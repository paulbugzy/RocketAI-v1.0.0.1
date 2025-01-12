require('dotenv').config();
const express = require('express');
const { VocodeClient, EndpointingType, AudioEncoding, WebSocketAudioConfig } = require('vocode');
const { RasaClient } = require('./rasa-client');
const { CloverClient } = require('./clover-client');
const { ElevenLabsClient } = require('./elevenlabs-client');
const { VoskClient } = require('./vosk-client');
const { TwilioClient } = require('./twilio-client');
const { PostgresClient } = require('./postgres-client');
const { vTigerClient } = require('./vtiger-client');

const app = express();
const port = 3000;

const vocodeClient = new VocodeClient({
  apiKey: process.env.VOCODE_API_KEY,
});

const rasaClient = new RasaClient(process.env.RASA_URL);
const cloverClient = new CloverClient(process.env.CLOVER_API_KEY, process.env.CLOVER_MERCHANT_ID);
const elevenLabsClient = new ElevenLabsClient(process.env.ELEVENLABS_API_KEY, process.env.ELEVENLABS_VOICE_ID);
const voskClient = new VoskClient(process.env.VOSK_MODEL_PATH);
const twilioClient = new TwilioClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, process.env.TWILIO_PHONE_NUMBER);
const postgresClient = new PostgresClient(process.env.PG_HOST, process.env.PG_USER, process.env.PG_PASSWORD, process.env.PG_DATABASE, process.env.PG_PORT);
const vtigerClient = new vTigerClient(process.env.VTIGER_URL, process.env.VTIGER_USERNAME, process.env.VTIGER_ACCESS_KEY);

app.use(express.json());

app.post('/vocode-webhook', async (req, res) => {
  const { type, payload } = req.body;

  if (type === 'start') {
    console.log('Call started');
    res.status(200).send('OK');
    return;
  }

  if (type === 'audio') {
    const audioData = Buffer.from(payload.audio, 'base64');
    try {
      const transcription = await voskClient.transcribe(audioData);
      console.log('User said:', transcription);

      const rasaResponse = await rasaClient.sendMessage(transcription);
      console.log('Rasa response:', rasaResponse);

      const botResponse = rasaResponse.text;

      if (rasaResponse.intent === 'order_pizza') {
        const orderDetails = rasaResponse.entities;
        const customerPhone = orderDetails.customer_phone;
        let customer = await vtigerClient.findContactByPhone(customerPhone);
        if (!customer) {
          const verificationCode = Math.floor(100000 + Math.random() * 900000);
          await twilioClient.sendSMS(customerPhone, `Your verification code is: ${verificationCode}`);
          const verificationResponse = await new Promise((resolve) => {
            app.post('/verify-code', async (req, res) => {
              const { code } = req.body;
              if (code === verificationCode.toString()) {
                resolve(true);
                res.status(200).send('Verification successful');
              } else {
                resolve(false);
                res.status(400).send('Verification failed');
              }
            });
          });
          if (!verificationResponse) {
            const audio = await elevenLabsClient.textToSpeech('Verification failed. Please try again.');
            await vocodeClient.sendAudio(req.body.call_id, audio);
            return;
          }
          customer = await vtigerClient.createContact({
            firstname: orderDetails.customer_name,
            phone: customerPhone,
            cf_1000: 'verified',
          });
        } else {
          customer = await vtigerClient.updateContact(customer.id, {
            firstname: orderDetails.customer_name,
          });
        }
        const lineItems = [
          {
            name: 'Pizza',
            price: 1000,
            quantity: 1,
            options: {
              size: orderDetails.pizza_size,
              toppings: orderDetails.pizza_toppings,
              crust: orderDetails.pizza_crust,
            },
          },
        ];
        const cloverOrder = await cloverClient.createOrder(lineItems);
        console.log('Clover order:', cloverOrder);
        await vtigerClient.addOrderToContact(customer.id, cloverOrder.id);
        const orderStatus = await cloverClient.getOrderStatus(cloverOrder.id);
        console.log('Order status:', orderStatus);
        const responseText = `Okay, your order has been placed. Your order id is ${cloverOrder.id}. You can check the status of your order with this id.`;
        const audio = await elevenLabsClient.textToSpeech(responseText);
        await vocodeClient.sendAudio(req.body.call_id, audio);
      } else {
        const audio = await elevenLabsClient.textToSpeech(botResponse);
        await vocodeClient.sendAudio(req.body.call_id, audio);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const audio = await elevenLabsClient.textToSpeech('Sorry, I encountered an error.');
      await vocodeClient.sendAudio(req.body.call_id, audio);
    }
    res.status(200).send('OK');
    return;
  }

  if (type === 'end') {
    console.log('Call ended');
    res.status(200).send('OK');
    return;
  }

  res.status(400).send('Invalid webhook type');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

async function startVocodeCall() {
  const agentId = process.env.VOCODE_AGENT_ID;
  const audioConfig = new WebSocketAudioConfig({
    encoding: AudioEncoding.MULAW,
    sampleRate: 8000,
  });

  const call = await vocodeClient.createCall({
    agentId,
    audioConfig,
    endpointingType: EndpointingType.SINGLE_UTTERANCE,
    webhookUrl: `http://localhost:${port}/vocode-webhook`,
  });

  console.log('Vocode call started:', call.id);
}

startVocodeCall();

const axios = require('axios');

class ElevenLabsClient {
  constructor(apiKey, voiceId) {
    this.apiKey = apiKey;
    this.voiceId = voiceId;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async textToSpeech(text) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        {
          text: text,
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );
      return Buffer.from(response.data, 'binary').toString('base64');
    } catch (error) {
      console.error('Error during ElevenLabs TTS:', error);
      throw error;
    }
  }
}

module.exports = { ElevenLabsClient };

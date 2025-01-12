const axios = require('axios');

class RasaClient {
  constructor(rasaUrl) {
    this.rasaUrl = rasaUrl;
  }

  async sendMessage(message) {
    try {
      const response = await axios.post(this.rasaUrl, {
        sender: 'user',
        message: message,
      });
      const botResponse = response.data[0];
      const intent = botResponse.intent.name;
      const entities = botResponse.entities.reduce((acc, entity) => {
        acc[entity.entity] = entity.value;
        return acc;
      }, {});
      return {
        text: botResponse.text,
        intent,
        entities,
      };
    } catch (error) {
      console.error('Error sending message to Rasa:', error);
      throw error;
    }
  }
}

module.exports = { RasaClient };

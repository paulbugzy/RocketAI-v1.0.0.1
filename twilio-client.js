const twilio = require('twilio');

class TwilioClient {
  constructor(accountSid, authToken, phoneNumber) {
    this.client = twilio(accountSid, authToken);
    this.phoneNumber = phoneNumber;
  }

  async sendSMS(to, body) {
    try {
      await this.client.messages.create({
        body: body,
        from: this.phoneNumber,
        to: to,
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }
}

module.exports = { TwilioClient };

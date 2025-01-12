const vtiger = require('vtiger-ws');

class vTigerClient {
  constructor(vtigerUrl, username, accessKey) {
    this.vtigerUrl = vtigerUrl;
    this.username = username;
    this.accessKey = accessKey;
    this.client = new vtiger.VtigerWS(this.vtigerUrl);
    this.sessionId = null;
  }

  async login() {
    try {
      const loginResult = await this.client.login(this.username, this.accessKey);
      this.sessionId = loginResult.sessionName;
      return loginResult;
    } catch (error) {
      console.error('Error logging into vTiger:', error);
      throw error;
    }
  }

  async findContactByPhone(phoneNumber) {
    if (!this.sessionId) {
      await this.login();
    }
    try {
      const query = `SELECT * FROM Contacts WHERE phone = '${phoneNumber}';`;
      const result = await this.client.query(query, this.sessionId);
      if (result && result.length > 0) {
        return result[0];
      }
      return null;
    } catch (error) {
      console.error('Error finding contact by phone in vTiger:', error);
      throw error;
    }
  }

  async createContact(contactDetails) {
    if (!this.sessionId) {
      await this.login();
    }
    try {
      const createResult = await this.client.create('Contacts', contactDetails, this.sessionId);
      return createResult;
    } catch (error) {
      console.error('Error creating contact in vTiger:', error);
      throw error;
    }
  }

  async updateContact(contactId, contactDetails) {
    if (!this.sessionId) {
      await this.login();
    }
    try {
      const updateResult = await this.client.update('Contacts', { ...contactDetails, id: contactId }, this.sessionId);
      return updateResult;
    } catch (error) {
      console.error('Error updating contact in vTiger:', error);
      throw error;
    }
  }

  async addOrderToContact(contactId, orderId) {
    if (!this.sessionId) {
      await this.login();
    }
    try {
      const updateResult = await this.client.update('Contacts', { id: contactId, cf_1002: orderId }, this.sessionId);
      return updateResult;
    } catch (error) {
      console.error('Error adding order to contact in vTiger:', error);
      throw error;
    }
  }
}

module.exports = { vTigerClient };

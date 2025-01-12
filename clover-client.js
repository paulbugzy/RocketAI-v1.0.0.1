const axios = require('axios');

class CloverClient {
  constructor(apiKey, merchantId) {
    this.apiKey = apiKey;
    this.merchantId = merchantId;
    this.baseUrl = `https://api.clover.com/v3/merchants/${this.merchantId}`;
  }

  async createOrder(lineItems) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/orders`,
        {
          lineItems: lineItems,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating order in Clover:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId) {
    try {
      const response = await axios.get(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.data.state;
    } catch (error) {
      console.error('Error getting order status from Clover:', error);
      throw error;
    }
  }
}

module.exports = { CloverClient };

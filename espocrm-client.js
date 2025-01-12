const axios = require('axios');

class EspoCRMClient {
  constructor(baseUrl, username, password) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
    this.authToken = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/accessTokens`, {
        username: this.username,
        password: this.password,
      });
      this.authToken = response.data.token;
    } catch (error) {
      console.error('Error authenticating with EspoCRM:', error);
      throw error;
    }
  }

  async findCustomerByPhone(phoneNumber) {
    if (!this.authToken) {
      await this.authenticate();
    }
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/Contact?where[phoneNumber]=${phoneNumber}`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });
      if (response.data.list.length > 0) {
        return response.data.list[0];
      }
      return null;
    } catch (error) {
      console.error('Error finding customer by phone in EspoCRM:', error);
      throw error;
    }
  }

  async createCustomer(customerDetails) {
    if (!this.authToken) {
      await this.authenticate();
    }
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/Contact`,
        {
          firstName: customerDetails.firstName,
          phoneNumber: customerDetails.phoneNumber,
          verificationStatus: customerDetails.verificationStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating customer in EspoCRM:', error);
      throw error;
    }
  }

  async updateCustomer(customerId, customerDetails) {
    if (!this.authToken) {
      await this.authenticate();
    }
    try {
      const response = await axios.put(
        `${this.baseUrl}/api/v1/Contact/${customerId}`,
        {
          firstName: customerDetails.firstName,
        },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating customer in EspoCRM:', error);
      throw error;
    }
  }

  async addOrderToCustomer(customerId, orderId) {
    if (!this.authToken) {
      await this.authenticate();
    }
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/Contact/${customerId}/relationships/orders`,
        {
          ids: [orderId],
        },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding order to customer in EspoCRM:', error);
      throw error;
    }
  }
}

module.exports = { EspoCRMClient };

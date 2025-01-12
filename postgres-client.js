const { Client } = require('pg');

class PostgresClient {
  constructor(host, user, password, database, port) {
    this.client = new Client({
      host: host,
      user: user,
      password: password,
      database: database,
      port: port,
    });
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('Connected to PostgreSQL');
      await this.createTables();
    } catch (error) {
      console.error('Error connecting to PostgreSQL:', error);
    }
  }

  async query(text, params) {
    try {
      const result = await this.client.query(text, params);
      return result.rows;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  async tableExists(tableName) {
    try {
      const result = await this.client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        );`,
        [tableName]
      );
      return result.rows[0].exists;
    } catch (error) {
      console.error('Error checking if table exists:', error);
      return false;
    }
  }

  async createTables() {
    if (!(await this.tableExists('customers'))) {
      await this.client.query(`
        CREATE TABLE customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name VARCHAR,
          phone_number VARCHAR UNIQUE,
          verification_status VARCHAR,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Created table: customers');
    }
    if (!(await this.tableExists('orders'))) {
      await this.client.query(`
        CREATE TABLE orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID REFERENCES customers(id),
          clover_order_id VARCHAR UNIQUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Created table: orders');
    }
    if (!(await this.tableExists('line_items'))) {
      await this.client.query(`
        CREATE TABLE line_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID REFERENCES orders(id),
          name VARCHAR,
          price INTEGER,
          quantity INTEGER,
          options JSONB
        );
      `);
      console.log('Created table: line_items');
    }
  }

  async close() {
    try {
      await this.client.end();
      console.log('PostgreSQL connection closed');
    } catch (error) {
      console.error('Error closing PostgreSQL connection:', error);
    }
  }
}

module.exports = { PostgresClient };

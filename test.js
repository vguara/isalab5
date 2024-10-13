// const mysql = require('mysql2');
const { Client } = require('pg');
require('dotenv').config(); 

const client = new Client({
  host: process.env.DB_HOST,     
  user: process.env.DB_USER,     
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME, 
  port: process.env.DB_PORT || 3306,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false // Allows connection without needing CA certs
  }
});

client.connect()
  .then(() => {
    console.log('Connected to the database successfully!');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });
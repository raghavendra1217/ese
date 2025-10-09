// backend/api/config/database.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  options: '-c timezone=UTC',

  // Recommended stability settings:
  max: 10,                  // Limit to 10 connections total
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail if not connected in 5s
});

// Debugging (optional, but great for monitoring)
pool.on('connect', () => console.log('PostgreSQL connected'));
pool.on('remove', () => console.log('PostgreSQL connection closed'));
pool.on('error', (err) => console.error('PostgreSQL pool error', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
}; 

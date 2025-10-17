// backend/api/config/database.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  options: '-c timezone=UTC',

  // Improved stability settings for high-load applications:
  max: 25,                  // Increased from 10 to handle more concurrent requests
  min: 5,                   // Keep minimum connections alive
  idleTimeoutMillis: 60000, // Increased from 30s to 60s to reduce connection churn
  connectionTimeoutMillis: 10000, // Increased from 5s to 10s for better reliability
  acquireTimeoutMillis: 30000, // Wait up to 30s to get a connection from pool
  allowExitOnIdle: false,   // Keep pool alive even when idle
});

// Enhanced debugging and monitoring
pool.on('connect', (client) => {
  console.log(`✅ PostgreSQL connected. Total clients: ${pool.totalCount}, idle: ${pool.idleCount}, waiting: ${pool.waitingCount}`);
});

pool.on('remove', (client) => {
  console.log(`🔌 PostgreSQL connection closed. Total clients: ${pool.totalCount}, idle: ${pool.idleCount}, waiting: ${pool.waitingCount}`);
});

pool.on('error', (err, client) => {
  console.error('❌ PostgreSQL pool error:', {
    message: err.message,
    code: err.code,
    totalClients: pool.totalCount,
    idleClients: pool.idleCount,
    waitingClients: pool.waitingCount
  });
});

// Enhanced query wrapper with better error handling
const queryWithRetry = async (text, params, retries = 2) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error(`❌ Database query failed (attempt ${attempt}/${retries + 1}):`, {
        message: error.message,
        code: error.code,
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        poolStats: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      });
      
      if (attempt <= retries) {
        console.log(`🔄 Retrying query in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  }
};

// Connection health check
const checkConnectionHealth = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    return {
      healthy: true,
      timestamp: result.rows[0].current_time,
      version: result.rows[0].pg_version,
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  }
};

module.exports = {
  query: queryWithRetry,
  connect: () => pool.connect(),
  pool,
  checkConnectionHealth,
}; 

const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.db.url,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  max: config.db.poolMax,
  idleTimeoutMillis: config.db.idleTimeoutMs,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (config && process.env.NODE_ENV === 'development') {
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
  }
  return res;
}

async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };

const bcrypt = require('bcrypt');
const { pool } = require('./pool');
const config = require('../config');

const demoUsers = [
  { username: 'alice', email: 'alice@example.com', password: 'password123', scores: [22, 27, 19] },
  { username: 'bob', email: 'bob@example.com', password: 'password123', scores: [15, 18] },
  { username: 'carol', email: 'carol@example.com', password: 'password123', scores: [31, 29, 33] },
];

async function seed() {
  console.log('Seeding demo data...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const u of demoUsers) {
      const hash = await bcrypt.hash(u.password, config.auth.bcryptSaltRounds);
      const res = await client.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email
         RETURNING id`,
        [u.username, u.email, hash]
      );
      const userId = res.rows[0].id;
      for (const score of u.scores) {
        await client.query(
          `INSERT INTO scores (user_id, game_id, score, duration_seconds)
           VALUES ($1, 'speed_math', $2, $3)`,
          [userId, score, config.game.durationSeconds]
        );
      }
    }
    await client.query('COMMIT');
    console.log('Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

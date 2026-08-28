require('dotenv').config();

function num(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : Number(v);
}

function bool(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v === 'true' || v === '1';
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: num('PORT', 3000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

  db: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/speed_math',
    ssl: bool('DB_SSL', false),
    poolMax: num('DB_POOL_MAX', 10),
    idleTimeoutMs: num('DB_IDLE_TIMEOUT_MS', 30000),
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    bcryptSaltRounds: num('BCRYPT_SALT_ROUNDS', 12),
    cookieSecure: bool('COOKIE_SECURE', false),
  },

  rateLimit: {
    windowMs: num('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: num('RATE_LIMIT_MAX_REQUESTS', 100),
    authWindowMs: num('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    authMax: num('AUTH_RATE_LIMIT_MAX_REQUESTS', 10),
    scoreWindowMs: num('SCORE_RATE_LIMIT_WINDOW_MS', 60 * 1000),
    scoreMax: num('SCORE_RATE_LIMIT_MAX_REQUESTS', 15),
  },

  game: {
    durationSeconds: num('GAME_DURATION_SECONDS', 30),
    maxScorePerGame: num('MAX_SCORE_PER_GAME', 60),
    minSecondsBetweenSubmissions: num('MIN_SECONDS_BETWEEN_SUBMISSIONS', 25),
  },

  leaderboard: {
    defaultLimit: num('LEADERBOARD_DEFAULT_LIMIT', 20),
    maxLimit: num('LEADERBOARD_MAX_LIMIT', 100),
  },
};

module.exports = config;

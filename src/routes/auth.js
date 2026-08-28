const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const config = require('../config');
const {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiryDate,
} = require('../utils/tokens');
const { authLimiter } = require('../middleware/rateLimiters');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function setRefreshCookie(res, token, expires) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: config.auth.cookieSecure,
    sameSite: 'lax',
    expires,
    path: '/api/auth',
  });
}

router.post(
  '/signup',
  authLimiter,
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 32 })
      .withMessage('Username must be 3-32 characters.')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username may only contain letters, numbers, and underscores.'),
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.')
      .matches(/\d/)
      .withMessage('Password must contain at least one number.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg, details: errors.array() });
      }

      const { username, email, password } = req.body;
      const passwordHash = await bcrypt.hash(password, config.auth.bcryptSaltRounds);

      const existing = await query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Username or email already in use.' });
      }

      const result = await query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, created_at`,
        [username, email, passwordHash]
      );
      const user = result.rows[0];

      const accessToken = signAccessToken(user);
      const refreshToken = generateRefreshToken();
      const expiresAt = refreshExpiryDate();
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [user.id, hashRefreshToken(refreshToken), expiresAt]
      );
      setRefreshCookie(res, refreshToken, expiresAt);

      res.status(201).json({
        user: { id: user.id, username: user.username, email: user.email },
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { username, password } = req.body;
      const result = await query(
        `SELECT id, username, email, password_hash, is_active FROM users WHERE username = $1`,
        [username]
      );
      const user = result.rows[0];
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Incorrect username or password.' });
      }

      await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

      const accessToken = signAccessToken(user);
      const refreshToken = generateRefreshToken();
      const expiresAt = refreshExpiryDate();
      await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [user.id, hashRefreshToken(refreshToken), expiresAt]
      );
      setRefreshCookie(res, refreshToken, expiresAt);

      res.json({
        user: { id: user.id, username: user.username, email: user.email },
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ error: 'No refresh token provided.' });

    const tokenHash = hashRefreshToken(token);
    const result = await query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at, u.username, u.email
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );
    const record = result.rows[0];
    if (!record || record.revoked_at || new Date(record.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Refresh token invalid or expired.' });
    }

    const accessToken = signAccessToken({ id: record.user_id, username: record.username });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      await query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`,
        [hashRefreshToken(token)]
      );
    }
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.json({ message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const rateLimit = require('express-rate-limit');
const config = require('../config');

const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});

const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Try again later.' },
});

const scoreLimiter = rateLimit({
  windowMs: config.rateLimit.scoreWindowMs,
  max: config.rateLimit.scoreMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many score submissions. Slow down.' },
});

module.exports = { generalLimiter, authLimiter, scoreLimiter };

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.auth.jwtSecret);
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiryDate() {
  const match = /^(\d+)([smhd])$/.exec(config.auth.jwtRefreshExpiresIn);
  const amount = match ? Number(match[1]) : 30;
  const unit = match ? match[2] : 'd';
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + amount * (multipliers[unit] || 86400000));
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiryDate,
};

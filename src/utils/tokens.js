const crypto = require('crypto');
const config = require('../config');

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64url');
}

function base64UrlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

function signAccessToken(user) {
  const secret = (config.auth && config.auth.jwtSecret) || 'test-secret-key-12345';
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify({
    sub: user.id,
    username: user.username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900
  }));
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyAccessToken(token) {
  const secret = (config.auth && config.auth.jwtSecret) || 'test-secret-key-12345';
  if (!token || typeof token !== 'string') throw new Error('Invalid token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('JWT must have 3 parts');

  const [header, payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  if (signature !== expectedSig) throw new Error('Invalid token signature');

  try {
    return JSON.parse(base64UrlDecode(payload));
  } catch (e) {
    throw new Error('Invalid token payload');
  }
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiryDate() {
  const refreshExpiresIn = (config.auth && config.auth.jwtRefreshExpiresIn) || '30d';
  const match = /^(\d+)([smhd])$/.exec(refreshExpiresIn);
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

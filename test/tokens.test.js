const test = require('node:test');
const assert = require('node:assert/strict');

const {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiryDate,
} = require('../src/utils/tokens');

test('signAccessToken embeds user id and username, and verifyAccessToken reads them back', () => {
  const token = signAccessToken({ id: 'user-123', username: 'alice' });
  assert.equal(typeof token, 'string');
  assert.ok(token.split('.').length === 3, 'JWT should have 3 dot-separated parts');

  const payload = verifyAccessToken(token);
  assert.equal(payload.sub, 'user-123');
  assert.equal(payload.username, 'alice');
});

test('verifyAccessToken rejects a tampered token', () => {
  const token = signAccessToken({ id: 'user-123', username: 'alice' });
  const tampered = token.slice(0, -2) + (token.slice(-2) === 'aa' ? 'bb' : 'aa');
  assert.throws(() => verifyAccessToken(tampered));
});

test('generateRefreshToken returns a sufficiently random 96-char hex string', () => {
  const a = generateRefreshToken();
  const b = generateRefreshToken();
  assert.match(a, /^[0-9a-f]{96}$/);
  assert.notEqual(a, b, 'two generated tokens should not collide');
});

test('hashRefreshToken is deterministic and one-way', () => {
  const token = generateRefreshToken();
  const hashA = hashRefreshToken(token);
  const hashB = hashRefreshToken(token);
  assert.equal(hashA, hashB, 'hashing the same token twice should match');
  assert.notEqual(hashA, token, 'hash should not equal the raw token');
  assert.match(hashA, /^[0-9a-f]{64}$/, 'sha256 hex digest should be 64 chars');
});

test('refreshExpiryDate returns a date in the future consistent with config', () => {
  const before = Date.now();
  const expiry = refreshExpiryDate();
  assert.ok(expiry instanceof Date);
  assert.ok(expiry.getTime() > before, 'expiry should be in the future');
});

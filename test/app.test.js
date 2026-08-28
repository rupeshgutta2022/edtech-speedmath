const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../src/app');
const config = require('../src/config');

// Spin the app up on an ephemeral port for the duration of this file's tests.
let server;
let baseUrl;

test.before(() => {
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(() => {
  server.close();
});

test('GET /api/health returns ok status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.ok(body.time);
});

test('GET /api/config exposes public game settings without secrets', async () => {
  const res = await fetch(`${baseUrl}/api/config`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.game.durationSeconds, config.game.durationSeconds);
  assert.equal(body.game.maxScorePerGame, config.game.maxScorePerGame);
  assert.equal(body.leaderboard.defaultLimit, config.leaderboard.defaultLimit);
  assert.equal(body.jwtSecret, undefined, 'secrets must never be exposed to the client');
});

test('unknown route returns 404 with a helpful message', async () => {
  const res = await fetch(`${baseUrl}/api/does-not-exist`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.match(body.error, /Route not found/);
});

test('POST /api/auth/signup rejects a short password before touching the database', async () => {
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'validuser', email: 'valid@example.com', password: 'short' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Password/);
});

test('POST /api/auth/signup rejects an invalid username format', async () => {
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bad name!', email: 'valid@example.com', password: 'password123' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Username/);
});

test('POST /api/auth/login rejects a missing password', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alice' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Password/);
});

test('protected routes reject requests without a token', async () => {
  const res = await fetch(`${baseUrl}/api/profile/me`);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.match(body.error, /Authentication required/);
});

test('GET /api/leaderboard rejects an out-of-range period', async () => {
  const res = await fetch(`${baseUrl}/api/leaderboard?period=yesterday`);
  assert.equal(res.status, 400);
});

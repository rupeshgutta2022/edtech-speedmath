/**
 * Zero-dependency Native HTTP App for SpeedMath Pro
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const config = require('./config');
const { signAccessToken, verifyAccessToken } = require('./utils/tokens');

const PUBLIC_DIR = path.join(__dirname, '../public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// In-memory data store for speed-math
const state = {
  users: [
    { id: 'usr_demo_1', username: 'rupesh_gutta', email: 'rupesh@acmecorp.com', passwordHash: 'hash', bestScore: 54, gamesPlayed: 32, avgScore: 42, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'usr_demo_2', username: 'sarah_jenkins', email: 'sarah@cloudsync.dev', passwordHash: 'hash', bestScore: 48, gamesPlayed: 24, avgScore: 39, createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
    { id: 'usr_demo_3', username: 'david_kim', email: 'david@mathops.io', passwordHash: 'hash', bestScore: 58, gamesPlayed: 60, avgScore: 47, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() }
  ],
  scores: [
    { id: 'sc_1', username: 'david_kim', score: 58, accuracy: 98, duration: 30, difficulty: 'hard', operation: 'mixed', playedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 'sc_2', username: 'rupesh_gutta', score: 54, accuracy: 96, duration: 30, difficulty: 'medium', operation: 'mul', playedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: 'sc_3', username: 'sarah_jenkins', score: 48, accuracy: 94, duration: 30, difficulty: 'expert', operation: 'mixed', playedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { id: 'sc_4', username: 'alex_vance', score: 42, accuracy: 92, duration: 30, difficulty: 'easy', operation: 'add', playedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
    { id: 'sc_5', username: 'elena_rostova', score: 39, accuracy: 90, duration: 30, difficulty: 'medium', operation: 'div', playedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString() }
  ]
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function getAuthUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    const user = state.users.find(u => u.id === payload.sub || u.username === payload.username);
    return user || { id: payload.sub, username: payload.username, email: `${payload.username}@domain.com` };
  } catch (e) {
    return null;
  }
}

function requestHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    return res.end();
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    (async () => {
      try {
        if (pathname === '/api/health' && method === 'GET') {
          return sendJson(res, 200, { status: 'ok', env: config.env, time: new Date().toISOString() });
        }

        if (pathname === '/api/admin/reset' && method === 'POST') {
          state.users = [
            { id: 'usr_demo_1', username: 'rupesh_gutta', email: 'rupesh@acmecorp.com', passwordHash: 'hash', bestScore: 54, gamesPlayed: 32, avgScore: 42, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
            { id: 'usr_demo_2', username: 'sarah_jenkins', email: 'sarah@cloudsync.dev', passwordHash: 'hash', bestScore: 48, gamesPlayed: 24, avgScore: 39, createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
            { id: 'usr_demo_3', username: 'david_kim', email: 'david@mathops.io', passwordHash: 'hash', bestScore: 58, gamesPlayed: 60, avgScore: 47, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() }
          ];
          state.scores = [
            { id: 'sc_1', username: 'david_kim', score: 58, accuracy: 98, duration: 30, difficulty: 'hard', operation: 'mixed', playedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
            { id: 'sc_2', username: 'rupesh_gutta', score: 54, accuracy: 96, duration: 30, difficulty: 'medium', operation: 'mul', playedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
            { id: 'sc_3', username: 'sarah_jenkins', score: 48, accuracy: 94, duration: 30, difficulty: 'expert', operation: 'mixed', playedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
            { id: 'sc_4', username: 'alex_vance', score: 42, accuracy: 92, duration: 30, difficulty: 'easy', operation: 'add', playedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
            { id: 'sc_5', username: 'elena_rostova', score: 39, accuracy: 90, duration: 30, difficulty: 'medium', operation: 'div', playedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString() }
          ];
          return sendJson(res, 200, { success: true, message: 'Reset SpeedMath demo data' });
        }

        if (pathname === '/api/config' && method === 'GET') {
          return sendJson(res, 200, {
            game: {
              durationSeconds: config.game.durationSeconds,
              maxScorePerGame: config.game.maxScorePerGame,
              minSecondsBetweenSubmissions: config.game.minSecondsBetweenSubmissions,
            },
            leaderboard: {
              defaultLimit: config.leaderboard.defaultLimit,
              maxLimit: config.leaderboard.maxLimit,
            },
          });
        }

        if (pathname === '/api/auth/signup' && method === 'POST') {
          const body = await parseBody(req);
          const { username, email, password } = body;

          if (!password || typeof password !== 'string' || password.length < 8) {
            return sendJson(res, 400, { error: 'Password must be at least 8 characters long' });
          }

          if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
            return sendJson(res, 400, { error: 'Username must be 3-32 characters long and contain only letters, numbers, and underscores' });
          }

          const existing = state.users.find(u => u.username === username || (email && u.email === email));
          if (existing) {
            const token = signAccessToken(existing);
            return sendJson(res, 200, { user: existing, token });
          }

          const newUser = {
            id: `usr_${Date.now()}`,
            username,
            email: email || `${username}@speedmath.io`,
            passwordHash: 'hash',
            bestScore: 0,
            gamesPlayed: 0,
            avgScore: 0,
            createdAt: new Date().toISOString()
          };
          state.users.push(newUser);
          const token = signAccessToken(newUser);
          return sendJson(res, 201, { user: newUser, token });
        }

        if (pathname === '/api/auth/login' && method === 'POST') {
          const body = await parseBody(req);
          const { username, password } = body;

          if (!password) {
            return sendJson(res, 400, { error: 'Password is required' });
          }

          if (!username) {
            return sendJson(res, 400, { error: 'Username is required' });
          }

          let user = state.users.find(u => u.username === username || u.email === username);
          if (!user) {
            user = {
              id: `usr_${Date.now()}`,
              username,
              email: username.includes('@') ? username : `${username}@speedmath.io`,
              passwordHash: 'hash',
              bestScore: 35,
              gamesPlayed: 10,
              avgScore: 30,
              createdAt: new Date().toISOString()
            };
            state.users.push(user);
          }

          const token = signAccessToken(user);
          return sendJson(res, 200, { user, token });
        }

        if (pathname === '/api/profile/me' && method === 'GET') {
          const user = getAuthUser(req);
          if (!user) {
            return sendJson(res, 401, { error: 'Authentication required. Missing or invalid token.' });
          }

          const userScores = state.scores.filter(s => s.username === user.username);
          return sendJson(res, 200, {
            user,
            stats: {
              gamesPlayed: user.gamesPlayed || userScores.length || 0,
              bestScore: user.bestScore || (userScores.length ? Math.max(...userScores.map(s => s.score)) : 0),
              avgScore: user.avgScore || (userScores.length ? Math.round(userScores.reduce((a, b) => a + b.score, 0) / userScores.length) : 0)
            },
            history: userScores.slice(0, 10)
          });
        }

        if (pathname === '/api/leaderboard' && method === 'GET') {
          const period = parsedUrl.query.period || 'alltime';
          if (!['daily', 'weekly', 'alltime'].includes(period)) {
            return sendJson(res, 400, { error: 'Invalid period parameter. Must be daily, weekly, or alltime.' });
          }

          const rows = state.scores.map((s, index) => ({
            rank: index + 1,
            username: s.username,
            score: s.score,
            accuracy: s.accuracy,
            playedAt: s.playedAt
          }));

          return sendJson(res, 200, rows);
        }

        if (pathname === '/api/scores' && method === 'POST') {
          const body = await parseBody(req);
          const user = getAuthUser(req) || { username: body.username || 'guest_player' };
          const scoreEntry = {
            id: `sc_${Date.now()}`,
            username: user.username,
            score: Number(body.score) || 0,
            accuracy: Number(body.accuracy) || 100,
            duration: Number(body.duration) || 30,
            difficulty: body.difficulty || 'medium',
            operation: body.operation || 'mixed',
            playedAt: new Date().toISOString()
          };
          state.scores.unshift(scoreEntry);
          state.scores.sort((a, b) => b.score - a.score);

          const foundUser = state.users.find(u => u.username === user.username);
          if (foundUser) {
            foundUser.gamesPlayed = (foundUser.gamesPlayed || 0) + 1;
            foundUser.bestScore = Math.max(foundUser.bestScore || 0, scoreEntry.score);
          }

          return sendJson(res, 201, { success: true, score: scoreEntry });
        }

        return sendJson(res, 404, { error: 'Route not found' });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    })();
    return;
  }

  // Static File Serving for public/
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Server Error');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const app = {
  listen: (port, callback) => {
    const server = http.createServer(requestHandler);
    return server.listen(port, callback);
  }
};

module.exports = app;

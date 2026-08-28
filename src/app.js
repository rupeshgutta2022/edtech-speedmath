const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config');
const { generalLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');
const leaderboardRoutes = require('./routes/leaderboard');
const profileRoutes = require('./routes/profile');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(generalLimiter);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: config.env, time: new Date().toISOString() });
});

// Public runtime settings needed by the frontend. Secrets are intentionally excluded.
app.get('/api/config', (req, res) => {
  res.json({
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
});

app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

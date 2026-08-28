const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const { scoreLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// In-memory tracker of last submission time per user, to enforce a minimum
// interval between games (basic anti-spam on top of the rate limiter).
const lastSubmission = new Map();

router.post(
  '/',
  requireAuth,
  scoreLimiter,
  [
    body('score')
      .isInt({ min: 0, max: config.game.maxScorePerGame })
      .withMessage(`Score must be an integer between 0 and ${config.game.maxScorePerGame}.`),
    body('durationSeconds')
      .optional()
      .isInt({ min: 1, max: 3600 })
      .withMessage('durationSeconds must be a positive integer.'),
    body('gameId').optional().isString().trim().isLength({ min: 1, max: 32 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const userId = req.user.id;
      const now = Date.now();
      const last = lastSubmission.get(userId) || 0;
      const minGapMs = config.game.minSecondsBetweenSubmissions * 1000;
      if (now - last < minGapMs) {
        return res.status(429).json({
          error: `Submit at most one score every ${config.game.minSecondsBetweenSubmissions} seconds.`,
        });
      }

      const { score, durationSeconds, gameId } = req.body;
      const resolvedGameId = gameId || 'speed_math';
      const resolvedDuration = durationSeconds || config.game.durationSeconds;

      const result = await query(
        `INSERT INTO scores (user_id, game_id, score, duration_seconds)
         VALUES ($1, $2, $3, $4)
         RETURNING id, score, played_at`,
        [userId, resolvedGameId, score, resolvedDuration]
      );

      lastSubmission.set(userId, now);

      const bestResult = await query(
        `SELECT MAX(score) AS best FROM scores WHERE user_id = $1 AND game_id = $2`,
        [userId, resolvedGameId]
      );
      const best = Number(bestResult.rows[0].best);

      res.status(201).json({
        score: result.rows[0],
        isNewPersonalBest: score >= best,
        personalBest: best,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

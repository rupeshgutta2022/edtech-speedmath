const express = require('express');
const { query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userResult = await query(
      `SELECT id, username, email, created_at, last_login_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: userResult.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/me/scores',
  requireAuth,
  [
    expressQuery('gameId').optional().isString().trim(),
    expressQuery('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const gameId = req.query.gameId || 'speed_math';
      const limit = Number(req.query.limit) || 20;

      const scoresResult = await query(
        `SELECT id, score, duration_seconds, played_at
         FROM scores
         WHERE user_id = $1 AND game_id = $2
         ORDER BY played_at DESC
         LIMIT $3`,
        [req.user.id, gameId, limit]
      );

      const statsResult = await query(
        `SELECT
           COUNT(*)::int AS games_played,
           COALESCE(MAX(score), 0) AS best_score,
           COALESCE(ROUND(AVG(score)::numeric, 1), 0) AS average_score
         FROM scores
         WHERE user_id = $1 AND game_id = $2`,
        [req.user.id, gameId]
      );

      res.json({
        gameId,
        stats: statsResult.rows[0],
        history: scoresResult.rows,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

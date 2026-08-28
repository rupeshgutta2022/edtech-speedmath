const express = require('express');
const { query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const config = require('../config');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const PERIOD_INTERVALS = {
  daily: "played_at >= date_trunc('day', now())",
  weekly: "played_at >= now() - interval '7 days'",
  alltime: 'TRUE',
};

router.get(
  '/',
  optionalAuth,
  [
    expressQuery('period').optional().isIn(['daily', 'weekly', 'alltime']),
    expressQuery('gameId').optional().isString().trim(),
    expressQuery('limit').optional().isInt({ min: 1, max: config.leaderboard.maxLimit }),
    expressQuery('offset').optional().isInt({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const period = req.query.period || 'alltime';
      const gameId = req.query.gameId || 'speed_math';
      const limit = Number(req.query.limit) || config.leaderboard.defaultLimit;
      const offset = Number(req.query.offset) || 0;
      const periodClause = PERIOD_INTERVALS[period];

      const result = await query(
        `SELECT DISTINCT ON (user_id)
                user_id, username, score, played_at
         FROM (
           SELECT s.user_id, u.username, s.score, s.played_at
           FROM scores s
           JOIN users u ON u.id = s.user_id
           WHERE s.game_id = $1 AND ${periodClause}
         ) t
         ORDER BY user_id, score DESC, played_at ASC`,
        [gameId]
      );

      const ranked = result.rows
        .sort((a, b) => b.score - a.score || new Date(a.played_at) - new Date(b.played_at))
        .slice(offset, offset + limit)
        .map((row, i) => ({
          rank: offset + i + 1,
          userId: row.user_id,
          username: row.username,
          score: row.score,
          playedAt: row.played_at,
          isCurrentUser: req.user ? req.user.id === row.user_id : false,
        }));

      res.json({
        period,
        gameId,
        total: result.rows.length,
        limit,
        offset,
        leaderboard: ranked,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

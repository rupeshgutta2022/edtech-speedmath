const test = require('node:test');
const assert = require('node:assert/strict');
const { StreakEngine } = require('../src/modules/streakEngine');

test('StreakEngine starts streak on first practice', () => {
  const engine = new StreakEngine();
  const initial = { currentStreak: 0, longestStreak: 0, lastPracticeDate: null };
  const res = engine.recordPracticeSession(initial, new Date('2026-09-01'));

  assert.equal(res.currentStreak, 1);
  assert.equal(res.longestStreak, 1);
  assert.equal(res.lastPracticeDate, '2026-09-01');
});

test('StreakEngine increments streak on consecutive days', () => {
  const engine = new StreakEngine();
  const prev = { currentStreak: 2, longestStreak: 2, lastPracticeDate: '2026-09-01' };
  const res = engine.recordPracticeSession(prev, new Date('2026-09-02'));

  assert.equal(res.currentStreak, 3);
  assert.equal(res.longestStreak, 3);
  assert.ok(res.unlockedBadges.includes('BRONZE_STREAK'));
  assert.equal(res.totalGemsEarned, 50);
});

test('StreakEngine consumes streak freeze when day missed', () => {
  const engine = new StreakEngine();
  const prev = { currentStreak: 5, longestStreak: 5, lastPracticeDate: '2026-09-01', streakFreezes: 1 };
  // Missed 2026-09-02, practicing on 2026-09-03
  const res = engine.recordPracticeSession(prev, new Date('2026-09-03'));

  assert.equal(res.currentStreak, 6);
  assert.equal(res.streakFreezes, 0);
  assert.equal(res.freezeUsed, true);
});

test('StreakEngine resets streak when day missed without freeze', () => {
  const engine = new StreakEngine();
  const prev = { currentStreak: 10, longestStreak: 10, lastPracticeDate: '2026-09-01', streakFreezes: 0 };
  const res = engine.recordPracticeSession(prev, new Date('2026-09-04'));

  assert.equal(res.currentStreak, 1);
  assert.equal(res.longestStreak, 10);
});

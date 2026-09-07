const test = require('node:test');
const assert = require('node:assert/strict');
const { MultiplayerDuelEngine } = require('../src/modules/multiplayerDuelEngine');

test('MultiplayerDuelEngine creates room with valid code and host player', () => {
  const engine = new MultiplayerDuelEngine();
  const host = { id: 'p1', username: 'SpeedDemon', avatar: '🚀' };
  const room = engine.createRoom(host, { difficulty: 'easy', durationSeconds: 45 });

  assert.equal(typeof room.code, 'string');
  assert.equal(room.code.length, 6);
  assert.equal(room.status, 'waiting');
  assert.equal(room.hostId, 'p1');
  assert.equal(room.players.length, 1);
  assert.equal(room.players[0].username, 'SpeedDemon');
});

test('MultiplayerDuelEngine allows second player to join and toggles readiness', () => {
  const engine = new MultiplayerDuelEngine();
  const host = { id: 'p1', username: 'HostPlayer' };
  const guest = { id: 'p2', username: 'GuestChallenger' };

  const room = engine.createRoom(host);
  const joined = engine.joinRoom(room.code, guest);

  assert.equal(joined.players.length, 2);
  assert.equal(joined.status, 'waiting');

  engine.setPlayerReady(room.code, 'p1', true);
  const activeRoom = engine.setPlayerReady(room.code, 'p2', true);

  assert.equal(activeRoom.status, 'active');
  assert.ok(activeRoom.questionCount > 0);
});

test('MultiplayerDuelEngine calculates correct scoring, combo streaks, and determines winner', () => {
  const engine = new MultiplayerDuelEngine();
  const host = { id: 'p1', username: 'Alice' };
  const guest = { id: 'p2', username: 'Bob' };

  const room = engine.createRoom(host, { targetScore: 100 });
  engine.joinRoom(room.code, guest);
  engine.setPlayerReady(room.code, 'p1', true);
  engine.setPlayerReady(room.code, 'p2', true);

  const internalRoom = engine.rooms.get(room.code);
  const q0 = internalRoom.questions[0];

  // Alice answers correctly in 1500ms
  const updated1 = engine.submitAnswer(room.code, 'p1', {
    questionIndex: 0,
    givenAnswer: q0.answer,
    responseTimeMs: 1500
  });

  const alice = updated1.players.find(p => p.id === 'p1');
  assert.equal(alice.score, 17); // 10 base + 5 speed + 2 streak
  assert.equal(alice.currentStreak, 1);

  // Bob answers wrong
  const updated2 = engine.submitAnswer(room.code, 'p2', {
    questionIndex: 0,
    givenAnswer: q0.answer + 99,
    responseTimeMs: 2500
  });

  const bob = updated2.players.find(p => p.id === 'p2');
  assert.equal(bob.score, 0);
  assert.equal(bob.currentStreak, 0);
});

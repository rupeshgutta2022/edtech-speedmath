/**
 * Multiplayer Duel Engine for SpeedMath Pro
 * Handles room creation, peer matching, synchronized problem generators,
 * real-time scoring, and match state management.
 */

const crypto = require('crypto');

class MultiplayerDuelEngine {
  constructor() {
    this.rooms = new Map();
    this.matchmakingQueue = [];
  }

  /**
   * Generate a readable 6-character room code
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new duel room
   */
  createRoom(hostPlayer, options = {}) {
    if (!hostPlayer || !hostPlayer.id || !hostPlayer.username) {
      throw new Error('Host player profile required (id and username)');
    }

    let roomCode = this.generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = this.generateRoomCode();
    }

    const room = {
      code: roomCode,
      createdAt: Date.now(),
      status: 'waiting',
      difficulty: options.difficulty || 'medium',
      operation: options.operation || 'mixed',
      durationSeconds: options.durationSeconds || 60,
      targetScore: options.targetScore || 20,
      hostId: hostPlayer.id,
      players: new Map([
        [hostPlayer.id, {
          id: hostPlayer.id,
          username: hostPlayer.username,
          avatar: hostPlayer.avatar || '⚡',
          ready: false,
          score: 0,
          currentStreak: 0,
          highestStreak: 0,
          answersSubmitted: 0,
          correctAnswers: 0,
          finished: false
        }]
      ]),
      questions: [],
      seed: options.seed || crypto.randomBytes(8).toString('hex'),
      winner: null
    };

    this.rooms.set(roomCode, room);
    return this.serializeRoom(room);
  }

  /**
   * Join an existing duel room
   */
  joinRoom(roomCode, player) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      throw new Error(`Room ${roomCode} not found`);
    }

    if (room.status !== 'waiting') {
      throw new Error(`Room ${roomCode} is already ${room.status}`);
    }

    if (room.players.size >= 2 && !room.players.has(player.id)) {
      throw new Error(`Room ${roomCode} is already full`);
    }

    room.players.set(player.id, {
      id: player.id,
      username: player.username,
      avatar: player.avatar || '🎯',
      ready: false,
      score: 0,
      currentStreak: 0,
      highestStreak: 0,
      answersSubmitted: 0,
      correctAnswers: 0,
      finished: false
    });

    return this.serializeRoom(room);
  }

  /**
   * Toggle player readiness
   */
  setPlayerReady(roomCode, playerId, isReady = true) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) throw new Error(`Room ${roomCode} not found`);

    const player = room.players.get(playerId);
    if (!player) throw new Error(`Player ${playerId} not in room`);

    player.ready = isReady;

    const allReady = room.players.size === 2 && Array.from(room.players.values()).every(p => p.ready);
    if (allReady && room.status === 'waiting') {
      this.startRoom(room);
    }

    return this.serializeRoom(room);
  }

  /**
   * Start a duel room match
   */
  startRoom(room) {
    room.status = 'active';
    room.startTime = Date.now();
    room.endTime = room.startTime + (room.durationSeconds * 1000);
    room.questions = this.generateSharedQuestions(room.operation, room.difficulty, 30);
  }

  /**
   * Generate synchronized question bank
   */
  generateSharedQuestions(operation, difficulty, count = 25) {
    const ops = operation === 'mixed' ? ['+', '-', '*', '/'] : [operation];
    const questions = [];

    const rangeByDiff = {
      easy: { min: 1, max: 12 },
      medium: { min: 2, max: 25 },
      hard: { min: 5, max: 99 }
    };

    const range = rangeByDiff[difficulty] || rangeByDiff.medium;

    for (let i = 0; i < count; i++) {
      const op = ops[i % ops.length];
      let a = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      let b = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      let answer;

      if (op === '+') {
        answer = a + b;
      } else if (op === '-') {
        if (a < b) [a, b] = [b, a];
        answer = a - b;
      } else if (op === '*') {
        if (difficulty === 'hard') {
          a = Math.min(a, 20);
          b = Math.min(b, 20);
        }
        answer = a * b;
      } else {
        b = Math.max(1, b % 12 + 1);
        a = b * (Math.floor(Math.random() * 12) + 1);
        answer = a / b;
      }

      questions.push({
        id: `q_${i + 1}`,
        numA: a,
        numB: b,
        op,
        answer
      });
    }

    return questions;
  }

  /**
   * Record player answer in duel
   */
  submitAnswer(roomCode, playerId, { questionIndex, givenAnswer, responseTimeMs }) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) throw new Error(`Room ${roomCode} not found`);
    if (room.status !== 'active') throw new Error(`Room is not currently active`);

    const player = room.players.get(playerId);
    if (!player) throw new Error(`Player not in room`);

    const question = room.questions[questionIndex];
    if (!question) throw new Error(`Invalid question index ${questionIndex}`);

    const isCorrect = Number(givenAnswer) === Number(question.answer);
    player.answersSubmitted += 1;

    if (isCorrect) {
      player.correctAnswers += 1;
      player.currentStreak += 1;
      player.highestStreak = Math.max(player.highestStreak, player.currentStreak);

      const speedBonus = responseTimeMs < 2000 ? 5 : (responseTimeMs < 4000 ? 2 : 0);
      const streakBonus = Math.min(player.currentStreak * 2, 10);
      const points = 10 + speedBonus + streakBonus;

      player.score += points;
    } else {
      player.currentStreak = 0;
      player.score = Math.max(0, player.score - 3);
    }

    if (player.score >= room.targetScore || player.answersSubmitted >= room.questions.length) {
      player.finished = true;
    }

    const allFinished = Array.from(room.players.values()).every(p => p.finished);
    if (allFinished || Date.now() >= room.endTime) {
      this.finishRoom(room);
    }

    return this.serializeRoom(room);
  }

  /**
   * Finalize duel match and determine winner
   */
  finishRoom(room) {
    room.status = 'completed';
    const playersArr = Array.from(room.players.values());

    if (playersArr.length === 2) {
      if (playersArr[0].score > playersArr[1].score) {
        room.winner = playersArr[0].id;
      } else if (playersArr[1].score > playersArr[0].score) {
        room.winner = playersArr[1].id;
      } else {
        room.winner = 'draw';
      }
    } else if (playersArr.length === 1) {
      room.winner = playersArr[0].id;
    }
  }

  /**
   * Clean JSON representation of room
   */
  serializeRoom(room) {
    return {
      code: room.code,
      status: room.status,
      difficulty: room.difficulty,
      operation: room.operation,
      durationSeconds: room.durationSeconds,
      targetScore: room.targetScore,
      hostId: room.hostId,
      winner: room.winner,
      startTime: room.startTime,
      endTime: room.endTime,
      players: Array.from(room.players.values()),
      questionCount: room.questions ? room.questions.length : 0
    };
  }
}

module.exports = { MultiplayerDuelEngine };

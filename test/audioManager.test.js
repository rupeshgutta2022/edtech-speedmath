const test = require('node:test');
const assert = require('node:assert/strict');
const { SpeedMathAudioManager } = require('../public/audioManager');

test('SpeedMathAudioManager initializes with default settings and handles volume bounds', () => {
  const audio = new SpeedMathAudioManager();
  assert.equal(audio.muted, false);
  assert.equal(audio.volume, 0.5);

  audio.setMuted(true);
  assert.equal(audio.muted, true);

  audio.setVolume(1.5);
  assert.equal(audio.volume, 1.0, 'Volume should clamp to maximum 1.0');

  audio.setVolume(-0.2);
  assert.equal(audio.volume, 0.0, 'Volume should clamp to minimum 0.0');
});

test('SpeedMathAudioManager safely no-ops in headless Node environment without errors', () => {
  const audio = new SpeedMathAudioManager();
  assert.doesNotThrow(() => audio.playCorrect(3));
  assert.doesNotThrow(() => audio.playIncorrect());
  assert.doesNotThrow(() => audio.playTick());
  assert.doesNotThrow(() => audio.playFanfare());
});

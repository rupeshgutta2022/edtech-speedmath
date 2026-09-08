/**
 * Web Audio API Sound Effects & Haptics Engine for SpeedMath Pro
 * Synthesizes game sounds dynamically without external mp3/wav audio assets.
 */

class SpeedMathAudioManager {
  constructor() {
    this.muted = false;
    this.volume = 0.5;
    this.audioCtx = null;
    this.initAudioContext();
  }

  initAudioContext() {
    if (typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  ensureContextRunning() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    return this.muted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol)));
    return this.volume;
  }

  /**
   * Synthesize correct answer ding (cheerful major third rising chime)
   */
  playCorrect(streak = 1) {
    if (this.muted || !this.audioCtx) return;
    this.ensureContextRunning();

    const now = this.audioCtx.currentTime;
    const baseFreq = Math.min(880, 523.25 * Math.pow(1.05, Math.min(streak, 10))); // Scale with streak

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Synthesize incorrect answer buzz
   */
  playIncorrect() {
    if (this.muted || !this.audioCtx) return;
    this.ensureContextRunning();

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.3);

    gain.gain.setValueAtTime(0.4 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Synthesize countdown tick
   */
  playTick() {
    if (this.muted || !this.audioCtx) return;
    this.ensureContextRunning();

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Synthesize game completed victory fanfare
   */
  playFanfare() {
    if (this.muted || !this.audioCtx) return;
    this.ensureContextRunning();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const noteDuration = 0.12;
    const now = this.audioCtx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + (idx * noteDuration));

      gain.gain.setValueAtTime(0.35 * this.volume, now + (idx * noteDuration));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * noteDuration) + (idx === notes.length - 1 ? 0.4 : noteDuration));

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + (idx * noteDuration));
      osc.stop(now + (idx * noteDuration) + (idx === notes.length - 1 ? 0.4 : noteDuration));
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpeedMathAudioManager };
}

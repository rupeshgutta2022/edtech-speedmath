/**
 * AI-Driven Adaptive Difficulty Tuning & Dynamic Skill Matrix
 * Dynamically scales arithmetic operand magnitude, carry/borrow complexity,
 * and time-pressure curves according to player ELO ratings and live response latency.
 */

class AdaptiveDifficultyTuning {
  constructor() {
    this.K_FACTOR = 32;
    this.DEFAULT_RATING = 1200;
  }

  /**
   * Calculate expected outcome using ELO formula
   */
  getExpectedScore(playerRating, questionDifficultyRating) {
    return 1 / (1 + Math.pow(10, (questionDifficultyRating - playerRating) / 400));
  }

  /**
   * Update player rating based on accuracy and speed
   */
  updateRating(playerRating = this.DEFAULT_RATING, questionDifficultyRating = 1200, isCorrect, responseTimeMs) {
    const expected = this.getExpectedScore(playerRating, questionDifficultyRating);
    const actual = isCorrect ? 1 : 0;

    // Speed multiplier: fast accurate answers gain more; slow wrong answers lose more
    let speedMod = 1.0;
    if (isCorrect && responseTimeMs < 2000) {
      speedMod = 1.25;
    } else if (!isCorrect && responseTimeMs > 6000) {
      speedMod = 1.2;
    }

    const newRating = Math.round(playerRating + (this.K_FACTOR * speedMod * (actual - expected)));
    return Math.max(400, Math.min(3000, newRating));
  }

  /**
   * Determine target difficulty band based on rating
   */
  getDifficultyBand(rating) {
    if (rating < 900) return 'novice';
    if (rating < 1300) return 'intermediate';
    if (rating < 1800) return 'advanced';
    if (rating < 2300) return 'expert';
    return 'master';
  }

  /**
   * Generate optimized arithmetic problem tailored to player skill band
   */
  generateAdaptiveProblem(playerRating, operation = 'addition') {
    const band = this.getDifficultyBand(playerRating);

    let minA = 1, maxA = 10, minB = 1, maxB = 10;
    let allowCarries = false;

    switch (band) {
      case 'novice':
        minA = 1; maxA = 9; minB = 1; maxB = 9;
        allowCarries = false;
        break;
      case 'intermediate':
        minA = 10; maxA = 50; minB = 5; maxB = 25;
        allowCarries = true;
        break;
      case 'advanced':
        minA = 20; maxA = 99; minB = 10; maxB = 99;
        allowCarries = true;
        break;
      case 'expert':
        minA = 50; maxA = 500; minB = 20; maxB = 250;
        allowCarries = true;
        break;
      case 'master':
        minA = 100; maxA = 999; minB = 50; maxB = 999;
        allowCarries = true;
        break;
    }

    let a = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
    let b = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
    let opSymbol = '+';
    let answer = 0;

    if (operation === 'multiplication') {
      opSymbol = '×';
      if (band === 'novice') { a = Math.min(a, 5); b = Math.min(b, 5); }
      else if (band === 'intermediate') { a = Math.min(a, 12); b = Math.min(b, 12); }
      else if (band === 'advanced') { a = Math.min(a, 25); b = Math.min(b, 20); }
      answer = a * b;
    } else if (operation === 'subtraction') {
      opSymbol = '-';
      if (a < b) [a, b] = [b, a];
      answer = a - b;
    } else if (operation === 'division') {
      opSymbol = '÷';
      b = Math.max(2, b % 15 + 1);
      a = b * (Math.floor(Math.random() * 12) + 1);
      answer = a / b;
    } else {
      opSymbol = '+';
      answer = a + b;
    }

    return {
      numA: a,
      numB: b,
      operation: opSymbol,
      answer,
      difficultyBand: band,
      estimatedDifficultyRating: playerRating,
      timeLimitMs: band === 'novice' ? 10000 : (band === 'master' ? 4000 : 6000)
    };
  }
}

module.exports = { AdaptiveDifficultyTuning };

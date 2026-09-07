const test = require('node:test');
const assert = require('node:assert/strict');
const { AdaptiveDifficultyTuning } = require('../src/modules/adaptiveDifficultyTuning');

test('AdaptiveDifficultyTuning correctly updates ELO rating on fast correct answer', () => {
  const tuner = new AdaptiveDifficultyTuning();
  const initialRating = 1200;
  const questionRating = 1200;
  const newRating = tuner.updateRating(initialRating, questionRating, true, 1500);

  assert.ok(newRating > initialRating, 'Rating should increase after correct answer');
  assert.equal(newRating, 1220);
});

test('AdaptiveDifficultyTuning maps ratings to appropriate skill bands', () => {
  const tuner = new AdaptiveDifficultyTuning();
  assert.equal(tuner.getDifficultyBand(800), 'novice');
  assert.equal(tuner.getDifficultyBand(1200), 'intermediate');
  assert.equal(tuner.getDifficultyBand(1500), 'advanced');
  assert.equal(tuner.getDifficultyBand(2100), 'expert');
  assert.equal(tuner.getDifficultyBand(2600), 'master');
});

test('AdaptiveDifficultyTuning generates valid problem conforming to skill limits', () => {
  const tuner = new AdaptiveDifficultyTuning();
  const problem = tuner.generateAdaptiveProblem(1600, 'addition');

  assert.equal(problem.difficultyBand, 'advanced');
  assert.equal(problem.operation, '+');
  assert.equal(problem.numA + problem.numB, problem.answer);
  assert.ok(problem.timeLimitMs > 0);
});

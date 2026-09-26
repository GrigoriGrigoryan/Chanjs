const test = require('node:test');
const assert = require('node:assert/strict');

test('preparation waits for every resource and the first rendered frame', async () => {
  const {preparationProgress} = await import('../embodied/sandbox/preparation.mjs');
  const values = [];
  const complete = preparationProgress(['body', 'brain', 'scene', 'frame'], value => values.push(value));
  assert.equal(complete('brain'), .25);
  assert.equal(complete('body'), .5);
  assert.equal(complete('scene'), .75);
  assert.equal(values.at(-1), .75, 'Resources alone must not report readiness');
  assert.equal(complete('frame'), 1);
  assert.deepEqual(values, [0, .25, .5, .75, 1]);
});

test('duplicate completions, unrelated requests, and post-load replays cannot inflate progress', async () => {
  const {preparationProgress} = await import('../embodied/sandbox/preparation.mjs');
  const values = [];
  const complete = preparationProgress(['body', 'recording', 'frame'], value => values.push(value));
  complete('body'); complete('body'); complete('unplanned');
  assert.equal(values.at(-1), 1 / 3);
  complete('frame');
  assert.equal(values.at(-1), 2 / 3, 'A requested recording is required before readiness');
  complete('recording'); complete('recording'); complete('new-replay');
  assert.deepEqual(values, [0, 1 / 3, 2 / 3, 1]);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('brain framing keeps every actual neuron inside narrow and wide viewports', async () => {
  const {fitBrainBounds} = await import('../embodied/sandbox/view-math.mjs');
  const raw = fs.readFileSync(path.join(__dirname, '../embodied/sandbox/assets/neurons.bin'));
  const positions = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  const bounds = {min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity]};
  for (let i = 0; i < positions.length; i++) {
    const axis = i % 3, value = positions[i] / 100 * (axis ? -1 : 1);
    bounds.min[axis] = Math.min(bounds.min[axis], value); bounds.max[axis] = Math.max(bounds.max[axis], value);
  }
  for (const [width, height] of [[250, 720], [390, 560], [760, 360], [700, 800]]) {
    const fit = fitBrainBounds(bounds, width, height), tangent = Math.tan(42 * Math.PI / 360);
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i] / 100, y = -positions[i + 1] / 100, z = -positions[i + 2] / 100;
      const depth = fit.center[2] + fit.distance - z;
      assert(Math.abs((x - fit.center[0]) / (depth * tangent * width / height)) < 1);
      assert(Math.abs((y - fit.targetY) / (depth * tangent)) < 1);
    }
  }
});

test('arena panning remains around food, danger and a moving fly without moving the model', async () => {
  const {boundedArenaTarget} = await import('../embodied/sandbox/view-math.mjs');
  const subjects = [[30, 0], [15, 0], [410, -190]], snapshot = JSON.stringify(subjects);
  assert.deepEqual(boundedArenaTarget([9000, -9000, 400], subjects), [480, -260, 12]);
  assert.deepEqual(boundedArenaTarget([410, -190, 1.2], subjects), [410, -190, 1.2]);
  assert.equal(JSON.stringify(subjects), snapshot);
});

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

test('closer decision-focus framing keeps actual neurons and the orb clear of Both-view controls', async () => {
  const {fitBrainBounds} = await import('../embodied/sandbox/view-math.mjs');
  const raw = fs.readFileSync(path.join(__dirname, '../embodied/sandbox/assets/neurons.bin'));
  const original = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4), points = new Float32Array(original.length);
  const bounds = {min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity]}, mean = [0, 0, 0];
  for (let i = 0; i < original.length; i++) {
    const axis = i % 3, value = original[i] / 100 * (axis ? -1 : 1);
    points[i] = value; mean[axis] += value / (original.length / 3);
    bounds.min[axis] = Math.min(bounds.min[axis], value); bounds.max[axis] = Math.max(bounds.max[axis], value);
  }
  const orbY = bounds.max[1] + 1.3, extraPoints = [];
  for (const x of [mean[0] - .45, mean[0] + .45]) for (const y of [orbY - .45, orbY + .45])
    for (const z of [mean[2] - .45, mean[2] + .45]) extraPoints.push([x, y, z]);
  for (const point of extraPoints) for (let axis = 0; axis < 3; axis++) {
    bounds.min[axis] = Math.min(bounds.min[axis], point[axis]); bounds.max[axis] = Math.max(bounds.max[axis], point[axis]);
  }
  for (const [width, height, both] of [[250, 720, false], [390, 560, false], [288, 173, true], [358, 254, true], [650, 148, true]]) {
    const top = both ? 52 : Math.min(168, height * .25), bottom = both ? 8 : Math.min(112, height * .18);
    const fit = fitBrainBounds(bounds, width, height, 42, {points, extraPoints, top, bottom});
    const tangent = Math.tan(42 * Math.PI / 360), upper = 1 - 2 * top / height, lower = -1 + 2 * bottom / height;
    const visible = (x, y, z) => {
      const depth = fit.center[2] + fit.distance - z;
      assert(Math.abs((x - fit.center[0]) / (depth * tangent * width / height)) < 1);
      const vertical = (y - fit.targetY) / (depth * tangent);
      assert(vertical < upper && vertical > lower, `${width}×${height}: point overlaps reserved controls`);
    };
    for (let i = 0; i < points.length; i += 3) visible(points[i], points[i + 1], points[i + 2]);
    extraPoints.forEach(point => visible(...point));
    const half = bounds.max.map((value, axis) => (value - bounds.min[axis]) / 2);
    const previousDistance = half[2] + Math.max(half[0] / (tangent * width / height * .9), half[1] / (tangent * (height - top - bottom) / height * .9));
    assert(fit.distance < previousDistance, 'The closer presentation must not fall back to the old loose framing');
    assert(previousDistance / fit.distance <= 1.150001, 'The requested zoom increase remains modest');
  }
});

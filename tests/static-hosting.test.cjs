'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {staticFiles, build} = require('../tools/build-vercel.cjs');
const root = path.resolve(__dirname, '..');

test('legacy recorded poses align with each 25 ms decision window', async () => {
  const {poseFrameAt} = await import('../embodied/sandbox/replay.mjs');
  const run = JSON.parse(fs.readFileSync(path.join(root, 'embodied/results/sandbox/2ea7f28129/run.json')));
  assert.equal(run.frames, run.rows.length * 3);
  for (let w = 0; w < run.rows.length; w++) {
    assert.equal(poseFrameAt(run, w * .025), w * 3);
    assert.equal(poseFrameAt(run, w * .025 + .01), w * 3 + 1);
    assert.equal(poseFrameAt(run, w * .025 + .024), w * 3 + 2);
  }
  assert.equal(poseFrameAt(run, 6), 719);
  assert.equal(poseFrameAt({frames: 600, rows: new Array(240), frame_dt: .01}, 5.99), 599);
});

test('replay paths preserve both the local server and nested static page', async () => {
  const {recordingPath} = await import('../embodied/sandbox/replay.mjs');
  assert.equal(recordingPath('2ea7f28129', false), '/runs/2ea7f28129');
  assert.equal(new URL(recordingPath('2ea7f28129', true), 'https://example.test/embodied/sandbox/').pathname, '/embodied/results/sandbox/2ea7f28129');
  assert.throws(() => recordingPath('../../secret', true));
});

test('static build publishes required replay paths and rejects unrelated files', () => {
  const listed = staticFiles(root);
  assert.ok(listed.includes('data/connectome.js'));
  assert.ok(listed.includes('embodied/sandbox/assets/valence.json'));
  assert.ok(!listed.some(p => /(?:\.env|\.py$|log\.txt|node_modules|\.git)/.test(p)));
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'chanjs-static-test-'));
  try {
    build(root, output);
    const html = fs.readFileSync(path.join(output, 'embodied/sandbox/index.html'), 'utf8');
    assert.match(html, /window\.CHANJ_STATIC_HOSTING=true/);
    assert.ok(!html.includes('cdn.jsdelivr.net'));
    assert.ok(!html.includes('fonts.googleapis.com'));
    assert.ok(fs.existsSync(path.join(output, 'vendor/three/build/three.module.js')));
    assert.ok(fs.existsSync(path.join(output, 'vendor/three/LICENSE')));
    const ids = ['2ea7f28129', '19be51902d', '313e0f37bc'];
    for (const id of ids) for (const name of ['run.json', 'poses.bin', 'spikes_idx.bin', 'spikes_cnt.bin']) {
      assert.ok(fs.existsSync(path.join(output, `embodied/results/sandbox/${id}/${name}`)));
    }
    assert.ok(!fs.existsSync(path.join(output, 'embodied/sandbox_server.py')));
  } finally { fs.rmSync(output, {recursive: true, force: true}); }
});

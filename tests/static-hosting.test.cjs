'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {staticFiles, build, assetVersion} = require('../tools/build-vercel.cjs');
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

test('root and nested sandbox entries resolve all assets without publishing feeding payload', async () => {
  const listed = staticFiles(root);
  assert.ok(!listed.includes('index.html'));
  assert.ok(!listed.includes('data/connectome.js'));
  assert.ok(listed.includes('data/LICENSE'));
  assert.ok(!listed.some(file => file.startsWith(path.join('assets', 'loading', 'source') + path.sep)),
    'Loading artwork provenance originals are retained in source but not deployed');
  assert.ok(listed.includes('embodied/sandbox/assets/valence.json'));
  assert.ok(!listed.some(p => /(?:\.env|\.py$|log\.txt|node_modules|\.git)/.test(p)));
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'chanjs-static-test-'));
  try {
    const result = build(root, output);
    assert.ok(result.bytes < 45e6, 'Embodied-only presentation should stay below 45 MB');
    const html = fs.readFileSync(path.join(output, 'embodied/sandbox/index.html'), 'utf8');
    assert.match(result.version, /^[0-9a-f]{12}$/);
    for (const url of ['mobile.css', 'ui.js', './app.js', '../../loading.js', '../../loading.css']) {
      assert.ok(html.includes(`${url}?v=${result.version}`), `UI reference is content-versioned: ${url}`);
    }
    assert.ok(fs.readFileSync(path.join(output, 'embodied/sandbox/app.js'), 'utf8')
      .includes(`./replay.mjs?v=${result.version}`), 'The owned replay module shares the UI cache version');
    assert.match(html, /window\.CHANJ_STATIC_HOSTING=true/);
    assert.ok(!html.includes('cdn.jsdelivr.net'));
    assert.ok(!html.includes('fonts.googleapis.com'));
    assert.ok(fs.existsSync(path.join(output, 'vendor/three/build/three.module.js')));
    assert.ok(fs.existsSync(path.join(output, 'vendor/three/LICENSE')));
    const rootHtml = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
    assert.match(rootHtml, /<base href="\/embodied\/sandbox\/">/);
    assert.match(rootHtml, /window\.CHANJ_STATIC_HOSTING=true/);
    const base = new URL('/embodied/sandbox/', 'https://example.test/');
    const brands = listed.filter(file => file.startsWith(path.join('assets', 'brand') + path.sep));
    assert.ok(brands.length > 0, 'Brand SVG assets are included in the static allowlist');
    for (const file of brands) {
      assert.ok(fs.existsSync(path.join(output, file)), `Brand SVG deployed: ${file}`);
      assert.match(fs.readFileSync(path.join(output, file), 'utf8'), /<svg\b/);
    }
    for (const [page, pageUrl] of [[rootHtml, 'https://example.test/'], [html, base.href]]) {
      const documentBase = new URL(page.match(/<base\b[^>]*href="([^"]+)"/)?.[1] || pageUrl, pageUrl);
      const favicon = [...page.matchAll(/<link\b[^>]*>/g)].map(match => match[0])
        .find(tag => /\brel="(?:shortcut )?icon"/.test(tag));
      assert.ok(favicon, 'The sandbox provides a favicon');
      const faviconUrl = new URL(favicon.match(/\bhref="([^"]+)"/)[1], documentBase);
      assert.equal(faviconUrl.searchParams.get('v'), result.version);
      assert.ok(faviconUrl.pathname.startsWith('/assets/brand/'), 'Favicon uses a deployed brand asset');
      assert.ok(fs.existsSync(path.join(output, faviconUrl.pathname.slice(1))));
      const brandRefs = [...page.matchAll(/(?:href|src)="([^"]*assets\/brand\/[^\"]+)"/g)].map(match => match[1]);
      for (const reference of brandRefs) {
        const resolved = new URL(reference, documentBase);
        assert.equal(resolved.searchParams.get('v'), result.version, 'HTML brand references share the content version');
        assert.ok(fs.existsSync(path.join(output, resolved.pathname.slice(1))), `Brand reference resolves from ${pageUrl}: ${reference}`);
      }
    }
    for (const stylesheet of listed.filter(file => file.endsWith('.css'))) {
      const css = fs.readFileSync(path.join(output, stylesheet), 'utf8');
      for (const match of css.matchAll(/url\(["']?([^\s)"']*assets\/brand\/[^\s)"']+)["']?\)/g)) {
        const resolved = new URL(match[1], new URL(stylesheet, 'https://example.test/'));
        assert.equal(resolved.searchParams.get('v'), result.version, 'CSS brand references share the content version');
        assert.ok(fs.existsSync(path.join(output, resolved.pathname.slice(1))), `CSS brand asset resolves from ${stylesheet}: ${match[1]}`);
      }
    }
    const {recordingPath} = await import('../embodied/sandbox/replay.mjs');
    for (const relative of ['./app.js', './replay.mjs', 'assets/fly.json', 'assets/valence.json',
      '../../loading.js', '../../loading.css', '../../vendor/three/build/three.module.js',
      `${recordingPath('2ea7f28129', true)}/run.json`]) {
      const resolved = new URL(relative, base).pathname.slice(1);
      assert.ok(fs.existsSync(path.join(output, resolved)), `${relative} resolves to a deployed file: ${resolved}`);
    }
    for (const missing of ['model.js', 'body.js', 'draw.js', 'app.js', 'style.css', 'about.html',
      'data/connectome.js', 'data/modulators.js', 'data/metadata.json']) {
      assert.ok(!fs.existsSync(path.join(output, missing)), `Feeding payload excluded: ${missing}`);
    }
    const ids = ['2ea7f28129', '19be51902d', '313e0f37bc'];
    for (const id of ids) for (const name of ['run.json', 'poses.bin', 'spikes_idx.bin', 'spikes_cnt.bin']) {
      assert.ok(fs.existsSync(path.join(output, `embodied/results/sandbox/${id}/${name}`)));
    }
    assert.ok(!fs.existsSync(path.join(output, 'embodied/sandbox_server.py')));
  } finally { fs.rmSync(output, {recursive: true, force: true}); }
});

test('UI cache version is stable for identical content and changes after an asset edit', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'chanjs-version-test-'));
  try {
    const files = ['loading.js', 'embodied/sandbox/mobile.css'];
    fs.mkdirSync(path.join(fixture, 'embodied/sandbox'), {recursive: true});
    fs.writeFileSync(path.join(fixture, files[0]), 'window.loader = true;');
    fs.writeFileSync(path.join(fixture, files[1]), 'body { color: black; }');
    const before = assetVersion(fixture, files);
    assert.equal(assetVersion(fixture, [...files].reverse()), before, 'Input ordering does not affect the version');
    fs.writeFileSync(path.join(fixture, files[1]), 'body { color: white; }');
    assert.notEqual(assetVersion(fixture, files), before, 'Changing one owned stylesheet invalidates the UI version');
  } finally { fs.rmSync(fixture, {recursive: true, force: true}); }
});

test('legacy homepage and sandbox shortcuts redirect to the root presentation', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  for (const source of ['/index.html', '/sandbox', '/sandbox/']) {
    assert.equal(config.redirects.find(rule => rule.source === source)?.destination, '/');
  }
  assert.ok(!config.redirects.some(rule => rule.source.startsWith('/embodied/sandbox')),
    'Existing nested recording links must remain directly available');
});

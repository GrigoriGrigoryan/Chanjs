'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

// The public presentation is the embodied sandbox. Preserve the feeding
// experiment in source, but do not upload its 61 MB network or frontend.
const ROOT_FILES = ['LICENSE'];
const OPTIONAL_FILES = ['loading.js', 'loading.css'];
const THREE_ENTRIES = ['build/three.module.js', ...[
  'controls/OrbitControls.js', 'postprocessing/EffectComposer.js', 'postprocessing/RenderPass.js',
  'postprocessing/UnrealBloomPass.js', 'postprocessing/OutputPass.js', 'renderers/CSS2DRenderer.js'
].map(p => `examples/jsm/${p}`)];

function filesUnder(root, relative, extensions) {
  const directory = path.join(root, relative);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const file = path.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Static build refuses symbolic link: ${file}`);
    if (entry.isDirectory()) return filesUnder(root, file, extensions);
    return entry.isFile() && extensions.includes(path.extname(file)) ? [file] : [];
  });
}

function staticFiles(root) {
  const files = [...ROOT_FILES, ...OPTIONAL_FILES.filter(p => fs.existsSync(path.join(root, p))),
    'data/LICENSE',
    ...filesUnder(root, 'docs', ['.md', '.jpg', '.png']),
    ...filesUnder(root, 'assets/loading', ['.webp', '.avif', '.png', '.jpg', '.jpeg', '.svg'])
      .filter(file => !file.startsWith(path.join('assets', 'loading', 'source') + path.sep)),
    ...filesUnder(root, 'assets/brand', ['.svg']),
    ...filesUnder(root, 'embodied/sandbox', ['.html', '.js', '.mjs', '.css', '.json', '.bin'])];
  for (const id of ['2ea7f28129', '19be51902d', '313e0f37bc']) {
    for (const name of ['run.json', 'poses.bin', 'spikes_idx.bin', 'spikes_cnt.bin']) files.push(`embodied/results/sandbox/${id}/${name}`);
  }
  return files;
}

function copy(root, relative, output, target = relative) {
  const source = path.join(root, relative);
  if (!fs.lstatSync(source).isFile()) throw new Error(`Expected regular static file: ${relative}`);
  const destination = path.join(output, target);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.copyFileSync(source, destination);
}

// Copy the actual import closure, not all of three's examples and optional assets.
function vendorThree(root, output) {
  const pkg = path.join(root, 'node_modules/three');
  const version = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'), 'utf8')).version;
  if (version !== '0.170.0') throw new Error(`Expected pinned three 0.170.0, got ${version}`);
  const pending = [...THREE_ENTRIES], seen = new Set();
  while (pending.length) {
    const relative = pending.pop();
    if (seen.has(relative)) continue;
    seen.add(relative);
    const source = fs.readFileSync(path.join(pkg, relative), 'utf8');
    copy(pkg, relative, output, path.join('vendor/three', relative));
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
      if (match[1].startsWith('.')) {
        const dependency = path.normalize(path.join(path.dirname(relative), match[1]));
        if (dependency.startsWith('..') || path.isAbsolute(dependency)) throw new Error('Invalid three import');
        pending.push(dependency);
      } else if (match[1] !== 'three') throw new Error(`Unvendored dependency: ${match[1]}`);
    }
  }
  copy(pkg, 'LICENSE', output, 'vendor/three/LICENSE');
  return seen.size;
}

function assetVersion(root, files) {
  const critical = files.filter(file => /\.(js|mjs|css|svg)$/.test(file) &&
    (file.startsWith('embodied/sandbox/') || file.startsWith('assets/brand/') || OPTIONAL_FILES.includes(file))).sort();
  const hash = createHash('sha256');
  for (const file of critical) hash.update(file).update('\0').update(fs.readFileSync(path.join(root, file))).update('\0');
  return hash.digest('hex').slice(0, 12);
}

function versionReferences(content, references, version) {
  for (const reference of references) for (const quote of ['"', "'"]) {
    content = content.replaceAll(`${quote}${reference}${quote}`, `${quote}${reference}?v=${version}${quote}`);
  }
  return content;
}

function build(root, output) {
  if (fs.existsSync(output) && fs.readdirSync(output).length) throw new Error('Build output must be empty');
  fs.mkdirSync(output, {recursive: true});
  const files = staticFiles(root);
  for (const file of files) copy(root, file, output);
  const vendorCount = vendorThree(root, output);
  const version = assetVersion(root, files);
  const brandRefs = files.filter(file => file.startsWith('assets/brand/'))
    .flatMap(file => [file, `../../${file}`]);
  // Brand marks also appear in slider CSS and the loader's JavaScript.
  for (const file of files.filter(file => /\.(css|js)$/.test(file))) {
    const target = path.join(output, file);
    const source = fs.readFileSync(target, 'utf8');
    const updated = versionReferences(source, [...brandRefs, './replay.mjs'], version);
    if (source !== updated) fs.writeFileSync(target, updated);
  }
  const sandboxPath = path.join(output, 'embodied/sandbox/index.html');
  let html = fs.readFileSync(sandboxPath, 'utf8');
  html = versionReferences(html, ['mobile.css', 'ui.js', './app.js', '../../loading.js', '../../loading.css', ...brandRefs], version);
  html = html.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.170\.0\//g, '../../vendor/three/');
  html = html.replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, '');
  html = html.replace('</head>', '<script>window.CHANJ_STATIC_HOSTING=true;</script>\n</head>');
  fs.writeFileSync(sandboxPath, html);
  // Modules and fetch() calls retain their sandbox-relative paths when the
  // sandbox is opened at /. The original nested entry stays available.
  const rootHtml = html.replace(/<head\b[^>]*>/i, '$&\n<base href="/embodied/sandbox/">');
  fs.writeFileSync(path.join(output, 'index.html'), rootHtml);
  let bytes = 0;
  const walk = dir => { for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name); if (entry.isDirectory()) walk(file); else bytes += fs.statSync(file).size;
  }};
  walk(output);
  console.log(`Static presentation: ${files.length} project files + root sandbox entry + ${vendorCount} three modules; ${(bytes / 1e6).toFixed(2)} MB.`);
  console.log('Instant preview and recorded runs enabled. Full Python/MuJoCo jobs are not deployed.');
  return {files, bytes, vendorCount, version};
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..'), output = path.join(root, 'dist');
  fs.rmSync(output, {recursive: true, force: true});
  build(root, output);
}
module.exports = {build, staticFiles, vendorThree, assetVersion};

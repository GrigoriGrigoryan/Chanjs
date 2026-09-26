// UI only: the scientific runtime owns the experiment, playback and renderer.
const $ = id => document.getElementById(id);
const root = document.documentElement;
const body = document.body;
const controls = $('controls');
const brainDetails = $('brain-details');
const help = $('help-dialog');
const desktop = matchMedia('(min-width:1000px)');
const THEME_KEY = 'chanj-theme';
const COACH_KEY = 'chanj-intro-seen-v2';
let activeView = 'arena';
let lastOpener = null;
let coachTimer = 0;

const explanations = {
  about: {
    kicker: 'MEET CHANJ', title: 'A little body. A connected brain.',
    content: '<p>Explore how signals in a modeled fruit-fly brain relate to movement in its world.</p><p class="help-fact"><strong>138,639 neurons.</strong> FlyWire connectivity, a NeuroMechFly body, and an interactive view of their modeled behavior.</p><p>Use <strong>Arena</strong> to follow the fly, <strong>Brain</strong> to explore activity, and <strong>Controls</strong> to change the conditions.</p><p><a href="https://github.com/K4ryan/Chanjs/blob/main/embodied/README.md" target="_blank" rel="noreferrer">Model, sources &amp; assumptions ↗</a></p><p class="legal-note">FlyWire data: noncommercial use. Base code © Nic Dunzelman, MIT. NeuroMechFly: Apache-2.0. Three.js: MIT.</p>'
  },
  arena: {
    kicker: '01 / THE BODY', title: 'Follow a small decision.',
    content: '<p>The fly moves through a world with <strong>food</strong> and a <strong>danger cue</strong>. The top readout shows fly time and distance to food.</p><p>Drag the objects to move them. Use the target button to <strong>follow the fly</strong>, or the eye to see an <strong>overview</strong>.</p><p>Open Controls to change neural inputs or replay a previously computed experiment.</p>'
  },
  brain: {
    kicker: '02 / THE BRAIN', title: 'Signals become visible.',
    content: '<p>The colored groups represent neural populations. Activity dots are sampled from measured firing rates; recorded runs use recorded spike counts.</p><p><strong>Decision focus</strong> highlights the populations used by the model’s approach/avoid readout.</p><p>Tap <strong>Neuron groups</strong> for mean rates, or <strong>Why this choice?</strong> for the decision pathway and its assumptions.</p>'
  },
  modes: {
    kicker: 'WHAT IS RUNNING?', title: 'Two ways to explore.',
    content: '<p><strong>Instant preview</strong> interpolates results measured from the spiking brain at 100 settings. Body motion is an animated approximation.</p><p><strong>Recorded experiments</strong> replay previously computed full-brain and MuJoCo physics runs. Playback restores the recorded conditions.</p><p class="help-fact">A new full simulation needs the separate Python runtime. The hosted app provides the instant preview and recorded results.</p>'
  },
  modulators: {
    kicker: 'CHANGE A SIGNAL', title: 'Try one change at a time.',
    content: '<p><strong>Reward dopamine (PAM)</strong> and <strong>punishment dopamine (PPL1)</strong> change modeled input to approach/avoid populations.</p><p>At <strong>0</strong> the setting is natural. <strong>−1</strong> blocks release; <strong>+1</strong> drives the group. These are model interventions, not measured hormone concentrations.</p><p><strong>Octopamine</strong> changes walking speed through an assumed gain. Move a slider, then compare the movement and neural readouts.</p>'
  },
  newspaper: {
    kicker: 'A PLAYFUL LAYER', title: 'Watch the newspaper.',
    content: '<p><strong>Newspaper mode</strong> shows food as fruit and danger as a newspaper. It adds collision and win/lose rules to the scene.</p><p>These are game rules layered over the model. Being caught by the newspaper is not a biological finding.</p><p>Tap <strong>Newspaper</strong> in the arena to toggle the mode. You can drag the newspaper and food to move them.</p>'
  },
  gestures: {
    kicker: 'EXPLORE THE WORLD', title: 'A few small gestures.',
    content: '<ul><li><strong>Drag food or danger</strong> to change its position.</li><li><strong>Drag empty space</strong> to rotate the view.</li><li><strong>Pinch</strong> to zoom; use two fingers to pan.</li><li>On a computer, <strong>scroll</strong> to zoom and right-drag to pan.</li></ul><p>The target button follows the fly. The eye button restores an overview.</p>'
  },
  decision: {
    kicker: 'READ THE RESPONSE', title: 'Approach or avoid?',
    content: '<p>The decision signal summarizes the model’s approach and avoid populations. Positive values favor approach; negative values favor avoidance.</p><p>It is a model readout, not a measure of emotion, intent or confidence.</p><p>Open <strong>Brain → Why this choice?</strong> to inspect the rates and the dopamine input assumptions behind it.</p>'
  }
};

// A deployed root page uses <base>; local SVG references must retain this page URL.
function normalizeIcons() {
  const page = `${location.pathname}${location.search}`;
  document.querySelectorAll('use').forEach(use => {
    const original = use.dataset.icon || use.getAttribute('href')?.split('#').pop();
    if (!original) return;
    use.dataset.icon = original;
    use.setAttribute('href', `${page}#${original}`);
  });
}
function setTheme(theme, updateUrl = true) {
  if (!['orange', 'burgundy'].includes(theme)) theme = 'orange';
  root.dataset.theme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('theme', theme);
    history.replaceState(history.state, '', url);
  }
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'burgundy' ? '#f2e4e6' : '#f3efe7');
  normalizeIcons();
  window.dispatchEvent(new CustomEvent('chanj:themechange', { detail: { theme } }));
}
function setView(view) {
  activeView = view === 'brain' ? 'brain' : 'arena';
  body.dataset.view = activeView;
  document.querySelectorAll('[data-view-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.viewChoice === activeView)));
  $('arena').setAttribute('aria-hidden', String(!desktop.matches && activeView !== 'arena'));
  $('brainview').setAttribute('aria-hidden', String(!desktop.matches && activeView !== 'brain'));
  hideCoach();
}
function showControlTab(tab) {
  if (!['behavior', 'arena', 'replays'].includes(tab)) tab = 'behavior';
  document.querySelectorAll('[data-control-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.controlTab === tab)));
  document.querySelectorAll('[data-control-panel]').forEach(panel => { panel.hidden = panel.dataset.controlPanel !== tab; });
  controls.querySelector('.sheet-scroll').scrollTop = 0;
}
function showBrainTab(tab) {
  if (!['groups', 'pathway'].includes(tab)) tab = 'groups';
  document.querySelectorAll('[data-brain-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.brainTab === tab)));
  document.querySelectorAll('[data-brain-content]').forEach(panel => { panel.hidden = panel.dataset.brainContent !== tab; });
  brainDetails.querySelector('.sheet-scroll').scrollTop = 0;
}
function openDialog(dialog, opener) {
  hideCoach();
  if (!dialog.open) {
    lastOpener = opener || document.activeElement;
    dialog.showModal();
  }
}
function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}
function openControls(tab, opener) {
  showControlTab(tab);
  openDialog(controls, opener);
}
function openHelp(key, opener) {
  const explanation = explanations[key] || explanations.about;
  $('help-kicker').textContent = explanation.kicker;
  $('help-title').textContent = explanation.title;
  $('help-content').innerHTML = explanation.content;
  openDialog(help, opener);
}
function hideCoach() {
  clearTimeout(coachTimer);
  $('coachmark').hidden = true;
}
function showCoach() {
  let seen = false;
  try { seen = localStorage.getItem(COACH_KEY) === '1'; } catch {}
  if (seen || document.querySelector('dialog[open]')) return;
  try { localStorage.setItem(COACH_KEY, '1'); } catch {}
  $('coachmark').hidden = false;
  coachTimer = setTimeout(hideCoach, 7000);
}

for (const button of document.querySelectorAll('[data-theme-choice]')) button.addEventListener('click', () => setTheme(button.dataset.themeChoice));
for (const button of document.querySelectorAll('[data-view-choice]')) button.addEventListener('click', () => setView(button.dataset.viewChoice));
for (const button of document.querySelectorAll('[data-open-controls]')) button.addEventListener('click', () => openControls(button.dataset.openControls, button));
for (const button of document.querySelectorAll('[data-control-tab]')) button.addEventListener('click', () => showControlTab(button.dataset.controlTab));
for (const button of document.querySelectorAll('[data-brain-tab]')) button.addEventListener('click', () => showBrainTab(button.dataset.brainTab));
for (const button of document.querySelectorAll('[data-brain-panel]')) button.addEventListener('click', () => { showBrainTab(button.dataset.brainPanel); openDialog(brainDetails, button); });
for (const button of document.querySelectorAll('[data-help]')) button.addEventListener('click', () => openHelp(button.dataset.help, button));
for (const button of document.querySelectorAll('[data-close-dialog]')) button.addEventListener('click', () => closeDialog(button.closest('dialog')));
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(dialog);
  });
  dialog.addEventListener('close', () => {
    if (lastOpener?.isConnected && !document.querySelector('dialog[open]')) lastOpener.focus({ preventScroll: true });
  });
}
$('dismiss-coach').addEventListener('click', hideCoach);

// Observe only presentation state written by app.js; never duplicate simulation logic.
function syncPlayback() {
  const recorded = $('playback').classList.contains('show');
  body.dataset.playback = recorded ? 'recorded' : 'preview';
  if (recorded) closeDialog(controls);
}
new MutationObserver(syncPlayback).observe($('playback'), { attributes: true, attributeFilter: ['class'] });
for (const id of ['replay-baseline', 'replay-modulated']) {
  $(id).addEventListener('click', () => { hideCoach(); });
}
desktop.addEventListener('change', () => setView(activeView));
document.addEventListener('chanj:ready', () => { syncPlayback(); showCoach(); });
window.addEventListener('popstate', () => {
  const theme = new URL(location.href).searchParams.get('theme');
  if (theme) setTheme(theme, false);
});
setTheme(root.dataset.theme, false);
setView('arena');
syncPlayback();

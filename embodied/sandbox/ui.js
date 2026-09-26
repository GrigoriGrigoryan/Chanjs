// UI only: the scientific runtime owns the experiment, playback and renderer.
const $ = id => document.getElementById(id);
const root = document.documentElement;
const body = document.body;
const controls = $('controls');
const brainDetails = $('brain-details');
const help = $('help-dialog');
const desktop = matchMedia('(min-width:1100px)');
const THEME_KEY = 'chanj-theme';
const COACH_KEY = 'chanj-intro-seen-v2';
let activeView = 'arena';
const dialogOpeners = new WeakMap();
let coachTimer = 0;

const explanations = {
  about: {
    kicker: 'MEET CHANJS', title: 'A little body. A connected brain.',
    content: '<p>Explore how signals in a modeled fruit-fly brain relate to movement in its world.</p><p class="help-fact"><strong>138,639 neurons.</strong> FlyWire connectivity, a NeuroMechFly body, and an interactive view of their modeled behavior.</p><p>Use <strong>Arena</strong> to follow the fly and <strong>Brain</strong> to explore activity. On a computer the settings stay open. On a phone, tap <strong>Controls</strong> and drag the panel down to close it.</p><p><a href="https://github.com/K4ryan/Chanjs/blob/main/embodied/README.md" target="_blank" rel="noreferrer">Model, sources &amp; assumptions ↗</a></p><p class="legal-note">FlyWire data: noncommercial use. Base code © Nic Dunzelman, MIT. NeuroMechFly: Apache-2.0. Three.js: MIT.</p>'
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
    content: '<p><strong>Food attraction · PAM</strong>: moving right strengthens the model’s approach signal by reducing its avoid-side input.</p><p><strong>Approach brake · PPL1</strong>: moving left releases this brake. Moving right can have a smaller effect because the baseline brake is already strong.</p><p>At <strong>0</strong> the setting is natural. <strong>−1</strong> blocks release; <strong>+1</strong> drives the group. These are model interventions, not measured hormone concentrations.</p><p><strong>Walking drive · octopamine</strong> changes the modeled walking drive through an assumed gain. This is different from playback speed, which only changes how quickly you watch.</p><p>The presets change food attraction while resetting the other conditions, so you can compare the same scene. They do not guarantee a route or outcome.</p>'
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
  if (!['noir', 'burgundy'].includes(theme)) theme = 'noir';
  root.dataset.theme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('theme', theme);
    history.replaceState(history.state, '', url);
  }
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'burgundy' ? '#170b13' : '#080809');
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
  document.querySelectorAll('[data-control-panel]').forEach(panel => { panel.hidden = !desktop.matches && panel.dataset.controlPanel !== tab; });
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
    dialogOpeners.set(dialog, opener || document.activeElement);
    dialog.showModal();
  }
}
function closeDialog(dialog) {
  if (dialog === controls && desktop.matches) return;
  if (dialog?.open) dialog.close();
}
function openControls(tab, opener) {
  showControlTab(tab);
  if (desktop.matches) {
    controls.open = true;
    const section = controls.querySelector(`[data-control-panel="${tab}"]`);
    if (section) controls.querySelector('.sheet-scroll').scrollTop += section.getBoundingClientRect().top - controls.querySelector('.sheet-scroll').getBoundingClientRect().top;
    return;
  }
  openDialog(controls, opener);
}
function syncControlsLayout() {
  const wasOpen = controls.open;
  if (wasOpen) controls.close(); // removes an old mobile modal from the top layer
  controls.removeAttribute('style');
  controls.setAttribute('role', desktop.matches ? 'complementary' : 'dialog');
  if (desktop.matches) controls.open = true; // a nonmodal panel; never steals loader focus
  showControlTab(controls.querySelector('[data-control-tab][aria-pressed="true"]')?.dataset.controlTab || 'behavior');
}

function openHelp(key, opener) {
  const explanation = explanations[key] || explanations.about;
  $('help-kicker').textContent = explanation.kicker;
  $('help-title').textContent = explanation.title;
  $('help-content').innerHTML = explanation.content;
  if (key === 'about') {
    const replay = document.createElement('button');
    replay.className = 'help-row';
    replay.textContent = 'Replay opening · restarts this view';
    replay.addEventListener('click', () => {
      const url = new URL(location.href); url.searchParams.set('intro', '1'); location.href = url.href;
    });
    $('help-content').append(replay);
  }
  openDialog(help, opener);
}
function hideCoach() {
  clearTimeout(coachTimer);
  $('coachmark').hidden = true;
}
function showCoach() {
  let seen = false;
  try { seen = localStorage.getItem(COACH_KEY) === '1'; } catch {}
  if (seen || [...document.querySelectorAll('dialog[open]')].some(dialog => dialog !== controls || !desktop.matches)) return;
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
    const opener = dialogOpeners.get(dialog);
    if (opener?.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
  });
}
$('dismiss-coach').addEventListener('click', hideCoach);

// Pull the grip/header, or pull down from the top of the scroll area.
// Range sliders and buttons keep their own gestures; content still scrolls normally.
for (const sheet of document.querySelectorAll('.sheet')) {
  let gesture = null, settleTimer = 0;
  const canDrag = () => !desktop.matches && sheet.open;
  const interactive = target => target.closest('button,input,select,a,summary');
  const start = (x, y, kind) => {
    clearTimeout(settleTimer);
    gesture = { x, y, dy: 0, at: performance.now(), kind, active: kind === 'header' };
  };
  const move = (x, y) => {
    if (!gesture) return false;
    const dy = y - gesture.y, dx = x - gesture.x;
    if (!gesture.active) {
      if (dy < -8 || Math.abs(dx) > Math.abs(dy) + 8) { gesture = null; return false; }
      if (dy > 8 && dy > Math.abs(dx)) gesture.active = true;
    }
    if (!gesture.active) return false;
    gesture.dy = Math.max(0, dy);
    sheet.dataset.dragging = 'true';
    sheet.style.animation = 'none';
    sheet.style.transition = 'none';
    sheet.style.transform = `translateY(${gesture.dy}px)`;
    return true;
  };
  const clear = () => {
    gesture = null;
    delete sheet.dataset.dragging;
    sheet.style.removeProperty('transform');
    sheet.style.removeProperty('transition');
    sheet.style.removeProperty('animation');
  };
  const end = (cancelled = false) => {
    if (!gesture) return;
    const {dy, at, active} = gesture;
    gesture = null;
    if (!active) return;
    const fast = dy > 36 && dy / Math.max(1, performance.now() - at) > .55;
    const dismiss = !cancelled && (dy > Math.min(110, sheet.clientHeight * .22) || fast);
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
    sheet.style.transition = `transform ${duration}ms ease-out`;
    sheet.style.transform = dismiss ? `translateY(${sheet.clientHeight + 40}px)` : 'translateY(0)';
    settleTimer = setTimeout(() => { if (dismiss) closeDialog(sheet); clear(); }, duration);
  };
  for (const handle of sheet.querySelectorAll('.sheet-grip,.sheet-header')) {
    handle.style.touchAction = 'none';
    handle.addEventListener('pointerdown', event => {
      if (!canDrag() || event.button !== 0 || interactive(event.target)) return;
      start(event.clientX, event.clientY, 'header');
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', event => { if (gesture?.kind === 'header') move(event.clientX, event.clientY); });
    handle.addEventListener('pointerup', () => { if (gesture?.kind === 'header') end(); });
    handle.addEventListener('pointercancel', () => { if (gesture?.kind === 'header') end(true); });
  }
  const scroll = sheet.querySelector('.sheet-scroll');
  scroll?.addEventListener('touchstart', event => {
    if (!canDrag() || event.touches.length !== 1 || scroll.scrollTop > 0 || interactive(event.target)) return;
    const touch = event.touches[0]; start(touch.clientX, touch.clientY, 'content');
  }, {passive: true});
  scroll?.addEventListener('touchmove', event => {
    if (gesture?.kind !== 'content' || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (move(touch.clientX, touch.clientY)) event.preventDefault();
  }, {passive: false});
  scroll?.addEventListener('touchend', () => { if (gesture?.kind === 'content') end(); });
  scroll?.addEventListener('touchcancel', () => { if (gesture?.kind === 'content') end(true); });
  sheet.addEventListener('close', () => { clearTimeout(settleTimer); clear(); });
}

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
desktop.addEventListener('change', () => { setView(activeView); syncControlsLayout(); });
document.addEventListener('chanj:ready', () => { syncPlayback(); showCoach(); });
window.addEventListener('popstate', () => {
  const theme = new URL(location.href).searchParams.get('theme');
  if (theme) setTheme(theme, false);
});
setTheme(root.dataset.theme, new URLSearchParams(location.search).get('theme') === 'orange');
setView('arena');
syncControlsLayout();
syncPlayback();

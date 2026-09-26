/* CHANJS first-visit introduction; resource readiness and cinema stay separate. */
(function () {
  'use strict';
  if (window.ChanjLoader) return;

  const scriptUrl = document.currentScript && document.currentScript.src;
  const assetBase = scriptUrl || new URL('loading.js', location.href);
  const artUrl = new URL('assets/loading/newspaper-hand.webp', assetBase).href;
  const markUrl = new URL('assets/brand/fly-eye.svg', assetBase).href;
  const SEEN_KEY = 'chanjs-intro-v3';
  const INTRO_MS = 2800, REVEAL_MS = 400, REDUCED_MS = 180;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let root, dock, title, detail, phase, elapsed, dockTime, retryButton;
  let cycle = null, visible = false, pageSeen = false, waitingForBody = false;
  let pendingOptions = null, returnFocus = null;
  const defaults = { title: 'A tiny fly. A whole world.', detail: 'Preparing the experiment…', timeoutMs: 45000 };

  function currentTheme() {
    const selected = document.documentElement.dataset.theme;
    if (selected === 'noir' || selected === 'burgundy') return selected;
    const query = new URLSearchParams(location.search).get('theme');
    if (query === 'noir' || query === 'burgundy') return query;
    try { if (localStorage.getItem('chanj-theme') === 'burgundy') return 'burgundy'; } catch (_) {}
    return 'noir';
  }
  function syncTheme() {
    if (root) root.dataset.theme = currentTheme();
    if (dock) dock.dataset.theme = currentTheme();
  }
  function hasSeenIntro() {
    if (new URLSearchParams(location.search).get('intro') === '1') return false;
    try { return pageSeen || localStorage.getItem(SEEN_KEY) === 'seen'; } catch (_) { return pageSeen; }
  }
  function rememberIntro() {
    pageSeen = true;
    try { localStorage.setItem(SEEN_KEY, 'seen'); } catch (_) {}
  }
  function makeCycle(settings) {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { ready: false, failed: false, ended: false, mounted: false, introDone: false,
      skipped: false, exiting: false, reduced: motionPreference.matches, returning: hasSeenIntro(),
      startedAt: performance.now(), readyAt: null, retry: typeof settings.retry === 'function' ? settings.retry : null,
      tick: 0, timeout: 0, introTimer: 0, exitTimer: 0, exitListener: null, promise, resolve };
  }
  function flyingFly() {
    return `<svg viewBox="0 0 180 150" aria-hidden="true" focusable="false" fill="none">
      <g stroke="#22201c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m89 80-12 27-26 10m38-25 14 31 26 4m-48-42-33 2-20 12m71-16 27 23 27-4m-60-27-27-15-22 5m50 17 33-4 21 11"/>
        <g class="cl-fly-wing cl-fly-wing-a"><path d="M83 75C25 82 5 28 20 20S76 29 95 64Z" fill="#f6f0dc" fill-opacity=".82"/><path d="M24 25 88 69 33 42M51 57 54 47 61 29" stroke-width="1" opacity=".6"/></g>
        <g class="cl-fly-wing cl-fly-wing-b"><path d="M99 71C116 15 166 2 170 22S145 66 109 79Z" fill="#f6f0dc" fill-opacity=".82"/><path d="M165 24 109 70 153 38M135 48 134 32 127 22" stroke-width="1" opacity=".6"/></g>
        <path d="M76 91C64 122 78 144 91 143S111 113 102 90Z" fill="#383526"/>
        <path d="M74 107Q90 115 105 105M75 121Q90 129 103 119M81 134Q89 138 98 132" stroke="#c3a460" stroke-width="4"/>
        <ellipse cx="91" cy="82" rx="18" ry="22" fill="#39382d"/>
        <path d="M85 65 78 46 70 42M99 65 105 45 114 42"/>
        <ellipse cx="91" cy="60" rx="19" ry="15" fill="#9c4836"/>
        <ellipse cx="78" cy="60" rx="8" ry="12" fill="#e9633c"/><ellipse cx="104" cy="59" rx="8" ry="12" fill="#e9633c"/>
        <path d="m85 54 5-5 7 3" stroke="#eac793" stroke-width="2"/>
      </g>
    </svg>`;
  }
  function paperFallback() {
    // Immediate code-native silhouette while the optional photograph downloads.
    return `<svg class="cl-paper-fallback" viewBox="0 0 1200 800" aria-hidden="true" focusable="false">
      <g transform="rotate(-42 570 450)"><path d="M505 64Q566 18 634 64L648 595Q575 632 506 594Z" fill="#f2e8ce" stroke="#312e29" stroke-width="3"/>
      <ellipse cx="570" cy="66" rx="64" ry="22" fill="#cfbfa2" stroke="#312e29" stroke-width="3"/><ellipse cx="569" cy="64" rx="40" ry="10" fill="#544d41"/>
      <path d="M524 145h102v86H524z" fill="#38352e"/>
      <path d="M525 260h100m-100 15h100m-100 15h100m-100 15h100m-100 40h100m-100 15h100m-100 15h100m-100 15h100m-100 40h100m-100 15h100m-100 15h100m-100 15h100" stroke="#655e4e" stroke-width="5"/>
      </g></svg>`;
  }
  function mount() {
    if (root) return;
    root = document.createElement('section');
    root.className = 'chanj-loader';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'cl-title');
    root.innerHTML = `<header class="cl-top"><span class="cl-brand"><img class="cl-brand-mark" alt="" width="26" height="26">CHANJS<span class="cl-brand-slash">/</span><span class="cl-atlas">A FLY'S WORLD</span></span><button type="button" class="cl-hide">Skip intro <span aria-hidden="true">↗</span></button></header>
      <div class="cl-stage" aria-hidden="true">
        <img class="cl-return-mark" alt="" width="128" height="128">
        <div class="cl-stage-copy"><span class="cl-index">01 / A MOMENT IN A FLY’S WORLD</span><p>Small brain.<br><em>Big world.</em></p></div>
        <span class="cl-side-note">A WORLD IN EVERY CONNECTION.</span>
        <div class="cl-wordmark"><span>C</span><span>H</span><span>A</span><span>N</span><span>J</span><span>S</span></div>
        <svg class="cl-flightline" viewBox="0 0 1000 500" preserveAspectRatio="none"><path d="M-50 350C120 260 280 435 410 280S650 30 740 180 1040 260 1100 50"/></svg>
        <div class="cl-fly">${flyingFly()}</div>
        <div class="cl-swat">${paperFallback()}<img class="cl-hand" alt="" width="1200" height="800" decoding="async" fetchpriority="high"></div>
        <span class="cl-impact cl-impact-one"></span><span class="cl-impact cl-impact-two"></span><span class="cl-impact cl-impact-three"></span>
        <span class="cl-escape-note">A SMALL INTERRUPTION.</span>
        <span class="cl-illustration">Illustrated introduction</span>
      </div>
      <footer class="cl-bottom"><div class="cl-copy"><h2 id="cl-title"></h2><div class="cl-status"><span class="cl-status-mark" aria-hidden="true"></span><div><p class="cl-phase">PREPARING THE WORLD</p><p class="cl-detail" role="status" aria-live="polite" aria-atomic="true"></p></div></div></div><div class="cl-actions"><button type="button" class="cl-retry" hidden>Retry loading <span aria-hidden="true">↗</span></button></div><div class="cl-time"><span>ELAPSED</span><output role="timer" aria-live="off">00:00</output></div></footer>`;
    document.body.append(root);
    dock = document.createElement('button');
    dock.type = 'button';
    dock.className = 'chanj-loader-dock';
    dock.hidden = true;
    dock.innerHTML = '<span aria-hidden="true" class="cl-dock-dot"></span><span class="cl-dock-text">Loading continues</span><span class="cl-dock-time" aria-hidden="true">00:00</span><span aria-hidden="true">↗</span>';
    dock.setAttribute('aria-label', 'Show loading status');
    document.body.append(dock);
    syncTheme();
    window.addEventListener('chanj:themechange', syncTheme);
    new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const hand = root.querySelector('.cl-hand');
    hand.addEventListener('load', () => { root.dataset.art = 'ready'; }, { once: true });
    hand.addEventListener('error', () => { root.dataset.art = 'fallback'; }, { once: true });
    hand.src = artUrl;
    root.querySelector('.cl-brand-mark').src = root.querySelector('.cl-return-mark').src = markUrl;
    title = root.querySelector('#cl-title');
    detail = root.querySelector('.cl-detail');
    phase = root.querySelector('.cl-phase');
    elapsed = root.querySelector('output');
    dockTime = dock.querySelector('.cl-dock-time');
    retryButton = root.querySelector('.cl-retry');
    root.querySelector('.cl-hide').addEventListener('click', hide);
    dock.addEventListener('click', reveal);
    retryButton.addEventListener('click', () => {
      if (!cycle || !cycle.retry) { window.location.reload(); return; }
      const retry = cycle.retry;
      resetForRetry(cycle);
      try { Promise.resolve(retry()).catch(error => fail(error.message || 'Loading failed.', retry)); }
      catch (error) { fail(error.message || 'Loading failed.', retry); }
    });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); hide(); }
      if (event.key !== 'Tab') return;
      const buttons = [...root.querySelectorAll('button')].filter(button => !button.hidden && !button.disabled);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function formatTime(c) {
    const end = c.readyAt === null ? performance.now() : c.readyAt;
    const seconds = Math.max(0, Math.floor((end - c.startedAt) / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function updateTime() {
    if (!root || !cycle) return;
    elapsed.textContent = dockTime.textContent = formatTime(cycle);
  }
  function clearLoadTimers(c) {
    clearInterval(c.tick); clearTimeout(c.timeout); c.tick = c.timeout = 0;
  }
  function cancelExit(c) {
    clearTimeout(c.exitTimer); c.exitTimer = 0;
    if (root && c.exitListener) root.removeEventListener('transitionend', c.exitListener);
    c.exitListener = null; c.exiting = false;
    if (root) delete root.dataset.exiting;
  }
  function restoreFocus() {
    if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === 'function') returnFocus.focus({ preventScroll: true });
  }
  function reveal() {
    if (!cycle || cycle.ended || !root) return;
    visible = true;
    root.hidden = false; dock.hidden = true;
    document.documentElement.classList.add('chanj-loading-lock');
    root.querySelector('.cl-hide').focus({ preventScroll: true });
  }
  function endCinema(c, skipped) {
    clearTimeout(c.introTimer); c.introTimer = 0;
    c.introDone = true;
    if (skipped) c.skipped = true;
    rememberIntro();
    if (root) root.dataset.cinema = 'settled';
  }
  function complete(c) {
    if (cycle !== c || c.ended || !c.ready || c.failed) return;
    const hadFocus = visible && root && root.contains(document.activeElement);
    clearLoadTimers(c); clearTimeout(c.introTimer); cancelExit(c);
    visible = false; c.ended = true;
    if (root) root.hidden = dock.hidden = true;
    document.documentElement.classList.remove('chanj-loading-lock');
    if (hadFocus) restoreFocus();
    // Resolve after the actual DOM hide, never just when resource loading ends.
    c.resolve();
  }
  function maybeComplete(c) {
    if (cycle !== c || c.ended || c.failed || !c.ready || !c.introDone || !c.mounted || c.exiting) return;
    if (!visible || c.reduced || c.returning || c.skipped) { complete(c); return; }
    c.exiting = true;
    root.dataset.exiting = 'true';
    c.exitListener = event => {
      if (event.target === root && event.propertyName === 'opacity') complete(c);
    };
    root.addEventListener('transitionend', c.exitListener);
    // If transitions are disabled or the browser suppresses transitionend, hide
    // explicitly before resolving. A late asset error can cancel this fallback.
    c.exitTimer = window.setTimeout(() => complete(c), REVEAL_MS + 80);
  }
  function hide() {
    const c = cycle;
    if (!c || c.ended) return;
    endCinema(c, true);
    cancelExit(c);
    visible = false;
    if (root) { root.hidden = true; dock.hidden = false; }
    document.documentElement.classList.remove('chanj-loading-lock');
    restoreFocus();
    // Skip dismisses cinema, not resource loading. The dock persists until ready.
    maybeComplete(c);
  }
  function armLoading(c, timeoutMs) {
    clearLoadTimers(c);
    c.tick = window.setInterval(updateTime, 1000);
    const wait = Number(timeoutMs);
    if (wait > 0 && Number.isFinite(wait)) c.timeout = window.setTimeout(() => {
      if (cycle !== c || c.ended || c.ready || c.failed) return;
      root.dataset.state = 'slow';
      phase.textContent = 'STILL LOADING';
      detail.textContent = 'This is taking longer than expected. You can keep waiting or retry.';
      retryButton.hidden = false;
      dock.querySelector('.cl-dock-text').textContent = 'Loading is taking longer';
    }, wait);
  }
  function startMountedCycle(c, settings) {
    mount(); syncTheme();
    c.mounted = true;
    if (typeof settings.retry === 'function') c.retry = settings.retry;
    if (c.returning || c.failed) c.introDone = true;
    root.dataset.state = c.failed ? 'error' : (c.ready ? 'ready' : 'loading');
    root.dataset.mode = c.returning ? 'returning' : 'cinematic';
    root.dataset.motion = c.reduced ? 'reduced' : 'full';
    root.dataset.cinema = c.introDone ? 'settled' : 'playing';
    delete root.dataset.exiting;
    title.textContent = settings.title;
    detail.textContent = c.ready ? 'Your fly is ready.' : settings.detail;
    phase.textContent = c.failed ? 'LOADING STOPPED' : (c.ready ? 'READY' : 'PREPARING THE WORLD');
    retryButton.hidden = !c.failed;
    dock.querySelector('.cl-dock-text').textContent = 'Loading continues';
    returnFocus = document.activeElement;
    if (!c.skipped) reveal();
    else { root.hidden = true; dock.hidden = false; }
    if (!c.introDone) c.introTimer = window.setTimeout(() => {
      if (cycle !== c || c.ended) return;
      endCinema(c, false); maybeComplete(c);
    }, c.reduced ? REDUCED_MS : INTRO_MS);
    if (!c.ready && !c.failed) armLoading(c, settings.timeoutMs);
    updateTime(); maybeComplete(c);
  }
  function show(options) {
    const settings = Object.assign({}, defaults, options || {});
    if (!cycle || cycle.ended) cycle = makeCycle(settings);
    const c = cycle;
    if (!document.body) {
      pendingOptions = settings;
      if (!waitingForBody) {
        waitingForBody = true;
        document.addEventListener('DOMContentLoaded', () => {
          waitingForBody = false;
          if (cycle === c && !c.ended) startMountedCycle(c, pendingOptions || settings);
          pendingOptions = null;
        }, { once: true });
      }
      return;
    }
    if (!c.mounted) { startMountedCycle(c, settings); return; }
    if (c.failed) resetForRetry(c);
    syncTheme(); title.textContent = settings.title;
    if (!c.ready) detail.textContent = settings.detail;
    if (typeof settings.retry === 'function') c.retry = settings.retry;
    if (!visible) reveal();
  }
  function resetForRetry(c) {
    cancelExit(c); clearTimeout(c.introTimer); clearLoadTimers(c);
    c.ready = c.failed = false; c.readyAt = null;
    c.returning = c.introDone = true; c.skipped = false;
    c.startedAt = performance.now();
    root.dataset.mode = 'returning'; root.dataset.cinema = 'settled'; root.dataset.state = 'loading';
    retryButton.hidden = true; phase.textContent = 'TRYING AGAIN'; detail.textContent = 'Preparing the experiment…';
    dock.querySelector('.cl-dock-text').textContent = 'Loading continues';
    reveal(); updateTime(); armLoading(c, defaults.timeoutMs);
    // Preserve the same pending completion promise across a retry.
  }
  function update(message) {
    if (pendingOptions) pendingOptions.detail = String(message);
    if (cycle && !cycle.ended && !cycle.ready && detail) detail.textContent = String(message);
  }
  function finish() {
    if (!cycle) return Promise.resolve();
    const c = cycle;
    if (c.ended) return c.promise;
    if (!c.ready) c.readyAt = performance.now();
    c.ready = true; c.failed = false; clearLoadTimers(c);
    if (root) {
      root.dataset.state = 'ready'; phase.textContent = 'READY';
      detail.textContent = 'Your fly is ready.'; retryButton.hidden = true;
      updateTime();
    }
    maybeComplete(c);
    return c.promise;
  }
  function fail(message, retry) {
    if (!cycle || cycle.ended) show({ title: 'A connection is missing.', detail: message });
    const c = cycle;
    c.ready = false; c.failed = true; c.readyAt = performance.now();
    clearLoadTimers(c); clearTimeout(c.introTimer); cancelExit(c);
    c.introDone = true;
    c.retry = typeof retry === 'function' ? retry : null;
    if (!root) {
      pendingOptions = Object.assign({}, pendingOptions || defaults, { detail: String(message) });
      return;
    }
    root.dataset.state = 'error'; root.dataset.cinema = 'settled';
    phase.textContent = 'LOADING STOPPED';
    detail.textContent = String(message || 'The experiment could not load. Please retry.');
    retryButton.hidden = false; updateTime();
    for (const button of root.querySelectorAll('button')) button.disabled = false;
    dock.disabled = false;
    dock.querySelector('.cl-dock-text').textContent = 'Loading needs attention';
    if (visible) retryButton.focus({ preventScroll: true });
  }
  motionPreference.addEventListener('change', event => {
    if (!event.matches || !cycle || cycle.ended) return;
    cycle.reduced = true;
    if (cycle.exiting) cancelExit(cycle);
    if (root) root.dataset.motion = 'reduced';
    endCinema(cycle, false); maybeComplete(cycle);
  });
  window.ChanjLoader = Object.freeze({ show, update, finish, fail, hide });
}());

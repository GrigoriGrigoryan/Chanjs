/* A two-second illustrated opening; application readiness remains a separate gate. */
(function () {
  'use strict';
  if (window.ChanjLoader) return;
  const scriptUrl = document.currentScript && document.currentScript.src;
  const assetBase = scriptUrl || new URL('loading.js', location.href);
  const artUrl = new URL('assets/loading/newspaper-hand.webp', assetBase).href;
  const firebirdGlyphUrl = new URL('assets/brand/firebird-glyph.svg', assetBase).href;
  const markUrl = new URL('assets/brand/fly-eye.svg', assetBase).href;
  const INTRO_MS = 2000, AIM_MS = 260, HIT_MS = 380, READ_HOLD_MS = 850, PAPER_SETTLE_MS = 240, WELCOME_MS = 1040;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const defaults = { title: 'Preparing your world.', detail: 'Loading the experiment…', timeoutMs: 45000 };
  let root, dock, title, detail, phase, elapsed, dockTime, retryButton, flyNode, progressNode, numberNode;
  let cycle = null, visible = false, waitingForBody = false, pendingOptions = null, returnFocus = null;
  let geometry = { rx: 200, ry: 105, strikeY: -45 };

  function syncTheme() {
    if (root) root.dataset.theme = 'burgundy';
    if (dock) dock.dataset.theme = 'burgundy';
  }
  function makeCycle(settings) {
    let resolve, releaseHeavy;
    const promise = new Promise(done => { resolve = done; });
    const heavyPromise = new Promise(done => { releaseHeavy = done; });
    return { ready: false, failed: false, ended: false, mounted: false, skipped: false,
      reduced: motionPreference.matches, scene: 'orbit', serial: 0, introDone: false, heavyReleased: false,
      measured: 0, displayed: 0, lastNumber: -1, pos: { x: 0, y: 0, angle: 90 },
      startedAt: performance.now(), visibleAt: 0, readyAt: null,
      retry: typeof settings.retry === 'function' ? settings.retry : null,
      tick: 0, timeout: 0, raf: 0, phaseTimer: 0, heavyTimer: 0, exitTimer: 0, exitListener: null,
      promise, resolve, heavyPromise, releaseHeavy };
  }
  function releaseHeavyWork(c) {
    if (c.heavyReleased) return;
    c.heavyReleased = true;
    if (root) root.dataset.heavy = 'allowed';
    c.releaseHeavy();
  }
  function beforeHeavyWork() { return cycle ? cycle.heavyPromise : Promise.resolve(); }
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
        <path d="M90 51C87 40 89 28 96 17" stroke="#191514" stroke-width="9"/><path d="M90 51C87 40 89 28 96 17" stroke="#d6a37d" stroke-width="5"/><path d="m88 38 6 1m-5-10 6 2" stroke="#6c4133" stroke-width="2"/><ellipse cx="97" cy="15" rx="7" ry="4" fill="#8c5140" stroke="#191514" stroke-width="2"/>
      </g>
    </svg>`;
  }

  function paperFallback() {
    return `<svg class="cl-paper-fallback" viewBox="0 0 1200 800" aria-hidden="true"><g transform="translate(156 120) rotate(-42)">
      <path d="M-95 0H95L110 560Q0 590-104 560Z" fill="#e9dfc8" stroke="#39302b" stroke-width="3"/>
      <ellipse rx="95" ry="27" fill="#c7b99f" stroke="#39302b" stroke-width="3"/><ellipse rx="56" ry="15" fill="#50473d"/>
      <text x="0" y="69" text-anchor="middle" fill="#27211f" font-family="Arial, sans-serif" font-weight="900" font-size="24">CHANJS WON</text>
      <path d="M-81 80h162v9H-81z" fill="#ff632d"/>
      <text x="0" y="118" text-anchor="middle" fill="#27211f" font-family="Arial, sans-serif" font-weight="700" font-size="23"><tspan x="0">FIREBIRD</tspan><tspan x="0" dy="28">HACKATHON</tspan></text>
      <image href="${firebirdGlyphUrl}" x="-21" y="162" width="42" height="55"/>
      <path d="M-80 240H80m-160 19H80m-160 19H80m-160 19H80m-160 45H80m-160 19H80m-160 19H80m-160 19H80m-160 45H80m-160 19H80m-160 19H80m-160 19H80" stroke="#655d4f" stroke-width="5"/>
      </g></svg>`;
  }
  function inkSplash() {
    return `<svg viewBox="0 0 240 220" aria-hidden="true" focusable="false"><path d="M122 38C130 2 143 19 140 48L170 22C181 22 165 54 167 64L208 51C224 52 201 73 181 86L225 96C244 109 211 115 188 113L214 149C217 166 189 145 175 139L179 185C169 208 159 177 151 162L129 209C113 222 118 184 111 171L78 195C54 202 82 175 80 161L35 171C11 161 57 146 62 133L19 112C-1 95 38 99 57 97L30 65C22 40 56 72 70 69L70 31C78 4 91 51 102 53Z"/><circle cx="27" cy="31" r="7"/><circle cx="220" cy="179" r="5"/><circle cx="212" cy="29" r="4"/><circle cx="51" cy="202" r="4"/></svg>`;
  }
  function mount() {
    if (root) return;
    root = document.createElement('section'); root.className = 'chanj-loader'; root.hidden = true;
    root.tabIndex = -1; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'cl-title');
    root.innerHTML = `<header class="cl-top"><span class="cl-brand"><img class="cl-brand-mark" alt="" width="28" height="28">CHANJS<span class="cl-brand-note">BRAIN / BODY / WORLD</span></span><button type="button" class="cl-hide">Skip intro <span aria-hidden="true">↗</span></button></header>
      <div class="cl-stage"><p class="cl-stage-label">THE CHANJS SIMULATION</p>
        <div class="cl-orbit-line" aria-hidden="true"></div>
        <div class="cl-readout"><div class="cl-progress" role="progressbar" aria-label="Illustrated opening progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="cl-number" aria-hidden="true">00</span><span class="cl-percent-unit" aria-hidden="true">%</span></div><p class="cl-progress-label">INTRO · 2 SECONDS</p></div><p class="cl-preparing"><span class="cl-busy-dot" aria-hidden="true"></span>Preparing simulation…</p>
        <div class="cl-fly" aria-hidden="true">${flyingFly()}</div>
        <div class="cl-strike-origin" aria-hidden="true"><div class="cl-paper-motion">${paperFallback()}<img class="cl-hand" alt="" width="1200" height="800" decoding="async" fetchpriority="high"></div></div>
        <div class="cl-splash" aria-hidden="true">${inkSplash()}</div>
        <div class="cl-welcome" aria-hidden="true"><p><span class="cl-welcome-lead">Welcome to the</span><strong><span>Chanjs</span> <span>simulation.</span></strong></p></div>
        <p class="cl-illustration">Illustrated introduction</p>
      </div>
      <footer class="cl-bottom"><div class="cl-copy"><h2 id="cl-title"></h2><div class="cl-status"><span class="cl-status-mark" aria-hidden="true"></span><div><p class="cl-phase">LOADING</p><p class="cl-detail" role="status" aria-live="polite" aria-atomic="true"></p></div></div></div><div class="cl-actions"><button type="button" class="cl-retry" hidden>Retry loading <span aria-hidden="true">↗</span></button></div><div class="cl-time"><span>ELAPSED</span><output role="timer" aria-live="off">00:00</output></div></footer>`;
    document.body.append(root);
    dock = document.createElement('button'); dock.type = 'button'; dock.className = 'chanj-loader-dock'; dock.hidden = true;
    dock.innerHTML = '<span aria-hidden="true" class="cl-dock-dot"></span><span class="cl-dock-text">Loading continues</span><span class="cl-dock-time" aria-hidden="true">00:00</span><span aria-hidden="true">↗</span>';
    dock.setAttribute('aria-label', 'Show loading status'); document.body.append(dock);
    title = root.querySelector('#cl-title'); detail = root.querySelector('.cl-detail'); phase = root.querySelector('.cl-phase');
    elapsed = root.querySelector('output'); dockTime = dock.querySelector('.cl-dock-time'); retryButton = root.querySelector('.cl-retry');
    flyNode = root.querySelector('.cl-fly'); progressNode = root.querySelector('.cl-progress'); numberNode = root.querySelector('.cl-number');
    syncTheme(); window.addEventListener('chanj:themechange', syncTheme);
    new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const hand = root.querySelector('.cl-hand');
    hand.addEventListener('load', () => { root.dataset.art = 'ready'; }, { once: true });
    hand.addEventListener('error', () => { root.dataset.art = 'fallback'; }, { once: true }); hand.src = artUrl;
    root.querySelector('.cl-brand-mark').src = markUrl;
    new ResizeObserver(measureScene).observe(root.querySelector('.cl-stage'));
    root.querySelector('.cl-hide').addEventListener('click', hide); dock.addEventListener('click', reveal);
    retryButton.addEventListener('click', () => {
      if (!cycle || !cycle.retry) { window.location.reload(); return; }
      const retry = cycle.retry; resetForRetry(cycle);
      try { Promise.resolve(retry()).catch(error => fail(error.message || 'Loading failed.', retry)); }
      catch (error) { fail(error.message || 'Loading failed.', retry); }
    });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); hide(); }
      if (event.key !== 'Tab') return;
      const buttons = [...root.querySelectorAll('button')].filter(button => !button.hidden && !button.disabled && button.offsetParent !== null && getComputedStyle(button).visibility !== 'hidden');
      if (!buttons.length) { event.preventDefault(); root.focus({ preventScroll: true }); return; }
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }
  function measureScene() {
    if (!root) return;
    const box = root.querySelector('.cl-stage').getBoundingClientRect();
    if (!box.width || !box.height) return;
    geometry = { rx: Math.min(290, box.width * .365), ry: Math.min(140, box.height * .29), strikeY: -Math.min(48, box.height * .1) };
    root.style.setProperty('--cl-orbit-width', `${geometry.rx * 2}px`);
    root.style.setProperty('--cl-orbit-height', `${geometry.ry * 2}px`);
    root.style.setProperty('--cl-strike-y', `${geometry.strikeY}px`);
    if (cycle && ['strike', 'impact'].includes(cycle.scene)) putFly(cycle, 0, geometry.strikeY, 12);
  }
  function formatTime(c) {
    const seconds = Math.max(0, Math.floor(((c.readyAt === null ? performance.now() : c.readyAt) - c.startedAt) / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function updateTime() { if (root && cycle) elapsed.textContent = dockTime.textContent = formatTime(cycle); }
  function clearLoadTimers(c) { clearInterval(c.tick); clearTimeout(c.timeout); c.tick = c.timeout = 0; }
  function stopFrame(c) { cancelAnimationFrame(c.raf); c.raf = 0; }
  function cancelExit(c) {
    clearTimeout(c.exitTimer); c.exitTimer = 0;
    if (root && c.exitListener) root.removeEventListener('transitionend', c.exitListener);
    c.exitListener = null;
    if (root) { delete root.dataset.exiting; root.style.removeProperty('--cl-exit-ms'); }
  }
  function stopCinema(c) { c.serial++; clearTimeout(c.phaseTimer); clearTimeout(c.heavyTimer); c.phaseTimer = c.heavyTimer = 0; cancelExit(c); }
  function later(c, fn, ms) {
    clearTimeout(c.phaseTimer); const serial = c.serial;
    c.phaseTimer = window.setTimeout(() => { if (cycle === c && !c.ended && !c.failed && c.serial === serial) fn(); }, ms);
  }
  function restoreFocus() { if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === 'function') returnFocus.focus({ preventScroll: true }); }
  function renderProgress(c) {
    if (!root) return;
    if (c.failed) {
      c.lastNumber = -1; delete root.dataset.percent; numberNode.textContent = '—'; progressNode.removeAttribute('aria-valuenow'); progressNode.setAttribute('aria-valuetext', 'Loading stopped'); return;
    }
    const value = Math.min(100, Math.floor(c.displayed * 100 + .000001));
    if (value !== c.lastNumber) {
      c.lastNumber = value; numberNode.textContent = String(value).padStart(2, '0');
      progressNode.setAttribute('aria-valuenow', String(value)); progressNode.removeAttribute('aria-valuetext');
      root.dataset.percent = String(value);
    }
  }
  function putFly(c, x, y, angle) {
    c.pos = { x, y, angle };
    if (flyNode) flyNode.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${angle.toFixed(2)}deg)`;
  }
  function tickFrame(c, now) {
    c.raf = 0;
    if (cycle !== c || c.ended || c.failed || !c.mounted || !visible) return;
    const age = Math.max(0, now - c.visibleAt);
    if (!c.introDone) c.displayed = Math.min(1, age / INTRO_MS);
    renderProgress(c);
    if (!c.reduced && c.scene === 'orbit') {
      const angle = age / 1700 * Math.PI * 2 - Math.PI * .85;
      const x = Math.cos(angle) * geometry.rx, y = Math.sin(angle) * geometry.ry;
      putFly(c, x, y, Math.atan2(Math.cos(angle) * geometry.ry, -Math.sin(angle) * geometry.rx) * 180 / Math.PI + 90);
      if (age >= INTRO_MS - AIM_MS) {
        c.scene = 'aim'; c.aimFrom = { ...c.pos }; root.dataset.cinema = 'aim';
      }
    }
    if (c.scene === 'aim') {
      const t = Math.min(1, Math.max(0, (age - (INTRO_MS - AIM_MS)) / AIM_MS)), eased = 1 - Math.pow(1 - t, 3);
      putFly(c, c.aimFrom.x * (1 - eased), c.aimFrom.y + (geometry.strikeY - c.aimFrom.y) * eased, c.aimFrom.angle + (12 - c.aimFrom.angle) * eased);
    }
    if (!c.introDone && age >= INTRO_MS && (c.scene === 'orbit' || c.scene === 'aim')) beginStrike(c);
    advance(c);
    if (!c.ended && !c.failed && visible && ['orbit', 'aim'].includes(c.scene)) c.raf = requestAnimationFrame(time => tickFrame(c, time));
  }
  function startFrame(c) { if (!c.raf && c.mounted && !c.failed && !c.ended && visible) c.raf = requestAnimationFrame(time => tickFrame(c, time)); }
  function complete(c) {
    if (cycle !== c || c.ended || !c.ready || c.failed) return;
    const hadFocus = visible && root && root.contains(document.activeElement);
    clearLoadTimers(c); stopFrame(c); stopCinema(c);
    visible = false; c.ended = true; releaseHeavyWork(c);
    if (root) root.hidden = dock.hidden = true;
    document.documentElement.classList.remove('chanj-loading-lock'); if (hadFocus) restoreFocus();
    c.resolve();
  }
  function openingComplete(c) {
    if (c.failed || c.ended) return;
    c.introDone = true; c.displayed = 1; c.scene = 'waiting'; stopFrame(c);
    root.dataset.cinema = 'waiting'; root.dataset.counter = 'done'; root.dataset.introComplete = 'true'; root.querySelector('.cl-progress-label').textContent = 'INTRO COMPLETE'; renderProgress(c);
    releaseHeavyWork(c); advance(c);
  }
  function impact(c) {
    if (c.failed || c.ended) return;
    c.scene = 'impact'; root.dataset.cinema = 'impact'; root.dataset.counter = 'done'; putFly(c, 0, geometry.strikeY, 12);
    // Finish the mobile reading-pose movement, then paint before expensive app work.
    const serial = c.serial;
    c.heavyTimer = window.setTimeout(() => {
      c.heavyTimer = 0;
      requestAnimationFrame(() => {
        if (cycle !== c || c.ended || c.failed || c.serial !== serial) return;
        // CSS can start a frame after the phase changes. Wait for its actual
        // finish too, so a busy frame cannot release work during the last pose.
        const moving = [...root.querySelector('.cl-paper-motion').getAnimations(), ...root.querySelector('.cl-splash').getAnimations()];
        Promise.allSettled(moving.map(animation => animation.finished)).then(() => {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (cycle === c && !c.ended && !c.failed && c.serial === serial) releaseHeavyWork(c);
          }));
        });
      });
    }, PAPER_SETTLE_MS);
    later(c, () => openingComplete(c), READ_HOLD_MS);
  }
  function beginStrike(c) {
    c.displayed = 1; renderProgress(c); c.scene = 'strike'; root.dataset.cinema = 'strike';
    putFly(c, 0, geometry.strikeY, 12); stopFrame(c);
    later(c, () => impact(c), HIT_MS);
  }
  function welcome(c) {
    if (!c.ready || c.failed || !c.introDone || ['welcome', 'revealing'].includes(c.scene)) return;
    c.scene = 'welcome'; root.dataset.cinema = 'welcome'; root.dataset.exiting = 'true'; stopFrame(c);
    root.focus({ preventScroll: true });
    later(c, () => complete(c), c.reduced ? 160 : WELCOME_MS);
  }
  function advance(c) {
    if (!c.mounted || c.ended || c.failed) return;
    if (c.skipped || !visible) {
      releaseHeavyWork(c);
      if (c.ready) complete(c);
      return;
    }
    if (c.reduced && !c.introDone) openingComplete(c);
    if (c.ready && c.introDone) welcome(c);
  }
  function reveal() {
    const c = cycle; if (!c || c.ended || !root) return;
    visible = true; root.hidden = false; dock.hidden = true;
    document.documentElement.classList.add('chanj-loading-lock'); measureScene();
    root.querySelector('.cl-hide').focus({ preventScroll: true }); startFrame(c);
  }
  function hide() {
    const c = cycle; if (!c || c.ended) return;
    c.skipped = true; c.introDone = true; c.displayed = 1; stopCinema(c); stopFrame(c); releaseHeavyWork(c);
    c.scene = 'waiting'; visible = false;
    if (root) { root.dataset.mode = 'simple'; root.dataset.counter = 'done'; root.dataset.cinema = 'waiting'; root.hidden = true; dock.hidden = false; }
    document.documentElement.classList.remove('chanj-loading-lock'); restoreFocus(); advance(c, performance.now());
  }
  function armLoading(c, timeoutMs) {
    clearLoadTimers(c); c.tick = window.setInterval(updateTime, 1000);
    const wait = Number(timeoutMs);
    if (wait > 0 && Number.isFinite(wait)) c.timeout = window.setTimeout(() => {
      if (cycle !== c || c.ended || c.ready || c.failed) return;
      root.dataset.state = 'slow'; phase.textContent = 'STILL LOADING';
      detail.textContent = 'This is taking longer than expected. You can keep waiting or retry.';
      retryButton.hidden = false; dock.querySelector('.cl-dock-text').textContent = 'Loading is taking longer';
    }, wait);
  }
  function startMountedCycle(c, settings) {
    mount(); syncTheme(); c.mounted = true; c.visibleAt = performance.now();
    if (typeof settings.retry === 'function') c.retry = settings.retry;
    root.dataset.state = c.failed ? 'error' : (c.ready ? 'ready' : 'loading');
    root.dataset.mode = 'cinematic'; root.dataset.counter = 'running'; root.dataset.heavy = c.heavyReleased ? 'allowed' : 'deferred'; delete root.dataset.introComplete; root.dataset.motion = c.reduced ? 'reduced' : 'full'; root.dataset.cinema = 'orbit';
    delete root.dataset.exiting; root.querySelector('.cl-progress-label').textContent = 'INTRO · 2 SECONDS'; root.setAttribute('aria-busy', c.ready ? 'false' : 'true');
    title.textContent = settings.title; detail.textContent = c.ready ? 'Your world is ready.' : settings.detail;
    phase.textContent = c.failed ? 'LOADING STOPPED' : (c.ready ? 'READY' : 'LOADING');
    retryButton.hidden = !c.failed; dock.querySelector('.cl-dock-text').textContent = 'Loading continues'; returnFocus = document.activeElement;
    if (!c.skipped) reveal(); else { root.hidden = true; dock.hidden = false; }
    if (!c.ready && !c.failed) armLoading(c, settings.timeoutMs);
    updateTime(); renderProgress(c); advance(c, performance.now());
  }
  function show(options) {
    const settings = Object.assign({}, defaults, options || {});
    if (!cycle || cycle.ended) cycle = makeCycle(settings);
    const c = cycle;
    if (!document.body) {
      pendingOptions = settings;
      if (!waitingForBody) { waitingForBody = true; document.addEventListener('DOMContentLoaded', () => {
        waitingForBody = false; if (cycle === c && !c.ended) startMountedCycle(c, pendingOptions || settings); pendingOptions = null;
      }, { once: true }); } return;
    }
    if (!c.mounted) { startMountedCycle(c, settings); return; }
    if (c.failed) resetForRetry(c);
    syncTheme(); title.textContent = settings.title; if (!c.ready) detail.textContent = settings.detail;
    if (typeof settings.retry === 'function') c.retry = settings.retry; if (!visible) reveal();
  }
  function resetForRetry(c) {
    stopCinema(c); stopFrame(c); clearLoadTimers(c);
    c.ready = c.failed = c.skipped = false; c.readyAt = null; c.introDone = true; c.scene = 'waiting';
    c.measured = 0; c.displayed = 1; releaseHeavyWork(c); c.lastNumber = -1; c.startedAt = performance.now();
    root.dataset.mode = 'simple'; root.dataset.cinema = 'waiting'; root.dataset.counter = 'done'; root.dataset.introComplete = 'true'; root.querySelector('.cl-progress-label').textContent = 'INTRO COMPLETE'; root.dataset.state = 'loading'; root.setAttribute('aria-busy', 'true');
    retryButton.hidden = true; phase.textContent = 'TRYING AGAIN'; detail.textContent = 'Preparing the experiment…';
    dock.querySelector('.cl-dock-text').textContent = 'Loading continues'; reveal(); updateTime(); renderProgress(c); armLoading(c, defaults.timeoutMs);
  }
  function update(message) {
    if (pendingOptions) pendingOptions.detail = String(message);
    if (cycle && !cycle.ended && !cycle.ready && detail) detail.textContent = String(message);
  }
  function progress(fraction) {
    // Compatibility for callers reporting resources: this is deliberately not the intro clock.
    if (!cycle || cycle.ended || cycle.failed || typeof fraction !== 'number' || !Number.isFinite(fraction)) return;
    cycle.measured = Math.max(cycle.measured, Math.max(0, Math.min(1, fraction)));
  }
  function finish() {
    if (!cycle) return Promise.resolve();
    const c = cycle; if (c.ended) return c.promise;
    if (c.failed) return c.promise;
    if (!c.ready) c.readyAt = performance.now(); c.ready = true; c.failed = false; c.measured = 1; clearLoadTimers(c);
    if (root) { root.dataset.state = 'ready'; root.setAttribute('aria-busy', 'false'); phase.textContent = 'READY'; detail.textContent = 'Your world is ready.'; retryButton.hidden = true; updateTime(); }
    advance(c, performance.now()); startFrame(c); return c.promise;
  }
  function fail(message, retry) {
    if (!cycle || cycle.ended) show({ title: 'A connection is missing.', detail: message });
    const c = cycle; c.ready = false; c.failed = true; c.readyAt = performance.now();
    clearLoadTimers(c); stopCinema(c); stopFrame(c); c.scene = 'paused'; releaseHeavyWork(c); c.retry = typeof retry === 'function' ? retry : null;
    if (!root) { pendingOptions = Object.assign({}, pendingOptions || defaults, { detail: String(message) }); return; }
    root.dataset.state = 'error'; root.dataset.cinema = 'paused'; root.setAttribute('aria-busy', 'false'); phase.textContent = 'LOADING STOPPED';
    detail.textContent = String(message || 'The experiment could not load. Please retry.'); retryButton.hidden = false; updateTime(); renderProgress(c);
    for (const button of root.querySelectorAll('button')) button.disabled = false;
    dock.disabled = false; dock.querySelector('.cl-dock-text').textContent = 'Loading needs attention'; if (visible) retryButton.focus({ preventScroll: true });
  }
  motionPreference.addEventListener('change', event => {
    if (!event.matches || !cycle || cycle.ended) return;
    cycle.reduced = true; stopCinema(cycle); cycle.scene = 'waiting'; cycle.introDone = false;
    if (root) { root.dataset.motion = 'reduced'; root.dataset.cinema = 'waiting'; }
    advance(cycle, performance.now()); startFrame(cycle);
  });
  window.ChanjLoader = Object.freeze({ show, update, progress, beforeHeavyWork, finish, fail, hide });
}());

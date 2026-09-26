/* Original illustrated introduction. Decorative motion never reports load progress. */
(function () {
  'use strict';
  if (window.ChanjLoader) return;

  const scriptUrl = document.currentScript && document.currentScript.src;
  const artUrl = new URL('assets/loading/newspaper-hand.webp', scriptUrl || new URL('loading.js', location.href)).href;
  let root, dock, title, detail, phase, elapsed, dockTime, retryButton;
  let active = false, visible = false, startedAt = 0, tick = 0, timeout = 0;
  let returnFocus = null, retryAction = null, pending = null, pendingFailure = null;
  const defaults = {
    title: 'A tiny fly. A whole world.',
    detail: 'Preparing the experiment…',
    timeoutMs: 45000
  };

  function currentTheme() {
    const selected = document.documentElement.dataset.theme;
    if (selected === 'orange' || selected === 'burgundy') return selected;
    const query = new URLSearchParams(location.search).get('theme');
    if (query === 'orange' || query === 'burgundy') return query;
    try { if (localStorage.getItem('chanj-theme') === 'burgundy') return 'burgundy'; } catch (_) {}
    return 'orange';
  }
  function syncTheme() {
    if (root) root.dataset.theme = currentTheme();
    if (dock) dock.dataset.theme = currentTheme();
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
    root.innerHTML = `<header class="cl-top"><span class="cl-brand"><i aria-hidden="true"></i>CHANJ<span class="cl-brand-slash">/</span><span class="cl-atlas">A FLY'S WORLD</span></span><button type="button" class="cl-hide">Hide intro <span aria-hidden="true">↗</span></button></header>
      <div class="cl-stage" aria-hidden="true">
        <div class="cl-stage-copy"><span class="cl-index">01 / AN EVERYDAY ESCAPE</span><p>Small brain.<br><em>Big instinct.</em></p></div>
        <span class="cl-side-note">STAY CURIOUS. MOVE QUICKLY.</span>
        <div class="cl-wordmark"><span>C</span><span>H</span><span>A</span><span>N</span><span>J</span></div>
        <svg class="cl-flightline" viewBox="0 0 1000 500" preserveAspectRatio="none"><path d="M-50 350C120 260 280 435 410 280S650 30 740 180 1040 260 1100 50"/></svg>
        <div class="cl-fly">${flyingFly()}</div>
        <div class="cl-swat">${paperFallback()}<img class="cl-hand" alt="" width="1200" height="800" decoding="async" fetchpriority="low"></div>
        <span class="cl-impact cl-impact-one"></span><span class="cl-impact cl-impact-two"></span><span class="cl-impact cl-impact-three"></span>
        <span class="cl-escape-note">TOO QUICK.</span>
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
    title = root.querySelector('#cl-title');
    detail = root.querySelector('.cl-detail');
    phase = root.querySelector('.cl-phase');
    elapsed = root.querySelector('output');
    dockTime = dock.querySelector('.cl-dock-time');
    retryButton = root.querySelector('.cl-retry');
    root.querySelector('.cl-hide').addEventListener('click', hide);
    dock.addEventListener('click', reveal);
    retryButton.addEventListener('click', () => {
      if (!retryAction) { window.location.reload(); return; }
      const retry = retryAction;
      const text = title.textContent;
      stopTimers(); active = false;
      show({ title: text, detail: 'Trying again…', retry });
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

  function formatTime() {
    const seconds = Math.max(0, Math.floor((performance.now() - startedAt) / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function updateTime() {
    if (!root) return;
    elapsed.textContent = dockTime.textContent = formatTime();
  }
  function stopTimers() { clearInterval(tick); clearTimeout(timeout); tick = timeout = 0; }
  function restoreFocus() {
    if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === 'function') returnFocus.focus({ preventScroll: true });
  }
  function reveal() {
    if (!active || !root) return;
    visible = true;
    root.hidden = false;
    dock.hidden = true;
    document.documentElement.classList.add('chanj-loading-lock');
    root.querySelector('.cl-hide').focus({ preventScroll: true });
  }
  function hide() {
    if (!root) return;
    visible = false;
    root.hidden = true;
    dock.hidden = !active;
    document.documentElement.classList.remove('chanj-loading-lock');
    restoreFocus();
  }
  function show(options) {
    const settings = Object.assign({}, defaults, options || {});
    if (!document.body) {
      pending = settings;
      document.addEventListener('DOMContentLoaded', () => {
        if (pending) { const next = pending; pending = null; show(next); }
        if (pendingFailure) { const next = pendingFailure; pendingFailure = null; fail(next.message, next.retry); }
      }, { once: true });
      return;
    }
    mount();
    syncTheme();
    if (!active) {
      startedAt = performance.now();
      returnFocus = document.activeElement;
      active = true;
      root.dataset.state = 'loading';
      phase.textContent = 'PREPARING THE WORLD';
      retryButton.hidden = true;
      dock.querySelector('.cl-dock-text').textContent = 'Loading continues';
      retryAction = typeof settings.retry === 'function' ? settings.retry : null;
      tick = window.setInterval(updateTime, 1000);
      const wait = Number(settings.timeoutMs);
      if (wait > 0 && Number.isFinite(wait)) timeout = window.setTimeout(() => {
        if (!active) return;
        root.dataset.state = 'slow';
        phase.textContent = 'STILL WAITING';
        detail.textContent = 'This is taking longer than expected. Loading may still finish. You can keep waiting, hide this overlay, or retry.';
        retryButton.hidden = false;
        dock.querySelector('.cl-dock-text').textContent = 'Loading is taking longer';
      }, wait);
    }
    title.textContent = settings.title;
    detail.textContent = settings.detail;
    updateTime();
    if (!visible) reveal();
  }
  function update(message) {
    if (pending) pending.detail = String(message);
    if (active && detail) detail.textContent = String(message);
  }
  function finish() {
    pending = pendingFailure = null;
    if (!active) return;
    active = false;
    stopTimers();
    // Readiness controls the handoff; the illustration never delays it.
    const hadFocus = visible && root.contains(document.activeElement);
    visible = false;
    root.hidden = dock.hidden = true;
    document.documentElement.classList.remove('chanj-loading-lock');
    if (hadFocus) restoreFocus();
  }
  function fail(message, retry) {
    if (!active) show({ title: 'A connection is missing.', detail: message });
    if (!root) { pendingFailure = { message, retry }; return; }
    updateTime();
    stopTimers();
    root.dataset.state = 'error';
    phase.textContent = 'LOADING STOPPED';
    detail.textContent = String(message || 'The experiment could not load. Please retry.');
    retryAction = typeof retry === 'function' ? retry : null;
    retryButton.hidden = false;
    // Legacy app failures disable all buttons; loader controls stay usable.
    for (const button of root.querySelectorAll('button')) button.disabled = false;
    dock.disabled = false;
    dock.querySelector('.cl-dock-text').textContent = 'Loading needs attention';
    if (visible) retryButton.focus({ preventScroll: true });
  }
  window.ChanjLoader = Object.freeze({ show, update, finish, fail, hide });
}());

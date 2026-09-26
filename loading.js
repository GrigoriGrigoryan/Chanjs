/* Original Chanjs specimen illustration. It is decoration, never neural data. */
(function () {
  'use strict';
  if (window.ChanjLoader) return;

  let root, dock, title, detail, phase, elapsed, dockTime, retryButton;
  let active = false, visible = false, startedAt = 0, tick = 0, timeout = 0;
  let returnFocus = null, retryAction = null, pending = null, pendingFailure = null;
  const defaults = {
    title: 'From cells to motion.',
    detail: 'Preparing the experiment…',
    timeoutMs: 45000
  };

  // A deterministic, hand-shaped atlas plate: no downloaded artwork or shaders.
  function specimen() {
    const wing = 'M350 279 C305 209 202 198 158 258 C109 324 119 441 163 477 C207 514 295 398 350 279Z';
    const veins = [
      'M350 279 C273 245 207 245 158 258',
      'M350 279 C244 286 184 354 163 477',
      'M350 279 C284 310 241 390 163 477',
      'M350 279 C273 342 281 376 216 437',
      'M300 274 245 314 196 305 137 323',
      'M274 294 253 342 194 371 137 391',
      'M253 342 256 382 217 410 166 421',
      'M217 410 204 449'
    ];
    const nodes = Array.from({ length: 35 }, (_, i) => {
      const a = i * 2.399963, r = Math.sqrt((i + 0.5) / 35);
      return [360 + Math.cos(a) * 30 * r, 202 + Math.sin(a) * 18 * r];
    });
    const edges = nodes.map((p, i) => {
      const q = nodes[(i + 8) % nodes.length];
      return `<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}"/>`;
    }).join('');
    const dots = nodes.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i % 5 === 0 ? 2 : 1.2}"/>`).join('');
    const veinPaths = veins.map(d => `<path class="cl-trace" pathLength="1" d="${d}"/>`).join('');
    const ticks = Array.from({ length: 41 }, (_, i) => `<path d="M${160 + i * 10} 565v${i % 5 === 0 ? 8 : 4}"/>`).join('');
    return `<svg class="cl-specimen" viewBox="0 0 720 620" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="cl-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" stroke="currentColor" stroke-width=".5"/></pattern>
        <pattern id="cl-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V7" stroke="currentColor" stroke-width=".5"/></pattern>
      </defs>
      <rect x="40" y="40" width="640" height="520" fill="url(#cl-grid)" class="cl-grid"/>
      <g class="cl-guide"><circle cx="360" cy="310" r="224"/><circle cx="360" cy="310" r="148" stroke-dasharray="2 7"/><path d="M360 60V551M104 310H616" stroke-dasharray="3 8"/></g>
      <g class="cl-registration"><path d="M40 58V40H58M662 40H680V58M40 542V560H58M662 560H680V542"/>${ticks}</g>
      <g class="cl-organism" transform="rotate(22 360 310)">
        <g class="cl-legs cl-trace-group">
          <path class="cl-trace" pathLength="1" d="M346 275 289 246 254 183 220 166M374 275 431 246 466 183 500 166M341 299 276 321 215 313 166 330M379 299 444 321 505 313 554 330M345 330 299 389 282 466 242 507M375 330 421 389 438 466 478 507"/>
          <path d="M254 183 246 192M289 246 279 251M215 313 213 324M282 466 272 463M466 183 474 192M431 246 441 251M505 313 507 324M438 466 448 463"/>
        </g>
        <g class="cl-wing cl-wing-left"><path class="cl-wing-fill" d="${wing}"/><path class="cl-trace cl-wing-outline" pathLength="1" d="${wing}"/>${veinPaths}</g>
        <g transform="translate(720 0) scale(-1 1)"><g class="cl-wing cl-wing-right"><path class="cl-wing-fill" d="${wing}"/><path class="cl-trace cl-wing-outline" pathLength="1" d="${wing}"/>${veinPaths}</g></g>
        <g class="cl-abdomen">
          <path class="cl-body-fill" d="M340 327C312 364 324 437 360 459C396 437 408 364 380 327Z"/>
          <path class="cl-trace" pathLength="1" d="M340 327C312 364 324 437 360 459C396 437 408 364 380 327ZM330 355Q360 371 390 355M329 376Q360 393 391 376M335 401Q360 416 385 401M343 425Q360 436 377 425"/>
          <path d="M360 345V441" stroke-dasharray="2 5"/>
        </g>
        <g class="cl-thorax"><path class="cl-body-fill" d="M346 235C317 251 317 315 339 340Q360 350 381 340C403 315 403 251 374 235Z"/><path class="cl-trace" pathLength="1" d="M346 235C317 251 317 315 339 340Q360 350 381 340C403 315 403 251 374 235ZM349 249Q338 288 350 328M371 249Q382 288 370 328"/></g>
        <g class="cl-head">
          <path class="cl-body-fill" d="M329 186Q360 165 391 186L400 216Q360 245 320 216Z"/>
          <path class="cl-trace" pathLength="1" d="M329 186Q360 165 391 186L400 216Q360 245 320 216ZM345 180 337 162 324 155M375 180 383 162 396 155M354 180 351 153M366 180 369 153"/>
          <ellipse cx="328" cy="205" rx="12" ry="20" transform="rotate(14 328 205)" fill="url(#cl-hatch)"/><ellipse cx="392" cy="205" rx="12" ry="20" transform="rotate(-14 392 205)" fill="url(#cl-hatch)"/>
          <g class="cl-brain-lines">${edges}</g><g class="cl-brain-dots">${dots}</g>
        </g>
      </g>
      <g class="cl-annotations">
        <path d="M390 198 483 110H625"/><circle cx="390" cy="198" r="4"/>
        <path d="M233 352 148 452H70"/><circle cx="233" cy="352" r="4"/>
        <text x="488" y="99">01 / CIRCUIT</text><text x="70" y="477">02 / BODY</text>
        <text x="160" y="595" class="cl-scale-label">DROSOPHILA · SCHEMATIC STUDY</text>
      </g>
      <g class="cl-scanner"><path d="M90 310H630"/><circle cx="360" cy="310" r="5"/></g>
    </svg>`;
  }

  function mount() {
    if (root) return;
    root = document.createElement('section');
    root.className = 'chanj-loader';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'cl-title');
    root.innerHTML = `<header class="cl-top"><span class="cl-brand"><i aria-hidden="true"></i>CHANJ<span class="cl-brand-slash">/</span><span class="cl-atlas">LOADING ATLAS</span></span><button type="button" class="cl-hide">Hide overlay <span aria-hidden="true">↗</span></button></header>
      <div class="cl-main"><div class="cl-copy"><p class="cl-eyebrow">A SMALL BODY.<br>A WORLD OF CONNECTIONS.</p><h2 id="cl-title"></h2><div class="cl-status"><span class="cl-status-mark" aria-hidden="true"></span><div><p class="cl-phase">INITIALIZING</p><p class="cl-detail" role="status" aria-live="polite" aria-atomic="true"></p></div></div><div class="cl-actions"><button type="button" class="cl-retry" hidden>Retry loading <span aria-hidden="true">↗</span></button></div></div><figure class="cl-figure">${specimen()}<figcaption>Original illustration · not neural activity</figcaption></figure></div>
      <footer class="cl-bottom"><div class="cl-time"><span>ELAPSED</span><output role="timer" aria-live="off">00:00</output></div><p class="cl-honesty">Preparing your experiment.<br>This view closes when loading completes.</p><span class="cl-edition" aria-hidden="true">FORM → FUNCTION</span></footer>`;
    document.body.append(root);
    dock = document.createElement('button');
    dock.type = 'button';
    dock.className = 'chanj-loader-dock';
    dock.hidden = true;
    dock.innerHTML = '<span aria-hidden="true" class="cl-dock-dot"></span><span class="cl-dock-text">Loading continues</span><span class="cl-dock-time" aria-hidden="true">00:00</span><span aria-hidden="true">↗</span>';
    dock.setAttribute('aria-label', 'Show loading status');
    document.body.append(dock);
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
    if (!active) {
      startedAt = performance.now();
      returnFocus = document.activeElement;
      active = true;
      root.dataset.state = 'loading';
      phase.textContent = 'INITIALIZING';
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

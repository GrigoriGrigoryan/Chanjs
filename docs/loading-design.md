# CHANJS — preparation, encounter, reveal

A small illustrated fly orbits an oversized Space Grotesk counter. The number follows completed preparation work. When the application is ready and the counter reaches 100%, the fly moves into the newspaper's path. A rolled newspaper meets it, an abstract ink mark appears, and “Welcome to a smaller world” introduces an 800ms reveal of the live experiment. The shared compound-eye mark and flying illustration both have visible faces and proboscises. Noir and Burgundy use the same composition.

The caption “Illustrated introduction” identifies the scene as decoration. It is not neural activity, a scientific recording, or the simulation's newspaper-collision result. No second WebGL renderer is created.

## Public API and application gate

```js
ChanjLoader.show({
  title: 'Preparing your world.',
  detail: 'Loading fly geometry and measured decision tables…',
  timeoutMs: 45000
});
ChanjLoader.update('Assembling the world…');
ChanjLoader.progress(completedPreparationSteps / totalPreparationSteps);
await actualApplicationReadiness();
await ChanjLoader.finish();
// Now reset/start the simulation clock and autoplay.
```

- `progress(fraction)` accepts finite numbers from 0 to 1, clamps out-of-range values, and ignores decreases and invalid values. The visible number eases toward that measured value; it never runs ahead of completed work. A stall stays at the reported progress, without timer-based estimates. In this application the fraction is **completed preparation milestones**, including fetched/parsed assets, scene assembly, and first render, rather than bytes downloaded.
- `progress(1)` alone cannot show 100%. Before `finish()`, the counter stops at 99%. Only `finish()` confirms full readiness. The first visit also stays below 100% during its initial 1.2-second orbit, so reaching 100% directly begins the encounter.
- `finish()` returns the same `Promise<void>` for the current load. It resolves only after the overlay and compact status button are actually hidden. Repeated calls do not restart the scene. The application must await this promise before starting its simulation clock.
- `show`, `update`, `fail(message, retry)`, and `hide` remain compatible. `show` optionally accepts a retry callback. Retry uses that callback or reloads the current URL. A callback must explicitly signal readiness with `finish()` after success; callback resolution alone does not release the gate.

Resource work and the orbit run concurrently. After the number reaches 100%, the fly moves to the contact point for 260ms, the newspaper strikes for 380ms, and the ink and welcome transition runs for 500ms before the 800ms reveal. A fast first visit therefore takes roughly three to four seconds overall, depending on frame scheduling and the counter's final easing. A slow load keeps orbiting until real readiness. These are presentation timings, not download estimates or a performance benchmark.

The elapsed clock measures time to actual readiness or failure and stops at that event. Status and elapsed time are separate from the choreography. A transition-end listener resolves the gate after the root opacity transition; its timeout fallback explicitly hides the overlay before resolving.

## Visits, motion, and controls

The versioned localStorage marker is `chanjs-intro-v4`, value `seen`. It is saved at impact or skip; if storage is unavailable, a page-local marker handles subsequent cycles. `?intro=1` replays the first-visit scene. Returning visits keep measured progress, omit the orbit and newspaper, and fade for 180ms after readiness.

Skip intro, Escape, and `hide()` dismiss the scene immediately. If preparation is unfinished, a compact status button remains. A skip cannot make resources ready or release the readiness promise. Opening the compact status returns to the simple progress view.

Reduced motion uses a still composition, no traveling hand or wings, and a 160ms quiet impact before an immediate reveal. Changing the motion preference while loading also takes this path. The native reduced-motion CSS is present in addition to the script's preference handling.

The dialog has keyboard focus handling, a polite status region, a non-announcing elapsed clock, and controls at least 44px high. The counter is an accessible progressbar; individual digits are hidden from assistive technology. Decorative SVGs and photographic art have no announcement. Long error messages can scroll vertically on small screens.

## Failure and retry

A failure cancels the pending encounter/reveal, clears readiness and progress announcements, shows a dash, and exposes Retry. Existing completion waiters stay pending. A late `finish()` while failed is ignored: an explicit Retry or `show()` must first reset the failed attempt. Retry preserves the original promise, resets measured progress, and uses the returning layout. Error during the fade cancels the fade and keeps the overlay visible until a successful retry.

The configurable timeout says loading is taking longer, allows retry, and keeps accepting real progress and readiness. It does not fake completion or declare a network failure. A missing newspaper photograph falls back to a code-native rolled-paper silhouette without blocking the page.

## Composition, assets, and provenance

The fly's final position, newspaper contact, and ink all share a stage-relative anchor. The newspaper artwork's contact point is 13% across and 15% down its source box; its impact transform translates that point to the anchor. This avoids viewport-dependent collision offsets. The stage clips incoming art, preventing horizontal panning on phones. The orbit and counter scale within the same stage.

Load `loading.js` and `loading.css` before experiment initialization. Image paths derive from the loading script URL, so root and nested entry points use the same assets. The font URL is relative to the stylesheet. Themes come from the root `data-theme`, then `?theme=noir|burgundy`, then the `chanj-theme` storage key. Root attribute changes and `chanj:themechange` update the overlay.

- Runtime photograph: `assets/loading/newspaper-hand.webp`, 1200 × 800 alpha, 77,096 bytes.
- Original generated source: `assets/loading/source/newspaper-hand-alpha.png`, 1536 × 1024 alpha PNG.
- Exact generation prompts, tool mode, source path, and optimization record: `assets/loading/source/generation-provenance.json`.
- Shared authored fly mark: `assets/brand/fly-eye.svg`, also used by the application.
- Typeface: locally hosted `assets/fonts/space-grotesk-bold.ttf`, weight 700, with its OFL license in `assets/fonts`. It uses `font-display: swap`; other text uses system fonts.

The hand and newspaper were generated with the built-in ImageGen tool for the earlier introduction and are reused unchanged. The print is abstract texture without intended readable text, logos, or scientific claims. Sharp resized and encoded the runtime WebP without retouching or compositing the source. The fly, visible proboscis, ink, fallback newspaper, orbit, and motion are authored SVG/CSS/JavaScript. The source PNG is preserved but never requested by the loader.

## Validation — 27 September 2026

`node --check loading.js` passed. An independent logic audit reviewed the public API, bounded progress, repeated finish calls, failures, and timer cancellation. Chrome fixtures recorded timestamps, actual readiness, progress, stage, and hidden state. Every completion resolved after readiness and actual hiding.

| Fixture | Result |
| --- | --- |
| Fast assets and repeated finish | Both waiters resolved together after the reveal; no 100% or encounter before readiness. |
| Slow assets | Progress followed 25%, 55%, and 90% milestones; orbit continued until actual readiness. |
| Stalled and invalid progress | Held at 25%; ignored decreases, NaN, and strings. `progress(1)` held at 99% until `finish()`. |
| Skip before readiness | Hidden immediately; gate remained pending until actual readiness. |
| Returning visit | Simple mode; ready at 104ms, hidden resolution at 296ms in the isolated fixture. |
| Reduced motion | Static impact; ready at 125ms, hidden resolution at 304ms in the fixture. |
| Error after readiness | Revoked readiness; stale `finish()` did not release waiters; explicit retry reset restored normal completion. |
| Retry button | Callback received control, measured progress restarted, and both waiters resolved after successful readiness and hiding. |
| Error during reveal | Fade cancelled; late finish ignored until explicit reset; both waiters resolved after a later successful reveal. |
| Timeout | Displayed still-loading status without false readiness, then completed normally. |

Reduced-motion behavior was tested using a fixture-only matchMedia override; no operating-system preference was changed. Returning mode was checked separately to avoid localStorage interactions between parallel fixtures.

Chrome visual checks cover Noir desktop at 1280 × 720, Burgundy mobile at 320 × 640, and the common newspaper contact point. The parent integration separately verified 390 × 844, 844 × 390, and desktop layouts, plus the live simulation clock staying at 0.00 until the overlay hid. The stage clipping fix removed horizontal overflow. The actual 100% impact and subsequent simulation start were observed in the built application.

Evidence lives in the deployment chat's `outputs/qa/intro-v4-state-results.json` and v4 loader screenshots. Progress screenshots show a fixture held at a known measured milestone. Impact proof freezes the production animation at 60ms into impact for inspection; this freeze exists only in the review harness, not in production.

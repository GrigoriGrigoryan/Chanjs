# CHANJS — two seconds, a newspaper, and a type-only reveal

Every visit uses the same Burgundy opening. A fly circles a counter labeled **INTRO · 2 SECONDS**. At 100%, the newspaper strikes, then pauses so its winning headline can be read. The final welcome contains only oversized local typography: “Welcome to the Chanjs simulation.” The paper exits as the words approach the viewer and fade. A solid Burgundy layer fades in opacity to reveal the actual simulation beneath.

There is no card, logo, header, footer, counter, caption, or loading control around the welcome. The loader's other elements are hidden for that brief final stage. Before and after it, normal loading/retry controls remain available. The loader ignores saved theme choices and theme query values; it is always Burgundy. No seen marker or returning-visit bypass is used.

The number measures the illustrated opening's timeline, not downloads or preparation work. The visible “Illustrated introduction” caption before the welcome distinguishes this scene from neural activity, recordings, and the actual simulated newspaper encounter.

## Timing and public API

The number is `floor(clamp((frameTimestamp - visibleAt) / 2000, 0, 1) * 100)`. It uses requestAnimationFrame and elapsed time directly. `progress(fraction)` remains accepted for compatibility but cannot change the intro counter. Resource completion and browser caching therefore do not change the counter's intended two-second duration. A browser that misses frames may omit intermediate integers, without extending the intended timeline.

The normal sequence is:

1. **2,000ms counter**, with the fly moving toward the contact point during the last 260ms.
2. **380ms newspaper strike**, beginning at 100%.
3. **850ms readable headline hold**. Desktop holds the contact pose. Mobile gently shifts the paper left and rotates it 14 degrees in the first 240ms so the headline sits inside the narrow viewport, then holds it still for about 610ms.
4. **1,040ms reveal**, once the real simulation is ready. The paper exits over the first 360ms while large Space Grotesk text enters, moves forward, and fades. The solid Burgundy layer fades in opacity, exposing the already-rendered simulation behind it. Paper, type, and background use compositor-friendly transform/opacity animation; no full-screen blur or background-color animation is used.

With assets ready in time, this is approximately **4.27 seconds overall**. If preparation takes longer, the newspaper stays still in exactly the same reading pose with a small separate **Preparing simulation…** message and actual preparation details below. The counter hides after impact and never returns during waiting or retry. The orbit, count, and newspaper do not restart.

`beforeHeavyWork(): Promise<void>` releases after the 240ms reading-pose movement and 220ms ink animation actually finish, followed by two paint frames, normally around 2.67 seconds. The gate awaits the animations' finished promises as well as a timer, because a busy browser can start CSS animation a frame late. Serial/cycle guards discard stale completions. Expensive data/scene/GPU work then overlaps the static part of the reading hold instead of interrupting the counter, strike, or paper movement. Network requests can run earlier. The gate also releases immediately on skip, reduced motion, or a stopped/error state, preventing a startup deadlock. It does not imply actual application readiness.

`finish(): Promise<void>` signals actual readiness, and resolves only after the opening/readable hold and final reveal are complete and the overlay/status dock are actually hidden. Repeated calls return the same promise and never restart the sequence. Application code must await it before starting the simulation clock.

```js
ChanjLoader.show({ title: 'Preparing your world.', detail: 'Loading the experiment…' });
const requests = startNetworkRequests();
await ChanjLoader.beforeHeavyWork();
await prepareAndRenderTheActualSimulation(requests);
await ChanjLoader.finish();
// Reset/start the simulation clock and autoplay now.
```

`show`, `update`, `fail(message, retry)`, and `hide` retain their signatures. `show` accepts `timeoutMs` and an optional retry callback. The elapsed footer measures time from showing the loader to actual readiness/failure, separately from the two-second presentation.

## Skip, reduced motion, failure, and retry

Skip intro, Escape, and `hide()` stop the choreography and release the heavy-work gate immediately. If preparation is unfinished, the status dock remains. Skipping never invents readiness. Opening the dock returns to the simple, completed-intro waiting state.

Reduced motion skips the traveling count/fly/newspaper, releases heavy work immediately, and waits honestly for preparation. It then shows a static welcome for 160ms before hiding. The loader responds to preference changes during a load; native reduced-motion CSS is also present. No operating-system setting is changed by the application.

During the type-only welcome, focus moves to the dialog itself. Escape still skips, and Tab stays contained even though the visible loading buttons are hidden. Outside that stage, buttons are at least 44px high. The numeric progressbar is named “Illustrated opening progress.” Actual status is a polite live region; the elapsed clock is non-announcing. Decorative artwork is hidden from assistive technology.

Failure cancels pending choreography/reveal, revokes readiness, clears numeric announcements, shows a dash, and exposes Retry. A stale `finish()` in the failed state cannot clear the error. Retry or explicit `show()` must reset the attempt; existing finish waiters remain pending until a successful actual-ready signal and completed reveal. Retry uses a quiet completed-opening view rather than replaying the scene inside that failed attempt. A later visit always runs the full opening.

Retry callbacks must explicitly call `finish()` after success; their own resolution does not release the entry gate. Without a callback, Retry reloads the current URL. The configurable timeout reports slow preparation and offers retry without declaring false failure or readiness. Failure during the type reveal cancels the final completion timer and restores the error surface.

## Composition, assets, and provenance

The fly center, newspaper contact, and ink share a stage-relative anchor. The paper image's contact point is 13% across and 15% down its source box. The impact transform places that point exactly at the fly center. On mobile, only the subsequent reading pose changes; the collision stays aligned. The stage clips incoming artwork to prevent horizontal panning.

Runtime artwork is `assets/loading/newspaper-hand.webp`, 1200 × 800 alpha, 108,890 bytes. The current image was edited via the built-in ImageGen tool; its preserved source is `assets/loading/source/newspaper-firebird-won-alpha.png` and its exact prompt is in `firebird-won-provenance.json` beside it. It carries the user's requested winning headline, with “CHANJS WON” leading “FIREBIRD HACKATHON,” orange print, and the official Firebird glyph. The decorative artwork is not evidence establishing an award.

The code-native fallback uses the same lead wording, an orange rule, and `assets/brand/firebird-glyph.svg`. That official glyph is sourced from `https://www.firebird.ai/assets/glyph-gradient.svg`; the parent task preserves the source. The fly, proboscis, ink, fallback newspaper geometry, orbit, and choreography are authored SVG/CSS/JavaScript. No second WebGL renderer is created.

The fly-face mark remains `assets/brand/fly-eye.svg`. Typography is locally hosted `assets/fonts/space-grotesk-bold.ttf`, weight 700, with its OFL license. The font uses `font-display: swap`; supporting text uses system fonts. Image URLs derive from the loading script URL; the font URL is relative to the stylesheet. The build versions runtime assets to avoid old cached script/artwork. Preserved original PNGs are not requested by the loader.

## Validation — 27 September 2026

`node --check loading.js` and whitespace checks for the owned files pass. Chrome fixtures record visible counter state, timeline phase, actual readiness, paper/ink animation state at heavy-work release, and final hidden state. The visible-counter regression checks fast, cached, slow, skipped, reduced-motion, timeout, failure/retry, and failure during the welcome. Normal complete runs show 100% in exactly one continuous episode. Waiting and retry never show it again; a retry before the first strike shows no 100% at all.

Slow preparation keeps the newspaper visible at a constant reading transform with no active paper animation. Every finish resolution must have actual readiness true and the overlay hidden. The independent entry gate survives skip, reduced motion, stale finish calls after failure, explicit retry, timeout, and failure during the welcome.

Evidence is recorded in the deployment chat's `outputs/qa/intro-v7-state-results.json` and `intro-v7-state-summary.json`. Review screenshots may pause a production animation at a chosen frame only in the external fixture; production has no pause. The held mobile fixture shows the readable headline and separate preparation message with no numeric readout.

The final built application was checked in Chrome at 320 × 640. Observed 25%, 50%, 75%, and 100% occurred at 491ms, 1,000ms, 1,492ms, and 1,994ms after sampling began. Impact appeared at 2,375ms, heavy work was allowed at 2,801ms, the welcome began at 3,223ms, and the overlay was hidden at 4,265ms. Every visible sample held simulation time at `0.00 s`. Width and scroll width both stayed at 320px. These are local QA measurements, not a cross-device guarantee.

The final eight-case fixture suite recorded no running paper or ink animation when heavy work was released, zero visible waiting counters, and one constant paper transform throughout slow preparation. Fast/cached/slow/timeout runs each showed exactly one continuous 100% episode. Skip, reduced motion, and retry after a pre-impact failure showed none. Every finish promise resolved only with actual readiness true and the overlay hidden.

`loading-v7-waiting-mobile.png` shows the quiet slow-preparation fixture. `loading-v7-live-welcome-mobile.png` captures the actual application under the type-only welcome, with the simulation clock still at zero. Temporary browser viewport overrides were reset and the QA tab closed.

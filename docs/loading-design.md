# CHANJS — a short encounter

The first visit opens with one finite scene: a fly enters, a hand sweeps a rolled newspaper across the oversized CHANJS lettering, and the fly settles into a small, flattened, stylized mark. The impact is quiet, with no gore. The scene then reveals the application. The text-free compound-eye brand mark is shared with the application. Themes are Noir (default, near-black with deep crimson) and Burgundy; orange is no longer a theme.

This is an illustrated introduction, not a neural visualization, scientific recording, or model result. The caption says “Illustrated introduction.” The scene contains no progress percentage or estimated completion animation.

## Timing and readiness contract

Resource loading and the introduction run in parallel. The normal first-visit scene lasts 2,800ms, then the overlay fades for 400ms after real assets are ready. If loading finishes early, it waits for the scene. If loading takes longer, the final impact frame stays still until readiness. All decorative animations are finite and are removed after the scene settles.

**`ChanjLoader.finish()` now returns `Promise<void>`.** Call it only after actual application readiness, and await it before starting the simulation clock or autoplay. It resolves after the overlay and minimized status button are actually hidden, including the reveal transition. A timeout fallback handles browsers that suppress `transitionend`; that fallback explicitly hides the DOM before resolving.

```js
ChanjLoader.show({
  title: 'A tiny fly. A whole world.',
  detail: 'Loading geometry and measured decision tables…',
  timeoutMs: 45000
});
ChanjLoader.update('Preparing the measured decision table…');
await loadActualResources();
await ChanjLoader.finish();
// Start/reset the application clock and autoplay here.
```

`show`, `update`, `fail`, and `hide` keep their existing call signatures. `show` accepts an optional `retry` callback, and `fail(message, retry)` accepts the same callback. Retry reloads the current URL if no callback is supplied. A callback must call `finish()` after its own successful readiness work; resolving the retry callback alone does not imply that resources are ready.

The elapsed clock measures time to actual readiness or failure and stops at that event. During a fast first load, the status can truthfully say “READY — Your fly is ready” while the short introduction completes. Its choreography never claims to measure loading.

## First visit, skip, and motion preferences

- The versioned localStorage key is `chanjs-intro-v3`, value `seen`. It is saved when the scene finishes or the user skips it. If storage is unavailable, an in-memory marker handles subsequent cycles in the current page.
- Returning visits use a simpler, static loading view and reveal as soon as real assets are ready.
- `?intro=1` explicitly replays the first-visit scene for review, regardless of the stored marker.
- “Skip intro,” Escape, and `hide()` end the scene and dismiss the overlay immediately. If assets are still loading, a compact status button remains. Skipping never makes assets ready and never resolves a pending `finish()` promise early.
- Reduced motion uses a still impact composition for at most 180ms and an immediate reveal once resources are ready. There is no wing motion, traveling hand, letter movement, or shake. The loader also reacts if the motion preference changes while it is open.

The dialog has a polite status region, focus handling, controls at least 44px high, and a non-announcing elapsed timer. All decorative scene content is hidden from assistive technology. Small screens use a tighter crop and allow vertical scrolling if longer errors require extra space.

## Failures and retries

A resource failure cancels any pending reveal, clears readiness, pauses the scene, and shows Retry. Existing completion waiters remain pending. Retry preserves that same promise and uses a simple loading view; it does not replay the cinematic. Only a later successful `finish()` releases those waiters. An error during the 400ms fade cancels the fade and prevents an early resolution.

The configurable loading timeout reports that loading is taking longer, without falsely declaring failure. It keeps accepting a later successful readiness event. A missing newspaper image falls back to a code-native silhouette and does not block loading or the scene.

## Asset and theme integration

Load the classic `loading.js` script and `loading.css` before experiment initialization. The script derives its asset URLs from its own URL, so root and nested entry points, including an HTML `<base>`, use the same assets.

Themes are read from `document.documentElement.dataset.theme`, then `?theme=noir|burgundy`, then localStorage `chanj-theme`. The loader follows root theme changes and `chanj:themechange` events without overwriting the preference.

- Runtime photograph: `assets/loading/newspaper-hand.webp` — 1200 × 800, alpha, 77,096 bytes.
- Preserved generated source: `assets/loading/source/newspaper-hand-alpha.png` — 1536 × 1024 alpha PNG, unchanged from the selected ImageGen result.
- Exact prompts, built-in tool mode, original source path, and processing record: `assets/loading/source/generation-provenance.json`.
- Shared authored compound-eye mark: `assets/brand/fly-eye.svg`.

The hand and newspaper were generated for the previous introduction using the built-in ImageGen tool and are reused unchanged here. The print is abstract texture without intended readable words, logos, or scientific claims. Sharp resized and encoded the runtime WebP; it did not retouch, composite, or threshold the alpha. The fly, fallback newspaper, route, letters, and choreography are code-native. No second WebGL renderer is created.

## Validation — 27 September 2026

`node --check loading.js` passed. Chrome fixture scenarios recorded real timestamps and DOM state; every resolved promise was checked to have both actual readiness and an already-hidden overlay.

| Scenario | Observed behavior |
| --- | --- |
| Fast assets | Assets ready at 90ms; promise resolved after hidden at 3,258ms. |
| Slow assets | Scene settled while still loading at 3,024ms; assets ready at 4,222ms; revealed at 4,650ms. |
| Skip before readiness | Hidden at 173ms, still unready at 677ms; resolved only at readiness, 1,222ms. |
| Reduced motion | Still composition; assets ready at 71ms; resolved at 200ms. |
| Returning visit | Static mode; readiness and hidden resolution both at 55ms. |
| Error after early readiness | Failure revoked readiness; skipping did not resolve it; successful readiness later released both waiters at 1,223ms. |
| Retry button | Existing waiter survived failure; clicking Retry used static loading; both waiters resolved after the callback signaled actual readiness. |
| Error during reveal | Failure at 2,980ms cancelled the fade; overlay remained visible and unready at 3,476ms; later readiness revealed at 4,659ms. |
| Loading timeout | Entered the still-loading state without failure; later readiness completed normally. |

Reduced-motion logic was exercised by a fixture-only `matchMedia` override that activated the production `data-motion="reduced"` path; no OS setting was changed. In addition, the CSS contains the native media-query fallback.

The current Noir and Burgundy scenes were visually inspected at 1280 × 720, and Burgundy at 320 × 640. At 320px, the viewport and loader scroll width were both 320px; loader height was 640px, the skip control was 44px high, and the full CHANJS wordmark fit. After settling, computed animation names in the scene were all `none`. Both the generated hand and shared brand image loaded. Console warning/error capture was empty. Temporary browser viewport overrides were reset.

Evidence is saved in the deployment chat's `outputs/qa/intro-v3-state-results.json` and `loading-noir-v3-desktop.png`, `loading-burgundy-v3-desktop.png`, and `loading-burgundy-v3-mobile.png`. These screenshots show a local fixture held in the final impact frame; their clocks are fixture viewing time, not production load benchmarks.

Loader JavaScript and CSS total 32,018 unminified bytes, approximately 9,420 bytes when separately gzipped. The reused 77KB WebP and small shared SVG are the only additional images requested. The preserved source PNG is not requested by the loader.

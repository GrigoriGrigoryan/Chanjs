# CHANJS — a consistent illustrated opening

Every visit plays the same three-second opening: a fly circles a large counter marked **INTRO · 3 SECONDS**, then a Firebird newspaper swats it at 100%. A quiet ink splash settles before a glass-like card says “Welcome to the Chanjs simulation.” The counter measures the opening's timeline. It does not claim to measure downloads or preparation work.

There is no seen marker, cache-dependent bypass, or returning-visit shortcut. The loader never reads or writes the old `chanjs-intro-v4` marker. `?intro=1` is harmless but no longer necessary to replay the scene. Cached and uncached visits follow the same timeline.

The scene is an “Illustrated introduction,” separate from scientific recordings, neural activity, and the actual simulation's newspaper encounter. Noir and Burgundy share the same composition, face/proboscis fly mark, and authored flying illustration.

## Timeline and two independent gates

The number is `floor(clamp((frameTimestamp - visibleAt) / 3000, 0, 1) * 100)`. It uses requestAnimationFrame and elapsed time directly, without exponential smoothing, measured-resource jumps, or a timer estimate of remaining download time. The fly moves toward the shared contact point during the last 260ms. At three seconds the number reaches 100 and the 380ms newspaper strike begins; the 380ms impact/recoil then settles. A browser that cannot supply frames cannot display every intermediate integer, but missed frames do not lengthen the intended timeline.

**`beforeHeavyWork(): Promise<void>`** lets application startup defer heavy decoding, allocation, scene construction, GPU initialization, and rendering until the moving opening has finished. It normally resolves after the three-second counter plus strike and settle, approximately 3.76 seconds. It resolves immediately when the user skips, requests reduced motion, or an error stops the opening, so startup cannot deadlock on a failed decoration. It does not mean assets are ready and never releases the application's final entry gate.

**`finish(): Promise<void>`** signals actual application readiness. Its promise resolves only after both the opening and real preparation have completed and the overlay/status dock are actually hidden. Repeated calls share the same promise and do not restart anything. The application awaits this gate before resetting and starting the simulation clock.

If actual preparation is slow, the completed opening stays at 100 with **INTRO COMPLETE** and a separate quiet busy indicator: **Opening complete · preparing simulation**. The fly and newspaper remain settled. Neither the count nor the orbit restarts. Actual resource details continue in the footer.

Once both conditions are satisfied, the welcome card enters over 220ms, holds fully visible for approximately 630ms, and the whole overlay fades over 700ms. Thus the numbered opening is three seconds; the readable welcome and reveal are additional presentation time. Actual preparation can extend the waiting period. There is no claim that the entire application becomes ready in three seconds.

```js
ChanjLoader.show({
  title: 'Preparing your world.',
  detail: 'Loading fly geometry and measured decision tables…',
  timeoutMs: 45000
});
// Network work may overlap the introduction when useful.
await ChanjLoader.beforeHeavyWork();
await constructAndWarmUpTheActualApplication();
ChanjLoader.update('Simulation prepared.');
await ChanjLoader.finish();
// Start/reset the simulation clock and autoplay only now.
```

`progress(fraction)` remains available for compatibility with existing preparation reporting, but it never changes the intro counter. `show`, `update`, `fail(message, retry)`, and `hide` retain their signatures. The elapsed footer measures time from showing the loader to actual readiness/failure and stops at that event. It is separate from the opening timeline.

## Skip, reduced motion, failure, and retry

Skip intro, Escape, and `hide()` stop the choreography and release the heavy-work gate immediately. If the application is still loading, a compact status button remains. Skipping never implies readiness. Reopening that status button shows the completed opening with the actual waiting status.

Reduced motion omits the traveling fly/newspaper and moving count, immediately releases the heavy-work gate, and uses a static completed-intro view while preparation continues. After readiness it shows a still welcome for 160ms and hides without a traveling/fading transition. Preference changes during the opening also take this route. The native reduced-motion CSS is present alongside the script's preference handling.

A failure cancels any pending scene/welcome/reveal, clears readiness and numeric announcements, shows a dash, and exposes Retry. Existing finish waiters remain pending. A stale `finish()` while failed cannot clear the error: Retry or explicit `show()` must reset the attempt first. Retry preserves the original finish promise and shows a quiet completed-opening state, without replaying the three-second scene inside that failed attempt. A later navigation always runs the full opening again.

`show` and `fail` accept optional retry callbacks. The callback must call `finish()` after successful readiness; merely resolving the callback does not release the gate. Without a callback, Retry reloads the current URL. The configurable timeout reports that preparation is taking longer and permits retry while continuing to accept real readiness. It does not invent completion or a network failure.

A transition-end listener resolves the entry gate after opacity reaches its end. Its timer fallback explicitly hides the DOM before resolving. Error during the fade cancels both paths until a successful retry.

## Visual and accessibility behavior

The newspaper contact, fly's final position, and ink share a stage-relative anchor. The photographic contact point is 13% across and 15% down the image box; the impact transform translates this point onto the fly. This keeps the hit aligned across viewports. The stage clips incoming art and prevents horizontal panning on phones. The glass welcome uses a restrained translucent gradient, soft border, backdrop blur, and a short accent rule.

The dialog has a polite actual-status region, an accessible progressbar named “Illustrated opening progress,” focus handling, Escape support, and controls at least 44px high. Decorative artwork is hidden from assistive technology. The elapsed timer does not announce each tick. Long failure messages can scroll vertically on short screens.

## Assets and integration

Load `loading.js` and `loading.css` before application initialization. Image paths derive from the script URL; the font path is relative to the stylesheet. The build versions those URLs to avoid cached old artwork/scripts. Theme selection follows the document root `data-theme`, then `?theme=noir|burgundy`, then the `chanj-theme` preference. Root attribute changes and `chanj:themechange` update the loader.

- Runtime photograph: `assets/loading/newspaper-hand.webp`, 1200 × 800 alpha WebP, 103,666 bytes.
- Updated generated source: `assets/loading/source/newspaper-firebird-alpha.png`.
- Firebird edit provenance and exact prompt: `assets/loading/source/firebird-provenance.json`.
- Original cutout and its prompts remain in `assets/loading/source/newspaper-hand-alpha.png` and `generation-provenance.json`.
- Shared authored fly face and proboscis mark: `assets/brand/fly-eye.svg`.
- Typeface: local `assets/fonts/space-grotesk-bold.ttf`, weight 700, with its OFL license in `assets/fonts`. It uses `font-display: swap`; other text uses system fonts.

The photographic newspaper was edited using the built-in ImageGen tool to carry the user's requested Firebird masthead and “CHANJS WINS FIREBIRD HACKATHON” headline. This is decorative scene artwork, not evidence establishing an award. The code-native fallback contains the same wording. The fly, proboscis, ink, orbit, fallback newspaper, and choreography are authored SVG/CSS/JavaScript. No second WebGL renderer is created. Preserved source PNGs are never requested by the loader.

## Validation — 27 September 2026

`node --check loading.js` and `git diff --check` passed. Chrome fixture logs record visible progress, timeline phase, actual readiness, heavy-gate release, and hidden state. In the final parallel fixture run, fast, slow, and cached cases began the 100% strike at 3003ms, 3007ms, and 3008ms respectively. Their heavy-work gates released at 3768ms, 3773ms, and 3773ms. All finish resolutions occurred with actual readiness true and the overlay hidden.

| Case | Observed behavior |
| --- | --- |
| Fast preparation | Actual readiness at about 70ms did not accelerate the three-second counter or skip the scene. |
| Slow preparation | Counter and strike finished normally; at 4.5s the intro stayed at 100, waiting honestly for preparation. |
| Cached/returning visit | Even with the old seen marker present, the full count and swat played. |
| Skip | Heavy gate released at 183ms; entry still waited for actual readiness at 1203ms. |
| Reduced motion | Heavy gate released immediately; still welcome and hide followed readiness. |
| Failure and stale finish | Error released only the heavy gate; finish remained pending until explicit reset and actual readiness. |
| Retry button | Retry callback ran; successful readiness completed the original entry promise. |
| Failure during reveal | Fade cancelled, stale finish ignored, and successful retry released both finish waiters only after hiding. |
| Timeout | Waiting status appeared without changing the intro clock or inventing readiness. |

Fixtures inject reduced-motion preference locally without changing operating-system settings. Visual evidence includes the final Firebird photograph, aligned impact, and desktop/mobile glass welcome. Screenshots that hold a welcome or impact do so only in the review harness; production has no such freeze. Evidence files are in the deployment chat's `outputs/qa/intro-v5-state-results.json` and v5 screenshots. Full-app startup timing is checked separately against the integrated build with heavy work deferred.

The integrated built application was sampled on a cached reload at 320 × 640: 25% at 749ms, 50% at 1501ms, 75% at 2249ms, and 100% with the strike at 3000ms. Heavy work became allowed at 3811ms; the overlay hid after the welcome at 5789ms. Every visible sample retained simulation time `0.00 s`. These observations are saved in `outputs/qa/intro-v5-integrated-counter.json`. The complete welcome fits inside the 320px stage; the loader is exactly 320 × 640 with a 44px skip target. The updated Firebird photo has clean alpha edges and its contact anchor matches the fly center in the desktop proof. Temporary browser viewport overrides were reset and the fixture tab was closed.

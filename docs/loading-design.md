# Loading atlas

`loading.js` and `loading.css` provide the shared Chanjs startup overlay. The design is an original, code-authored atlas plate: a bilateral fly with wing veins, jointed legs, segmented abdomen, and a schematic circuit inset. Cream strokes assemble over a dark registration grid; vermilion identifies the head, annotations, and a slow scan line. The artwork uses inline SVG and CSS only. It requires no image, font, library, shader, or remote request.

The fly and the inset are schematic decoration, not measured anatomy, FlyWire coordinates, neural activity, or a simulation result. The visible caption states “Original illustration · not neural activity.” The scan and line assembly never represent loading progress. No proprietary reference artwork or source code was reused. The visual assets were authored for this implementation; there are no external media attribution obligations.

## Integration

Load `loading.css` and the classic `loading.js` script before the experiment scripts. For the sandbox, use the matching relative root paths. Call `show` before starting resource loading, `update` at actual work boundaries, and `finish` only when the experiment is ready. Call `fail` after any legacy code that disables all page buttons, so retry and hide remain usable.

```js
ChanjLoader.show({
  title: 'From cells to motion.',
  detail: 'Loading the experiment…',
  timeoutMs: 45000
});
ChanjLoader.update('Unpacking the network…');
// In the real readiness callback:
ChanjLoader.finish();
// In the error handler:
ChanjLoader.fail('The network could not load. Please retry.');
```

`show` also accepts a `retry` callback, and `fail(message, retry)` accepts the same callback. If no callback is provided, Retry reloads the current URL. `hide()` closes the overlay and leaves a compact status button that reopens it; loading continues. Escape performs the same action. `finish()` hides both overlay and status button immediately, stops timers, and restores focus when appropriate. It imposes no minimum viewing duration.

Elapsed time is measured using `performance.now()`, never estimated from animation. After the configurable timeout, the status says loading is taking longer and offers Retry while remaining receptive to a later successful readiness event. A reported failure stops the elapsed timer. No percentage is fabricated.

## Accessibility and responsive behavior

The overlay has a labeled dialog, a polite live status region, and a timer that does not announce every tick. Keyboard focus stays within visible controls; Escape always hides the overlay. Buttons are at least 44px high. `prefers-reduced-motion: reduce` removes all decorative animation and transitions. At narrow widths the composition stacks; vertical scrolling keeps controls available for longer errors. There is no horizontal overflow at 320px.

## Verification, 26 September 2026

- `node --check loading.js` passed.
- Isolated loader visually inspected in the Codex in-app browser at 1280 × 720 and 320 × 640. The 320px document and loader scroll widths were both 320px; the hide button measured 44px high.
- Exercised Hide, reopen, Escape, immediate completion, explicit failure, successful retry, and the still-waiting state with a shortened test timeout. The clock continued across hide/reopen; successful completion removed both overlay and status button.
- Integrated feeding page inspected at 320 × 640. It reached `body.dataset.ready === 'true'` and hid the loader after network initialization. Document scroll width stayed 320px, and all experiment buttons measured 44px high.
- Ran a fixed feeding offer to completion in that mobile viewport. The populated trial log measured 296px in both layout width and scroll width, with no overflow. Browser warning/error capture was empty.
- Reduced-motion handling was inspected in source; the system preference was not changed for this check. No claim is made that the SVG is anatomically or scientifically validated.

At the check above, the unminified loader totaled 21,731 bytes (JavaScript 12,920; CSS 8,811), approximately 7,126 bytes when the two files were gzipped separately. No media downloads are added.

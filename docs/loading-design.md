# Escape the newspaper

The Chanjs introduction is an original editorial scene: oversized CHANJ lettering, a tactile hand holding a rolled newspaper, and a small illustrated fly that escapes the sweep and passes behind the letters. It uses the selected orange (`#FF632D`) or burgundy (`#751B3B`) theme. The small caption reads “Illustrated introduction.” This is decorative storytelling, not a neural visualization, scientific recording, or model result.

The composition appears immediately through HTML, CSS, and an inline SVG fly. A code-native rolled-paper silhouette remains available while the optional photographic cutout loads, or if it fails. The newspaper sweep, letter reactions, fly route, and wingbeat use CSS animation; there is no second WebGL renderer. Animations never represent loading progress.

## Readiness and API

Load `loading.css` and the classic `loading.js` script before starting the experiment. The script derives the image URL from its own URL, so both the root entry and `/embodied/sandbox/` resolve the same artwork, including when the entry uses a `<base>` element.

```js
ChanjLoader.show({
  title: 'A tiny fly. A whole world.',
  detail: 'Loading fly geometry and measured decision tables…',
  timeoutMs: 45000
});
ChanjLoader.update('Preparing the measured decision table…');
// Called by actual application readiness:
ChanjLoader.finish();
// Called by the application error handler:
ChanjLoader.fail('The experiment could not load. Please retry.');
```

The API remains `show`, `update`, `finish`, `fail`, and `hide`. `show` accepts an optional `retry` function; `fail(message, retry)` accepts the same callback. Retry reloads the current URL if no callback is provided. Call `fail` after legacy code that disables all page buttons so the introduction controls remain usable.

`finish()` removes the overlay and its minimized status button immediately and stops the timer. There is no minimum viewing duration or delay waiting for the artwork or the animation. When initialization is fast, the introduction may only appear briefly.

Elapsed time uses `performance.now()`. After the configured timeout the overlay says that loading is taking longer and offers Retry, while still accepting a later successful finish. An explicit failure stops the timer and pauses the decorative motion. Hide and Escape leave initialization running and expose a compact status button for reopening it.

## Theme and accessibility

The loader reads `document.documentElement.dataset.theme`, then `?theme=orange|burgundy`, then the `chanj-theme` localStorage value. It follows root theme attribute changes and `chanj:themechange` events. It does not overwrite the user's theme setting.

The overlay is a labeled dialog with a polite status region and a timer that does not announce every tick. All decorative scene content is hidden from assistive technology. Focus cycles through the visible controls. Escape hides the overlay. Buttons are at least 44px high. `prefers-reduced-motion: reduce` turns off all animation and transitions and presents a still composition. Small screens use a tighter scene crop, and the overlay permits vertical scrolling if an error requires extra room.

## Artwork provenance

The hand/newspaper cutout was generated for this implementation using the **built-in ImageGen tool**, following the ImageGen skill. No external photography, stock image, brand, newspaper masthead, or reference artwork was reused. The print is abstract texture and contains no intended readable text or science claims.

- Runtime asset: `assets/loading/newspaper-hand.webp` — 1200 × 800, transparent alpha, 77,096 bytes.
- Preserved generated source: `assets/loading/source/newspaper-hand-alpha.png` — 1536 × 1024, alpha PNG, copied unchanged from the selected ImageGen result.
- Complete generation prompt, refinement prompt, tool mode, original source path, and processing record: `assets/loading/source/generation-provenance.json`.

The initial prompt requested a single adult hand and forearm holding a rolled newspaper, diagonally composed for a sweep from the lower right, with tactile studio lighting, abstract newsprint, and a transparent background. A subsequent ImageGen edit requested removing any surrounding haze while preserving the hand, paper, anatomy, gesture, and colors. The selected source was inspected and confirmed to have an alpha channel. Transparent pixels retain color values in the PNG, but those values are not visible when alpha is composited correctly.

Sharp only resized the selected image and encoded WebP (quality 82, alpha quality 100). It did not retouch, composite, or threshold the alpha. The original PNG remains alongside its provenance. The fly, dotted route, fallback newspaper, and typography are newly authored inline SVG/CSS/HTML.

## Validation — 27 September 2026

- `node --check loading.js` passed.
- Inspected both themes in Chrome at 1280 × 720 and 320 × 640 using a local display fixture with current source.
- At 320 × 640, document and loader scroll widths were 320px, loader height was 640px, and the hide button was 44px high. The actual loading status and elapsed clock remained visible.
- Verified that the generated WebP loaded and `data-art` became `ready`; transparent edges composited cleanly on both backgrounds.
- Exercised Hide, reopening from the status button, Escape, completion, explicit failure, successful retry, and the still-waiting timeout state. Completion immediately removed both the dialog and minimized status button. Browser warning/error capture was empty.
- Reviewed reduced-motion CSS and missing-image fallback in source; the OS preference was not changed and an image-fetch failure was not injected during this fixture check.
- Saved four viewport screenshots under the deployment chat's `outputs/qa/`: `loading-orange-desktop.png`, `loading-orange-mobile.png`, `loading-burgundy-desktop.png`, and `loading-burgundy-mobile.png`.

The fixture deliberately stays visible for design review. Its elapsed clock records fixture viewing time, not production load performance. No production delay was added for screenshots. Temporary browser viewport overrides were reset afterward.

The unminified loader code totals 25,641 bytes (12,063 JavaScript + 13,578 CSS), approximately 7,916 bytes when separately gzipped. With the 77,096-byte WebP, the runtime addition is approximately 85KB transferred before protocol overhead. The preserved PNG source is not requested by the loader.

---
paths:
  - "src/app.ts"
  - "src/ui/**"
  - "src/styles.css"
  - "src/main.ts"
  - "index.html"
---

# UI and mobile rules

- **iPhone landscape is the primary target** (about 852×393 CSS px). The `@media (max-height: 500px)`
  block in `styles.css` is the compact phone layout: the top bar and the detune tools scroll
  horizontally, and labels and key names are hidden. Check every UI change at that size
  (`node scripts/screenshots.mjs <dir>`).
- The keyboard surface keeps `touch-action: none`. `Keyboard` tracks each `pointerId` and hit-tests
  with `elementFromPoint`. That gives glissando across keys and multi-touch chords. Don't switch to
  click/touch events.
- Zoom is blocked by the viewport meta, `gesturestart` preventDefault, and a double-tap guard on
  `.keyboard`. Safe areas are handled with `env(safe-area-inset-*)` on `#app` and `.version`.
- **All user-visible text goes through i18n** (`t(lang, key)` / the `i18n()` helper in `app.ts`).
  No hard-coded Turkish/English strings in the DOM. Note names come from `notes.names`.
- Colours are CSS custom properties. Every new token needs light **and** dark values, in both the
  `[data-theme='dark']` block and the `prefers-color-scheme` block. Keep the kilim palette:
  madder red, indigo, saffron, cream.
- Interactive elements that e2e tests touch get a stable `data-testid`.
- Settings persist through `state.ts` (`sanitize()` validates everything loaded from localStorage).
  When you add a field, add it to `AppState`, `defaultState()` and `sanitize()`, plus a unit test.
- The app version comes from `__APP_VERSION__` (defined from package.json in `vite.config.ts`). Don't hard-code it.
- Web MIDI is desktop-only and feature-detected. Nothing may depend on it.

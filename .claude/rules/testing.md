---
paths:
  - "tests/**"
  - "playwright.config.ts"
  - "vite.config.ts"
---

# Testing rules

- `npm run check` = typecheck + lint + Vitest. It must pass before every push.
- Unit tests live in `tests/unit/*.test.ts` and run in Node (no DOM). Test data tables and pure logic.
- E2E tests live in `tests/e2e/*.spec.ts`. The Playwright projects are `chromium`, `webkit` and `iphone`
  (iPhone 15 landscape, WebKit). The webServer serves the **built** app with `vite preview` on
  port 4173 under `/kkey/`. Locally it builds first; in CI (`CI=true`) the build step has already run.
- Start each e2e test through the `start(page)` helper (click the overlay, wait for
  `body[data-audio="running"]`).
- To press keys, use `page.mouse` at a key's bounding-box centre (about 85% of its height, so white
  keys aren't covered by black keys). For multi-touch, dispatch `pointerdown`/`pointerup` on the
  `keyboard` test id with distinct `pointerId`s and real `clientX/Y`.
- Key names (`.key .name`) are hidden in the compact phone layout, so skip label assertions on `iphone`.
- **Cloud sandbox caveat:** WebKit can't be downloaded there (the proxy blocks the Playwright CDN).
  Run `--project=chromium` locally and let CI cover webkit/iphone. Pin `@playwright/test` to the
  version whose Chromium is preinstalled (`/opt/pw-browsers`), currently 1.63.0.
- Never skip, disable or loosen a test to get green. Fix the cause.

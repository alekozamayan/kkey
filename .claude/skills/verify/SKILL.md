---
name: verify
description: Run kkey's full local quality gate (typecheck, lint, unit tests, build, Playwright e2e) and a phone-layout screenshot check. Use before pushing, before opening or updating a PR, or when asked to "test everything".
---

# Verify kkey

Needs Node 22+ and `npm ci`. If `node` is missing on this machine, say so and rely on CI instead.

1. `npm run check`: typecheck + ESLint + Vitest. All must pass.
2. `npm run build`: check that `dist/manifest.webmanifest`, `dist/sw.js` and `dist/icons/*.png` exist.
3. E2E:
   - With all browsers installed: `npm run test:e2e` (chromium + webkit + iphone).
   - In the cloud sandbox WebKit can't be downloaded. Run `npx playwright test --project=chromium`,
     and say that webkit/iphone will run in CI.
4. Visual check for any UI change: `node scripts/screenshots.mjs <scratch-dir>` (needs a running
   `npx vite preview --port 4173`). Look at the `iphone` shot (852×393 landscape). The top bar must
   be a single row, the keyboard must fill the rest, and nothing may be clipped.
5. `npx prettier --check .` (it ignores the protected workflow files). Format only the paths you changed.
6. Report the result of each step: passed, failed (with output) or skipped (with the reason).
   Never call a skipped step green.

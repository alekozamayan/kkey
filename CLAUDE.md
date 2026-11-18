# kkey — Turkish/Kurdish dance-music keyboard (web app)

A browser-based musical keyboard built for Turkish and Kurdish dance music
(halay, govend, çiftetelli, karşılama, horon, zeybek, roman havası…),
in the spirit of the "oriental" arranger keyboards (org) played at weddings:
microtonal makam tuning, regional instrument voices, and usul/rhythm accompaniment.

Live site: https://alekozamayan.github.io/kkey/  (GitHub Pages, deployed by Actions)

## Start here (for Claude sessions)
- **`docs/STATUS.md`** is the session handoff log: current release, decisions, environment notes and backlog.
  Read it at the start (`/resume` skill) and update it before you finish.
- Path-scoped conventions live in `.claude/rules/`. Skills: `/resume`, `/verify`, `/release`,
  `/add-makam`, `/add-usul`, `/add-voice`.
- Run `/verify` before every push. Release only through `/release`.

## Hard requirements

- **Runs on iPhone Safari** with no App Store app. It must be an installable **PWA**
  ("Add to Home Screen"): web manifest, apple-touch-icon,
  `apple-mobile-web-app-capable`, a service worker for offline use, and a full-screen landscape layout.
- **Releases are tested and deployed automatically.** See "Release flow" below.
- No copyrighted samples. Synthesize sounds with the Web Audio API. If a sample is
  ever added it must be CC0 or CC-BY, with its license recorded in `public/samples/LICENSES.md`.

## Stack

- Vite + TypeScript (strict). Plain DOM or Preact; no heavy UI framework.
- Audio: Web Audio API directly (no Tone.js unless it clearly pays off).
- Tests: **Vitest** for logic (tuning math, makam tables, rhythm patterns, key mapping),
  **Playwright** smoke e2e (chromium + **webkit**, plus an iPhone device profile).
- Lint/format: ESLint + Prettier. `npm run check` = typecheck + lint + unit tests.
- `vite.config.ts` must set `base: '/kkey/'` for GitHub Pages.
- PWA via `vite-plugin-pwa`.

Scripts expected in package.json: `dev`, `build`, `preview`, `typecheck`, `lint`,
`test` (vitest run), `test:e2e` (playwright), `check`.

## iOS / mobile gotchas (must handle)

- Create or resume the `AudioContext` only inside a user gesture. Show a "Tap to start" overlay.
- Ring/silent switch: set `navigator.audioSession.type = 'playback'` when available (iOS 17+),
  so sound plays with the switch on silent.
- Multi-touch chords: Pointer Events with `touch-action: none`. Track each `pointerId`
  and support glissando by sliding across keys.
- Disable pinch and double-tap zoom on the play surface. Respect safe-area insets.
- Low latency: `latencyHint: 'interactive'`. Schedule rhythms with a look-ahead
  scheduler (setInterval plus `audioContext.currentTime`), never with raw setTimeout.
- Web MIDI isn't available on iOS Safari. Feature-detect it and treat MIDI input as a desktop bonus only.

## Music domain

### Tuning / makams
- Model pitches in **cents** relative to a tonic. Turkish theory uses the 53-TET Holdrian comma
  (1 koma ≈ 22.64 cents). Store makam scales as comma steps and derive cents from them.
- Oriental keyboards let you lower or raise individual notes by quarter tones (or commas).
  Provide a **per-note detune bar** (12 toggles/sliders per octave) that a makam preset fills in,
  and that the user can adjust live.
- Makam presets (at least): Rast, Uşşak, Hicaz, Hümayun, Kürdi, Nihavend, Saba, Hüseyni,
  Karcığar, Segah, plus 12-TET "Düz" (no microtones). Selectable tonic (karar), defaulting to the
  common keyboard-transposed tonic for that makam.
- Unit-test the tables: steps sum to an octave (53 commas), and known intervals are correct
  (e.g. Hicaz augmented second ≈ 12 commas).

### Rhythms (usul) — each is a data pattern (beats, accents, drum strokes)
Halay (2/4 and slow "ağır halay"), Govend / Delîlo (Kurdish), Çiftetelli (8/8), Karşılama (9/8 2+2+2+3),
Roman havası (9/8), Zeybek (9/4, slow), Horon (7/16 2+2+3), Bar (Erzurum), Kolbastı (2/4), Düz 4/4.
Drum voices to synthesize: **davul** (deep "düm" plus a thin "tek" stick), **darbuka** (düm / tek / ka),
**def**, **zil** (finger cymbals). Controls: start/stop, tempo (BPM), intro/fill button, and
volume balance between melody and rhythm.

### Instrument voices (synthesized)
Zurna (nasal double-reed, lively vibrato), Bağlama/Saz (plucked, Karplus-Strong), Klarnet,
Kaval/Ney (breathy flute), Kemençe (bowed), Org lead (the classic wedding-keyboard synth),
Akordeon. Each voice is a small module with a common interface (`noteOn(freq, vel)`,
`noteOff()`), so voices are easy to add.

## UI
- Large, touch-friendly keys. 2 octaves visible, with octave shift buttons. Landscape-first on phones.
- Top bar: instrument, makam/tonic, rhythm + tempo, start/stop, volume.
- QWERTY keyboard mapping on desktop.
- Visual theme: kilim / traditional textile motifs, warm reds, indigo and saffron; light and dark.
- UI languages: Türkçe (default), Kurmancî, English. Keep strings in an i18n dictionary.
- Show the app version (from package.json) in a corner of the UI.

## Release flow (CI/CD)
- `.github/workflows/ci.yml`: on push and pull_request, run npm ci, typecheck, lint, unit tests,
  build, and Playwright e2e.
- `.github/workflows/deploy.yml`: on push of tags `v*.*.*` (and workflow_dispatch). Run the full
  test suite first; only on success, build and deploy to GitHub Pages
  (`actions/upload-pages-artifact` + `actions/deploy-pages`, `permissions: pages: write, id-token: write`).
  Pages source is already set to "GitHub Actions".
- To release: `npm version patch|minor|major && git push --follow-tags`.
- Do NOT modify `claude.yml` or `claude-code-review.yml`.

## Conventions
- Work on a branch and open a PR to `main`. CI must be green before merging.
- Keep music data (makams, usuls, key maps) in `src/data/` as typed, tested tables, separate from audio code.

# kkey: project status and session handoff

This is the handoff log between Claude Code sessions (cloud and local). **Read it first**
(`resume` skill), and **update it at the end** of every session: current state, in-progress work,
and what comes next.

## Current state (2026-11-18)

- **Released:** v0.1.0, live at https://alekozamayan.github.io/kkey/ (deployed by `deploy.yml` from tag `v0.1.0`).
- `main` = merge of PR #2 (the whole v0.1.0 app). CI is green on chromium + webkit + iPhone.
- The spec in `CLAUDE.md` is fully implemented. Where things live:

| Area                                                 | Files                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| Tuning math, makams (53-TET), usuls, key map, i18n   | `src/data/*.ts`                                                |
| Engine (unlock, buses, reverb), drums, sequencer     | `src/audio/engine.ts`, `drums.ts`, `sequencer.ts`              |
| Voices (`SynthSpec` table + Karplus–Strong bağlama)  | `src/audio/voices/`                                            |
| App wiring, top bar, detune bar, QWERTY/MIDI         | `src/app.ts`                                                   |
| Multi-touch keyboard                                 | `src/ui/keyboard.ts`                                           |
| Settings persistence + validation                    | `src/state.ts`                                                 |
| Theme / compact phone layout                         | `src/styles.css` (`@media (max-height: 500px)`)                |
| Unit tests (85) / e2e (8 specs × 3 projects)         | `tests/unit`, `tests/e2e`                                      |
| Icons (regenerate: `node scripts/gen-icons.mjs`)     | `public/icons/`                                                |
| Screenshots for visual checks                        | `node scripts/screenshots.mjs <dir>` (needs `vite preview`)    |

## Claude Code project setup

- `CLAUDE.md`: the product spec (the source of requirements).
- `.claude/rules/*.md`: path-scoped conventions for music data, audio, UI/mobile, testing and CI/release.
- `.claude/skills/`: `resume`, `verify`, `release`, `add-makam`, `add-usul`, `add-voice`.
- `.claude/hooks/`: `session-start.sh` (npm ci + Playwright browsers in cloud sessions) and
  `protect-files.sh` (blocks changes to `claude.yml` / `claude-code-review.yml`, including running
  prettier --write over the whole repo or `.github`).

## Decisions made (and why)

- **Detune bar = cents per pitch class (12 values).** A makam preset maps each scale degree to the
  nearest 12-TET key and stores the offset in cents (e.g. Rast on C: E = −15). Keys outside the scale stay at 0.
  The user nudges a key by 1 koma (22.64¢) or ¼ tone.
- **Tuning is true AEU 53-TET**, not the "−50¢ quarter-tone" keyboard convention. Even "natural" degrees
  get small offsets (+4¢ for a 9-comma whole tone). The detune bar can reproduce the keyboard convention by hand.
- **Default tonics:** Rast C; Uşşak, Hicaz, Hümayun, Saba, Karcığar D; Kürdi, Hüseyni A; Nihavend G;
  Segah E; Düz C. The app starts on **Hicaz / Re** with **Halay** and the **Org** voice.
- **Tempo is always quarter-note BPM**, including 9/8 and 7/16 (horon 200, karşılama 130, zeybek 60).
- **Fills** are generated (`makeFill`: darbuka roll + davul on group starts). Intro = a fill bar before
  the pattern, and Fill while playing = a fill on the next bar.
- **Scale degrees are visible:** blue dot = in the makam, red dot = karar (tonic). Each key shows its cents offset.
- **Phone layout:** the top bar is one horizontally scrollable row, and the detune tools scroll too.
- Settings are saved in localStorage (`kkey.settings.v1`) and validated by `sanitize()`.

## Environment notes (learned the hard way)

- **Cloud sandbox:** it can push only its `claude/*` working branch. **Tag pushes get HTTP 403**, so the
  user pushes release tags locally. WebKit can't be downloaded there (Playwright CDN blocked), so run e2e
  with `--project=chromium` and let CI cover webkit/iphone. `@playwright/test` is pinned to 1.63.0 to
  match the preinstalled Chromium.
- **The local machine (`~/aiwork/claudework/kkey`)** has `gh` authenticated but **no Node** installed.
  Use `gh run watch` for CI and deploys; install Node 22 before running `npm` scripts there.
- The `github-pages` environment allows the `main` branch and `v*.*.*` tags (set 2026-11-18).
- Never format the whole repo or `.github` with prettier's write mode: it reformats the protected
  Claude workflow files. Format only the paths you changed.
- When running curl against the live site, always pass `-m 15`. A bare curl once hung for minutes.

## In progress

- Nothing. The next session can pick from the backlog.

## Backlog / ideas (not started)

1. **CI hygiene:** bump `actions/deploy-pages` and `actions/upload-artifact` once Node 24 builds are
   available (Node 20 deprecation warning). `ubuntu-latest` is moving to Ubuntu 26.
2. **Real-device check on iPhone:** silent-switch playback, Add to Home Screen full-screen, latency,
   and the double-tap guard. Nothing in CI can verify these.
3. **Hand-written fills** per usul (the current generic roll is functional but plain), plus 1–2
   pattern variations per usul (A/B, like arranger "variation" buttons).
4. **Accompaniment:** bass/chord (or drone) following the karar, as on arranger keyboards.
5. **More makams:** Muhayyer Kürdi, Hicazkar, Şehnaz, Suzinak, Çargah, Uzzal, Neva, Bayati (Arab-style
   quarter-tone preset). **More usuls:** Sirto, Hora, Kasap, Teke zortlatması, Laz barı.
   **More voices:** cümbüş/ud (plucked), kanun, mey, tulum, keman, string pad.
6. **Detune presets per user** (save/load custom tunings), and an optional "keyboard −50¢" mode.
7. Sustain/hold button and pitch-bend strip (touch), velocity from touch position.

## Releases

| Version | Date       | Notes                                                       |
| ------- | ---------- | ----------------------------------------------------------- |
| v0.1.0  | 2026-11-18 | First release: 11 makams, 11 usuls, 7 voices, PWA, CI/CD.   |

## Session log

- **2026-11-18 (cloud → local):** Built v0.1.0 (PR #2), merged it, tagged v0.1.0 from the local
  machine, verified the live deploy, and added the Claude project memory (rules, skills, hooks, this file).

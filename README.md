# kkey

A browser-based **oriental keyboard ("org")** for Turkish and Kurdish dance music (halay, govend,
çiftetelli, karşılama, horon, zeybek, roman havası…), with microtonal makam tuning, synthesized
regional instruments and usul rhythm accompaniment. It runs on iPhone Safari as an installable PWA.

**Live:** https://alekozamayan.github.io/kkey/ (on iPhone: Share → _Add to Home Screen_)

This project is implemented by AI for training purposes.

## Features

- **Makams**: Düz (12-TET), Rast, Uşşak, Hicaz, Hümayun, Kürdi, Nihavend, Saba, Hüseyni, Karcığar
  and Segah. Scales are stored as 53-TET Holdrian comma steps (`src/data/makams.ts`) and fill a
  12-note **detune bar** that you can nudge live by one koma or a quarter tone.
- **Usuls**: Halay, Ağır halay, Govend/Delîlo, Çiftetelli 8/8, Karşılama 9/8, Roman havası 9/8,
  Zeybek 9/4, Horon 7/16, Bar, Kolbastı and Düz 4/4. They are played on synthesized davul, darbuka,
  def and zil with a look-ahead scheduler. Controls: start/stop, tempo, intro/fill, and the balance
  between melody and rhythm.
- **Voices**: Org lead, Zurna, Bağlama/Saz (Karplus–Strong), Klarnet, Kaval/Ney, Kemençe, Akordeon.
  All are synthesized with the Web Audio API; the app ships no samples.
- Multi-touch keyboard with glissando, QWERTY input on desktop (Z-row / Q-row) and Web MIDI where
  available. UI in Türkçe, Kurmancî and English, with light and dark kilim themes.

## Development

```sh
npm ci
npm run dev        # http://localhost:5173/kkey/
npm run check      # typecheck + lint + unit tests
npm run build && npm run preview
npx playwright install --with-deps chromium webkit   # once
npm run test:e2e   # chromium, webkit, iPhone profile
```

## Releasing

Releases deploy automatically to GitHub Pages when a version tag is pushed:

```sh
git checkout main && git pull
npm version patch   # or minor / major; this bumps package.json and creates the vX.Y.Z tag
git push --follow-tags
```

`deploy.yml` runs the full test suite first and only builds and deploys if it passes.

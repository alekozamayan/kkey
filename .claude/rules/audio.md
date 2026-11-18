---
paths:
  - "src/audio/**"
---

# Audio rules (`src/audio/`)

- **Synthesis only.** No copyrighted samples. A sample may only be CC0/CC-BY, and it must be listed in
  `public/samples/LICENSES.md`.
- `AudioEngine.unlock()` must be called **synchronously inside a user gesture** (the click/pointerdown
  handler itself, not after an `await`). It sets `navigator.audioSession.type = 'playback'` (iOS silent
  switch), creates the context with `latencyHint: 'interactive'` and plays a 1-sample silent buffer.
- Rhythm timing goes **only** through `Sequencer` (look-ahead: `setInterval` + `ctx.currentTime`).
  Never schedule audio with raw `setTimeout`. The `setTimeout` in `engine.onBar` only drives UI lights.
  `Sequencer` takes injected `now`/`setInterval`, so keep it free of AudioContext and keep it unit-testable.
- Voices implement `Voice` (`voices/types.ts`): `noteOn(freq, vel, time?)`, `noteOff(time?)`,
  `glide(freq, time?)` and `legato`. Each noteOn creates a fresh node graph. `noteOff` must `stop()`
  every source after the release so nodes get garbage-collected.
  - Most voices are a declarative `SynthSpec` in `voices/index.ts` (`SynthVoice` builds the graph).
    Write a custom class only when the spec can't express the sound (e.g. `BaglamaVoice`, Karplus–Strong).
  - Keep pure DSP (like `karplus.ts`) in DOM-free functions so Vitest can test them.
- Buses: voices → `melodyBus` (+ reverb send); drums → `rhythmBus`; both → `master` → compressor.
  The balance uses an equal-power crossfade. Keep levels conservative (voice `level` ≈ 0.2–0.4).
- The cached noise buffer and PeriodicWaves are per-context (`WeakMap`). Don't allocate big buffers per note
  except Karplus–Strong, which is cached by frequency.

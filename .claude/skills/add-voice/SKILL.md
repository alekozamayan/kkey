---
name: add-voice
description: Add or tune a synthesized instrument voice in kkey (SynthSpec or custom Voice class, i18n, tests). Use when the user asks for a new instrument (e.g. cümbüş, ud, kanun, tulum, mey, violin, string pad) or says a voice sounds wrong.
---

# Add an instrument voice

1. Choose the model:
   - Sustained (wind, bowed, reed, synth): add a `SynthSpec` to `SPECS` in `src/audio/voices/index.ts`.
     It has oscillators (+ optional `harmonics`), a filter (a multiple of the note frequency unless
     `fixed`), formant peaks, ADSR, vibrato (rate/depth in cents/delay), tremolo, breath `noise`
     and `drive`.
   - Plucked/struck (ud, kanun, cümbüş): write a custom class like `BaglamaVoice` (Karplus–Strong via
     `karplus.ts`, cached per frequency). Set `legato = false`.
2. Add the id to `VoiceId` (`voices/types.ts`), `VOICE_IDS` and `VOICES`, plus `voice.<id>` labels in
   all three languages in `i18n.ts`.
3. Keep `level` so the voice sits around the existing ones (0.2–0.4). Its peak must not clip the compressor.
4. `noteOff` must stop every source node. A leak shows up as rising CPU over long sessions.
5. Tests:
   - The `i18n.test.ts` label test covers the new id.
   - The e2e test "every instrument plays without errors" expects the voice count. Update that number.
   - Put pure DSP helpers in their own module with a unit test (see `karplus.test.ts`).
6. Run `verify`. Then play on a phone-sized screen: fast runs, a held chord, and a glissando.

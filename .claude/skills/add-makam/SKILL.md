---
name: add-makam
description: Add or fix a makam preset in kkey (comma steps, default tonic, i18n, tests). Use when the user asks for a new makam (e.g. Muhayyer Kürdi, Şehnaz, Hicazkar, Suzinak, Çargah) or says a makam sounds wrong.
---

# Add a makam

1. Find the scale in AEU (Arel–Ezgi–Uzdilek) terms: a tetrachord + pentachord (or the reverse),
   written as comma steps. B=4, S=5, K=8, T=9, A=12. Tetrachords sum to 22 and pentachords to 31.
   Examples: Rast 9 8 5 9 9 8 5 · Hicaz 5 12 5 9 8 5 9 · Kürdi 4 9 9 9 4 9 9.
   If the makam's ascending and descending forms differ, use the ascending (seyir) form, and note the
   other in a comment.
2. Add the id to `MakamId` and an entry to `MAKAMS` in `src/data/makams.ts`, with a comment naming
   the çeşni/tetrachords. Use the usual keyboard-transposed tonic as `defaultTonic`.
3. If the display name needs translating, add `makam.<id>` to all three dictionaries in `src/data/i18n.ts`
   (by default `name` is shown as-is).
4. Tests in `tests/unit/makams.test.ts`:
   - The generic tests cover sum = 53 and 7 distinct keys automatically.
   - Add one test pinning a characteristic interval, for example the 2nd degree or the augmented second.
   - If its 4th/5th isn't 22/31 commas, extend the exceptions in the perfect-fifth test, with a comment explaining why.
5. Run the `verify` skill. Then check in the app that the detune bar shows the expected ± cents for the default tonic.

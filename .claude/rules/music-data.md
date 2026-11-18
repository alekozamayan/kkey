---
paths:
  - "src/data/**"
  - "tests/unit/makams.test.ts"
  - "tests/unit/usuls.test.ts"
  - "tests/unit/keymap.test.ts"
---

# Music data rules (`src/data/`)

- `src/data/` holds **pure, typed tables and math only**. No Web Audio, no DOM. Unit tests import these files in Node.
- **Makams** (`makams.ts`): each scale is exactly 7 step sizes in Holdrian commas and must sum to **53**.
  Use the AEU interval names: B=4, S=5, K=8, T=9, A=12 (13 allowed). Cents are always *derived*
  (`commasToCents`), never stored. `steps: null` means 12-TET (Düz only).
  - The 7 degrees must map to 7 **distinct** keyboard pitch classes for every tonic; a test enforces this.
  - `defaultTonic` = the tonic oriental-keyboard players usually transpose that makam to (0 = C).
  - Perfect 4th = 22 commas, perfect 5th = 31. Known exceptions in tests: Saba (4th = 18, 5th = 30),
    Karcığar (5th = 27), Segah (4th = 23 because its karar is koma-flat).
- **Usuls** (`usuls.ts`): one string per drum, one char per step. `.` is a rest, lowercase is a normal
  stroke and UPPERCASE is an accent. Letters: davul `d`/`t`, darbuka `d`/`t`/`k`, def `d`/`t`, zil `x`.
  - `stepsPerBar = meter[0] * stepUnit / meter[1]`. Every track must have exactly that length.
  - `grouping` (in meter beat units) sums to `meter[0]`. Group starts must land on integer steps.
  - The lead track (davul, or else darbuka) starts with `D`.
  - `defaultBpm` is in **quarter notes per minute** for every usul, including 9/8 and 7/16.
  - Fills come from `makeFill()` unless the usul gives a hand-written `fill`.
- **Key map** (`keymap.ts`): map by `KeyboardEvent.code` (layout independent). Offsets are 0…24 from the lowest visible C.
- **i18n** (`i18n.ts`): every new makam/usul/voice id needs `makam.*` / `usul.*` / `voice.*` labels
  in **all three** languages (tr, ku, en). `i18n.test.ts` fails otherwise. Turkish is the source dictionary;
  `MessageKey` is derived from it.
- Any table change needs a unit test that pins at least one musically known value.

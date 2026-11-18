---
name: add-usul
description: Add or adjust a rhythm (usul) pattern in kkey: meter, grouping, drum strings, tempo, i18n and tests. Use when the user asks for a new rhythm (e.g. Sirto, Hora, Teke zortlatması, Kasap, Laz barı) or says a rhythm feels wrong.
---

# Add an usul

1. Write down the meter, the grouping (e.g. 9/8 = 2+2+2+3) and the step resolution (`stepUnit`, usually 16).
   `stepsPerBar = meter[0] * stepUnit / meter[1]`.
2. Write one string per drum in `src/data/usuls.ts`, one char per step:
   - davul: `D`/`d` = düm, `T`/`t` = tek stick
   - darbuka: `d`/`t`/`k` (düm/tek/ka)
   - def: `d`/`t`
   - zil: `x`
   - `.` is a rest, and uppercase = accent.

   Put accents on the group starts. The lead track starts with `D`. Leave space: wedding grooves
   breathe, and a full grid sounds mechanical.
3. `defaultBpm` is in **quarter notes per minute**, even for x/8 and x/16 meters. Example: horon 7/16 at 200 ≈ 0.53 s per bar.
4. Optionally add a hand-written `fill` (same lengths). Otherwise `makeFill()` generates one.
5. Add the id to `UsulId`, and add `usul.<id>` labels (with the meter, e.g. "Sirto 2/4") to tr, ku and en in `i18n.ts`.
6. Tests in `tests/unit/usuls.test.ts`:
   - The generic tests check lengths, characters, grouping and the fill.
   - Add a meter/grouping assertion for the new id.
7. Run `verify`. Then listen at the default tempo, with Intro/Fill too.

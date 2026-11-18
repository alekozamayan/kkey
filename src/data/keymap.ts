/**
 * Desktop QWERTY mapping (by KeyboardEvent.code, so it is layout independent:
 * works the same on Turkish Q, US, German… keyboards).
 * Values are semitone offsets from the lowest visible C.
 */
export const KEY_MAP: Readonly<Record<string, number>> = {
  // Lower octave: Z-row = white keys, A-row = black keys
  KeyZ: 0,
  KeyS: 1,
  KeyX: 2,
  KeyD: 3,
  KeyC: 4,
  KeyV: 5,
  KeyG: 6,
  KeyB: 7,
  KeyH: 8,
  KeyN: 9,
  KeyJ: 10,
  KeyM: 11,
  Comma: 12,
  KeyL: 13,
  Period: 14,
  Semicolon: 15,
  Slash: 16,
  // Upper octave: Q-row = white keys, number row = black keys
  KeyQ: 12,
  Digit2: 13,
  KeyW: 14,
  Digit3: 15,
  KeyE: 16,
  KeyR: 17,
  Digit5: 18,
  KeyT: 19,
  Digit6: 20,
  KeyY: 21,
  Digit7: 22,
  KeyU: 23,
  KeyI: 24,
};

/** Number of keys on the on-screen keyboard (2 octaves + top C). */
export const VISIBLE_KEYS = 25;

export const BLACK_PITCH_CLASSES: ReadonlySet<number> = new Set([1, 3, 6, 8, 10]);

export function isBlack(pc: number): boolean {
  return BLACK_PITCH_CLASSES.has(((pc % 12) + 12) % 12);
}

export const MIN_OCTAVE = 1;
export const MAX_OCTAVE = 6;
export const DEFAULT_OCTAVE = 4;

/** MIDI note of the lowest visible C for an octave number (C4 = 60). */
export function baseMidi(octave: number): number {
  return (octave + 1) * 12;
}

export function keyToMidi(code: string, octave: number): number | undefined {
  const off = KEY_MAP[code];
  return off === undefined ? undefined : baseMidi(octave) + off;
}

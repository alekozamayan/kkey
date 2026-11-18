import { describe, expect, it } from 'vitest';
import { baseMidi, isBlack, KEY_MAP, keyToMidi, VISIBLE_KEYS } from '../../src/data/keymap';

describe('QWERTY key map', () => {
  it('maps every key inside the visible range', () => {
    for (const off of Object.values(KEY_MAP)) {
      expect(off).toBeGreaterThanOrEqual(0);
      expect(off).toBeLessThan(VISIBLE_KEYS);
    }
  });

  it('covers both visible octaves chromatically', () => {
    const covered = new Set(Object.values(KEY_MAP));
    for (let i = 0; i < VISIBLE_KEYS; i++) expect(covered.has(i)).toBe(true);
  });

  it('lower row: Z-row white keys, A-row black keys', () => {
    const whites = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'];
    for (const c of whites) expect(isBlack(KEY_MAP[c] ?? -1)).toBe(false);
    for (const c of ['KeyS', 'KeyD', 'KeyG', 'KeyH', 'KeyJ'])
      expect(isBlack(KEY_MAP[c] ?? -1)).toBe(true);
  });

  it('upper row: Q-row white, number row black', () => {
    for (const c of ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI'])
      expect(isBlack(KEY_MAP[c] ?? -1)).toBe(false);
    for (const c of ['Digit2', 'Digit3', 'Digit5', 'Digit6', 'Digit7'])
      expect(isBlack(KEY_MAP[c] ?? -1)).toBe(true);
  });

  it('converts to MIDI notes by octave', () => {
    expect(baseMidi(4)).toBe(60);
    expect(keyToMidi('KeyZ', 4)).toBe(60);
    expect(keyToMidi('KeyQ', 4)).toBe(72);
    expect(keyToMidi('KeyI', 3)).toBe(72);
    expect(keyToMidi('Enter', 4)).toBeUndefined();
  });
});

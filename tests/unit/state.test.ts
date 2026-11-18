import { describe, expect, it } from 'vitest';
import { defaultState, sanitize } from '../../src/state';

describe('settings sanitizer', () => {
  it('returns defaults for garbage', () => {
    expect(sanitize(null)).toEqual(defaultState());
    expect(sanitize('x')).toEqual(defaultState());
  });

  it('keeps valid values and clamps / drops invalid ones', () => {
    const s = sanitize({
      lang: 'ku',
      voice: 'zurna',
      makam: 'rast',
      tonic: 99,
      usul: 'horon',
      bpm: 9999,
      volume: -3,
      detune: [1, 2, 3],
      theme: 'neon',
    });
    expect(s.lang).toBe('ku');
    expect(s.voice).toBe('zurna');
    expect(s.makam).toBe('rast');
    expect(s.tonic).toBe(11);
    expect(s.usul).toBe('horon');
    expect(s.bpm).toBe(320);
    expect(s.volume).toBe(0);
    expect(s.detune).toHaveLength(12);
    expect(s.theme).toBe('auto');
  });
});

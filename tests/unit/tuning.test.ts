import { describe, expect, it } from 'vitest';
import {
  centsToCommas,
  commasToCents,
  flatDetune,
  KOMA_CENTS,
  midiToFreq,
  pitchClass,
  tunedFreq,
} from '../../src/data/tuning';

describe('tuning math', () => {
  it('one koma is ~22.64 cents', () => {
    expect(KOMA_CENTS).toBeCloseTo(22.6415, 3);
    expect(commasToCents(53)).toBeCloseTo(1200, 9);
    expect(centsToCommas(1200)).toBeCloseTo(53, 9);
  });

  it('A4 = 440 Hz and octaves double', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 9);
    expect(midiToFreq(81)).toBeCloseTo(880, 9);
    expect(midiToFreq(60)).toBeCloseTo(261.6256, 3);
  });

  it('detune in cents shifts frequency', () => {
    expect(midiToFreq(69, 100)).toBeCloseTo(midiToFreq(70), 9);
    expect(midiToFreq(69, -50)).toBeCloseTo(440 * 2 ** (-0.5 / 12), 9);
  });

  it('pitch class handles negatives', () => {
    expect(pitchClass(60)).toBe(0);
    expect(pitchClass(-1)).toBe(11);
  });

  it('tunedFreq applies the detune bar by pitch class', () => {
    const bar = flatDetune();
    bar[4] = -50; // E quarter-flat
    expect(tunedFreq(64, bar)).toBeCloseTo(midiToFreq(64, -50), 9);
    expect(tunedFreq(76, bar)).toBeCloseTo(midiToFreq(76, -50), 9);
    expect(tunedFreq(65, bar)).toBeCloseTo(midiToFreq(65), 9);
  });
});

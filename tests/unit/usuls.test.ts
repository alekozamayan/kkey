import { describe, expect, it } from 'vitest';
import {
  compileTracks,
  DRUMS,
  getUsul,
  groupStarts,
  makeFill,
  parseTrack,
  stepDuration,
  stepsPerBar,
  STROKE_CHARS,
  USULS,
} from '../../src/data/usuls';

const REQUIRED = [
  'halay',
  'agirHalay',
  'govend',
  'ciftetelli',
  'karsilama',
  'roman',
  'zeybek',
  'horon',
  'bar',
  'kolbasti',
  'duz',
];

describe('usul patterns', () => {
  it('includes every required rhythm', () => {
    for (const id of REQUIRED) expect(() => getUsul(id)).not.toThrow();
    expect(new Set(USULS.map((u) => u.id)).size).toBe(USULS.length);
  });

  it.each(USULS.map((u) => [u.id, u] as const))('%s is well-formed', (_id, u) => {
    const n = stepsPerBar(u);
    expect(Number.isInteger(n)).toBe(true);
    expect(u.grouping.reduce((a, b) => a + b, 0)).toBe(u.meter[0]);
    for (const s of groupStarts(u)) expect(Number.isInteger(s)).toBe(true);
    const tracks = Object.entries(u.tracks);
    expect(tracks.length).toBeGreaterThan(0);
    for (const [drum, pattern] of tracks) {
      expect(DRUMS).toContain(drum);
      expect(pattern).toHaveLength(n);
      const allowed = new Set([
        '.',
        ...Object.keys(STROKE_CHARS[drum as keyof typeof STROKE_CHARS]),
      ]);
      for (const ch of pattern ?? '') expect(allowed).toContain(ch.toLowerCase());
    }
    // The bar starts with an accented düm.
    const lead = u.tracks.davul ?? u.tracks.darbuka ?? '';
    expect(lead[0]).toBe('D');
    expect(u.defaultBpm).toBeGreaterThanOrEqual(40);
    expect(u.defaultBpm).toBeLessThanOrEqual(240);
  });

  it('uses the right meters and groupings', () => {
    expect(getUsul('karsilama').meter).toEqual([9, 8]);
    expect(getUsul('karsilama').grouping).toEqual([2, 2, 2, 3]);
    expect(getUsul('roman').meter).toEqual([9, 8]);
    expect(getUsul('zeybek').meter).toEqual([9, 4]);
    expect(getUsul('horon').meter).toEqual([7, 16]);
    expect(getUsul('horon').grouping).toEqual([2, 2, 3]);
    expect(getUsul('ciftetelli').meter).toEqual([8, 8]);
    expect(getUsul('halay').meter).toEqual([2, 4]);
    expect(getUsul('kolbasti').meter).toEqual([2, 4]);
    expect(getUsul('duz').meter).toEqual([4, 4]);
    expect(getUsul('agirHalay').defaultBpm).toBeLessThan(getUsul('halay').defaultBpm);
  });

  it('karşılama groups start on steps 0,4,8,12 of 18', () => {
    const u = getUsul('karsilama');
    expect(stepsPerBar(u)).toBe(18);
    expect(groupStarts(u)).toEqual([0, 4, 8, 12]);
  });

  it('horon is 7 sixteenths', () => {
    const u = getUsul('horon');
    expect(stepsPerBar(u)).toBe(7);
    expect(stepDuration(u, 120)).toBeCloseTo(0.125, 9);
  });

  it('parses strokes and accents', () => {
    expect(parseTrack('darbuka', 'D.tK')).toEqual([
      { step: 0, drum: 'darbuka', stroke: 'dum', accent: true },
      { step: 2, drum: 'darbuka', stroke: 'tek', accent: false },
      { step: 3, drum: 'darbuka', stroke: 'ka', accent: true },
    ]);
    expect(() => parseTrack('zil', 'd')).toThrow();
  });

  it('compiles tracks by step', () => {
    const byStep = compileTracks({ davul: 'D.t.', zil: 'x...' }, 4);
    expect(byStep[0]).toHaveLength(2);
    expect(byStep[1]).toHaveLength(0);
    expect(byStep[2]?.[0]?.stroke).toBe('tek');
  });

  it.each(USULS.map((u) => [u.id, u] as const))('%s fill is a valid bar', (_id, u) => {
    const fill = makeFill(u);
    const n = stepsPerBar(u);
    for (const [drum, p] of Object.entries(fill)) {
      expect(p).toHaveLength(n);
      expect(() => parseTrack(drum as 'davul', p ?? '')).not.toThrow();
    }
  });
});

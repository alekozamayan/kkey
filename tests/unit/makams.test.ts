import { describe, expect, it } from 'vitest';
import {
  degreeCommas,
  getMakam,
  makamDetune,
  makamScale,
  MAKAMS,
  totalCommas,
} from '../../src/data/makams';
import { COMMAS_PER_OCTAVE, KOMA_CENTS } from '../../src/data/tuning';

const REQUIRED = [
  'rast',
  'ussak',
  'hicaz',
  'humayun',
  'kurdi',
  'nihavend',
  'saba',
  'huseyni',
  'karcigar',
  'segah',
  'duz',
];

const microtonal = MAKAMS.filter((m) => m.steps);

describe('makam tables', () => {
  it('includes every required makam', () => {
    for (const id of REQUIRED) expect(() => getMakam(id)).not.toThrow();
  });

  it('ids are unique', () => {
    expect(new Set(MAKAMS.map((m) => m.id)).size).toBe(MAKAMS.length);
  });

  it.each(microtonal.map((m) => [m.name, m] as const))('%s steps sum to 53 commas', (_n, m) => {
    expect(m.steps).toHaveLength(7);
    expect(totalCommas(m)).toBe(COMMAS_PER_OCTAVE);
    for (const s of m.steps ?? []) expect([4, 5, 8, 9, 12, 13]).toContain(s);
  });

  it.each(microtonal.map((m) => [m.name, m] as const))(
    '%s maps 7 degrees to 7 distinct keyboard keys',
    (_n, m) => {
      for (let tonic = 0; tonic < 12; tonic++) {
        const pcs = makamScale(m, tonic).map((d) => d.pitchClass);
        expect(new Set(pcs).size).toBe(7);
      }
    },
  );

  it('has a perfect fifth (31 commas) above the tonic, except Karcığar/Saba', () => {
    for (const m of microtonal) {
      const c = degreeCommas(m);
      if (m.id === 'karcigar') expect(c[4]).toBe(27);
      else if (m.id === 'saba') expect(c[4]).toBe(30);
      else expect(c[4]).toBe(31);
      // Perfect fourth = 22 commas; Saba has a diminished 4th, Segah (on a koma-flat karar) 23.
      expect(c[3]).toBe(m.id === 'saba' ? 18 : m.id === 'segah' ? 23 : 22);
    }
  });

  it('Hicaz has an augmented second of 12 commas between 2nd and 3rd degree', () => {
    const h = getMakam('hicaz');
    expect(h.steps?.[1]).toBe(12);
    const c = degreeCommas(h);
    expect((c[2] ?? 0) - (c[1] ?? 0)).toBe(12);
    expect(12 * KOMA_CENTS).toBeCloseTo(271.7, 1);
    expect(getMakam('humayun').steps?.[1]).toBe(12);
  });

  it('Rast segah is a koma-flat third (17 commas ≈ 385 cents)', () => {
    const [, , third] = makamScale(getMakam('rast'), 0);
    expect(third?.commas).toBe(17);
    expect(third?.cents).toBeCloseTo(384.9, 1);
    expect(third?.pitchClass).toBe(4); // E
    expect(third?.offsetCents).toBeCloseTo(-15.1, 1);
  });

  it('Uşşak second degree is 8 commas (between a semitone and a tone)', () => {
    const c = degreeCommas(getMakam('ussak'));
    expect(c[1]).toBe(8);
  });

  it('Kürdi second degree is a bakiye (4 commas ≈ 90.6 cents)', () => {
    const [, second] = makamScale(getMakam('kurdi'), 9);
    expect(second?.cents).toBeCloseTo(90.6, 1);
    expect(second?.pitchClass).toBe(10); // B♭ above A
  });

  it('Hicaz on D detunes the right keys', () => {
    const bar = makamDetune(getMakam('hicaz'), 2);
    // D, E♭(+13), F♯(-15), G, A, B(-17), C
    expect(bar[2]).toBeCloseTo(0, 9);
    expect(bar[3]).toBeCloseTo(5 * KOMA_CENTS - 100, 6);
    expect(bar[6]).toBeCloseTo(17 * KOMA_CENTS - 400, 6);
    expect(bar[11]).toBeCloseTo(39 * KOMA_CENTS - 900, 6);
    // Out-of-scale keys stay equal-tempered.
    expect(bar[4]).toBe(0);
    expect(bar[1]).toBe(0);
  });

  it('Düz is plain 12-TET', () => {
    const d = getMakam('duz');
    expect(d.steps).toBeNull();
    expect(makamDetune(d, 0).every((x) => x === 0)).toBe(true);
  });

  it('every offset is within a quarter-tone-ish range', () => {
    for (const m of microtonal)
      for (let tonic = 0; tonic < 12; tonic++)
        for (const v of makamDetune(m, tonic)) expect(Math.abs(v)).toBeLessThanOrEqual(50);
  });
});

import { describe, expect, it } from 'vitest';
import { karplusStrong } from '../../src/audio/voices/karplus';

describe('Karplus–Strong', () => {
  it('produces a decaying, periodic signal', () => {
    const sr = 44100;
    const f = 220;
    const out = karplusStrong(f, sr, 1);
    expect(out.length).toBe(sr);
    const rms = (a: Float32Array, from: number, to: number) => {
      let s = 0;
      for (let i = from; i < to; i++) s += (a[i] ?? 0) ** 2;
      return Math.sqrt(s / (to - from));
    };
    const early = rms(out, 0, 2000);
    const late = rms(out, sr - 2000, sr);
    expect(early).toBeGreaterThan(0.01);
    expect(late).toBeLessThan(early);
    // Autocorrelation peaks at the period.
    const period = Math.round(sr / f);
    let corr = 0;
    let norm = 0;
    for (let i = 4000; i < 8000; i++) {
      corr += (out[i] ?? 0) * (out[i + period] ?? 0);
      norm += (out[i] ?? 0) ** 2;
    }
    expect(corr / norm).toBeGreaterThan(0.9);
  });

  it('is deterministic for a seed', () => {
    expect(karplusStrong(330, 8000, 0.1, { seed: 7 })).toEqual(
      karplusStrong(330, 8000, 0.1, { seed: 7 }),
    );
  });
});

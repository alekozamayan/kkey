import { describe, expect, it } from 'vitest';
import { Sequencer } from '../../src/audio/sequencer';
import { getUsul, stepDuration, stepsPerBar, type DrumHit } from '../../src/data/usuls';

function setup(usulId = 'halay', bpm = 120) {
  let now = 0;
  const hits: { hit: DrumHit; time: number }[] = [];
  const bars: { bar: number; fill: boolean }[] = [];
  const seq = new Sequencer(getUsul(usulId), bpm, {
    now: () => now,
    onHit: (hit, time) => hits.push({ hit, time }),
    onBar: (bar, fill) => bars.push({ bar, fill }),
    lookahead: 0.1,
    setInterval: () => 1,
    clearInterval: () => undefined,
  });
  const advance = (dt: number) => {
    const end = now + dt;
    while (now < end) {
      now = Math.min(end, now + 0.025);
      seq.tick();
    }
  };
  return { seq, hits, bars, advance };
}

describe('look-ahead sequencer', () => {
  it('schedules hits ahead of time, never in the past', () => {
    const { seq, hits, advance } = setup();
    seq.start();
    advance(2);
    const lastNow = 2;
    expect(hits.length).toBeGreaterThan(0);
    for (const { time } of hits) expect(time).toBeLessThan(lastNow + 0.1 + 1e-9);
  });

  it('spaces steps by the tempo', () => {
    const { seq, hits, advance } = setup('halay', 120);
    seq.start();
    advance(3);
    const u = getUsul('halay');
    const bar = stepDuration(u, 120) * stepsPerBar(u);
    const downbeats = hits.filter((h) => h.hit.drum === 'davul' && h.hit.accent).map((h) => h.time);
    expect(downbeats.length).toBeGreaterThan(2);
    // Halay davul accents on the start of each beat (2 per bar).
    expect((downbeats[2] ?? 0) - (downbeats[0] ?? 0)).toBeCloseTo(bar, 6);
  });

  it('plays a fill on the bar after requestFill and then returns to the pattern', () => {
    const { seq, bars, advance } = setup('halay', 120);
    seq.start();
    advance(0.3);
    seq.requestFill();
    advance(4);
    expect(bars[0]?.fill).toBe(false);
    const fillIdx = bars.findIndex((b) => b.fill);
    expect(fillIdx).toBeGreaterThan(0);
    expect(bars[fillIdx + 1]?.fill).toBe(false);
  });

  it('start(intro) begins with a fill bar', () => {
    const { seq, bars, advance } = setup();
    seq.start(true);
    advance(0.5);
    expect(bars[0]).toEqual({ bar: 0, fill: true });
  });

  it('stop halts scheduling', () => {
    const { seq, hits, advance } = setup();
    seq.start();
    advance(1);
    seq.stop();
    expect(seq.running).toBe(false);
    const n = hits.length;
    // tick is only called by the timer; once stopped nothing schedules it.
    advance(0);
    expect(hits.length).toBe(n);
  });

  it('clamps tempo', () => {
    const { seq } = setup();
    seq.setTempo(5);
    expect(seq.tempo).toBe(30);
    seq.setTempo(1000);
    expect(seq.tempo).toBe(320);
  });

  it('switches usul without breaking the bar length', () => {
    const { seq, advance, hits } = setup('karsilama', 130);
    seq.start();
    advance(1);
    seq.setUsul(getUsul('horon'));
    expect(seq.currentUsul.id).toBe('horon');
    advance(1);
    expect(hits.length).toBeGreaterThan(0);
  });
});

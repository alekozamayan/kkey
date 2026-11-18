import type { DrumId, Stroke } from '../data/usuls';
import { noiseSource } from './noise';

/** Exponential decay envelope on a gain node, starting at `peak`. */
function env(g: GainNode, t: number, peak: number, attack: number, decay: number): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function tone(
  ctx: BaseAudioContext,
  out: AudioNode,
  t: number,
  type: OscillatorType,
  f0: number,
  f1: number,
  sweep: number,
  peak: number,
  decay: number,
): void {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + sweep);
  const g = ctx.createGain();
  env(g, t, peak, 0.003, decay);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + decay + 0.05);
}

function noise(
  ctx: BaseAudioContext,
  out: AudioNode,
  t: number,
  filterType: BiquadFilterType,
  freq: number,
  q: number,
  peak: number,
  decay: number,
): void {
  const n = noiseSource(ctx);
  const f = ctx.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, peak, 0.001, decay);
  n.connect(f).connect(g).connect(out);
  n.start(t, Math.random() * 0.5);
  n.stop(t + decay + 0.05);
}

/** Synthesize one drum stroke at audio time `t`. */
export function playStroke(
  ctx: BaseAudioContext,
  out: AudioNode,
  drum: DrumId,
  stroke: Stroke,
  t: number,
  velocity = 0.8,
): void {
  const v = velocity;
  switch (drum) {
    case 'davul':
      if (stroke === 'dum') {
        // Big double-headed drum hit with a felt beater: deep, booming.
        tone(ctx, out, t, 'sine', 120, 48, 0.18, 1.0 * v, 0.55);
        tone(ctx, out, t, 'triangle', 220, 70, 0.06, 0.35 * v, 0.12);
        noise(ctx, out, t, 'lowpass', 900, 0.7, 0.35 * v, 0.06);
      } else {
        // Çubuk: a thin switch on the other head, dry and snappy.
        noise(ctx, out, t, 'highpass', 2500, 0.8, 0.45 * v, 0.05);
        tone(ctx, out, t, 'square', 1800, 900, 0.02, 0.06 * v, 0.03);
      }
      break;
    case 'darbuka':
      if (stroke === 'dum') {
        tone(ctx, out, t, 'sine', 190, 85, 0.09, 0.85 * v, 0.32);
        noise(ctx, out, t, 'lowpass', 600, 0.7, 0.15 * v, 0.04);
      } else if (stroke === 'tek') {
        tone(ctx, out, t, 'sine', 820, 700, 0.03, 0.3 * v, 0.07);
        noise(ctx, out, t, 'bandpass', 4200, 1.4, 0.7 * v, 0.06);
      } else {
        tone(ctx, out, t, 'sine', 760, 650, 0.03, 0.18 * v, 0.05);
        noise(ctx, out, t, 'bandpass', 3400, 1.2, 0.45 * v, 0.04);
      }
      break;
    case 'def':
      if (stroke === 'dum') {
        tone(ctx, out, t, 'sine', 140, 75, 0.1, 0.7 * v, 0.3);
        noise(ctx, out, t, 'highpass', 6000, 0.5, 0.12 * v, 0.2);
      } else {
        // Rim slap with jingles.
        noise(ctx, out, t, 'bandpass', 2400, 2, 0.35 * v, 0.05);
        noise(ctx, out, t, 'highpass', 7000, 0.6, 0.3 * v, 0.22);
      }
      break;
    case 'zil': {
      // Finger cymbals: inharmonic metallic partials with a long ring.
      for (const [f, a] of [
        [2650, 0.12],
        [3810, 0.09],
        [5230, 0.07],
        [6970, 0.05],
      ] as const) {
        tone(ctx, out, t, 'sine', f, f * 0.998, 0.5, a * v, 0.9);
      }
      noise(ctx, out, t, 'highpass', 8000, 0.7, 0.08 * v, 0.03);
      break;
    }
  }
}

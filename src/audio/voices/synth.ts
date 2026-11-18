import { noiseSource } from '../noise';
import type { Voice } from './types';

export interface OscSpec {
  type: OscillatorType;
  /** Frequency multiplier (1 = fundamental, 2 = octave up). */
  ratio?: number;
  detune?: number;
  gain: number;
  /** Custom harmonic amplitudes (overrides `type`). */
  harmonics?: readonly number[];
}

export interface SynthSpec {
  oscs: readonly OscSpec[];
  /** Main filter; `freq` is a multiple of the note frequency unless `fixed`. */
  filter?: { type: BiquadFilterType; freq: number; q: number; fixed?: boolean; envAmount?: number };
  /** Optional formant (peaking) filters, fixed frequencies. */
  formants?: readonly { freq: number; q: number; gain: number }[];
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  vibrato?: { rate: number; depth: number; delay: number };
  tremolo?: { rate: number; depth: number };
  /** Breath / bow noise mixed in, band-passed around the note. */
  noise?: { gain: number; q: number; ratio: number };
  /** Soft-clipping drive amount (0 = clean). */
  drive?: number;
  glideTime?: number;
  legato?: boolean;
  level?: number;
}

const waveCache = new WeakMap<BaseAudioContext, Map<string, PeriodicWave>>();

function periodicWave(ctx: BaseAudioContext, harmonics: readonly number[]): PeriodicWave {
  let m = waveCache.get(ctx);
  if (!m) waveCache.set(ctx, (m = new Map()));
  const key = harmonics.join(',');
  let w = m.get(key);
  if (!w) {
    const real = new Float32Array(harmonics.length + 1);
    const imag = new Float32Array(harmonics.length + 1);
    harmonics.forEach((a, i) => (imag[i + 1] = a));
    w = ctx.createPeriodicWave(real, imag);
    m.set(key, w);
  }
  return w;
}

const curveCache = new Map<number, Float32Array<ArrayBuffer>>();
function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  let c = curveCache.get(amount);
  if (!c) {
    c = new Float32Array(1024);
    const k = amount * 10;
    for (let i = 0; i < c.length; i++) {
      const x = (i / (c.length - 1)) * 2 - 1;
      c[i] = Math.tanh(x * (1 + k)) / Math.tanh(1 + k);
    }
    curveCache.set(amount, c);
  }
  return c;
}

/** A subtractive-synthesis voice built from a declarative spec. */
export class SynthVoice implements Voice {
  private oscs: OscillatorNode[] = [];
  private sources: AudioScheduledSourceNode[] = [];
  private amp: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private stopped = false;

  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly out: AudioNode,
    private readonly spec: SynthSpec,
  ) {}

  get legato(): boolean {
    return this.spec.legato ?? true;
  }

  noteOn(freq: number, velocity: number, time = this.ctx.currentTime): void {
    const { ctx, spec } = this;
    const t = time;
    const level = (spec.level ?? 0.3) * (0.35 + 0.65 * velocity);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(level, t + spec.attack);
    amp.gain.setTargetAtTime(level * spec.sustain, t + spec.attack, spec.decay / 3 + 0.001);
    this.amp = amp;

    const chainIn: AudioNode = amp;
    let node: AudioNode = amp;
    if (spec.drive) {
      const ws = ctx.createWaveShaper();
      ws.curve = driveCurve(spec.drive);
      ws.oversample = '2x';
      node.connect(ws);
      node = ws;
    }
    if (spec.filter) {
      const f = ctx.createBiquadFilter();
      f.type = spec.filter.type;
      f.Q.value = spec.filter.q;
      const base = spec.filter.fixed ? spec.filter.freq : spec.filter.freq * freq;
      const cap = ctx.sampleRate / 2 - 100;
      if (spec.filter.envAmount) {
        f.frequency.setValueAtTime(Math.min(cap, base * (1 + spec.filter.envAmount)), t);
        f.frequency.setTargetAtTime(Math.min(cap, base), t + 0.01, 0.15);
      } else {
        f.frequency.setValueAtTime(Math.min(cap, base), t);
      }
      node.connect(f);
      node = f;
      this.filter = f;
    }
    for (const fm of spec.formants ?? []) {
      const p = ctx.createBiquadFilter();
      p.type = 'peaking';
      p.frequency.value = fm.freq;
      p.Q.value = fm.q;
      p.gain.value = fm.gain;
      node.connect(p);
      node = p;
    }
    if (spec.tremolo) {
      const trem = ctx.createGain();
      trem.gain.value = 1 - spec.tremolo.depth / 2;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = spec.tremolo.rate;
      const lg = ctx.createGain();
      lg.gain.value = spec.tremolo.depth / 2;
      lfo.connect(lg).connect(trem.gain);
      lfo.start(t);
      this.sources.push(lfo);
      node.connect(trem);
      node = trem;
    }
    node.connect(this.out);

    // Vibrato LFO → oscillator detune (in cents), fading in after `delay`.
    let vibGain: GainNode | null = null;
    if (spec.vibrato) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = spec.vibrato.rate;
      vibGain = ctx.createGain();
      vibGain.gain.setValueAtTime(0, t);
      vibGain.gain.linearRampToValueAtTime(spec.vibrato.depth, t + spec.vibrato.delay + 0.25);
      lfo.connect(vibGain);
      lfo.start(t);
      this.sources.push(lfo);
    }

    for (const o of spec.oscs) {
      const osc = ctx.createOscillator();
      if (o.harmonics) osc.setPeriodicWave(periodicWave(ctx, o.harmonics));
      else osc.type = o.type;
      osc.frequency.setValueAtTime(freq * (o.ratio ?? 1), t);
      osc.detune.value = o.detune ?? 0;
      if (vibGain) vibGain.connect(osc.detune);
      const g = ctx.createGain();
      g.gain.value = o.gain;
      osc.connect(g).connect(chainIn);
      osc.start(t);
      this.oscs.push(osc);
      this.sources.push(osc);
    }

    if (spec.noise) {
      const n = noiseSource(ctx, true);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq * spec.noise.ratio;
      bp.Q.value = spec.noise.q;
      const g = ctx.createGain();
      g.gain.value = spec.noise.gain;
      n.connect(bp).connect(g).connect(chainIn);
      n.start(t);
      this.sources.push(n);
      this.noiseFilter = bp;
    }
  }

  glide(freq: number, time = this.ctx.currentTime): void {
    const gt = this.spec.glideTime ?? 0.04;
    this.spec.oscs.forEach((o, i) => {
      const osc = this.oscs[i];
      if (!osc) return;
      osc.frequency.cancelScheduledValues(time);
      osc.frequency.setTargetAtTime(freq * (o.ratio ?? 1), time, gt);
    });
    if (this.filter && this.spec.filter && !this.spec.filter.fixed) {
      const cap = this.ctx.sampleRate / 2 - 100;
      this.filter.frequency.cancelScheduledValues(time);
      this.filter.frequency.setTargetAtTime(Math.min(cap, this.spec.filter.freq * freq), time, gt);
    }
    this.noiseFilter?.frequency.setTargetAtTime(freq * (this.spec.noise?.ratio ?? 1), time, gt);
  }

  noteOff(time = this.ctx.currentTime): void {
    if (this.stopped || !this.amp) return;
    this.stopped = true;
    const r = this.spec.release;
    const g = this.amp.gain;
    g.cancelScheduledValues(time);
    g.setValueAtTime(g.value, time);
    g.setTargetAtTime(0, time, r / 4 + 0.001);
    for (const s of this.sources) s.stop(time + r + 0.1);
  }
}

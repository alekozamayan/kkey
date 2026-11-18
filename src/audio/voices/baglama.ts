import { karplusStrong } from './karplus';
import type { Voice } from './types';

const cache = new WeakMap<BaseAudioContext, Map<number, AudioBuffer>>();

function pluckBuffer(ctx: BaseAudioContext, freq: number): AudioBuffer {
  let m = cache.get(ctx);
  if (!m) cache.set(ctx, (m = new Map()));
  const key = Math.round(freq * 10);
  let buf = m.get(key);
  if (!buf) {
    const secs = Math.min(3, Math.max(1.2, 400 / freq));
    // Bağlama courses: main string + a slightly detuned unison + an octave string.
    const a = karplusStrong(freq, ctx.sampleRate, secs, { damping: 0.997, brightness: 0.7 });
    const b = karplusStrong(freq * 1.003, ctx.sampleRate, secs, { damping: 0.996, seed: 999 });
    const c = karplusStrong(freq * 2, ctx.sampleRate, secs, { damping: 0.994, seed: 4242 });
    buf = ctx.createBuffer(1, a.length, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++)
      d[i] = 0.5 * (a[i] ?? 0) + 0.35 * (b[i] ?? 0) + 0.25 * (c[i] ?? 0);
    if (m.size > 128) m.clear();
    m.set(key, buf);
  }
  return buf;
}

/** Bağlama / saz: plucked strings via Karplus–Strong plus a metallic body. */
export class BaglamaVoice implements Voice {
  readonly legato = false;
  private src: AudioBufferSourceNode | null = null;
  private amp: GainNode | null = null;
  private freq = 0;

  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly out: AudioNode,
  ) {}

  noteOn(freq: number, velocity: number, time = this.ctx.currentTime): void {
    const { ctx } = this;
    this.freq = freq;
    const src = ctx.createBufferSource();
    src.buffer = pluckBuffer(ctx, freq);
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 2800;
    body.Q.value = 1.5;
    body.gain.value = 5;
    const amp = ctx.createGain();
    amp.gain.value = 0.55 * (0.4 + 0.6 * velocity);
    src.connect(body).connect(amp).connect(this.out);
    src.start(time);
    this.src = src;
    this.amp = amp;
  }

  glide(freq: number, time = this.ctx.currentTime): void {
    if (!this.src || !this.freq) return;
    this.src.playbackRate.setTargetAtTime(freq / this.freq, time, 0.02);
  }

  noteOff(time = this.ctx.currentTime): void {
    if (!this.amp || !this.src) return;
    this.amp.gain.setTargetAtTime(0, time, 0.12);
    this.src.stop(time + 0.8);
    this.amp = null;
  }
}

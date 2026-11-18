import { getUsul, type Usul } from '../data/usuls';
import { playStroke } from './drums';
import { impulseResponse } from './noise';
import { Sequencer } from './sequencer';
import { createVoice, type Voice, type VoiceId } from './voices';

declare global {
  interface Navigator {
    /** iOS 17+ / Safari: Audio Session API. */
    audioSession?: { type: string };
  }
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/** Opt into the "playback" audio session so sound plays with the ring/silent switch on silent. */
export function setPlaybackAudioSession(nav: Navigator = navigator): boolean {
  try {
    if (nav.audioSession) {
      nav.audioSession.type = 'playback';
      return true;
    }
  } catch {
    /* not supported */
  }
  return false;
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private melodyBus!: GainNode;
  private rhythmBus!: GainNode;
  private active = new Map<string, Voice>();
  private seq: Sequencer | null = null;
  voiceId: VoiceId = 'org';
  private volume = 0.8;
  private balance = 0.5;
  private usul: Usul = getUsul('halay');
  private bpm = 116;
  onBar?: (bar: number, fill: boolean) => void;

  get started(): boolean {
    return this.ctx !== null;
  }

  get state(): string {
    return this.ctx?.state ?? 'none';
  }

  /**
   * Create or resume the AudioContext. MUST be called synchronously inside a
   * user gesture handler (iOS Safari requirement).
   */
  unlock(): Promise<void> {
    setPlaybackAudioSession();
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return Promise.reject(new Error('Web Audio not supported'));
      this.ctx = new Ctor({ latencyHint: 'interactive' });
      this.build(this.ctx);
    }
    const ctx = this.ctx;
    // Play one silent sample: unlocks output on older iOS versions.
    const b = ctx.createBufferSource();
    b.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    b.connect(ctx.destination);
    b.start(0);
    return ctx.state === 'running' ? Promise.resolve() : ctx.resume();
  }

  private build(ctx: AudioContext): void {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    comp.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.connect(comp);

    this.melodyBus = ctx.createGain();
    this.rhythmBus = ctx.createGain();
    this.melodyBus.connect(this.master);
    this.rhythmBus.connect(this.master);

    // A touch of hall reverb on the melody, like the keyboard's DSP.
    const verb = ctx.createConvolver();
    verb.buffer = impulseResponse(ctx);
    const send = ctx.createGain();
    send.gain.value = 0.18;
    this.melodyBus.connect(send).connect(verb).connect(this.master);

    this.applyMix();
    this.seq = new Sequencer(this.usul, this.bpm, {
      now: () => ctx.currentTime,
      onHit: (hit, time) =>
        playStroke(ctx, this.rhythmBus, hit.drum, hit.stroke, time, hit.accent ? 1 : 0.62),
      onBar: (bar, fill, time) => {
        const delay = Math.max(0, (time - ctx.currentTime) * 1000);
        setTimeout(() => this.onBar?.(bar, fill), delay);
      },
    });
  }

  private applyMix(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Equal-power crossfade between melody and rhythm.
    const mel = Math.cos((this.balance * Math.PI) / 2) * Math.SQRT2;
    const rhy = Math.sin((this.balance * Math.PI) / 2) * Math.SQRT2;
    this.master.gain.setTargetAtTime(this.volume, t, 0.02);
    this.melodyBus.gain.setTargetAtTime(Math.min(1.4, mel), t, 0.02);
    this.rhythmBus.gain.setTargetAtTime(Math.min(1.4, rhy) * 0.9, t, 0.02);
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    this.applyMix();
  }

  /** 0 = melody only, 0.5 = even, 1 = rhythm only. */
  setBalance(b: number): void {
    this.balance = Math.min(1, Math.max(0, b));
    this.applyMix();
  }

  setVoice(id: VoiceId): void {
    this.voiceId = id;
  }

  noteOn(key: string, freq: number, velocity = 0.85): void {
    if (!this.ctx) return;
    this.noteOff(key);
    const v = createVoice(this.voiceId, this.ctx, this.melodyBus);
    v.noteOn(freq, velocity);
    this.active.set(key, v);
  }

  /** Move a held note (glissando). Returns false when the voice should re-attack instead. */
  glide(key: string, newKey: string, freq: number): boolean {
    const v = this.active.get(key);
    if (!v || !v.legato) return false;
    v.glide(freq);
    this.active.delete(key);
    this.active.set(newKey, v);
    return true;
  }

  noteOff(key: string): void {
    const v = this.active.get(key);
    if (v) {
      v.noteOff();
      this.active.delete(key);
    }
  }

  allNotesOff(): void {
    for (const k of [...this.active.keys()]) this.noteOff(k);
  }

  setUsul(usul: Usul): void {
    this.usul = usul;
    this.seq?.setUsul(usul);
  }

  setTempo(bpm: number): void {
    this.bpm = bpm;
    this.seq?.setTempo(bpm);
  }

  get rhythmRunning(): boolean {
    return this.seq?.running ?? false;
  }

  startRhythm(intro = false): void {
    this.seq?.start(intro);
  }

  stopRhythm(): void {
    this.seq?.stop();
  }

  fill(): void {
    this.seq?.requestFill();
  }
}

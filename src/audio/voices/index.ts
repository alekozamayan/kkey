import { BaglamaVoice } from './baglama';
import { SynthVoice, type SynthSpec } from './synth';
import type { Voice, VoiceFactory, VoiceId } from './types';

export type { Voice, VoiceId } from './types';

export const VOICE_IDS: readonly VoiceId[] = [
  'org',
  'zurna',
  'baglama',
  'klarnet',
  'kaval',
  'kemence',
  'akordeon',
];

export const SPECS: Record<Exclude<VoiceId, 'baglama'>, SynthSpec> = {
  // Nasal double reed: buzzy, bright, strong formants and a lively vibrato.
  zurna: {
    oscs: [
      { type: 'sawtooth', gain: 0.6 },
      { type: 'square', gain: 0.35, detune: 4 },
    ],
    filter: { type: 'lowpass', freq: 9, q: 1.2 },
    formants: [
      { freq: 1250, q: 3, gain: 10 },
      { freq: 2700, q: 4, gain: 8 },
    ],
    drive: 0.4,
    attack: 0.02,
    decay: 0.15,
    sustain: 0.85,
    release: 0.08,
    vibrato: { rate: 6.4, depth: 22, delay: 0.12 },
    noise: { gain: 0.05, q: 2, ratio: 3 },
    level: 0.22,
  },
  // Clarinet: odd harmonics, warm, a little delayed vibrato (Roman style).
  klarnet: {
    oscs: [
      { type: 'square', gain: 0.5, harmonics: [1, 0.02, 0.45, 0.02, 0.25, 0.02, 0.14, 0.01, 0.08] },
    ],
    filter: { type: 'lowpass', freq: 5, q: 0.8 },
    attack: 0.04,
    decay: 0.2,
    sustain: 0.9,
    release: 0.1,
    vibrato: { rate: 5.6, depth: 14, delay: 0.3 },
    noise: { gain: 0.03, q: 1.5, ratio: 2 },
    level: 0.35,
  },
  // Kaval / ney: breathy flute, almost pure tone plus plenty of breath.
  kaval: {
    oscs: [
      { type: 'sine', gain: 0.7 },
      { type: 'triangle', gain: 0.15, ratio: 2 },
    ],
    filter: { type: 'lowpass', freq: 4, q: 0.5 },
    attack: 0.08,
    decay: 0.3,
    sustain: 0.85,
    release: 0.18,
    vibrato: { rate: 4.8, depth: 12, delay: 0.35 },
    noise: { gain: 0.35, q: 3, ratio: 1 },
    level: 0.4,
  },
  // Kemençe: bowed — slow-ish attack, resonant body, expressive vibrato.
  kemence: {
    oscs: [
      { type: 'sawtooth', gain: 0.5 },
      { type: 'sawtooth', gain: 0.3, detune: -6 },
    ],
    filter: { type: 'lowpass', freq: 6, q: 2 },
    formants: [
      { freq: 900, q: 2, gain: 6 },
      { freq: 2200, q: 3, gain: 5 },
    ],
    attack: 0.09,
    decay: 0.25,
    sustain: 0.8,
    release: 0.2,
    vibrato: { rate: 5.8, depth: 26, delay: 0.18 },
    noise: { gain: 0.06, q: 1.2, ratio: 4 },
    level: 0.24,
  },
  // The classic wedding-keyboard lead: fat detuned saws, portamento, vibrato.
  org: {
    oscs: [
      { type: 'sawtooth', gain: 0.45, detune: -7 },
      { type: 'sawtooth', gain: 0.45, detune: 7 },
      { type: 'square', gain: 0.25, ratio: 0.5 },
    ],
    filter: { type: 'lowpass', freq: 8, q: 3, envAmount: 2 },
    attack: 0.01,
    decay: 0.3,
    sustain: 0.75,
    release: 0.15,
    vibrato: { rate: 6, depth: 16, delay: 0.25 },
    glideTime: 0.03,
    level: 0.2,
  },
  // Musette accordion: three reeds slightly detuned → beating tremolo.
  akordeon: {
    oscs: [
      { type: 'sawtooth', gain: 0.4 },
      { type: 'sawtooth', gain: 0.35, detune: 12 },
      { type: 'sawtooth', gain: 0.35, detune: -12 },
      { type: 'square', gain: 0.15, ratio: 2 },
    ],
    filter: { type: 'lowpass', freq: 7, q: 1 },
    formants: [{ freq: 1500, q: 1.5, gain: 4 }],
    attack: 0.03,
    decay: 0.2,
    sustain: 0.9,
    release: 0.09,
    tremolo: { rate: 5.5, depth: 0.15 },
    level: 0.18,
    legato: false,
  },
};

export const VOICES: Record<VoiceId, VoiceFactory> = {
  baglama: (ctx, out) => new BaglamaVoice(ctx, out),
  zurna: (ctx, out) => new SynthVoice(ctx, out, SPECS.zurna),
  klarnet: (ctx, out) => new SynthVoice(ctx, out, SPECS.klarnet),
  kaval: (ctx, out) => new SynthVoice(ctx, out, SPECS.kaval),
  kemence: (ctx, out) => new SynthVoice(ctx, out, SPECS.kemence),
  org: (ctx, out) => new SynthVoice(ctx, out, SPECS.org),
  akordeon: (ctx, out) => new SynthVoice(ctx, out, SPECS.akordeon),
};

export function createVoice(id: VoiceId, ctx: BaseAudioContext, out: AudioNode): Voice {
  return VOICES[id](ctx, out);
}

export function isVoiceId(x: unknown): x is VoiceId {
  return typeof x === 'string' && (VOICE_IDS as readonly string[]).includes(x);
}

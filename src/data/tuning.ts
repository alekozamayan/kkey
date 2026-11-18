/**
 * Tuning math. Pitches are modelled in cents relative to a tonic; Turkish makam
 * theory (Arel–Ezgi–Uzdilek) divides the octave into 53 Holdrian commas.
 */

export const COMMAS_PER_OCTAVE = 53;
export const CENTS_PER_OCTAVE = 1200;
/** One Holdrian comma (koma) ≈ 22.64 cents. */
export const KOMA_CENTS = CENTS_PER_OCTAVE / COMMAS_PER_OCTAVE;
export const QUARTER_TONE_CENTS = 50;
export const A4_FREQ = 440;
export const A4_MIDI = 69;

/** Named AEU interval sizes, in commas. */
export const INTERVAL = {
  /** Fazla (F) */
  fazla: 1,
  /** Bakiye (B) */
  bakiye: 4,
  /** Küçük mücenneb (S) */
  kucukMucenneb: 5,
  /** Büyük mücenneb (K) */
  buyukMucenneb: 8,
  /** Tanini – whole tone (T) */
  tanini: 9,
  /** Artık ikili – augmented second (A) */
  artikIkili: 12,
} as const;

export function commasToCents(commas: number): number {
  return commas * KOMA_CENTS;
}

export function centsToCommas(cents: number): number {
  return cents / KOMA_CENTS;
}

/** Frequency of a MIDI note, optionally detuned by a number of cents. */
export function midiToFreq(midi: number, detuneCents = 0, a4 = A4_FREQ): number {
  return a4 * 2 ** ((midi - A4_MIDI + detuneCents / 100) / 12);
}

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** A per-note detune bar: 12 values in cents, index 0 = C … 11 = B. */
export type DetuneBar = number[];

export function flatDetune(): DetuneBar {
  return new Array<number>(12).fill(0);
}

/** Frequency for a MIDI note under a detune bar. */
export function tunedFreq(midi: number, detune: readonly number[], a4 = A4_FREQ): number {
  return midiToFreq(midi, detune[pitchClass(midi)] ?? 0, a4);
}

export function roundTo(value: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

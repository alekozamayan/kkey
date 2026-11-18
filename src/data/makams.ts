import { COMMAS_PER_OCTAVE, commasToCents, flatDetune, type DetuneBar } from './tuning';

export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type MakamId =
  | 'duz'
  | 'rast'
  | 'ussak'
  | 'hicaz'
  | 'humayun'
  | 'kurdi'
  | 'nihavend'
  | 'saba'
  | 'huseyni'
  | 'karcigar'
  | 'segah';

export interface Makam {
  id: MakamId;
  /** Display name (proper noun, same in every UI language). */
  name: string;
  /**
   * Seven ascending step sizes in Holdrian commas from the karar (tonic)
   * up to its octave. `null` means plain 12-TET ("Düz").
   */
  steps: readonly number[] | null;
  /** The tonic most often used for this makam on transposing oriental keyboards. */
  defaultTonic: PitchClass;
}

// Step sizes (AEU): B=4, S=5, K=8, T=9, A=12.
export const MAKAMS: readonly Makam[] = [
  { id: 'duz', name: 'Düz', steps: null, defaultTonic: 0 },
  // Rast pentachord (T K S T) + Rast tetrachord (T K S)
  { id: 'rast', name: 'Rast', steps: [9, 8, 5, 9, 9, 8, 5], defaultTonic: 0 },
  // Uşşak tetrachord (K S T) + Buselik pentachord (T B T T)
  { id: 'ussak', name: 'Uşşak', steps: [8, 5, 9, 9, 4, 9, 9], defaultTonic: 2 },
  // Hicaz tetrachord (S A S) + Rast pentachord (T K S T)
  { id: 'hicaz', name: 'Hicaz', steps: [5, 12, 5, 9, 8, 5, 9], defaultTonic: 2 },
  // Hicaz tetrachord (S A S) + Buselik pentachord (T B T T)
  { id: 'humayun', name: 'Hümayun', steps: [5, 12, 5, 9, 4, 9, 9], defaultTonic: 2 },
  // Kürdi tetrachord (B T T) + Buselik pentachord (T B T T)
  { id: 'kurdi', name: 'Kürdi', steps: [4, 9, 9, 9, 4, 9, 9], defaultTonic: 9 },
  // Buselik pentachord (T B T T) + Kürdi tetrachord (B T T)
  { id: 'nihavend', name: 'Nihavend', steps: [9, 4, 9, 9, 4, 9, 9], defaultTonic: 7 },
  // Saba tetrachord (K S S) + Hicaz on çargah (A S) + T T
  { id: 'saba', name: 'Saba', steps: [8, 5, 5, 12, 5, 9, 9], defaultTonic: 2 },
  // Uşşak tetrachord (K S T) + Hüseyni pentachord (T K S T)
  { id: 'huseyni', name: 'Hüseyni', steps: [8, 5, 9, 9, 8, 5, 9], defaultTonic: 9 },
  // Uşşak tetrachord (K S T) + Hicaz pentachord (S A S T)
  { id: 'karcigar', name: 'Karcığar', steps: [8, 5, 9, 5, 12, 5, 9], defaultTonic: 2 },
  // Segah: segah çargah neva hüseyni eviç gerdaniye muhayyer
  { id: 'segah', name: 'Segah', steps: [5, 9, 9, 8, 5, 9, 8], defaultTonic: 4 },
];

export function getMakam(id: string): Makam {
  const m = MAKAMS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown makam: ${id}`);
  return m;
}

/** Cumulative comma positions of the 7 scale degrees (starting with 0). */
export function degreeCommas(makam: Makam): number[] {
  if (!makam.steps) return [];
  const out: number[] = [0];
  let acc = 0;
  for (const s of makam.steps.slice(0, -1)) {
    acc += s;
    out.push(acc);
  }
  return out;
}

export function degreeCents(makam: Makam): number[] {
  return degreeCommas(makam).map(commasToCents);
}

export interface ScaleDegree {
  /** 0-based scale degree. */
  degree: number;
  /** Position above the tonic in commas. */
  commas: number;
  /** Exact cents above the tonic. */
  cents: number;
  /** Nearest equal-tempered semitone above the tonic (0–11). */
  semitone: number;
  /** Absolute pitch class on the keyboard (0 = C). */
  pitchClass: number;
  /** Detune from 12-TET, in cents, that the keyboard key needs. */
  offsetCents: number;
}

export function makamScale(makam: Makam, tonic: number): ScaleDegree[] {
  return degreeCommas(makam).map((commas, degree) => {
    const cents = commasToCents(commas);
    const semitone = Math.round(cents / 100);
    return {
      degree,
      commas,
      cents,
      semitone,
      pitchClass: (((tonic + semitone) % 12) + 12) % 12,
      offsetCents: cents - semitone * 100,
    };
  });
}

/**
 * Fill a 12-note detune bar for a makam on the given tonic. Notes outside the
 * scale stay at 0 (equal-tempered), like a keyboard's "scale" preset.
 */
export function makamDetune(makam: Makam, tonic: number): DetuneBar {
  const bar = flatDetune();
  for (const d of makamScale(makam, tonic)) bar[d.pitchClass] = d.offsetCents;
  return bar;
}

export function scalePitchClasses(makam: Makam, tonic: number): Set<number> {
  return new Set(makamScale(makam, tonic).map((d) => d.pitchClass));
}

export function totalCommas(makam: Makam): number {
  return makam.steps ? makam.steps.reduce((a, b) => a + b, 0) : COMMAS_PER_OCTAVE;
}

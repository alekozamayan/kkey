/**
 * Usul (rhythm) patterns. Each track is a string with one character per step:
 *   '.' rest, lowercase = normal stroke, UPPERCASE = accented stroke.
 * Stroke letters per drum:
 *   davul:   d = düm (big beater), t = tek (thin stick)
 *   darbuka: d = düm, t = tek, k = ka
 *   def:     d = düm, t = tek (rim + jingles)
 *   zil:     x = finger cymbals
 */

export type DrumId = 'davul' | 'darbuka' | 'def' | 'zil';
export type Stroke = 'dum' | 'tek' | 'ka' | 'zil';

export const DRUMS: readonly DrumId[] = ['davul', 'darbuka', 'def', 'zil'];

export const STROKE_CHARS: Record<DrumId, Record<string, Stroke>> = {
  davul: { d: 'dum', t: 'tek' },
  darbuka: { d: 'dum', t: 'tek', k: 'ka' },
  def: { d: 'dum', t: 'tek' },
  zil: { x: 'zil' },
};

export type Tracks = Partial<Record<DrumId, string>>;

export type UsulId =
  | 'halay'
  | 'agirHalay'
  | 'govend'
  | 'ciftetelli'
  | 'karsilama'
  | 'roman'
  | 'zeybek'
  | 'horon'
  | 'bar'
  | 'kolbasti'
  | 'duz';

export interface Usul {
  id: UsulId;
  /** Time signature [beats, beat unit]. */
  meter: readonly [number, number];
  /** Grouping of the beats (in meter beat units), e.g. 2+2+2+3. Sums to meter[0]. */
  grouping: readonly number[];
  /** Note value of one pattern step (8 = eighth, 16 = sixteenth). */
  stepUnit: number;
  /** Default tempo in quarter notes per minute. */
  defaultBpm: number;
  tracks: Tracks;
  /** Optional hand-written fill bar; otherwise one is generated. */
  fill?: Tracks;
}

export const USULS: readonly Usul[] = [
  {
    id: 'halay',
    meter: [2, 4],
    grouping: [1, 1],
    stepUnit: 16,
    defaultBpm: 116,
    tracks: {
      davul: 'D..tD.t.',
      darbuka: 'D.tkD.T.',
      zil: 'x...x...',
    },
  },
  {
    id: 'agirHalay',
    meter: [4, 4],
    grouping: [1, 1, 1, 1],
    stepUnit: 16,
    defaultBpm: 72,
    tracks: {
      davul: 'D.....t.D...t.t.',
      darbuka: 'D..k..T.D.k.T.k.',
      def: 'd.......d.......',
    },
  },
  {
    id: 'govend',
    meter: [2, 4],
    grouping: [1, 1],
    stepUnit: 16,
    defaultBpm: 128,
    tracks: {
      davul: 'D.dtD.t.',
      darbuka: 'D.dTk.Tk',
      def: 'd...t.t.',
      zil: 'x.......',
    },
  },
  {
    id: 'ciftetelli',
    meter: [8, 8],
    grouping: [3, 3, 2],
    stepUnit: 16,
    defaultBpm: 100,
    tracks: {
      davul: 'D.....t.D.D.....',
      darbuka: 'D..t..t.D.D.T...',
      zil: 'x.....x.....x...',
    },
  },
  {
    id: 'karsilama',
    meter: [9, 8],
    grouping: [2, 2, 2, 3],
    stepUnit: 16,
    defaultBpm: 130,
    tracks: {
      davul: 'D...t...D...t...t.',
      darbuka: 'D...T...D...T.k.T.',
      zil: 'x.......x.........',
    },
  },
  {
    id: 'roman',
    meter: [9, 8],
    grouping: [2, 2, 2, 3],
    stepUnit: 16,
    defaultBpm: 120,
    tracks: {
      davul: 'D...t...D...t.t...',
      darbuka: 'D.tkT.tkD.tkT.k.T.',
      zil: 'x...x...x...x.....',
    },
  },
  {
    id: 'zeybek',
    meter: [9, 4],
    grouping: [2, 2, 2, 3],
    stepUnit: 8,
    defaultBpm: 60,
    tracks: {
      davul: 'D...D...t.t.D.t.t.',
      darbuka: 'D..kD..kT.k.D.T.k.',
      zil: 'x.......x.........',
    },
  },
  {
    id: 'horon',
    meter: [7, 16],
    grouping: [2, 2, 3],
    stepUnit: 16,
    defaultBpm: 200,
    tracks: {
      davul: 'D.t.D.t',
      darbuka: 'D.T.Dkt',
      zil: 'x......',
    },
  },
  {
    id: 'bar',
    meter: [2, 4],
    grouping: [1, 1],
    stepUnit: 16,
    defaultBpm: 104,
    tracks: {
      davul: 'D..tD.tt',
      darbuka: 'D.kTD.T.',
      def: 'd...d.t.',
    },
  },
  {
    id: 'kolbasti',
    meter: [2, 4],
    grouping: [1, 1],
    stepUnit: 16,
    defaultBpm: 132,
    tracks: {
      davul: 'D...D.t.',
      darbuka: 'D.tkT.tk',
      zil: '..x...x.',
    },
  },
  {
    id: 'duz',
    meter: [4, 4],
    grouping: [1, 1, 1, 1],
    stepUnit: 16,
    defaultBpm: 110,
    tracks: {
      davul: 'D.......D.D.....',
      darbuka: 'D...T.k.D.D.T.k.',
      zil: '....x.......x...',
    },
  },
];

export function getUsul(id: string): Usul {
  const u = USULS.find((x) => x.id === id);
  if (!u) throw new Error(`Unknown usul: ${id}`);
  return u;
}

/** Number of pattern steps in one bar. */
export function stepsPerBar(u: Usul): number {
  return (u.meter[0] * u.stepUnit) / u.meter[1];
}

/** Step indices where each group of the grouping starts. */
export function groupStarts(u: Usul): number[] {
  const perBeat = u.stepUnit / u.meter[1];
  const out: number[] = [];
  let acc = 0;
  for (const g of u.grouping) {
    out.push(acc * perBeat);
    acc += g;
  }
  return out;
}

/** Duration of one step in seconds at a quarter-note tempo. */
export function stepDuration(u: Usul, bpm: number): number {
  return (60 / bpm) * (4 / u.stepUnit);
}

export interface DrumHit {
  step: number;
  drum: DrumId;
  stroke: Stroke;
  accent: boolean;
}

export function parseTrack(drum: DrumId, pattern: string): DrumHit[] {
  const table = STROKE_CHARS[drum];
  const hits: DrumHit[] = [];
  [...pattern].forEach((ch, step) => {
    if (ch === '.') return;
    const stroke = table[ch.toLowerCase()];
    if (!stroke) throw new Error(`Invalid stroke '${ch}' for ${drum}`);
    hits.push({ step, drum, stroke, accent: ch !== ch.toLowerCase() });
  });
  return hits;
}

/** Hits grouped by step index for fast lookup by the sequencer. */
export function compileTracks(tracks: Tracks, steps: number): DrumHit[][] {
  const byStep: DrumHit[][] = Array.from({ length: steps }, () => []);
  for (const drum of DRUMS) {
    const pattern = tracks[drum];
    if (!pattern) continue;
    for (const hit of parseTrack(drum, pattern)) byStep[hit.step]?.push(hit);
  }
  return byStep;
}

/**
 * A fill / intro bar: a darbuka roll (tek–ka) accenting each group start, with
 * davul düm on group starts and a zil on the downbeat.
 */
export function makeFill(u: Usul): Tracks {
  const n = stepsPerBar(u);
  const starts = new Set(groupStarts(u));
  let darbuka = '';
  let davul = '';
  for (let i = 0; i < n; i++) {
    if (starts.has(i)) darbuka += i === 0 ? 'D' : 'T';
    else darbuka += i % 2 === 0 ? 't' : 'k';
    davul += starts.has(i) ? (i === 0 ? 'D' : 'd') : i === n - 1 ? 'T' : '.';
  }
  const zil = 'x' + '.'.repeat(n - 1);
  return { davul, darbuka, zil };
}

export function fillTracks(u: Usul): Tracks {
  return u.fill ?? makeFill(u);
}

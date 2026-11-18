import {
  compileTracks,
  fillTracks,
  stepDuration,
  stepsPerBar,
  type DrumHit,
  type Usul,
} from '../data/usuls';

export interface SequencerOptions {
  /** Current audio clock time in seconds (audioContext.currentTime). */
  now: () => number;
  /** Called for every hit that must be scheduled at `time`. */
  onHit: (hit: DrumHit, time: number) => void;
  /** Called when a new bar starts (for UI), with `time` of its downbeat. */
  onBar?: (barIndex: number, isFill: boolean, time: number) => void;
  /** How far ahead to schedule, seconds. */
  lookahead?: number;
  /** Timer period, ms. */
  intervalMs?: number;
  setInterval?: (fn: () => void, ms: number) => unknown;
  clearInterval?: (id: unknown) => void;
}

/**
 * Look-ahead step sequencer (the "tale of two clocks" pattern): a coarse JS
 * timer wakes up regularly and schedules every step that falls inside the
 * look-ahead window precisely on the audio clock.
 */
export class Sequencer {
  private usul: Usul;
  private bpm: number;
  private main: DrumHit[][] = [];
  private fill: DrumHit[][] = [];
  private steps = 0;
  private timer: unknown = null;
  private nextTime = 0;
  private step = 0;
  private bar = 0;
  private fillPending = false;
  private inFill = false;
  private readonly lookahead: number;
  private readonly intervalMs: number;

  constructor(
    usul: Usul,
    bpm: number,
    private readonly opts: SequencerOptions,
  ) {
    this.usul = usul;
    this.bpm = bpm;
    this.lookahead = opts.lookahead ?? 0.12;
    this.intervalMs = opts.intervalMs ?? 25;
    this.compile();
  }

  get running(): boolean {
    return this.timer !== null;
  }

  get currentUsul(): Usul {
    return this.usul;
  }

  get tempo(): number {
    return this.bpm;
  }

  private compile(): void {
    this.steps = stepsPerBar(this.usul);
    this.main = compileTracks(this.usul.tracks, this.steps);
    this.fill = compileTracks(fillTracks(this.usul), this.steps);
  }

  setUsul(usul: Usul): void {
    this.usul = usul;
    this.compile();
    // Restart at the next downbeat so a 9/8 doesn't continue mid-bar of a 2/4.
    if (this.step >= this.steps) this.step = 0;
  }

  setTempo(bpm: number): void {
    this.bpm = Math.min(320, Math.max(30, bpm));
  }

  /** Start playing. With `intro`, the first bar is a fill. */
  start(intro = false): void {
    if (this.running) return;
    this.step = 0;
    this.bar = 0;
    this.fillPending = intro;
    this.inFill = false;
    this.nextTime = this.opts.now() + 0.05;
    const si = this.opts.setInterval ?? ((fn, ms) => globalThis.setInterval(fn, ms));
    this.timer = si(() => this.tick(), this.intervalMs);
    this.tick();
  }

  stop(): void {
    if (!this.running) return;
    const ci =
      this.opts.clearInterval ??
      ((id) => globalThis.clearInterval(id as ReturnType<typeof setInterval>));
    ci(this.timer);
    this.timer = null;
  }

  /** Play a fill on the next bar. */
  requestFill(): void {
    this.fillPending = true;
  }

  /** Schedule everything inside the look-ahead window. Public for testing. */
  tick(): void {
    const horizon = this.opts.now() + this.lookahead;
    while (this.nextTime < horizon) {
      if (this.step === 0) {
        this.inFill = this.fillPending;
        this.fillPending = false;
        this.opts.onBar?.(this.bar, this.inFill, this.nextTime);
      }
      const table = this.inFill ? this.fill : this.main;
      for (const hit of table[this.step] ?? []) this.opts.onHit(hit, this.nextTime);
      this.nextTime += stepDuration(this.usul, this.bpm);
      this.step++;
      if (this.step >= this.steps) {
        this.step = 0;
        this.bar++;
      }
    }
  }
}

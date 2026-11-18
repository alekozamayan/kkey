/** Common interface for every melodic instrument voice. */
export interface Voice {
  /** Start a note. `time` defaults to now. */
  noteOn(freq: number, velocity: number, time?: number): void;
  /** Release the note; the voice cleans itself up after its release tail. */
  noteOff(time?: number): void;
  /** Slide to a new pitch while held (glissando on sustained voices). */
  glide(freq: number, time?: number): void;
  /** Whether sliding to another key should glide instead of re-attacking. */
  readonly legato: boolean;
}

export type VoiceId = 'zurna' | 'baglama' | 'klarnet' | 'kaval' | 'kemence' | 'org' | 'akordeon';

export type VoiceFactory = (ctx: BaseAudioContext, out: AudioNode) => Voice;

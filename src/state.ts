import { DEFAULT_OCTAVE } from './data/keymap';
import { getMakam, makamDetune, MAKAMS, type MakamId } from './data/makams';
import { getUsul, USULS, type UsulId } from './data/usuls';
import { DEFAULT_LANG, isLang, type Lang } from './data/i18n';
import { isVoiceId, type VoiceId } from './audio/voices';

export type Theme = 'auto' | 'light' | 'dark';

export interface AppState {
  lang: Lang;
  theme: Theme;
  voice: VoiceId;
  makam: MakamId;
  tonic: number;
  detune: number[];
  detuneStep: 'koma' | 'quarter';
  showDetune: boolean;
  usul: UsulId;
  bpm: number;
  octave: number;
  volume: number;
  balance: number;
}

const KEY = 'kkey.settings.v1';

export function defaultState(): AppState {
  const makam = getMakam('hicaz');
  return {
    lang: DEFAULT_LANG,
    theme: 'auto',
    voice: 'org',
    makam: makam.id,
    tonic: makam.defaultTonic,
    detune: makamDetune(makam, makam.defaultTonic),
    detuneStep: 'koma',
    showDetune: true,
    usul: 'halay',
    bpm: getUsul('halay').defaultBpm,
    octave: DEFAULT_OCTAVE,
    volume: 0.8,
    balance: 0.5,
  };
}

/** Merge persisted settings over defaults, ignoring anything invalid. */
export function sanitize(raw: unknown): AppState {
  const d = defaultState();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<Record<keyof AppState, unknown>>;
  const num = (v: unknown, lo: number, hi: number, def: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
  const s: AppState = { ...d };
  if (isLang(r.lang)) s.lang = r.lang;
  if (r.theme === 'auto' || r.theme === 'light' || r.theme === 'dark') s.theme = r.theme;
  if (isVoiceId(r.voice)) s.voice = r.voice;
  if (MAKAMS.some((m) => m.id === r.makam)) s.makam = r.makam as MakamId;
  s.tonic = Math.round(num(r.tonic, 0, 11, getMakam(s.makam).defaultTonic));
  s.detune =
    Array.isArray(r.detune) &&
    r.detune.length === 12 &&
    r.detune.every((x) => typeof x === 'number')
      ? (r.detune as number[]).map((x) => num(x, -200, 200, 0))
      : makamDetune(getMakam(s.makam), s.tonic);
  if (r.detuneStep === 'koma' || r.detuneStep === 'quarter') s.detuneStep = r.detuneStep;
  if (typeof r.showDetune === 'boolean') s.showDetune = r.showDetune;
  if (USULS.some((u) => u.id === r.usul)) s.usul = r.usul as UsulId;
  s.bpm = Math.round(num(r.bpm, 30, 320, getUsul(s.usul).defaultBpm));
  s.octave = Math.round(num(r.octave, 1, 6, d.octave));
  s.volume = num(r.volume, 0, 1, d.volume);
  s.balance = num(r.balance, 0, 1, d.balance);
  return s;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    return sanitize(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultState();
  }
}

export function saveState(s: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable (private mode) */
  }
}

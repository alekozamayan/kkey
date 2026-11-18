import { AudioEngine } from './audio/engine';
import { VOICE_IDS, type VoiceId } from './audio/voices';
import { LANGS, noteNames, t, type Lang, type MessageKey } from './data/i18n';
import { baseMidi, keyToMidi, MAX_OCTAVE, MIN_OCTAVE, VISIBLE_KEYS } from './data/keymap';
import { getMakam, makamDetune, makamScale, MAKAMS, type MakamId } from './data/makams';
import { KOMA_CENTS, pitchClass, QUARTER_TONE_CENTS, roundTo, tunedFreq } from './data/tuning';
import { getUsul, groupStarts, USULS, type UsulId } from './data/usuls';
import { loadState, saveState, type AppState, type Theme } from './state';
import { h } from './ui/dom';
import { Keyboard } from './ui/keyboard';

declare const __APP_VERSION__: string;
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

const LANG_NAMES: Record<Lang, string> = { tr: 'Türkçe', ku: 'Kurmancî', en: 'English' };

export function mountApp(root: HTMLElement): void {
  const state: AppState = loadState();
  const engine = new AudioEngine();
  engine.setVoice(state.voice);
  engine.setVolume(state.volume);
  engine.setBalance(state.balance);
  engine.setUsul(getUsul(state.usul));
  engine.setTempo(state.bpm);

  const tr = (k: MessageKey) => t(state.lang, k);
  const i18nEls: [HTMLElement, MessageKey, 'text' | 'title' | 'aria'][] = [];
  const i18n = <E extends HTMLElement>(
    el: E,
    key: MessageKey,
    mode: 'text' | 'title' | 'aria' = 'text',
  ): E => {
    i18nEls.push([el, key, mode]);
    return el;
  };

  const persist = () => saveState(state);

  // ---------- Top bar ----------
  const voiceSel = h('select', { 'data-testid': 'voice', id: 'voice' });
  const makamSel = h('select', { 'data-testid': 'makam', id: 'makam' });
  const tonicSel = h('select', { 'data-testid': 'tonic', id: 'tonic' });
  const usulSel = h('select', { 'data-testid': 'usul', id: 'usul' });
  const langSel = h('select', { 'data-testid': 'lang', id: 'lang' });
  for (const l of LANGS) langSel.append(h('option', { value: l }, LANG_NAMES[l]));

  const tempoVal = h('span', { class: 'tempo-value', 'data-testid': 'tempo' });
  const tempoDown = h('button', { 'aria-label': '-' }, '−');
  const tempoUp = h('button', { 'aria-label': '+' }, '+');
  const playBtn = h('button', { class: 'primary', 'data-testid': 'play', 'aria-pressed': 'false' });
  const fillBtn = i18n(h('button', { 'data-testid': 'fill' }), 'bar.fill');
  const beats = h('div', { class: 'group', 'aria-hidden': 'true' });

  const volume = h('input', {
    type: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    'data-testid': 'volume',
    id: 'volume',
  });
  const balance = h('input', {
    type: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    'data-testid': 'balance',
    id: 'balance',
  });
  const octDown = h('button', { 'data-testid': 'oct-down', 'aria-label': 'octave down' }, '◀');
  const octUp = h('button', { 'data-testid': 'oct-up', 'aria-label': 'octave up' }, '▶');
  const octVal = h('span', { class: 'tempo-value', 'data-testid': 'octave' });
  const detuneToggle = i18n(h('button', { 'data-testid': 'detune-toggle' }), 'bar.detune');
  const themeBtn = h('button', { 'data-testid': 'theme' });
  const midiBtn = h('button', { hidden: true, 'data-testid': 'midi' }, 'MIDI');

  const lab = (key: MessageKey, forId: string) => i18n(h('label', { for: forId }), key);

  const topbar = h(
    'header',
    { class: 'topbar' },
    h('div', { class: 'brand' }, 'kkey'),
    h('div', { class: 'group' }, lab('bar.instrument', 'voice'), voiceSel),
    h(
      'div',
      { class: 'group' },
      lab('bar.makam', 'makam'),
      makamSel,
      lab('bar.tonic', 'tonic'),
      tonicSel,
    ),
    h('div', { class: 'group' }, lab('bar.rhythm', 'usul'), usulSel),
    h(
      'div',
      { class: 'group' },
      i18n(h('span', { class: 'label' }), 'bar.tempo'),
      tempoDown,
      tempoVal,
      tempoUp,
    ),
    h('div', { class: 'group' }, playBtn, fillBtn, beats),
    h('div', { class: 'group' }, lab('bar.volume', 'volume'), volume),
    h('div', { class: 'group' }, lab('bar.balance', 'balance'), balance),
    h(
      'div',
      { class: 'group' },
      i18n(h('span', { class: 'label' }), 'bar.octave'),
      octDown,
      octVal,
      octUp,
    ),
    h('div', { class: 'spacer' }),
    h('div', { class: 'group' }, detuneToggle, midiBtn, themeBtn, langSel),
  );

  // ---------- Detune bar ----------
  const detuneCells = h('div', { class: 'detune-cells' });
  const stepBtn = h('button', { 'data-testid': 'detune-step' });
  const resetBtn = i18n(h('button', { 'data-testid': 'detune-reset' }), 'detune.reset');
  const flatBtn = i18n(h('button', { 'data-testid': 'detune-flat' }), 'detune.flat');
  const detunePanel = h(
    'section',
    { class: 'detune', 'data-testid': 'detune' },
    detuneCells,
    h('div', { class: 'detune-tools' }, stepBtn, resetBtn, flatBtn),
  );
  const cellEls: { root: HTMLElement; name: HTMLElement; val: HTMLElement }[] = [];
  for (let pc = 0; pc < 12; pc++) {
    const up = h('button', { 'aria-label': `+${pc}`, 'data-testid': `dt-up-${pc}` }, '▲');
    const down = h('button', { 'aria-label': `-${pc}`, 'data-testid': `dt-down-${pc}` }, '▼');
    const name = h('span', { class: 'dt-name' });
    const val = h('span', { class: 'dt-val', 'data-testid': `dt-val-${pc}` });
    const root = h('div', { class: 'dt' }, up, name, val, down);
    const nudge = (dir: number) => {
      const step = state.detuneStep === 'koma' ? KOMA_CENTS : QUARTER_TONE_CENTS;
      const cur = state.detune[pc] ?? 0;
      state.detune[pc] = Math.max(-200, Math.min(200, roundTo(cur + dir * step, 3)));
      retune();
    };
    up.addEventListener('click', () => nudge(+1));
    down.addEventListener('click', () => nudge(-1));
    val.addEventListener('dblclick', () => {
      state.detune[pc] = 0;
      retune();
    });
    cellEls.push({ root, name, val });
    detuneCells.append(root);
  }

  // ---------- Keyboard ----------
  const heldOffsets = new Map<string, number>();
  const freqFor = (offset: number) => tunedFreq(baseMidi(state.octave) + offset, state.detune);

  const ensureAudio = () => {
    if (engine.state !== 'running') void engine.unlock().catch(() => undefined);
  };

  const keyboard = new Keyboard({
    gesture: ensureAudio,
    press: (p, off) => {
      heldOffsets.set(p, off);
      engine.noteOn(p, freqFor(off));
    },
    slide: (p, _from, to) => {
      heldOffsets.set(p, to);
      if (!engine.glide(p, p, freqFor(to))) engine.noteOn(p, freqFor(to));
    },
    release: (p) => {
      heldOffsets.delete(p);
      engine.noteOff(p);
    },
  });

  const kbWrap = h('main', { class: 'kb-wrap' }, keyboard.el);
  const rotateHint = i18n(h('div', { class: 'rotate-hint' }), 'rotate.hint');
  const version = h('div', { class: 'version', 'data-testid': 'version' }, `v${APP_VERSION}`);

  // ---------- Start overlay ----------
  const overlay = h(
    'button',
    { class: 'overlay', 'data-testid': 'start-overlay', type: 'button' },
    i18n(h('span', { class: 'start-btn' }), 'start.tap'),
    i18n(h('p'), 'start.hint'),
  );
  overlay.addEventListener('click', () => {
    // Must stay synchronous inside the gesture for iOS.
    const p = engine.unlock();
    overlay.hidden = true;
    void p
      .then(() => {
        engine.ctx?.addEventListener('statechange', syncAudioState);
        syncAudioState();
      })
      .catch((err: unknown) => console.error(err));
    syncAudioState();
  });

  function syncAudioState() {
    document.body.dataset.audio = engine.state;
  }

  root.append(
    rotateHint,
    h('div', { class: 'kilim-band' }),
    topbar,
    h('div', { class: 'kilim-band' }),
    detunePanel,
    kbWrap,
    version,
  );
  document.body.append(overlay);

  // ---------- Rendering ----------
  function fillSelect(
    sel: HTMLSelectElement,
    items: { value: string; label: string }[],
    value: string,
  ) {
    sel.replaceChildren(...items.map((i) => h('option', { value: i.value }, i.label)));
    sel.value = value;
  }

  function renderTexts() {
    document.documentElement.lang = state.lang;
    document.title = tr('app.title');
    for (const [el, key, mode] of i18nEls) {
      if (mode === 'text') el.textContent = tr(key);
      else if (mode === 'title') el.title = tr(key);
      else el.setAttribute('aria-label', tr(key));
    }
    const names = noteNames(state.lang);
    fillSelect(
      voiceSel,
      VOICE_IDS.map((v) => ({ value: v, label: tr(`voice.${v}` as MessageKey) })),
      state.voice,
    );
    fillSelect(
      makamSel,
      MAKAMS.map((m) => ({ value: m.id, label: m.id === 'duz' ? tr('makam.duz') : m.name })),
      state.makam,
    );
    fillSelect(
      tonicSel,
      names.map((n, i) => ({ value: String(i), label: n })),
      String(state.tonic),
    );
    fillSelect(
      usulSel,
      USULS.map((u) => ({ value: u.id, label: tr(`usul.${u.id}` as MessageKey) })),
      state.usul,
    );
    langSel.value = state.lang;
    stepBtn.textContent = `${tr('detune.step')}: ${tr(state.detuneStep === 'koma' ? 'detune.koma' : 'detune.quarter')}`;
    renderPlay();
    renderTheme();
    renderKeys();
  }

  function renderPlay() {
    const on = engine.rhythmRunning;
    playBtn.textContent = on ? `■ ${tr('bar.stop')}` : `▶ ${tr('bar.start')}`;
    playBtn.setAttribute('aria-pressed', String(on));
  }

  function renderTheme() {
    const icon: Record<Theme, string> = { auto: '◐', light: '☀', dark: '☾' };
    themeBtn.textContent = icon[state.theme];
    themeBtn.title = `${tr('bar.theme')}: ${state.theme}`;
    if (state.theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = state.theme;
  }

  function renderBeats() {
    const u = getUsul(state.usul);
    beats.replaceChildren(...groupStarts(u).map(() => h('span', { class: 'beat' })));
  }

  function renderKeys() {
    const names = noteNames(state.lang);
    const makam = getMakam(state.makam);
    const scale = makamScale(makam, state.tonic);
    const inScale = new Set(scale.map((d) => d.pitchClass));
    const fmt = (c: number) => {
      const r = Math.round(c);
      return r === 0 ? '' : r > 0 ? `+${r}` : `−${-r}`;
    };
    for (let off = 0; off < VISIBLE_KEYS; off++) {
      const midi = baseMidi(state.octave) + off;
      const pc = pitchClass(midi);
      keyboard.label(off, {
        name: pc === 0 ? `${names[0]}${Math.floor(midi / 12) - 1}` : (names[pc] ?? ''),
        cents: fmt(state.detune[pc] ?? 0),
        inScale: inScale.has(pc),
        tonic: pc === state.tonic,
      });
    }
    cellEls.forEach((c, pc) => {
      const v = state.detune[pc] ?? 0;
      c.name.textContent = names[pc] ?? '';
      c.val.textContent = Math.round(v) === 0 ? '0' : fmt(v);
      c.val.classList.toggle('neg', v < -0.5);
      c.val.classList.toggle('pos', v > 0.5);
      c.root.classList.toggle('in-scale', inScale.has(pc));
      c.root.classList.toggle('tonic', pc === state.tonic);
    });
    octVal.textContent = String(state.octave);
    tempoVal.textContent = String(state.bpm);
    detunePanel.hidden = !state.showDetune;
    detuneToggle.setAttribute('aria-pressed', String(state.showDetune));
    volume.value = String(state.volume);
    balance.value = String(state.balance);
  }

  /** Re-render and retune any held notes after a tuning change. */
  function retune() {
    for (const [p, off] of heldOffsets) engine.glide(p, p, freqFor(off));
    renderKeys();
    persist();
  }

  // ---------- Events ----------
  voiceSel.addEventListener('change', () => {
    state.voice = voiceSel.value as VoiceId;
    engine.setVoice(state.voice);
    persist();
  });
  makamSel.addEventListener('change', () => {
    const m = getMakam(makamSel.value);
    state.makam = m.id as MakamId;
    state.tonic = m.defaultTonic;
    state.detune = makamDetune(m, state.tonic);
    tonicSel.value = String(state.tonic);
    retune();
  });
  tonicSel.addEventListener('change', () => {
    state.tonic = Number(tonicSel.value);
    state.detune = makamDetune(getMakam(state.makam), state.tonic);
    retune();
  });
  usulSel.addEventListener('change', () => {
    const u = getUsul(usulSel.value);
    state.usul = u.id as UsulId;
    state.bpm = u.defaultBpm;
    engine.setUsul(u);
    engine.setTempo(state.bpm);
    renderBeats();
    renderKeys();
    persist();
  });
  const changeTempo = (d: number) => {
    state.bpm = Math.max(30, Math.min(320, state.bpm + d));
    engine.setTempo(state.bpm);
    tempoVal.textContent = String(state.bpm);
    persist();
  };
  tempoDown.addEventListener('click', () => changeTempo(-2));
  tempoUp.addEventListener('click', () => changeTempo(+2));

  const toggleRhythm = () => {
    ensureAudio();
    if (engine.rhythmRunning) engine.stopRhythm();
    else engine.startRhythm(false);
    renderPlay();
  };
  playBtn.addEventListener('click', toggleRhythm);
  fillBtn.addEventListener('click', () => {
    ensureAudio();
    if (engine.rhythmRunning) engine.fill();
    else engine.startRhythm(true);
    fillBtn.classList.remove('flash');
    void fillBtn.offsetWidth;
    fillBtn.classList.add('flash');
    renderPlay();
  });
  engine.onBar = (_bar, fill) => {
    // Light the group markers as the bar plays.
    const u = getUsul(state.usul);
    const marks = [...beats.children];
    const starts = groupStarts(u);
    const stepMs = (60 / state.bpm) * (4 / u.stepUnit) * 1000;
    starts.forEach((s, i) => {
      setTimeout(() => {
        marks.forEach((m, j) => {
          m.classList.toggle('on', j === i);
          m.classList.toggle('fill', fill && j === i);
        });
      }, s * stepMs);
    });
  };

  volume.addEventListener('input', () => {
    state.volume = Number(volume.value);
    engine.setVolume(state.volume);
    persist();
  });
  balance.addEventListener('input', () => {
    state.balance = Number(balance.value);
    engine.setBalance(state.balance);
    persist();
  });
  const shiftOctave = (d: number) => {
    engine.allNotesOff();
    state.octave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, state.octave + d));
    renderKeys();
    persist();
  };
  octDown.addEventListener('click', () => shiftOctave(-1));
  octUp.addEventListener('click', () => shiftOctave(+1));
  detuneToggle.addEventListener('click', () => {
    state.showDetune = !state.showDetune;
    renderKeys();
    persist();
  });
  stepBtn.addEventListener('click', () => {
    state.detuneStep = state.detuneStep === 'koma' ? 'quarter' : 'koma';
    renderTexts();
    persist();
  });
  resetBtn.addEventListener('click', () => {
    state.detune = makamDetune(getMakam(state.makam), state.tonic);
    retune();
  });
  flatBtn.addEventListener('click', () => {
    state.detune = new Array<number>(12).fill(0);
    retune();
  });
  themeBtn.addEventListener('click', () => {
    const order: Theme[] = ['auto', 'light', 'dark'];
    state.theme = order[(order.indexOf(state.theme) + 1) % order.length] ?? 'auto';
    renderTheme();
    persist();
  });
  langSel.addEventListener('change', () => {
    state.lang = langSel.value as Lang;
    renderTexts();
    persist();
  });

  // ---------- QWERTY ----------
  const isFormField = (e: KeyboardEvent) =>
    e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement;
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isFormField(e)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      toggleRhythm();
      return;
    }
    if (e.code === 'ArrowLeft') return shiftOctave(-1);
    if (e.code === 'ArrowRight') return shiftOctave(+1);
    const midi = keyToMidi(e.code, state.octave);
    if (midi === undefined) return;
    e.preventDefault();
    ensureAudio();
    const off = midi - baseMidi(state.octave);
    const id = `k${e.code}`;
    heldOffsets.set(id, off);
    keyboard.setDown(off, +1);
    engine.noteOn(id, freqFor(off));
  });
  window.addEventListener('keyup', (e) => {
    const id = `k${e.code}`;
    const off = heldOffsets.get(id);
    if (off === undefined) return;
    heldOffsets.delete(id);
    keyboard.setDown(off, -1);
    engine.noteOff(id);
  });
  window.addEventListener('blur', () => {
    for (const [id, off] of heldOffsets) if (id.startsWith('k')) keyboard.setDown(off, -1);
    for (const id of [...heldOffsets.keys()]) if (id.startsWith('k')) heldOffsets.delete(id);
    engine.allNotesOff();
  });

  // ---------- Web MIDI (desktop bonus; not available on iOS Safari) ----------
  if (typeof navigator.requestMIDIAccess === 'function') {
    midiBtn.hidden = false;
    midiBtn.addEventListener('click', () => {
      ensureAudio();
      navigator
        .requestMIDIAccess()
        .then((access) => {
          const attach = () =>
            access.inputs.forEach((input) => {
              input.onmidimessage = (msg) => {
                const [status = 0, note = 0, vel = 0] = msg.data ?? [];
                const cmd = status & 0xf0;
                const id = `m${note}`;
                if (cmd === 0x90 && vel > 0) {
                  engine.noteOn(id, tunedFreq(note, state.detune), vel / 127);
                } else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
                  engine.noteOff(id);
                }
              };
            });
          attach();
          access.onstatechange = attach;
          midiBtn.setAttribute('aria-pressed', 'true');
          midiBtn.title = tr('midi.connected');
        })
        .catch(() => midiBtn.setAttribute('aria-pressed', 'false'));
    });
  }

  // ---------- iOS: block pinch / double-tap zoom on the play surface ----------
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  }
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd < 350 && (e.target as Element | null)?.closest?.('.keyboard')) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false },
  );
  // Resume after an interruption (phone call, app switch).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') engine.allNotesOff();
  });

  renderBeats();
  renderTexts();
  syncAudioState();
}

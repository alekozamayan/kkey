import { describe, expect, it } from 'vitest';
import { VOICE_IDS } from '../../src/audio/voices';
import { LANGS, MESSAGES, noteNames, t, type MessageKey } from '../../src/data/i18n';
import { USULS } from '../../src/data/usuls';

describe('i18n', () => {
  const trKeys = Object.keys(MESSAGES.tr).sort();

  it.each(LANGS.map((l) => [l]))('%s has every key and no empty strings', (lang) => {
    expect(Object.keys(MESSAGES[lang]).sort()).toEqual(trKeys);
    for (const v of Object.values(MESSAGES[lang])) expect(v.trim().length).toBeGreaterThan(0);
  });

  it('labels every voice and usul', () => {
    for (const lang of LANGS) {
      for (const v of VOICE_IDS) expect(t(lang, `voice.${v}` as MessageKey)).toBeTruthy();
      for (const u of USULS) expect(t(lang, `usul.${u.id}` as MessageKey)).toBeTruthy();
    }
  });

  it('has 12 note names per language', () => {
    for (const lang of LANGS) expect(noteNames(lang)).toHaveLength(12);
  });

  it('defaults to Turkish strings', () => {
    expect(t('tr', 'start.tap')).toBe('Başlamak için dokun');
    expect(t('en', 'start.tap')).toBe('Tap to start');
  });
});

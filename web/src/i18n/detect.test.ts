import { describe, expect, it } from 'vitest';
import { en } from './en';
import { fr } from './fr';
import { detectLang } from './index';

describe('the language of the site', () => {
  it('takes the visitor’s choice first', () => {
    expect(detectLang('en', ['fr-FR'])).toBe('en');
    expect(detectLang('fr', ['en-US'])).toBe('fr');
  });
  it('else the first browser language Plug speaks', () => {
    expect(detectLang(null, ['fr-FR', 'en-US'])).toBe('fr');
    expect(detectLang(null, ['en-GB', 'fr'])).toBe('en');
    expect(detectLang(null, ['de-DE', 'fr-CH'])).toBe('fr');
    expect(detectLang('xx', ['pt-BR'])).toBe('en');
    expect(detectLang(null, [])).toBe('en');
  });
  it('has the same texts in both languages', () => {
    const keys = (o: object, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v, p + k + '.') : [p + k]));
    expect(keys(en).sort()).toEqual(keys(fr).sort());
  });
});

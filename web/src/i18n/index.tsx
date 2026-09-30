/**
 * The site's language: French or English.
 *
 * Chosen once, in this order: the visitor's own choice (the FR / EN switch,
 * remembered in localStorage), else the languages of their browser
 * (navigator.languages, the list the browser also sends as Accept-Language),
 * the first one Plug speaks. A browser in neither language gets English.
 * The server is told with every API call (X-Plug-Lang), so its messages follow.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import { fr, type Dict } from './fr';

export type Lang = 'fr' | 'en';
export const LANGS: readonly Lang[] = ['fr', 'en'];
const KEY = 'plug.lang';
const DICTS: Record<Lang, Dict> = { fr, en };

/** The saved choice if valid, else the first browser language Plug speaks, else English. */
export function detectLang(saved: string | null | undefined, browser: readonly string[] | undefined): Lang {
  if (saved === 'fr' || saved === 'en') return saved;
  for (const tag of browser ?? []) {
    const primary = tag.toLowerCase().split(/[-_]/)[0];
    if (primary === 'fr' || primary === 'en') return primary;
  }
  return 'en';
}

function saved(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages?.length ? navigator.languages : navigator.language ? [navigator.language] : [];
}

/** Current language for code outside React (the API client). */
let current: Lang = detectLang(saved(), browserLanguages());
export const currentLang = () => current;
export const dict = (lang: Lang = current): Dict => DICTS[lang];

interface LangValue { lang: Lang; t: Dict; setLang: (l: Lang) => void }
const Ctx = createContext<LangValue>({ lang: current, t: DICTS[current], setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);
  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(KEY, l); } catch { /* storage disabled: the choice lasts this visit */ }
    current = l;
    setLangState(l);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo(() => ({ lang, t: DICTS[lang], setLang }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
/** The texts of the current language. */
export const useT = () => useContext(Ctx).t;

/** FR / EN switch. */
export function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={'lang-switch ' + className} role="group" aria-label={t.common.language}>
      {LANGS.map(l => (
        <button key={l} type="button" aria-pressed={lang === l} className={lang === l ? 'is-on' : ''} onClick={() => setLang(l)} lang={l} title={l === 'fr' ? 'Français' : 'English'}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LangSwitch, useT } from '../i18n';
import { Logo } from '../components/Site';
import './inscription.css';

const PRICES = { free: 0, creator: 29, pro: 59, studio: 149 };
type PlanId = keyof typeof PRICES;

// Simulated Google account chooser (a real sign-in needs a server and a Google client id).
const G_ACCOUNTS = [
  { name: 'Léa Martin', email: 'lea.martin@gmail.com', initial: 'L', color: '#7c4dff' },
  { name: 'Studio Nova', email: 'contact@studionova.fr', initial: 'S', color: '#e0559a' }
];

const isMail = (s: string) => /.+@.+\..+/.test(s);

export default function Inscription() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'signup' | 'login'>(params.get('mode') === 'login' ? 'login' : 'signup');
  const t = useT(), g = t.signup;
  const planId: PlanId = (params.get('plan') ?? '') in PRICES ? (params.get('plan') as PlanId) : 'free';
  const [org, setOrg] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [gOpen, setGOpen] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [gOther, setGOther] = useState<string | null>(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => { setMode(params.get('mode') === 'login' ? 'login' : 'signup'); }, [params]);

  const su = mode === 'signup', pName = t.plans.names[planId], pPrice = t.plans.full(PRICES[planId]), pItems = g.plans[planId];

  const pickG = (acc: { email: string; name: string }) => {
    setGLoading(true);
    timer.current = window.setTimeout(() => {
      if (!su) { nav('/editeur'); return; }
      setGOpen(false); setGLoading(false); setGOther(null);
      setEmail(acc.email); setOrg(o => o || acc.name); setDone(true);
    }, 1200);
  };
  const closeG = () => { if (!gLoading) { setGOpen(false); setGOther(null); } };

  useEffect(() => {
    if (!gOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeG(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const submit = () => {
    if (!isMail(email)) return setError(g.badEmail);
    if (pwd.length < 8) return setError(g.shortPassword);
    if (!su) { nav('/editeur'); return; }
    setDone(true);
  };

  return (
    <div className="auth">
      <aside className="auth-visual">
        <div className="auth-visual__top"><Logo /><LangSwitch /></div>
        <div className="auth-visual__copy">
          <h1>{su ? g.h1Signup : g.h1Login}</h1>
          <p>{g.visual}</p>
        </div>
        <div className="auth-plan">
          <div className="auth-plan__head"><span>{g.selectedPlan}</span><Link to="/tarifs">{g.change}</Link></div>
          <div className="auth-plan__name"><span>{pName}</span><span>{pPrice}</span></div>
          <div className="auth-plan__items">{pItems.map(it => <span key={it}>✓ {it}</span>)}</div>
        </div>
      </aside>

      <main className="auth-form">
        <div className="auth-form__inner">
          {done ? (
            <div className="auth-done">
              <div className="auth-done__icon">✓</div>
              <h2>{g.created}</h2>
              <p>{g.createdText(email)}</p>
              <Link to="/editeur" className="btn-dark auth-done__btn">{g.openEditor}</Link>
            </div>
          ) : (
            <>
              <div className="auth-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={su} className={su ? 'is-on' : ''} onClick={() => { setMode('signup'); setError(''); }}>{g.tabSignup}</button>
                <button type="button" role="tab" aria-selected={!su} className={!su ? 'is-on' : ''} onClick={() => { setMode('login'); setError(''); }}>{g.tabLogin}</button>
              </div>
              <div>
                <h2 className="auth-title">{su ? g.titleSignup : g.titleLogin}</h2>
                <p className="auth-sub">{su ? g.subSignup : g.subLogin}</p>
              </div>
              <button type="button" className="g-btn" onClick={() => { setGOpen(true); setGLoading(false); }}><span className="g-logo" />{g.google}</button>
              <div className="auth-or"><span />{g.orEmail}<span /></div>
              <form className="auth-fields" noValidate onSubmit={e => { e.preventDefault(); submit(); }}>
                {su && (
                  <label><span>{g.org}</span><input value={org} onChange={e => setOrg(e.target.value)} placeholder={g.orgPlaceholder} autoComplete="organization" /></label>
                )}
                <label><span>{g.email}</span><input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder={g.emailPlaceholder} autoComplete="email" className={error && !isMail(email) ? 'is-err' : ''} aria-invalid={!!error && !isMail(email)} /></label>
                <label><span>{g.password}</span><input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setError(''); }} placeholder={g.passwordPlaceholder} autoComplete={su ? 'new-password' : 'current-password'} /></label>
                {error && <span className="auth-error" role="alert">{error}</span>}
                <button type="submit" className="auth-submit">{su ? (planId === 'free' ? g.submitFree : g.submitPaid) : g.submitLogin}</button>
              </form>
              <div className="auth-reassure">{g.reassure.map(r => <span key={r}>{r}</span>)}</div>
              <p className="auth-legal">{g.legalA}<a href="#">{g.legalTerms}</a>{g.legalB}<a href="#">{g.legalPrivacy}</a>{g.legalC}</p>
            </>
          )}
        </div>
      </main>

      {gOpen && (
        <div className="g-overlay" onClick={closeG}>
          <div className="g-modal" role="dialog" aria-modal="true" aria-labelledby="g-title" onClick={e => e.stopPropagation()}>
            <div className="g-modal__head"><span className="g-logo g-logo--lg" /><span>{g.gTitle}</span><button type="button" onClick={closeG} aria-label={t.common.close}>×</button></div>
            <div>
              <div id="g-title" className="g-modal__title">{g.gChoose}</div>
              <div className="g-modal__sub">{g.gContinue}</div>
            </div>
            {gLoading ? (
              <div className="g-loading"><span />{g.gLoading}</div>
            ) : (
              <div className="g-list">
                {G_ACCOUNTS.map(a => (
                  <button key={a.email} type="button" className="g-acc" onClick={() => pickG(a)}>
                    <span className="g-acc__avatar" style={{ background: a.color }}>{a.initial}</span>
                    <span className="g-acc__txt"><span>{a.name}</span><span>{a.email}</span></span>
                  </button>
                ))}
                {gOther === null ? (
                  <button type="button" className="g-other" onClick={() => setGOther('')}>{g.gOther}</button>
                ) : (
                  <form className="g-other-form" onSubmit={e => { e.preventDefault(); if (isMail(gOther)) pickG({ email: gOther, name: gOther.split('@')[0] }); }}>
                    <input autoFocus type="email" value={gOther} onChange={e => setGOther(e.target.value)} placeholder={g.gAddress} aria-label={g.gAddress} />
                    <button type="submit" disabled={!isMail(gOther)}>{g.gNext}</button>
                  </form>
                )}
              </div>
            )}
            <p className="g-modal__legal">{g.gLegal}</p>
          </div>
        </div>
      )}
    </div>
  );
}

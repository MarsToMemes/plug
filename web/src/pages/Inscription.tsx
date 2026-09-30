import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Site';
import './inscription.css';

const PLANS: Record<string, [string, string, string[]]> = {
  free: ['Free', '0 €/mois', ['5 min de vidéo montée', 'Export 1080p', 'Sans carte bancaire']],
  creator: ['Creator', '29 €/mois', ['60 min de vidéo montée', 'Export 1080p sans filigrane', 'Réalisation par Claude']],
  pro: ['Pro', '59 €/mois', ['180 min de vidéo montée', 'Tout Creator', '500 Go de stockage']],
  studio: ['Studio', '149 €/mois', ['600 min de vidéo montée', 'Tout Pro', 'Support dédié']]
};

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
  const planId = PLANS[params.get('plan') || ''] ? params.get('plan')! : 'free';
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

  const su = mode === 'signup', [pName, pPrice, pItems] = PLANS[planId];

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
    if (!isMail(email)) return setError('Entrez une adresse e-mail valide.');
    if (pwd.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.');
    if (!su) { nav('/editeur'); return; }
    setDone(true);
  };

  return (
    <div className="auth">
      <aside className="auth-visual">
        <Logo />
        <div className="auth-visual__copy">
          <h1>{su ? 'Montez plus. Publiez plus.' : 'Content de vous revoir'}</h1>
          <p>Votre premier documentaire est monté en quelques minutes.</p>
        </div>
        <div className="auth-plan">
          <div className="auth-plan__head"><span>PLAN SÉLECTIONNÉ</span><Link to="/tarifs">Changer</Link></div>
          <div className="auth-plan__name"><span>{pName}</span><span>{pPrice}</span></div>
          <div className="auth-plan__items">{pItems.map(it => <span key={it}>✓ {it}</span>)}</div>
        </div>
      </aside>

      <main className="auth-form">
        <div className="auth-form__inner">
          {done ? (
            <div className="auth-done">
              <div className="auth-done__icon">✓</div>
              <h2>Compte créé</h2>
              <p>Un lien de confirmation vient d’être envoyé à {email}. Vous pouvez déjà ouvrir l’éditeur.</p>
              <Link to="/editeur" className="btn-dark auth-done__btn">Ouvrir l’éditeur →</Link>
            </div>
          ) : (
            <>
              <div className="auth-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={su} className={su ? 'is-on' : ''} onClick={() => { setMode('signup'); setError(''); }}>Inscription</button>
                <button type="button" role="tab" aria-selected={!su} className={!su ? 'is-on' : ''} onClick={() => { setMode('login'); setError(''); }}>Connexion</button>
              </div>
              <div>
                <h2 className="auth-title">{su ? 'Créez votre compte' : 'Connexion'}</h2>
                <p className="auth-sub">{su ? '5 minutes de vidéo offertes.' : 'Retrouvez vos projets en cours.'}</p>
              </div>
              <button type="button" className="g-btn" onClick={() => { setGOpen(true); setGLoading(false); }}><span className="g-logo" />Continuer avec Google</button>
              <div className="auth-or"><span />ou par e-mail<span /></div>
              <form className="auth-fields" noValidate onSubmit={e => { e.preventDefault(); submit(); }}>
                {su && (
                  <label><span>Nom de la chaîne ou de l’entreprise</span><input value={org} onChange={e => setOrg(e.target.value)} placeholder="ex. Studio Nova" autoComplete="organization" /></label>
                )}
                <label><span>E-mail professionnel</span><input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="vous@entreprise.com" autoComplete="email" className={error && !isMail(email) ? 'is-err' : ''} aria-invalid={!!error && !isMail(email)} /></label>
                <label><span>Mot de passe</span><input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setError(''); }} placeholder="8 caractères minimum" autoComplete={su ? 'new-password' : 'current-password'} /></label>
                {error && <span className="auth-error" role="alert">{error}</span>}
                <button type="submit" className="auth-submit">{su ? (planId === 'free' ? 'Créer mon compte gratuit' : 'Continuer vers le paiement') : 'Se connecter'}</button>
              </form>
              <div className="auth-reassure"><span>✓ Sans carte bancaire</span><span>✓ Vidéos privées</span><span>✓ Résiliable en 1 clic</span></div>
              <p className="auth-legal">En continuant, vous acceptez les <a href="#">CGU</a> et la <a href="#">politique de confidentialité</a>.</p>
            </>
          )}
        </div>
      </main>

      {gOpen && (
        <div className="g-overlay" onClick={closeG}>
          <div className="g-modal" role="dialog" aria-modal="true" aria-labelledby="g-title" onClick={e => e.stopPropagation()}>
            <div className="g-modal__head"><span className="g-logo g-logo--lg" /><span>Se connecter avec Google</span><button type="button" onClick={closeG} aria-label="Fermer">×</button></div>
            <div>
              <div id="g-title" className="g-modal__title">Choisissez un compte</div>
              <div className="g-modal__sub">pour continuer vers Plug</div>
            </div>
            {gLoading ? (
              <div className="g-loading"><span />Connexion en cours…</div>
            ) : (
              <div className="g-list">
                {G_ACCOUNTS.map(a => (
                  <button key={a.email} type="button" className="g-acc" onClick={() => pickG(a)}>
                    <span className="g-acc__avatar" style={{ background: a.color }}>{a.initial}</span>
                    <span className="g-acc__txt"><span>{a.name}</span><span>{a.email}</span></span>
                  </button>
                ))}
                {gOther === null ? (
                  <button type="button" className="g-other" onClick={() => setGOther('')}>+ Utiliser un autre compte</button>
                ) : (
                  <form className="g-other-form" onSubmit={e => { e.preventDefault(); if (isMail(gOther)) pickG({ email: gOther, name: gOther.split('@')[0] }); }}>
                    <input autoFocus type="email" value={gOther} onChange={e => setGOther(e.target.value)} placeholder="Adresse Gmail" aria-label="Adresse Gmail" />
                    <button type="submit" disabled={!isMail(gOther)}>Suivant</button>
                  </form>
                )}
              </div>
            )}
            <p className="g-modal__legal">Google partagera votre nom, votre e-mail et votre photo de profil avec Plug.</p>
          </div>
        </div>
      )}
    </div>
  );
}

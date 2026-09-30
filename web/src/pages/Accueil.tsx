import { Link } from 'react-router-dom';
import { SiteFooter, SiteNav } from '../components/Site';
import HeroDemo from '../components/home/HeroDemo';
import ScriptCard from '../components/home/ScriptCard';
import PacksStack from '../components/home/PacksStack';
import EditorShowcase from '../components/home/EditorShowcase';
import './accueil.css';

interface Plan { name: string; price: string; tag: string; items: string[]; cta: string; id: string; badge?: string }

const PLANS: Plan[] = [
  { name: 'Free', price: '0', tag: 'Pour essayer Plug sur votre sujet.', items: ['5 min de vidéo montée / mois', 'Export 1080p avec filigrane', 'Voix IA ou votre voix'], cta: 'Commencer', id: 'free' },
  { name: 'Creator', price: '29', tag: 'Pour publier chaque semaine.', items: ['60 min de vidéo montée / mois', 'Export 1080p sans filigrane', 'Réalisation par Claude', 'Voix IA ElevenLabs incluse'], cta: 'Choisir Creator', id: 'creator', badge: 'Recommandé' },
  { name: 'Pro', price: '59', tag: 'Pour les chaînes à fort volume.', items: ['180 min de vidéo montée / mois', 'Tout Creator', '500 Go de stockage'], cta: 'Choisir Pro', id: 'pro' },
  { name: 'Studio', price: '149', tag: 'Pour les agences et équipes.', items: ['600 min de vidéo montée / mois', 'Tout Pro', 'Support dédié', '2 To de stockage'], cta: 'Choisir Studio', id: 'studio' }
];

const STEPS = [
  { n: '01', title: 'Écrivez le script', text: 'Une phrase par ligne, # pour un chapitre, les chiffres en chiffres. Plug lit l’intention de chaque phrase : accroche, fait, chiffre, révélation.', mod: 'a' },
  { n: '02', title: 'Ajoutez la voix et vos images', text: 'Voix IA générée depuis le script, ou votre propre voix calée au mot près. Vos photos, vidéos et documents : Claude les décrit pour le monteur.', mod: 'dark' },
  { n: '03', title: 'Plug monte, vous contrôlez', text: 'Titres qui se construisent au mot, chiffres qui comptent, graphiques, cartes, documents surlignés. Planche de contrôle, versions, export 1080p masterisé pour YouTube.', mod: 'b' }
];

export default function Accueil() {
  return (
    <div className="page">
      <header className="home-hero hero-bg">
        <SiteNav packsHref="/tarifs#packs" howHref="#fonctionnement" />

        <div className="home-hero__main">
          <div className="home-kicker"><span>NOUVEAU</span>Documentaires YouTube, style Apple</div>
          <h1 className="home-h1">Votre script,<br />monté comme un docu</h1>
          <div className="home-hero__grid">
            <div>
              <p className="home-lead">Écrivez le script, choisissez une voix. Plug choisit pour chaque phrase l’image la plus authentique, anime titres, chiffres et graphiques au mot près, et livre une vidéo prête à publier. Vous gardez la main sur chaque phrase.</p>
              <div className="home-ctas">
                <Link to="/inscription" className="btn-white">Commencer gratuitement <span aria-hidden="true">→</span></Link>
                <Link to="/tarifs" className="btn-outline-white">Voir les tarifs</Link>
              </div>
              <div className="home-reassure"><span>✓ Sans carte bancaire</span><span>✓ 5 min de vidéo offertes</span><span>✓ Sans engagement</span></div>
            </div>
            <HeroDemo />
          </div>
        </div>

        <div className="home-cards">
          <Link to="/editeur" className="demo-orb">
            <svg width="22" height="24" viewBox="0 0 22 24" aria-hidden="true"><path d="M3 2 L20 12 L3 22 Z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /></svg>
            Voir la démo
          </Link>
          <div className="home-cards__grid">
            <ScriptCard />
            <div className="glass-card glass-card--packs">
              <PacksStack />
              <div>
                <div className="glass-card__title">Le style Apple</div>
                <div className="glass-card__sub glass-card__sub--wide">Coupes franches, titres qui apparaissent au rythme de la voix, chiffres qui comptent, parts qui s’allument, documents recomposés. Chaque montage est vérifié par 158 règles de réalisation.</div>
              </div>
              <Link to="/tarifs#packs" className="btn-outline-white btn-outline-white--sm">Voir les styles <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section id="fonctionnement" className="how">
          <div className="how__head">
            <h2 className="h2">Du script à la vidéo publiée, en trois étapes.</h2>
            <p>Vous écrivez l’histoire. Plug fait le montage qui prendrait une journée.</p>
          </div>
          <div className="how__grid">
            {STEPS.map(s => (
              <div key={s.n} className={'step step--' + s.mod}>
                <div className="step__n">{s.n}</div>
                <div className="step__title">{s.title}</div>
                <div className="step__text">{s.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="showcase" aria-labelledby="showcase-title">
          <div className="showcase__copy">
            <div className="showcase__kicker">L’ÉDITEUR PLUG</div>
            <h2 id="showcase-title">Le monteur propose. Vous imposez.</h2>
            <p>Chaque plan dit pourquoi il existe et quelle image il utilise. Cliquez une phrase pour imposer un visuel, un graphique avec ses vraies données, une source : le montage se refait autour.</p>
            <div><Link to="/editeur" className="btn-grad">Ouvrir l’éditeur →</Link></div>
          </div>
          <div className="showcase__demo"><EditorShowcase /></div>
        </section>

        <section id="tarifs" className="home-pricing">
          <div className="home-pricing__head">
            <h2 className="h2">Un prix simple, en minutes de vidéo.</h2>
            <p>Commencez gratuitement. Changez de plan quand votre chaîne grandit.</p>
          </div>
          <div className="home-pricing__grid">
            {PLANS.map(p => {
              const hot = p.id === 'creator';
              return (
                <div key={p.id} className={'plan' + (hot ? ' plan--hot' : '')}>
                  <div className="plan__head"><span className="plan__name">{p.name}</span>{p.badge && <span className="plan__badge">{p.badge}</span>}</div>
                  <div className="plan__price"><span className="plan__amount">{p.price}</span><span className="plan__per">€/mois</span></div>
                  <div className="plan__tag">{p.tag}</div>
                  <div className="plan__items plan__items--grow">
                    {p.items.map(it => <div key={it} className="plan__item"><span className="plan__check">✓</span><span>{it}</span></div>)}
                  </div>
                  <Link to={'/inscription?plan=' + p.id} className={'plan__cta' + (hot ? ' plan__cta--hot' : p.id === 'free' ? ' plan__cta--free' : '')}>{p.cta}</Link>
                </div>
              );
            })}
          </div>
          <div className="home-pricing__foot">
            <span>Paiement sécurisé</span><span>·</span><span>Résiliable en 1 clic</span><span>·</span><span>Vos vidéos restent privées</span><span>·</span><Link to="/tarifs">Comparer les plans →</Link>
          </div>
        </section>
      </main>

      <section className="cta-final">
        <h2>Votre prochain documentaire est déjà dans votre script</h2>
        <Link to="/inscription" className="cta-final__btn">Commencer gratuitement →</Link>
        <span className="cta-final__note">5 min de vidéo offertes, sans carte bancaire</span>
      </section>

      <SiteFooter links={[['Tarifs', '/tarifs'], ['Éditeur', '/editeur'], ['Confidentialité', '#'], ['CGU', '#']]} />
    </div>
  );
}

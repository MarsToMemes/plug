import { Link } from 'react-router-dom';
import { SiteFooter, SiteNav } from '../components/Site';
import HeroDemo from '../components/home/HeroDemo';
import UploadCard from '../components/home/UploadCard';
import PacksStack from '../components/home/PacksStack';
import EditorShowcase from '../components/home/EditorShowcase';
import './accueil.css';

interface Plan { name: string; price: string; tag: string; items: string[]; cta: string; id: string; badge?: string }

const PLANS: Plan[] = [
  { name: 'Free', price: '0', tag: 'Pour tester Plug sur vos vraies vidéos.', items: ['30 min de rushes traités par l’IA / mois', 'Export 1080p avec filigrane', '5 Go de stockage'], cta: 'Commencer', id: 'free' },
  { name: 'Creator', price: '29', tag: 'Pour publier chaque semaine.', items: ['5 h de rushes traités par l’IA / mois', 'Export 1080p sans filigrane', 'Tous les styles de montage', '100 Go de stockage'], cta: 'Choisir Creator', id: 'creator', badge: 'Recommandé' },
  { name: 'Pro', price: '59', tag: 'Pour les chaînes à fort volume.', items: ['15 h de rushes traités par l’IA / mois', 'Export 4K', 'Rendu prioritaire', '500 Go de stockage'], cta: 'Choisir Pro', id: 'pro' },
  { name: 'Studio', price: '149', tag: 'Pour les agences et équipes.', items: ['50 h de rushes traités par l’IA / mois', '5 sièges inclus', 'Espace équipe partagé', '2 To de stockage'], cta: 'Choisir Studio', id: 'studio' }
];

const STEPS = [
  { n: '01', title: 'Déposez vos rushes', text: 'Glissez vos fichiers bruts, même longs. Plug analyse l’image, le son et la parole.', mod: 'a' },
  { n: '02', title: 'L’IA monte pour vous', text: 'Choisissez un style : vlog, tuto, podcast, gaming. Plug coupe les temps morts et cale le rythme.', mod: 'dark' },
  { n: '03', title: 'Peaufinez et exportez', text: 'Chaque coupe reste modifiable sur la timeline. Exportez en 1080p ou 4K, prêt pour YouTube.', mod: 'b' }
];

export default function Accueil() {
  return (
    <div className="page">
      <header className="home-hero hero-bg">
        <SiteNav packsHref="/tarifs#packs" howHref="#fonctionnement" />

        <div className="home-hero__main">
          <div className="home-kicker"><span>NOUVEAU</span>Montage IA automatique pour YouTube</div>
          <h1 className="home-h1">Vos rushes,<br />montés par l’IA</h1>
          <div className="home-hero__grid">
            <div>
              <p className="home-lead">Déposez vos fichiers bruts. Plug coupe, rythme et assemble une vidéo prête à publier. Vous gardez la main sur chaque plan.</p>
              <div className="home-ctas">
                <Link to="/inscription" className="btn-white">Commencer gratuitement <span aria-hidden="true">→</span></Link>
                <Link to="/tarifs" className="btn-outline-white">Voir les tarifs</Link>
              </div>
              <div className="home-reassure"><span>✓ Sans carte bancaire</span><span>✓ 30 min de montage IA offertes</span><span>✓ Sans engagement</span></div>
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
            <UploadCard />
            <div className="glass-card glass-card--packs">
              <PacksStack />
              <div>
                <div className="glass-card__title">Packs Motion &amp; Style</div>
                <div className="glass-card__sub glass-card__sub--wide">Transitions, titres animés et étalonnages créés par des motion designers. Appliqués en un clic, dès 19 €.</div>
              </div>
              <Link to="/tarifs#packs" className="btn-outline-white btn-outline-white--sm">Découvrir les packs <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section id="fonctionnement" className="how">
          <div className="how__head">
            <h2 className="h2">Du rush brut à la vidéo publiée, en trois étapes.</h2>
            <p>Le montage qui vous prenait une journée tient dans une pause café.</p>
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
            <h2 id="showcase-title">L’IA fait le premier montage. Vous signez le final.</h2>
            <p>Une timeline complète, des pistes titres et audio, un inspecteur précis. Tout ce que l’IA propose se corrige à la frame près.</p>
            <div><Link to="/editeur" className="btn-grad">Ouvrir l’éditeur →</Link></div>
          </div>
          <div className="showcase__demo"><EditorShowcase /></div>
        </section>

        <section id="tarifs" className="home-pricing">
          <div className="home-pricing__head">
            <h2 className="h2">Un prix simple. Des minutes IA claires.</h2>
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
        <h2>Votre prochaine vidéo est déjà dans vos rushes</h2>
        <Link to="/inscription" className="cta-final__btn">Commencer gratuitement →</Link>
        <span className="cta-final__note">30 min de montage IA offertes, sans carte bancaire</span>
      </section>

      <SiteFooter links={[['Tarifs', '/tarifs'], ['Éditeur', '/editeur'], ['Confidentialité', '#'], ['CGU', '#']]} />
    </div>
  );
}

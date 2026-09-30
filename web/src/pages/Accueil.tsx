import { Link } from 'react-router-dom';
import { SiteFooter, SiteNav } from '../components/Site';
import HeroDemo from '../components/home/HeroDemo';
import ScriptCard from '../components/home/ScriptCard';
import PacksStack from '../components/home/PacksStack';
import EditorShowcase from '../components/home/EditorShowcase';
import { useT } from '../i18n';
import './accueil.css';

const PLAN_IDS = ['free', 'creator', 'pro', 'studio'] as const;
const PRICES = { free: 0, creator: 29, pro: 59, studio: 149 };
const STEP_MODS = ['a', 'dark', 'b'];

export default function Accueil() {
  const t = useT(), h = t.home;
  return (
    <div className="page">
      <header className="home-hero hero-bg">
        <SiteNav packsHref="/tarifs#packs" howHref="#fonctionnement" />

        <div className="home-hero__main">
          <div className="home-kicker"><span>{h.kickerNew}</span>{h.kicker}</div>
          <h1 className="home-h1">{h.h1a}<br />{h.h1b}</h1>
          <div className="home-hero__grid">
            <div>
              <p className="home-lead">{h.lead}</p>
              <div className="home-ctas">
                <Link to="/inscription" className="btn-white">{h.ctaStart} <span aria-hidden="true">→</span></Link>
                <Link to="/tarifs" className="btn-outline-white">{h.ctaPricing}</Link>
              </div>
              <div className="home-reassure">{h.reassure.map(r => <span key={r}>{r}</span>)}</div>
            </div>
            <HeroDemo />
          </div>
        </div>

        <div className="home-cards">
          <Link to="/editeur" className="demo-orb">
            <svg width="22" height="24" viewBox="0 0 22 24" aria-hidden="true"><path d="M3 2 L20 12 L3 22 Z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /></svg>
            {h.demo}
          </Link>
          <div className="home-cards__grid">
            <ScriptCard />
            <div className="glass-card glass-card--packs">
              <PacksStack />
              <div>
                <div className="glass-card__title">{h.styleCardTitle}</div>
                <div className="glass-card__sub glass-card__sub--wide">{h.styleCardText}</div>
              </div>
              <Link to="/tarifs#packs" className="btn-outline-white btn-outline-white--sm">{h.styleCardCta} <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section id="fonctionnement" className="how">
          <div className="how__head">
            <h2 className="h2">{h.howTitle}</h2>
            <p>{h.howText}</p>
          </div>
          <div className="how__grid">
            {h.steps.map((s, i) => (
              <div key={i} className={'step step--' + STEP_MODS[i]}>
                <div className="step__n">{String(i + 1).padStart(2, '0')}</div>
                <div className="step__title">{s.title}</div>
                <div className="step__text">{s.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="showcase" aria-labelledby="showcase-title">
          <div className="showcase__copy">
            <div className="showcase__kicker">{h.showcaseKicker}</div>
            <h2 id="showcase-title">{h.showcaseTitle}</h2>
            <p>{h.showcaseText}</p>
            <div><Link to="/editeur" className="btn-grad">{h.showcaseCta}</Link></div>
          </div>
          <div className="showcase__demo"><EditorShowcase /></div>
        </section>

        <section id="tarifs" className="home-pricing">
          <div className="home-pricing__head">
            <h2 className="h2">{h.pricingTitle}</h2>
            <p>{h.pricingText}</p>
          </div>
          <div className="home-pricing__grid">
            {PLAN_IDS.map(id => {
              const hot = id === 'creator', name = t.plans.names[id], plan = h.plans[id];
              return (
                <div key={id} className={'plan' + (hot ? ' plan--hot' : '')}>
                  <div className="plan__head"><span className="plan__name">{name}</span>{hot && <span className="plan__badge">{t.plans.recommended}</span>}</div>
                  <div className="plan__price"><span className="plan__amount">{t.plans.amount(PRICES[id])}</span><span className="plan__per">{t.plans.perMonth}</span></div>
                  <div className="plan__tag">{plan.tag}</div>
                  <div className="plan__items plan__items--grow">
                    {plan.items.map(it => <div key={it} className="plan__item"><span className="plan__check">✓</span><span>{it}</span></div>)}
                  </div>
                  <Link to={'/inscription?plan=' + id} className={'plan__cta' + (hot ? ' plan__cta--hot' : id === 'free' ? ' plan__cta--free' : '')}>{id === 'free' ? t.plans.start : t.plans.choose(name)}</Link>
                </div>
              );
            })}
          </div>
          <div className="home-pricing__foot">
            {h.pricingFoot.flatMap(f => [<span key={f}>{f}</span>, <span key={f + '·'}>·</span>])}<Link to="/tarifs">{h.compare}</Link>
          </div>
        </section>
      </main>

      <section className="cta-final">
        <h2>{h.finalTitle}</h2>
        <Link to="/inscription" className="cta-final__btn">{h.ctaStart} →</Link>
        <span className="cta-final__note">{h.finalNote}</span>
      </section>

      <SiteFooter links={[[t.nav.pricing, '/tarifs'], [t.nav.editor, '/editeur'], [t.nav.privacy, '#'], [t.nav.terms, '#']]} />
    </div>
  );
}

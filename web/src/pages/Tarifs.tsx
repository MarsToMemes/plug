import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteFooter, SiteNav } from '../components/Site';
import { photo, type PhotoKey } from '../media/catalog';
import { useT } from '../i18n';
import './tarifs.css';

/** Annual billing selected by default (the prototype's "defaultYearly" tweak). */
const DEFAULT_YEARLY = false;

const PLAN_IDS = ['free', 'creator', 'pro', 'studio'] as const;
const MONTHLY = { free: 0, creator: 29, pro: 59, studio: 149 };
const PACK_ART: [string, PhotoKey][] = [['linear-gradient(135deg,#1a1a1a,#8a5cff)', 'cinema'], ['linear-gradient(135deg,#0f3340,#ff6fb0)', 'travel']];

export default function Tarifs() {
  const [yearly, setYearly] = useState(DEFAULT_YEARLY);
  const [open, setOpen] = useState(0);
  const t = useT(), pr = t.pricing;

  return (
    <div className="page">
      <header className="pr-hero">
        <SiteNav packsHref="#packs" />
        <div className="pr-hero__body">
          <h1>{pr.h1}</h1>
          <p>{pr.lead}</p>
          <div className="pr-toggle" role="group" aria-label={pr.billing}>
            <button type="button" aria-pressed={!yearly} className={!yearly ? 'is-on' : ''} onClick={() => setYearly(false)}>{pr.monthly}</button>
            <button type="button" aria-pressed={yearly} className={yearly ? 'is-on' : ''} onClick={() => setYearly(true)}>{pr.yearly} <span>−20 %</span></button>
          </div>
        </div>
      </header>

      <main className="pr-main">
        <section className="pr-plans" aria-label="Plans">
          <div className="pr-plans__grid">
            {PLAN_IDS.map(id => {
              const m = MONTHLY[id], name = t.plans.names[id], { tag, items } = pr.plans[id];
              const hot = id === 'creator', price = yearly ? Math.round(m * 0.8) : m;
              const cta = id === 'free' ? t.plans.start : t.plans.choose(name), badge = hot ? t.plans.recommended : '';
              const billing = m === 0 ? pr.freeForever : yearly ? pr.billedYearly(price * 12) : pr.billedMonthly;
              return (
                <div key={id} className={'plan pr-plan' + (hot ? ' plan--hot' : '')}>
                  <div className="plan__head"><span className="plan__name pr-plan__name">{name}</span>{badge && <span className="plan__badge">{badge}</span>}</div>
                  <div className="pr-plan__tag">{tag}</div>
                  <div className="plan__price"><span className="plan__amount pr-plan__amount">{t.plans.amount(price)}</span><span className="plan__per">{t.plans.perMonth}</span></div>
                  <div className="pr-plan__billing">{billing}</div>
                  <Link to={'/inscription?plan=' + id} className={'plan__cta' + (hot ? ' plan__cta--hot' : id === 'free' ? ' plan__cta--free' : '')}>{cta}</Link>
                  <div className="pr-plan__sep" />
                  <div className="plan__items pr-plan__items">
                    {items.map(it => <div key={it} className="plan__item"><span className="plan__check">✓</span><span>{it}</span></div>)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pr-note">{pr.note.flatMap((n, i) => [...(i ? [<span key={'s' + i}>·</span>] : []), <span key={n}>{n}</span>])}</div>
        </section>

        <section className="pr-compare">
          <h2 className="pr-h2">{pr.compareTitle}</h2>
          <div className="pr-table" role="region" aria-label={pr.compareLabel} tabIndex={0}>
            {/* Rows are CSS grids (display changes drop native table roles, so they are restated). */}
            <table role="table">
              <thead role="rowgroup">
                <tr role="row"><td role="cell" />{PLAN_IDS.map(id => <th key={id} role="columnheader" scope="col" className={id === 'creator' ? 'is-hot' : undefined}>{t.plans.names[id]}</th>)}</tr>
              </thead>
              <tbody role="rowgroup">
                {pr.rows.map(([label, vals]) => (
                  <tr key={label} role="row"><th role="rowheader" scope="row">{label}</th>{vals.map((v, i) => <td key={i} role="cell">{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="packs" className="pr-packs">
          <div className="pr-packs__head">
            <div>
              <span className="pr-packs__kicker">{pr.stylesKicker}</span>
              <h2 className="pr-h2">{pr.stylesTitle}</h2>
              <p>{pr.stylesText}</p>
            </div>
            <span className="pr-packs__range">{pr.included}</span>
          </div>
          <div className="pr-packs__grid">
            {pr.styles.map(([name, desc], i) => (
              <div key={name} className="pack">
                <img src={photo(PACK_ART[i]![1], 720)} alt="" style={{ background: PACK_ART[i]![0] }} />
                <div className="pack__body">
                  <div className="pack__row"><span>{name}</span><span>{pr.included}</span></div>
                  <span className="pack__desc">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pr-faq">
          <h2 className="pr-h2">{pr.faqTitle}</h2>
          <div>
            {pr.faq.map(([q, a], i) => {
              const isOpen = open === i;
              return (
                <div key={q} className="faq">
                  <button type="button" className="faq__q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                    <span>{q}</span><span className="faq__sign" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && <div className="faq__a">{a}</div>}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <section className="cta-final cta-final--tarifs">
        <h2>{pr.finalTitle}</h2>
        <Link to="/inscription" className="cta-final__btn">{pr.finalCta}</Link>
      </section>
      <SiteFooter links={[[t.nav.home, '/'], [t.nav.editor, '/editeur'], [t.nav.terms, '#']]} />
    </div>
  );
}

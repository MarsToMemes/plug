import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteFooter, SiteNav } from '../components/Site';
import { photo, type PhotoKey } from '../media/catalog';
import './tarifs.css';

/** Annual billing selected by default (the prototype's "defaultYearly" tweak). */
const DEFAULT_YEARLY = false;

const PLANS: [name: string, monthly: number, tag: string, items: string[], cta: string, id: string, badge: string][] = [
  ['Free', 0, 'Pour tester Plug sur vos vraies vidéos.', ['30 min de rushes traités / mois', 'Export 1080p avec filigrane', '3 projets actifs', '5 Go de stockage'], 'Commencer', 'free', ''],
  ['Creator', 29, 'Pour les créateurs qui publient chaque semaine.', ['5 h de rushes traités / mois', 'Export 1080p sans filigrane', 'Tous les styles de montage', 'Projets illimités', '100 Go de stockage'], 'Choisir Creator', 'creator', 'Recommandé'],
  ['Pro', 59, 'Pour les chaînes à fort volume.', ['15 h de rushes traités / mois', 'Export 4K', 'Rendu prioritaire', 'Marque personnalisée', '500 Go de stockage'], 'Choisir Pro', 'pro', ''],
  ['Studio', 149, 'Pour les agences et les équipes marketing.', ['50 h de rushes traités / mois', '5 sièges inclus', 'Espace équipe et validation', 'Support dédié', '2 To de stockage'], 'Choisir Studio', 'studio', '']
];

const ROWS: [string, string[]][] = [
  ['Rushes traités par l’IA / mois', ['30 min', '5 h', '15 h', '50 h']],
  ['Heures supplémentaires', ['—', '6 € / h', '5 € / h', '4 € / h']],
  ['Résolution d’export', ['1080p', '1080p', '4K', '4K']],
  ['Filigrane', ['Oui', 'Non', 'Non', 'Non']],
  ['Styles de montage IA', ['3', 'Tous', 'Tous', 'Tous']],
  ['File de rendu', ['Standard', 'Standard', 'Prioritaire', 'Prioritaire']],
  ['Sièges', ['1', '1', '1', '5']],
  ['Stockage', ['5 Go', '100 Go', '500 Go', '2 To']]
];

const PACKS: [string, number, string, string, PhotoKey][] = [
  ['Neon Pulse', 29, 'Titres néon et transitions rythmées pour le gaming.', 'linear-gradient(135deg,#2a1540,#ff6fb0)', 'concert'],
  ['Docu Press', 39, 'Cartons, surlignages et chiffres clés façon enquête.', 'linear-gradient(135deg,#1a1a1a,#FFC72C)', 'cinema'],
  ['Soft Vlog', 19, 'Étalonnage doux et sous-titres arrondis.', 'linear-gradient(135deg,#f0a9cf,#ffd29a)', 'travel'],
  ['Tech Clean', 49, 'Callouts, zooms écran et habillage produit.', 'linear-gradient(135deg,#0f3340,#8a5cff)', 'neon']
];

const FAQ: [string, string][] = [
  ['Que compte une « heure de rushes traitée » ?', 'La durée des fichiers bruts que l’IA analyse et monte. Une vidéo finale de 15 min issue de 1 h de rushes consomme 1 h. Les retouches manuelles dans l’éditeur ne consomment rien.'],
  ['Que se passe-t-il si je dépasse mon quota ?', 'Plug vous prévient à 80 %. Vous pouvez acheter des heures à l’unité ou passer au plan supérieur, sans perdre votre travail.'],
  ['Puis-je changer de plan à tout moment ?', 'Oui. Le passage à un plan supérieur est immédiat et calculé au prorata. La résiliation prend effet à la fin de la période.'],
  ['Mes vidéos servent-elles à entraîner l’IA ?', 'Non. Vos fichiers restent privés et ne sont jamais utilisés pour entraîner des modèles.'],
  ['Les packs sont-ils inclus dans les abonnements ?', 'Non, ce sont des achats uniques. Une fois achetés, ils restent à vous, même si vous changez de plan.']
];

export default function Tarifs() {
  const [yearly, setYearly] = useState(DEFAULT_YEARLY);
  const [open, setOpen] = useState(0);

  return (
    <div className="page">
      <header className="pr-hero">
        <SiteNav packsHref="#packs" />
        <div className="pr-hero__body">
          <h1>Payez pour le montage, pas pour la complexité</h1>
          <p>Chaque plan inclut un volume d’heures de rushes traitées par l’IA. L’éditeur, lui, est illimité.</p>
          <div className="pr-toggle" role="group" aria-label="Période de facturation">
            <button type="button" aria-pressed={!yearly} className={!yearly ? 'is-on' : ''} onClick={() => setYearly(false)}>Mensuel</button>
            <button type="button" aria-pressed={yearly} className={yearly ? 'is-on' : ''} onClick={() => setYearly(true)}>Annuel <span>−20 %</span></button>
          </div>
        </div>
      </header>

      <main className="pr-main">
        <section className="pr-plans" aria-label="Plans">
          <div className="pr-plans__grid">
            {PLANS.map(([name, m, tag, items, cta, id, badge]) => {
              const hot = id === 'creator', price = yearly ? Math.round(m * 0.8) : m;
              const billing = m === 0 ? 'Gratuit pour toujours' : yearly ? 'soit ' + price * 12 + ' € facturés par an' : 'facturé chaque mois';
              return (
                <div key={id} className={'plan pr-plan' + (hot ? ' plan--hot' : '')}>
                  <div className="plan__head"><span className="plan__name pr-plan__name">{name}</span>{badge && <span className="plan__badge">{badge}</span>}</div>
                  <div className="pr-plan__tag">{tag}</div>
                  <div className="plan__price"><span className="plan__amount pr-plan__amount">{price}</span><span className="plan__per">€/mois</span></div>
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
          <div className="pr-note"><span>Sans carte bancaire pour Free</span><span>·</span><span>Résiliable en 1 clic</span><span>·</span><span>TVA incluse</span></div>
        </section>

        <section className="pr-compare">
          <h2 className="pr-h2">Comparer en détail</h2>
          <div className="pr-table" role="region" aria-label="Tableau comparatif" tabIndex={0}>
            {/* Rows are CSS grids (display changes drop native table roles, so they are restated). */}
            <table role="table">
              <thead role="rowgroup">
                <tr role="row"><td role="cell" /><th role="columnheader" scope="col">Free</th><th role="columnheader" scope="col" className="is-hot">Creator</th><th role="columnheader" scope="col">Pro</th><th role="columnheader" scope="col">Studio</th></tr>
              </thead>
              <tbody role="rowgroup">
                {ROWS.map(([label, vals]) => (
                  <tr key={label} role="row"><th role="rowheader" scope="row">{label}</th>{vals.map((v, i) => <td key={i} role="cell">{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="packs" className="pr-packs">
          <div className="pr-packs__head">
            <div>
              <span className="pr-packs__kicker">PACKS MOTION &amp; STYLE</span>
              <h2 className="pr-h2">Une identité visuelle en un clic.</h2>
              <p>Achat unique, utilisable sur toutes vos vidéos. Compatible avec tous les plans, y compris Free.</p>
            </div>
            <span className="pr-packs__range">19 à 49 € l’unité</span>
          </div>
          <div className="pr-packs__grid">
            {PACKS.map(([name, price, desc, bg, img]) => (
              <div key={name} className="pack">
                <img src={photo(img, 720)} alt="" style={{ background: bg }} />
                <div className="pack__body">
                  <div className="pack__row"><span>{name}</span><span>{price} €</span></div>
                  <span className="pack__desc">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pr-faq">
          <h2 className="pr-h2">Questions fréquentes</h2>
          <div>
            {FAQ.map(([q, a], i) => {
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
        <h2>30 minutes offertes pour essayer</h2>
        <Link to="/inscription" className="cta-final__btn">Créer mon compte gratuit →</Link>
      </section>
      <SiteFooter links={[['Accueil', '/'], ['Éditeur', '/editeur'], ['CGU', '#']]} />
    </div>
  );
}

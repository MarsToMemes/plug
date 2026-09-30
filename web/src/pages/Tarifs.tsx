import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteFooter, SiteNav } from '../components/Site';
import { photo, type PhotoKey } from '../media/catalog';
import './tarifs.css';

/** Annual billing selected by default (the prototype's "defaultYearly" tweak). */
const DEFAULT_YEARLY = false;

const PLANS: [name: string, monthly: number, tag: string, items: string[], cta: string, id: string, badge: string][] = [
  ['Gratuit', 0, 'Pour essayer Plug sur votre sujet.', ['5 min de vidéo montée / mois', 'Export 1080p avec filigrane', 'Voix IA ou votre voix', '3 projets actifs', '5 Go de stockage'], 'Commencer', 'free', ''],
  ['Créateur', 29, 'Pour les créateurs qui publient chaque semaine.', ['60 min de vidéo montée / mois', 'Export 1080p sans filigrane', 'Réalisation par Claude', 'Voix IA ElevenLabs incluse', 'Projets illimités', '100 Go de stockage'], 'Choisir Créateur', 'creator', 'Recommandé'],
  ['Pro', 59, 'Pour les chaînes à fort volume.', ['180 min de vidéo montée / mois', 'Tout Créateur', 'Projets illimités', '500 Go de stockage'], 'Choisir Pro', 'pro', ''],
  ['Studio', 149, 'Pour les agences et les équipes éditoriales.', ['600 min de vidéo montée / mois', 'Tout Pro', 'Support dédié', '2 To de stockage'], 'Choisir Studio', 'studio', '']
];

const ROWS: [string, string[]][] = [
  ['Vidéo montée / mois', ['5 min', '60 min', '180 min', '600 min']],
  ['Minutes supplémentaires', ['—', '0,60 € / min', '0,50 € / min', '0,40 € / min']],
  ['Résolution d’export', ['1080p', '1080p', '1080p', '1080p']],
  ['Filigrane', ['Oui', 'Non', 'Non', 'Non']],
  ['Voix IA ElevenLabs', ['Oui', 'Oui', 'Oui', 'Oui']],
  ['Réalisation par Claude', ['Non', 'Oui', 'Oui', 'Oui']],
  ['Description automatique des images', ['Non', 'Oui', 'Oui', 'Oui']],
  ['Stockage', ['5 Go', '100 Go', '500 Go', '2 To']]
];

const PACKS: [string, string, string, string, PhotoKey][] = [
  ['Style Apple', 'Inclus', 'Coupes franches, titres au rythme de la voix, chiffres qui comptent, parts qui s’allument, documents recomposés.', 'linear-gradient(135deg,#1a1a1a,#8a5cff)', 'cinema'],
  ['Style classique', 'Inclus', 'Photos et vidéos plein cadre, mouvements de caméra, sous-titres mot à mot, transitions douces.', 'linear-gradient(135deg,#0f3340,#ff6fb0)', 'travel']
];

const FAQ: [string, string][] = [
  ['Que compte une « minute de vidéo montée » ?', 'La durée de la vidéo finale exportée en 1080p. Les aperçus 540p, la planche de contrôle et les réglages de phrase ne consomment rien.'],
  ['D’où viennent les images ?', 'De vous : vos photos, vidéos, captures et documents. Plug ne télécharge aucune image sans licence vérifiée. Quand une image manque, il vous dit laquelle chercher et où (Wikimedia Commons, kits presse, Pexels).'],
  ['Dois-je enregistrer ma voix ?', 'Non. La voix IA est générée depuis votre script. Vous pouvez aussi importer votre propre voix : chaque mot est calé sur l’image.'],
  ['Que se passe-t-il si je dépasse mon quota ?', 'Plug vous prévient à 80 %. Vous pouvez acheter des minutes à l’unité ou passer au plan supérieur, sans perdre votre travail.'],
  ['Puis-je changer de plan à tout moment ?', 'Oui. Le passage à un plan supérieur est immédiat et calculé au prorata. La résiliation prend effet à la fin de la période.'],
  ['Mes vidéos servent-elles à entraîner l’IA ?', 'Non. Vos fichiers restent privés et ne sont jamais utilisés pour entraîner des modèles.'],
  ['Les styles sont-ils inclus ?', 'Oui. Les styles Apple et classique sont inclus dans tous les plans, y compris Gratuit.']
];

export default function Tarifs() {
  const [yearly, setYearly] = useState(DEFAULT_YEARLY);
  const [open, setOpen] = useState(0);

  return (
    <div className="page">
      <header className="pr-hero">
        <SiteNav packsHref="#packs" />
        <div className="pr-hero__body">
          <h1>Payez pour la vidéo, pas pour la complexité</h1>
          <p>Chaque plan inclut des minutes de vidéo montée. Les aperçus, la planche de contrôle et les réglages, eux, sont illimités.</p>
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
          <div className="pr-note"><span>Sans carte bancaire pour l’offre Gratuit</span><span>·</span><span>Résiliable en 1 clic</span><span>·</span><span>TVA incluse</span></div>
        </section>

        <section className="pr-compare">
          <h2 className="pr-h2">Comparer en détail</h2>
          <div className="pr-table" role="region" aria-label="Tableau comparatif" tabIndex={0}>
            {/* Rows are CSS grids (display changes drop native table roles, so they are restated). */}
            <table role="table">
              <thead role="rowgroup">
                <tr role="row"><td role="cell" /><th role="columnheader" scope="col">Gratuit</th><th role="columnheader" scope="col" className="is-hot">Créateur</th><th role="columnheader" scope="col">Pro</th><th role="columnheader" scope="col">Studio</th></tr>
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
              <span className="pr-packs__kicker">STYLES DE MONTAGE</span>
              <h2 className="pr-h2">Un style, choisi en un clic.</h2>
              <p>Inclus dans tous les plans, y compris Gratuit. Le même script peut être monté dans chaque style.</p>
            </div>
            <span className="pr-packs__range">Inclus</span>
          </div>
          <div className="pr-packs__grid">
            {PACKS.map(([name, price, desc, bg, img]) => (
              <div key={name} className="pack">
                <img src={photo(img, 720)} alt="" style={{ background: bg }} />
                <div className="pack__body">
                  <div className="pack__row"><span>{name}</span><span>{price}</span></div>
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
        <h2>5 minutes de vidéo offertes pour essayer</h2>
        <Link to="/inscription" className="cta-final__btn">Créer mon compte gratuit →</Link>
      </section>
      <SiteFooter links={[['Accueil', '/'], ['Éditeur', '/editeur'], ['CGU', '#']]} />
    </div>
  );
}

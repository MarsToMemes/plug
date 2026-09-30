import { useEffect, useRef, useState } from 'react';
import { api, INTENT_LABEL, INTENTS, MEDIA_NEEDS, NEED_LABEL, REAL_SUBJECT_NEEDS, type Intent, type MediaNeed, type Project, type SentenceHints } from '../../lib/api';

type ChartKind = NonNullable<SentenceHints['chart']>['kind'];
const CHART_KINDS: [ChartKind, string][] = [['barChart', 'Barres'], ['lineChart', 'Courbe'], ['pieChart', 'Camembert']];

/** Form state: every field as typed (strings), turned into hints on save. */
interface Form {
  intent: Intent | '';
  mediaNeed: MediaNeed | '';
  media: string;
  mediaStart: string;
  source: string;
  strike: string;
  chartOn: boolean;
  chartKind: ChartKind;
  chartRows: Array<[string, string]>;
  chartUnit: string;
  chartTitle: string;
  chartSource: string;
  shareOn: boolean;
  shareValue: string;
  shareOf: string;
  shareLabel: string;
  docOn: boolean;
  docHeader: string;
  docHeading: string;
  docSentence: string;
  docRows: Array<[string, string]>;
}

const toForm = (h: SentenceHints = {}): Form => ({
  intent: h.intent ?? '',
  mediaNeed: h.mediaNeed ?? '',
  media: h.media ?? '',
  mediaStart: h.mediaStart ? String(h.mediaStart) : '',
  source: h.source ?? '',
  strike: h.strike ?? '',
  chartOn: !!h.chart,
  chartKind: h.chart?.kind ?? 'barChart',
  chartRows: h.chart ? h.chart.labels.map((l, i) => [l, String(h.chart!.values[i] ?? '')]) : [['', ''], ['', '']],
  chartUnit: h.chart?.unit ?? '',
  chartTitle: h.chart?.title ?? '',
  chartSource: h.chart?.source ?? '',
  shareOn: !!h.share,
  shareValue: h.share ? String(h.share.value) : '',
  shareOf: h.share?.of !== undefined ? String(h.share.of) : '',
  shareLabel: h.share?.label ?? '',
  docOn: !!h.documentCard,
  docHeader: h.documentCard?.header ?? '',
  docHeading: h.documentCard?.heading ?? '',
  docSentence: h.documentCard?.sentence ?? '',
  docRows: h.documentCard?.rows?.length ? h.documentCard.rows : [['', '']]
});

/** What the server validates; empty fields are left out. */
const toHints = (f: Form): Record<string, unknown> => {
  const rows = f.chartRows.filter(([l, v]) => l.trim() || v.trim());
  return {
    ...(f.intent ? { intent: f.intent } : {}),
    ...(f.mediaNeed ? { mediaNeed: f.mediaNeed } : {}),
    ...(f.media ? { media: f.media, ...(f.mediaStart.trim() ? { mediaStart: f.mediaStart.trim() } : {}) } : {}),
    ...(f.source.trim() ? { source: f.source } : {}),
    ...(f.strike.trim() ? { strike: f.strike } : {}),
    ...(f.chartOn && rows.length ? { chart: { kind: f.chartKind, labels: rows.map(r => r[0]), values: rows.map(r => r[1].trim()), unit: f.chartUnit, title: f.chartTitle, source: f.chartSource } } : {}),
    ...(f.shareOn && f.shareValue.trim() ? { share: { value: f.shareValue, of: f.shareOf, label: f.shareLabel } } : {}),
    ...(f.docOn && f.docSentence.trim() ? { documentCard: { header: f.docHeader, heading: f.docHeading, sentence: f.docSentence, rows: f.docRows } } : {})
  };
};

function Rows({ rows, onChange, labels, max }: { rows: Array<[string, string]>; onChange: (r: Array<[string, string]>) => void; labels: [string, string]; max: number }) {
  const set = (i: number, k: 0 | 1, v: string) => onChange(rows.map((r, j) => (j === i ? (k === 0 ? [v, r[1]] : [r[0], v]) : r)));
  return (
    <div className="se-rows">
      {rows.map((r, i) => (
        <div key={i} className="se-rows__row">
          <input className="ed-input" value={r[0]} placeholder={labels[0]} aria-label={`${labels[0]} ${i + 1}`} onChange={e => set(i, 0, e.target.value)} />
          <input className="ed-input se-rows__val" value={r[1]} placeholder={labels[1]} aria-label={`${labels[1]} ${i + 1}`} onChange={e => set(i, 1, e.target.value)} />
          <button type="button" className="se-x" aria-label={`Retirer la ligne ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      {rows.length < max && <button type="button" className="se-add" onClick={() => onChange([...rows, ['', '']])}>+ Ajouter une ligne</button>}
    </div>
  );
}

function Section({ title, on, onToggle, children, hint }: { title: string; on: boolean; onToggle: () => void; children: React.ReactNode; hint: string }) {
  return (
    <div className="ed-box">
      <div className="se-sec"><span className="ed-box__label ed-grow">{title}</span><button type="button" className={'ed-switch' + (on ? ' is-on' : '')} role="switch" aria-checked={on} aria-label={title} onClick={onToggle}><span /></button></div>
      {on ? children : <span className="ed-sub">{hint}</span>}
    </div>
  );
}

/**
 * What the author fixes on one sentence: the engine guesses the rest. Saved on the
 * server keyed by the script line; "Enregistrer et remonter" re-runs the edit.
 */
/**
 * Runway makes a visual for this sentence (on request: it costs credits). Refused when the
 * sentence must show something real (bible MED-07): a generated picture never stands for it.
 */
function RunwayBox({ project, line, need, onSaved, onError }: { project: Project; line: string; need: MediaNeed | undefined; onSaved: (p: Project) => void; onError: (m: string) => void }) {
  const [prompt, setPrompt] = useState(line);
  const [kind, setKind] = useState<'video' | 'image'>('video');
  const [seconds, setSeconds] = useState('5');
  const [sending, setSending] = useState(false);
  const mine = (project.generations ?? []).filter(g => g.line === line);
  const pending = mine.some(g => g.status === 'pending');
  if (need && REAL_SUBJECT_NEEDS.includes(need))
    return <span className="ed-sub">Cette phrase montre du réel ({NEED_LABEL[need].toLowerCase()}) : une image générée ne peut pas la représenter. Cherchez une vraie photo ou vidéo (Wikimedia Commons, kit presse, Pexels).</span>;
  const go = async () => {
    setSending(true);
    try { onSaved(await api.generate(project.id, { prompt, kind, seconds: Number(seconds) || 5, line })); } catch (e) { onError((e as Error).message); } finally { setSending(false); }
  };
  return (
    <>
      <textarea className="ed-input se-area" value={prompt} onChange={e => setPrompt(e.target.value)} aria-label="Ce que Runway doit montrer" placeholder="Décrivez l’image : sujet, lieu, lumière, mouvement de caméra." />
      <div className="se-pair">
        <div className="ed-seg se-grow">{([['video', 'Vidéo'], ['image', 'Image']] as const).map(([k, l]) => <button key={k} type="button" className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>{l}</button>)}</div>
        {kind === 'video' && <input className="ed-input se-sec-input" inputMode="numeric" value={seconds} onChange={e => setSeconds(e.target.value)} aria-label="Durée en secondes (2 à 10)" title="Durée en secondes (2 à 10)" />}
      </div>
      <button type="button" className="se-btn" disabled={sending || pending || !prompt.trim()} onClick={() => void go()}>{pending ? 'Runway génère… (quelques minutes)' : `Générer ${kind === 'video' ? 'une vidéo' : 'une image'} avec Runway`}</button>
      {mine.slice(0, 3).map(g => (
        <span key={g.id} className={g.status === 'failed' ? 'ed-warn' : 'ed-sub'}>
          {g.status === 'pending' ? `En cours : « ${g.prompt.slice(0, 60)} »` : g.status === 'done' ? `Généré et choisi pour cette phrase : « ${g.prompt.slice(0, 60)} »` : `Échec : ${g.error ?? 'erreur inconnue'}`}
        </span>
      ))}
      <span className="ed-sub">Chaque génération consomme des crédits Runway. Un visuel généré passe après vos vraies images, et YouTube demande de signaler les contenus réalistes générés par IA.</span>
    </>
  );
}

export default function SentenceEditor({ project, line, onClose, onSaved, onRerun, busy, canGenerate = false }: {
  project: Project;
  line: string;
  onClose: () => void;
  onSaved: (p: Project) => void;
  onRerun: () => void;
  busy: boolean;
  canGenerate?: boolean;
}) {
  const [f, setF] = useState<Form>(() => toForm(project.hints?.[line]));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (x: Partial<Form>) => setF({ ...f, ...x });
  // A Runway visual made for this sentence becomes its visual on the server: the form follows.
  const known = useRef(new Set((project.generations ?? []).filter(g => g.status === 'done').map(g => g.id)));
  useEffect(() => {
    for (const g of project.generations ?? []) {
      if (g.status !== 'done' || g.line !== line || known.current.has(g.id)) continue;
      known.current.add(g.id);
      if (g.mediaId) setF(prev => ({ ...prev, media: g.mediaId!, mediaStart: '' }));
    }
  }, [project.generations, line]);
  const visuals = project.media.filter(m => m.role === 'visual');
  const clip = visuals.find(m => m.id === f.media && m.kind === 'video');

  const save = async (rerun: boolean, clear = false) => {
    setSaving(true); setError('');
    try {
      const next = await api.hints(project.id, line, clear ? null : (toHints(f) as SentenceHints));
      onSaved(next);
      if (clear) setF(toForm());
      if (rerun) onRerun();
      else onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className="se-back" onClick={onClose}>‹ Retour</button>
      <h1>Cette phrase</h1>
      <blockquote className="se-line">{line}</blockquote>
      <div className="ed-hint">Laissez « Automatique » : le monteur décide. Ce que vous fixez ici passe avant son analyse.</div>

      <div className="ed-box">
        <label className="se-field"><span className="ed-box__label">Rôle dans le récit</span>
          <select className="ed-input" value={f.intent} onChange={e => set({ intent: e.target.value as Intent | '' })}>
            <option value="">Automatique</option>
            {INTENTS.filter(i => i !== 'chapter').map(i => <option key={i} value={i}>{INTENT_LABEL[i]}</option>)}
          </select>
        </label>
        <label className="se-field"><span className="ed-box__label">Ce que l’image doit faire</span>
          <select className="ed-input" value={f.mediaNeed} onChange={e => set({ mediaNeed: e.target.value as MediaNeed | '' })}>
            <option value="">Automatique</option>
            {MEDIA_NEEDS.map(n => <option key={n} value={n}>{NEED_LABEL[n]}</option>)}
          </select>
        </label>
      </div>

      <div className="ed-box">
        <label className="se-field"><span className="ed-box__label">Visuel</span>
          <select className="ed-input" value={f.media} onChange={e => set({ media: e.target.value })}>
            <option value="">Automatique</option>
            {visuals.map(m => <option key={m.id} value={m.id}>{m.description || m.originalName}</option>)}
          </select>
        </label>
        {!visuals.length && <span className="ed-sub">Importez des visuels dans Médias pour en imposer un.</span>}
        {clip && (
          <label className="se-field"><span className="ed-box__label">Début dans le clip (secondes)</span>
            <input className="ed-input" inputMode="decimal" value={f.mediaStart} placeholder="0" onChange={e => set({ mediaStart: e.target.value })} />
            <span className="ed-sub">{clip.durationInSeconds ? `Clip de ${clip.durationInSeconds.toFixed(1).replace('.', ',')} s. ` : ''}Un clip plus court que le plan repart en boucle.</span>
          </label>
        )}
      </div>

      <div className="ed-box">
        <span className="ed-box__label">Pas d’image pour cette phrase ?</span>
        {canGenerate
          ? <RunwayBox project={project} line={line} need={(f.mediaNeed || project.plan?.needs?.[line]) || undefined} onSaved={onSaved} onError={setError} />
          : <span className="ed-sub">Ajoutez votre clé Runway (RUNWAYML_API_SECRET) dans server/.env pour en générer une.</span>}
      </div>

      <Section title="Graphique" on={f.chartOn} onToggle={() => set({ chartOn: !f.chartOn })} hint="Les vraies données derrière la phrase : le monteur les montre en barres, en courbe ou en camembert.">
        <div className="ed-seg">{CHART_KINDS.map(([k, l]) => <button key={k} type="button" className={f.chartKind === k ? 'is-on' : ''} onClick={() => set({ chartKind: k })}>{l}</button>)}</div>
        <Rows rows={f.chartRows} labels={['Libellé', 'Valeur']} max={12} onChange={chartRows => set({ chartRows })} />
        <div className="se-pair">
          <input className="ed-input" value={f.chartUnit} placeholder="Unité (%, M$…)" aria-label="Unité" onChange={e => set({ chartUnit: e.target.value })} />
          <input className="ed-input" value={f.chartTitle} placeholder="Titre (facultatif)" aria-label="Titre du graphique" onChange={e => set({ chartTitle: e.target.value })} />
        </div>
        <input className="ed-input" value={f.chartSource} placeholder="Source des données (ex. Rapport annuel 2023)" aria-label="Source des données" onChange={e => set({ chartSource: e.target.value })} />
      </Section>

      <Section title="Part d’un tout" on={f.shareOn} onToggle={() => set({ shareOn: !f.shareOn })} hint="« 57 % des terres » : des unités s’allument une à une (style Apple).">
        <div className="se-pair">
          <input className="ed-input" inputMode="decimal" value={f.shareValue} placeholder="Valeur (57)" aria-label="Valeur" onChange={e => set({ shareValue: e.target.value })} />
          <input className="ed-input" inputMode="decimal" value={f.shareOf} placeholder="Sur (100)" aria-label="Sur" onChange={e => set({ shareOf: e.target.value })} />
        </div>
        <input className="ed-input" value={f.shareLabel} placeholder="Libellé (des terres)" aria-label="Libellé de la part" onChange={e => set({ shareLabel: e.target.value })} />
      </Section>

      <Section title="Fiche document" on={f.docOn} onToggle={() => set({ docOn: !f.docOn })} hint="Le document recomposé en fiche lisible, la phrase clé surlignée quand elle est dite.">
        <input className="ed-input" value={f.docHeader} placeholder="En-tête (ex. McDonald’s Corporation — Form 10-K)" aria-label="En-tête" onChange={e => set({ docHeader: e.target.value })} />
        <input className="ed-input" value={f.docHeading} placeholder="Titre de section" aria-label="Titre de section" onChange={e => set({ docHeading: e.target.value })} />
        <textarea className="ed-input se-area" value={f.docSentence} placeholder="La phrase du document. Entourez d’*astérisques* le mot à surligner." aria-label="Phrase du document" onChange={e => set({ docSentence: e.target.value })} />
        <Rows rows={f.docRows} labels={['Ligne', 'Montant']} max={8} onChange={docRows => set({ docRows })} />
      </Section>

      <div className="ed-box">
        <label className="se-field"><span className="ed-box__label">Source affichée</span>
          <input className="ed-input" value={f.source} placeholder="Ex. Rapport annuel McDonald’s 2023" onChange={e => set({ source: e.target.value })} />
        </label>
        <label className="se-field"><span className="ed-box__label">Mot barré</span>
          <input className="ed-input" value={f.strike} placeholder="Un mot de la phrase, barré quand elle se termine" onChange={e => set({ strike: e.target.value })} />
        </label>
      </div>

      {error && <div className="ed-warn" role="alert">{error}</div>}
      <div className="se-actions">
        <button type="button" className="se-btn" disabled={saving} onClick={() => save(false, true)}>Tout effacer</button>
        <button type="button" className="se-btn" disabled={saving} onClick={() => save(false)}>Enregistrer</button>
      </div>
      <button type="button" className="ed-cta ed-cta--glow" disabled={saving || busy} onClick={() => save(true)}>Enregistrer et remonter</button>
    </>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { api, INTENTS, MEDIA_NEEDS, REAL_SUBJECT_NEEDS, type Intent, type MediaNeed, type Project, type SentenceHints } from '../../lib/api';

type ChartKind = NonNullable<SentenceHints['chart']>['kind'];
const CHART_KINDS: ChartKind[] = ['barChart', 'lineChart', 'pieChart'];

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
  const t = useT().sentence;
  const set = (i: number, k: 0 | 1, v: string) => onChange(rows.map((r, j) => (j === i ? (k === 0 ? [v, r[1]] : [r[0], v]) : r)));
  return (
    <div className="se-rows">
      {rows.map((r, i) => (
        <div key={i} className="se-rows__row">
          <input className="ed-input" value={r[0]} placeholder={labels[0]} aria-label={`${labels[0]} ${i + 1}`} onChange={e => set(i, 0, e.target.value)} />
          <input className="ed-input se-rows__val" value={r[1]} placeholder={labels[1]} aria-label={`${labels[1]} ${i + 1}`} onChange={e => set(i, 1, e.target.value)} />
          <button type="button" className="se-x" aria-label={t.removeRow(i + 1)} onClick={() => onChange(rows.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      {rows.length < max && <button type="button" className="se-add" onClick={() => onChange([...rows, ['', '']])}>{t.addRow}</button>}
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
 * server keyed by the script line; "save and re-edit" re-runs the edit.
 */
/**
 * Runway makes a visual for this sentence (on request: it costs credits). Refused when the
 * sentence must show something real (bible MED-07): a generated picture never stands for it.
 */
function RunwayBox({ project, line, need, onSaved, onError }: { project: Project; line: string; need: MediaNeed | undefined; onSaved: (p: Project) => void; onError: (m: string) => void }) {
  const T = useT(), t = T.sentence;
  const [prompt, setPrompt] = useState(line);
  const [kind, setKind] = useState<'video' | 'image'>('video');
  const [seconds, setSeconds] = useState('5');
  const [sending, setSending] = useState(false);
  const mine = (project.generations ?? []).filter(g => g.line === line);
  const pending = mine.some(g => g.status === 'pending');
  if (need && REAL_SUBJECT_NEEDS.includes(need))
    return <span className="ed-sub">{t.realSubject(T.labels.needs[need].toLowerCase())}</span>;
  const go = async () => {
    setSending(true);
    try { onSaved(await api.generate(project.id, { prompt, kind, seconds: Number(seconds) || 5, line })); } catch (e) { onError((e as Error).message); } finally { setSending(false); }
  };
  return (
    <>
      <textarea className="ed-input se-area" value={prompt} onChange={e => setPrompt(e.target.value)} aria-label={t.promptLabel} placeholder={t.promptPlaceholder} />
      <div className="se-pair">
        <div className="ed-seg se-grow">{([['video', t.video], ['image', t.image]] as const).map(([k, l]) => <button key={k} type="button" className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>{l}</button>)}</div>
        {kind === 'video' && <input className="ed-input se-sec-input" inputMode="numeric" value={seconds} onChange={e => setSeconds(e.target.value)} aria-label={t.seconds} title={t.seconds} />}
      </div>
      <button type="button" className="se-btn" disabled={sending || pending || !prompt.trim()} onClick={() => void go()}>{pending ? t.generating : t.generate(kind)}</button>
      {mine.slice(0, 3).map(g => (
        <span key={g.id} className={g.status === 'failed' ? 'ed-warn' : 'ed-sub'}>
          {g.status === 'pending' ? t.genPending(g.prompt.slice(0, 60)) : g.status === 'done' ? t.genDone(g.prompt.slice(0, 60)) : t.genFailed(g.error ?? t.unknownError)}
        </span>
      ))}
      <span className="ed-sub">{t.runwayNote}</span>
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
  const T = useT(), t = T.sentence;
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
      <button type="button" className="se-back" onClick={onClose}>{t.back}</button>
      <h1>{t.title}</h1>
      <blockquote className="se-line">{line}</blockquote>
      <div className="ed-hint">{t.intro}</div>

      <div className="ed-box">
        <label className="se-field"><span className="ed-box__label">{t.role}</span>
          <select className="ed-input" value={f.intent} onChange={e => set({ intent: e.target.value as Intent | '' })}>
            <option value="">{t.auto}</option>
            {INTENTS.filter(i => i !== 'chapter').map(i => <option key={i} value={i}>{T.labels.intents[i]}</option>)}
          </select>
        </label>
        <label className="se-field"><span className="ed-box__label">{t.need}</span>
          <select className="ed-input" value={f.mediaNeed} onChange={e => set({ mediaNeed: e.target.value as MediaNeed | '' })}>
            <option value="">{t.auto}</option>
            {MEDIA_NEEDS.map(n => <option key={n} value={n}>{T.labels.needs[n]}</option>)}
          </select>
        </label>
      </div>

      <div className="ed-box">
        <label className="se-field"><span className="ed-box__label">{t.visual}</span>
          <select className="ed-input" value={f.media} onChange={e => set({ media: e.target.value })}>
            <option value="">{t.auto}</option>
            {visuals.map(m => <option key={m.id} value={m.id}>{m.description || m.originalName}</option>)}
          </select>
        </label>
        {!visuals.length && <span className="ed-sub">{t.noVisuals}</span>}
        {clip && (
          <label className="se-field"><span className="ed-box__label">{t.clipStart}</span>
            <input className="ed-input" inputMode="decimal" value={f.mediaStart} placeholder="0" onChange={e => set({ mediaStart: e.target.value })} />
            <span className="ed-sub">{clip.durationInSeconds ? t.clipLength(clip.durationInSeconds.toFixed(1).replace('.', T.common.decimal)) : ''}{t.loops}</span>
          </label>
        )}
      </div>

      <div className="ed-box">
        <span className="ed-box__label">{t.noImage}</span>
        {canGenerate
          ? <RunwayBox project={project} line={line} need={(f.mediaNeed || project.plan?.needs?.[line]) || undefined} onSaved={onSaved} onError={setError} />
          : <span className="ed-sub">{t.runwayNoKey}</span>}
      </div>

      <Section title={t.chart} on={f.chartOn} onToggle={() => set({ chartOn: !f.chartOn })} hint={t.chartHint}>
        <div className="ed-seg">{CHART_KINDS.map(k => <button key={k} type="button" className={f.chartKind === k ? 'is-on' : ''} onClick={() => set({ chartKind: k })}>{t.chartKinds[k]}</button>)}</div>
        <Rows rows={f.chartRows} labels={[t.label, t.value]} max={12} onChange={chartRows => set({ chartRows })} />
        <div className="se-pair">
          <input className="ed-input" value={f.chartUnit} placeholder={t.unit} aria-label={t.unitLabel} onChange={e => set({ chartUnit: e.target.value })} />
          <input className="ed-input" value={f.chartTitle} placeholder={t.chartTitle} aria-label={t.chartTitleLabel} onChange={e => set({ chartTitle: e.target.value })} />
        </div>
        <input className="ed-input" value={f.chartSource} placeholder={t.chartSource} aria-label={t.chartSourceLabel} onChange={e => set({ chartSource: e.target.value })} />
      </Section>

      <Section title={t.share} on={f.shareOn} onToggle={() => set({ shareOn: !f.shareOn })} hint={t.shareHint}>
        <div className="se-pair">
          <input className="ed-input" inputMode="decimal" value={f.shareValue} placeholder={t.shareValue} aria-label={t.value} onChange={e => set({ shareValue: e.target.value })} />
          <input className="ed-input" inputMode="decimal" value={f.shareOf} placeholder={t.shareOf} aria-label={t.shareOfLabel} onChange={e => set({ shareOf: e.target.value })} />
        </div>
        <input className="ed-input" value={f.shareLabel} placeholder={t.shareLabel} aria-label={t.shareLabelLabel} onChange={e => set({ shareLabel: e.target.value })} />
      </Section>

      <Section title={t.doc} on={f.docOn} onToggle={() => set({ docOn: !f.docOn })} hint={t.docHint}>
        <input className="ed-input" value={f.docHeader} placeholder={t.docHeader} aria-label={t.docHeaderLabel} onChange={e => set({ docHeader: e.target.value })} />
        <input className="ed-input" value={f.docHeading} placeholder={t.docHeading} aria-label={t.docHeading} onChange={e => set({ docHeading: e.target.value })} />
        <textarea className="ed-input se-area" value={f.docSentence} placeholder={t.docSentence} aria-label={t.docSentenceLabel} onChange={e => set({ docSentence: e.target.value })} />
        <Rows rows={f.docRows} labels={[t.docRow, t.docAmount]} max={8} onChange={docRows => set({ docRows })} />
      </Section>

      <div className="ed-box">
        <label className="se-field"><span className="ed-box__label">{t.source}</span>
          <input className="ed-input" value={f.source} placeholder={t.sourcePlaceholder} onChange={e => set({ source: e.target.value })} />
        </label>
        <label className="se-field"><span className="ed-box__label">{t.strike}</span>
          <input className="ed-input" value={f.strike} placeholder={t.strikePlaceholder} onChange={e => set({ strike: e.target.value })} />
        </label>
      </div>

      {error && <div className="ed-warn" role="alert">{error}</div>}
      <div className="se-actions">
        <button type="button" className="se-btn" disabled={saving} onClick={() => save(false, true)}>{t.clearAll}</button>
        <button type="button" className="se-btn" disabled={saving} onClick={() => save(false)}>{t.save}</button>
      </div>
      <button type="button" className="ed-cta ed-cta--glow" disabled={saving || busy} onClick={() => save(true)}>{t.saveRerun}</button>
    </>
  );
}

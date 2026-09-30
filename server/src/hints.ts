/**
 * What the author sets on one sentence of the script (the editor's sentence
 * panel): editorial intent, media need, the media and where the clip starts,
 * chart data, a share, a source, a document card, a struck word. Stored on the
 * project keyed by the script line, passed to editor-brain as `UnitHints`.
 * Author hints always win over the analysis (studio-engine, bible §27).
 */
import { EDITORIAL_INTENTS, MEDIA_NEEDS, type ScriptBlock } from './engine.ts';
import { MsgError } from './messages.ts';

export interface SentenceHints {
  intent?: (typeof EDITORIAL_INTENTS)[number];
  mediaNeed?: (typeof MEDIA_NEEDS)[number];
  /** Id of a visual of the project. */
  media?: string;
  /** Seconds into the clip where this sentence's footage starts. */
  mediaStart?: number;
  chart?: { kind: 'barChart' | 'lineChart' | 'pieChart'; labels: string[]; values: number[]; unit?: string; title?: string; source?: string };
  share?: { value: number; of?: number; label?: string };
  source?: string;
  documentCard?: { header?: string; heading?: string; sentence: string; rows?: Array<[string, string]> };
  strike?: string;
}

export type HintsByLine = Record<string, SentenceHints>;

/** Lines are matched on their text, spaces normalised. */
export const hintKey = (line: string) => line.trim().replace(/\s+/g, ' ');

/** A setting that cannot be kept: answered 400, in the language of the request. */
export class HintError extends MsgError {}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, max: number, field: string): string | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'string') throw new HintError('hintText', { field });
  return v.trim().slice(0, max) || undefined;
};
const num = (v: unknown, field: string): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new HintError('hintNumber', { field });
  return n;
};

/** Validates what the editor sends. Empty fields are dropped; an empty result means "no hints". */
export function parseHints(body: unknown, mediaIds: ReadonlySet<string>): SentenceHints {
  if (!isObj(body)) throw new HintError('hintObject');
  const h: SentenceHints = {};
  if (body.intent !== undefined && body.intent !== '') {
    if (!EDITORIAL_INTENTS.includes(body.intent as never)) throw new HintError('hintIntent', { value: String(body.intent) });
    h.intent = body.intent as SentenceHints['intent'];
  }
  if (body.mediaNeed !== undefined && body.mediaNeed !== '') {
    if (!MEDIA_NEEDS.includes(body.mediaNeed as never)) throw new HintError('hintNeed', { value: String(body.mediaNeed) });
    h.mediaNeed = body.mediaNeed as SentenceHints['mediaNeed'];
  }
  const media = text(body.media, 64, 'media');
  if (media) {
    if (!mediaIds.has(media)) throw new HintError('hintMedia');
    h.media = media;
  }
  const start = num(body.mediaStart, 'mediaStart');
  if (start !== undefined) {
    if (start < 0) throw new HintError('hintStart');
    if (start > 0) h.mediaStart = Math.round(start * 100) / 100;
  }
  if (isObj(body.chart)) {
    const c = body.chart;
    const labels = Array.isArray(c.labels) ? c.labels.map((l, i) => text(l, 60, `chart.labels[${i}]`) ?? '') : [];
    const values = Array.isArray(c.values) ? c.values.map((v, i) => num(v, `chart.values[${i}]`)) : [];
    if (labels.length || values.length) {
      if (!['barChart', 'lineChart', 'pieChart'].includes(c.kind as string)) throw new HintError('hintChartKind');
      if (!labels.length || labels.length !== values.length || values.some((v) => v === undefined) || labels.some((l) => !l)) throw new HintError('hintChartRows');
      if (labels.length > 12) throw new HintError('hintChartMax');
      const unit = text(c.unit, 12, 'chart.unit');
      const title = text(c.title, 120, 'chart.title');
      const source = text(c.source, 200, 'chart.source');
      h.chart = { kind: c.kind as 'barChart', labels, values: values as number[], ...(unit ? { unit } : {}), ...(title ? { title } : {}), ...(source ? { source } : {}) };
    }
  }
  if (isObj(body.share)) {
    const value = num(body.share.value, 'share.value');
    if (value !== undefined) {
      const of = num(body.share.of, 'share.of');
      if (value < 0 || value > (of ?? 100)) throw new HintError('hintShare', { max: of ?? 100 });
      const label = text(body.share.label, 80, 'share.label');
      h.share = { value, ...(of !== undefined ? { of } : {}), ...(label ? { label } : {}) };
    }
  }
  const source = text(body.source, 200, 'source');
  if (source) h.source = source;
  if (isObj(body.documentCard)) {
    const d = body.documentCard;
    const sentence = text(d.sentence, 400, 'documentCard.sentence');
    if (sentence) {
      const rows = Array.isArray(d.rows)
        ? d.rows.flatMap((r, i) => (Array.isArray(r) && (r[0] || r[1]) ? [[text(r[0], 80, `documentCard.rows[${i}]`) ?? '', text(r[1], 80, `documentCard.rows[${i}]`) ?? ''] as [string, string]] : [])).slice(0, 8)
        : [];
      const header = text(d.header, 80, 'documentCard.header');
      const heading = text(d.heading, 120, 'documentCard.heading');
      h.documentCard = { sentence, ...(header ? { header } : {}), ...(heading ? { heading } : {}), ...(rows.length ? { rows } : {}) };
    }
  }
  const strike = text(body.strike, 40, 'strike');
  if (strike) h.strike = strike;
  return h;
}

/** Hints of lines still in the script, with media that still exist. */
export function keepHints(hints: HintsByLine | undefined, script: string, mediaIds: ReadonlySet<string>): HintsByLine {
  const lines = new Set(script.split(/\r?\n/).map(hintKey).filter(Boolean));
  const out: HintsByLine = {};
  for (const [line, h] of Object.entries(hints ?? {})) {
    if (!lines.has(line)) continue;
    const { media, mediaStart, ...rest } = h;
    const kept: SentenceHints = { ...rest, ...(media && mediaIds.has(media) ? { media, ...(mediaStart ? { mediaStart } : {}) } : mediaStart && !media ? { mediaStart } : {}) };
    if (Object.keys(kept).length) out[line] = kept;
  }
  return out;
}

/** The script blocks with the author's hints on their lines. */
export function withHints(blocks: ScriptBlock[], hints: HintsByLine | undefined): ScriptBlock[] {
  if (!hints || !Object.keys(hints).length) return blocks;
  return blocks.map((b) => {
    if (b.kind !== 'text') return b;
    const h = hints[hintKey(b.text)];
    return h ? { ...b, hints: h } : b;
  });
}

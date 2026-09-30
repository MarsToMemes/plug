/**
 * A project as the reader sees it: what the server stored as message keys (job
 * progress, failures) and what the engine wrote in English (decisions, notes,
 * checks) are written in the reader's language when the project is read.
 * French goes through fr.ts; English cleans the engine's own wording
 * (`shots[2].motionSkill: …` → `Shot 3: …`, `u4: …` → `Sentence 4: …`).
 */
import { frDecision, frIssue, frNote } from './fr.ts';
import { text, type Lang, type Msg } from './messages.ts';
import type { Job, Project, RenderInfo } from './store.ts';

/** `u3` → `sentence 3`, `u3-b` → `sentence 3 (shot b)`, `chapter-2` → `chapter 2 card`. */
export function enId(s: string): string {
  return s
    .replace(/\bu(\d+)-([a-z])\b/g, 'sentence $1 (shot $2)')
    .replace(/\bu(\d+)\b/g, 'sentence $1')
    .replace(/\bchapter-(\d+)\b/g, 'chapter $1 card');
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** An engine text in readable English: ids named, the leading one capitalised. */
export const enText = (s: string) => cap(enId(s));

/** An issue in English: its rule, the shot, the engine's message without its field path. */
export function enIssue(i: { rule?: string; message: string; shotId?: string }): string {
  let m = i.message;
  const at = /^shots\[(\d+)\](?:\.[\w.[\]]+)?:\s*/.exec(m);
  if (at) m = `Shot ${Number(at[1]) + 1}: ${m.slice(at[0].length)}`;
  else if (i.shotId) m = `${cap(enId(i.shotId))}: ${m}`;
  return `${i.rule && !m.startsWith(`[${i.rule}]`) ? `[${i.rule}] ` : ''}${cap(m)}`;
}

const say = (m: Msg | undefined, fallback: string | undefined, lang: Lang) => (m ? text(m, lang) : fallback);

function localizeJob(job: Job, lang: Lang): Job {
  const out: Job = { ...job, message: say(job.msg, job.message, lang) ?? '' };
  if (job.error !== undefined) out.error = say(job.errorMsg, job.error, lang)!;
  return out;
}

function localizeRender(r: RenderInfo, lang: Lang): RenderInfo {
  const qc = r.qc;
  const notes = lang === 'fr' ? r.notes.map((n) => frNote(n) ?? n) : r.notes.map(enText);
  if (!qc || (!qc.checks && !qc.error)) return { ...r, notes };
  const issue = (c: { rule?: string; message: string; shotId?: string }) => (lang === 'fr' ? frIssue(c) ?? c.message : enIssue(c));
  const checks = qc.checks ?? [];
  return {
    ...r,
    notes,
    qc: {
      ...qc,
      failed: qc.error ? [text(qc.error, lang)] : checks.filter((c) => c.status === 'fail').map(issue),
      warnings: checks.filter((c) => c.status === 'warn').map(issue),
    },
  };
}

function localizePlan(plan: NonNullable<Project['plan']>, lang: Lang): NonNullable<Project['plan']> {
  // Plans made before this layer were stored in French.
  if (!plan.raw) return plan;
  if (lang === 'en') {
    return {
      ...plan,
      decisions: plan.decisions.map(enText),
      notes: plan.notes.map(enText),
      errors: plan.errors.map((e) => ({ ...e, message: enIssue(e) })),
      warnings: plan.warnings.map((e) => ({ ...e, message: enIssue(e) })),
      technical: [],
    };
  }
  const technical: string[] = [];
  const tr = (list: string[], f: (s: string) => string | null) => list.flatMap((s) => {
    const fr = f(s);
    if (fr === null) technical.push(s);
    return fr === null ? [] : [fr];
  });
  const issue = (e: { message: string; rule?: string }) => {
    const fr = frIssue(e);
    if (fr === null) technical.push(e.message);
    return { ...e, message: fr ?? 'Point technique à vérifier (détail en anglais dans le journal technique).' };
  };
  return {
    ...plan,
    decisions: tr(plan.decisions, frDecision),
    notes: tr(plan.notes, frNote),
    errors: plan.errors.map(issue),
    warnings: plan.warnings.map(issue),
    technical,
  };
}

/** The project in the reader's language. The stored project is never changed. */
export function localizeProject(p: Project, lang: Lang): Project {
  return {
    ...p,
    media: p.media.map((m) => (m.auto?.errorMsg ? { ...m, auto: { ...m.auto, error: text(m.auto.errorMsg, lang) } } : m)),
    ...(p.generations ? { generations: p.generations.map((g) => (g.errorMsg ? { ...g, error: text(g.errorMsg, lang) } : g)) } : {}),
    ...(p.job ? { job: localizeJob(p.job, lang) } : {}),
    ...(p.plan ? { plan: localizePlan(p.plan, lang) } : {}),
    ...(p.render ? { render: localizeRender(p.render, lang) } : {}),
    ...(p.renders ? { renders: p.renders.map((r) => localizeRender(r, lang)) } : {}),
  };
}

/** Anything the API answers: projects and jobs are localized, the rest passes through. */
export function localizePayload(payload: unknown, lang: Lang): unknown {
  if (Array.isArray(payload)) return payload.map((x) => localizePayload(x, lang));
  if (!payload || typeof payload !== 'object') return payload;
  const o = payload as Record<string, unknown>;
  if (typeof o.script === 'string' && Array.isArray(o.media)) return localizeProject(o as unknown as Project, lang);
  if (typeof o.kind === 'string' && typeof o.status === 'string' && typeof o.progress === 'number') return localizeJob(o as unknown as Job, lang);
  return payload;
}

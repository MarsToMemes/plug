import { THEME } from '../theme';
import { ANCHOR, FRAME, SAFE, SPACE } from './grid';
import { fitSize, measure, type Metrics, type TextStyle } from './measure';

/**
 * Composition engine: places measured text and graphics on the grid, by edges and anchors,
 * then checks the result (collisions, margins, clipping, hierarchy) BEFORE any animation.
 */
export type Role = 'hero' | 'primary' | 'secondary' | 'support' | 'meta' | 'graphic' | 'decor';
export type Box = { x: number; y: number; w: number; h: number };
export type Placed = {
  id: string; role: Role; box: Box; weight: number;
  text?: string; style?: TextStyle; color?: string; m?: Metrics;
  pen?: { x: number; baseline: number }; // where the DOM text must be drawn
};

const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255; };
/** Visual weight: inked area × contrast with the ground × (saturated colours weigh more). */
function weightOf(box: Box, color: string) {
  const sat = color === THEME.accent ? 1.35 : 1;
  return (box.w * box.h * Math.abs(lum(color) - lum(THEME.bg)) * sat) / 1000;
}

/** Align by INK, not by layout box: a left edge is where the first letter really starts. */
export function placeText(id: string, role: Role, text: string, style: TextStyle, align: { left?: number; center?: number; right?: number }, baseline: number, color: string = THEME.ink, caps = true): Placed {
  const m = measure(text, style);
  const x = align.left !== undefined ? align.left - m.inkLeft : align.right !== undefined ? align.right - m.inkRight : align.center! - (m.inkLeft + m.inkRight) / 2;
  // For caps, the optical top is the cap height (accents and punctuation overhang it).
  const top = baseline - (caps ? Math.max(m.capAscent, Math.min(m.ascent, m.capAscent * 1.02)) : m.ascent);
  const box = { x: x + m.inkLeft, y: top, w: m.inkWidth, h: baseline + m.descent - top };
  return { id, role, text, style, color, m, pen: { x, baseline }, box, weight: weightOf(box, color) };
}

export function placeBox(id: string, role: Role, box: Box, color: string = THEME.ink): Placed {
  return { id, role, box, color, weight: weightOf(box, color) };
}

/** Cap height of a style (the optical size of capitals). */
export const capOf = (s: TextStyle) => measure('H', s).capAscent;

/**
 * Line breaks chosen by MEANING: the author gives the acceptable splits, best first
 * (e.g. [["POURQUOI","VOTRE BILLET","COÛTE PLUS CHER ?"], ["POURQUOI VOTRE","BILLET","COÛTE PLUS CHER ?"]]).
 * The first option whose every line fits wins; only if none fits is the size reduced.
 */
export function chooseBreaks(options: string[][], style: TextStyle, maxWidth: number) {
  for (const lines of options) if (lines.every((l) => measure(l, style).inkWidth <= maxWidth)) return { lines, size: style.size };
  const best = options[0]!;
  const size = Math.min(...best.map((l) => fitSize(l, style, maxWidth, style.size)));
  return { lines: best, size };
}

/**
 * STACKED_EDITORIAL — lines on a shared edge with a strict vertical rhythm: each gap is measured
 * ink to ink (baseline of the upper line to the cap top of the lower one) and taken from SPACE.
 * The block is placed so that its optical centre sits on `centerY`.
 */
export type StackItem = { id: string; role: Role; text: string; style: TextStyle; color?: string; gapAfter?: number };
export function stack(items: StackItem[], edge: { left?: number; center?: number; right?: number }, centerY: number = ANCHOR.OPTICAL_Y): Placed[] {
  // First pass from baseline 0, to know the block's height. Gaps are ink to ink:
  // next baseline = previous baseline + previous descent + gap + next cap height.
  let base = 0, prevDescent = 0, prevGap = 0;
  const first = items.map((it, k) => {
    if (k > 0) base += prevDescent + prevGap + capOf(it.style);
    const p = placeText(it.id, it.role, it.text, it.style, edge, base, it.color);
    prevDescent = p.m!.descent;
    prevGap = it.gapAfter ?? SPACE.m;
    return p;
  });
  const top = Math.min(...first.map((p) => p.box.y)), bottom = Math.max(...first.map((p) => p.box.y + p.box.h));
  const dy = centerY - (top + bottom) / 2;
  return first.map((p) => placeText(p.id, p.role, p.text!, p.style!, edge, p.pen!.baseline + dy, p.color));
}

/**
 * DATA_EDITORIAL — a big number, a graphic bar under it on the same left edge, a label above.
 * Returns the placed items; the bar's length is a ratio of `barMax` (the data).
 */
export function dataEditorial(o: { label: StackItem; hero: StackItem; secondary?: StackItem; left: number; centerY?: number; barRatio: number; barMax: number; barH: number }) {
  // Label → hero (a large gap: the number needs air), bar one step under the hero's baseline,
  // secondary one step under the bar. Then the whole block is centred optically.
  const [label, hero] = stack([{ ...o.label, gapAfter: SPACE.xl }, { ...o.hero }], { left: o.left }, 0);
  const bar = placeBox('bar', 'graphic', { x: o.left, y: hero!.pen!.baseline + SPACE.l, w: o.barMax * o.barRatio, h: o.barH }, THEME.accent);
  const items: Placed[] = [label!, hero!, bar];
  if (o.secondary) items.push(placeText(o.secondary.id, o.secondary.role, o.secondary.text, o.secondary.style, { left: o.left }, bar.box.y + bar.box.h + SPACE.l + capOf(o.secondary.style), o.secondary.color));
  return centerBlock(items, o.centerY ?? ANCHOR.OPTICAL_Y);
}

/** Moves a whole composition so that its bounding box is centred on `centerY` (optical centre). */
export function centerBlock(items: Placed[], centerY: number): Placed[] {
  const top = Math.min(...items.map((p) => p.box.y)), bottom = Math.max(...items.map((p) => p.box.y + p.box.h));
  return shiftY(items, centerY - (top + bottom) / 2);
}
export function shiftY(items: Placed[], dy: number): Placed[] {
  return items.map((p) => ({ ...p, box: { ...p.box, y: p.box.y + dy }, pen: p.pen ? { ...p.pen, baseline: p.pen.baseline + dy } : undefined }));
}

// ── QA ──────────────────────────────────────────────────────────────────────────────────────
export type Issue = { kind: 'overlap' | 'proximity' | 'unsafe' | 'clipped' | 'hierarchy'; ids: string[]; detail: string };
const inter = (a: Box, b: Box, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
const READ: Role[] = ['hero', 'primary', 'secondary', 'support', 'meta'];

export function qa(items: Placed[], opts: { allow?: Array<[string, string]>; minGap?: number } = {}) {
  const issues: Issue[] = [];
  const allowed = (a: string, b: string) => (opts.allow ?? []).some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const gap = opts.minGap ?? SPACE.s;
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i]!, b = items[j]!;
    if (a.role === 'decor' || b.role === 'decor' || allowed(a.id, b.id)) continue;
    if (inter(a.box, b.box)) issues.push({ kind: 'overlap', ids: [a.id, b.id], detail: `${a.id} × ${b.id}` });
    else if (inter(a.box, b.box, gap)) issues.push({ kind: 'proximity', ids: [a.id, b.id], detail: `${a.id} – ${b.id} < ${gap}px` });
  }
  for (const p of items) {
    const b = p.box;
    if (b.x < 0 || b.y < 0 || b.x + b.w > FRAME.w || b.y + b.h > FRAME.h) issues.push({ kind: 'clipped', ids: [p.id], detail: `${p.id} leaves the frame` });
    else if (READ.includes(p.role) && (b.x < SAFE.left - 1 || b.x + b.w > SAFE.right + 1 || b.y < SAFE.top - 1 || b.y + b.h > SAFE.bottom + 1)) issues.push({ kind: 'unsafe', ids: [p.id], detail: `${p.id} outside the safe area` });
  }
  const hero = items.filter((p) => p.role === 'hero');
  if (hero.length) {
    const h = Math.max(...hero.map((p) => p.weight));
    const rival = items.filter((p) => p.role !== 'hero' && p.role !== 'decor' && p.role !== 'graphic').sort((a, b) => b.weight - a.weight)[0];
    if (rival && rival.weight * 1.6 > h) issues.push({ kind: 'hierarchy', ids: [rival.id], detail: `${rival.id} competes with the hero (${Math.round(rival.weight)} vs ${Math.round(h)})` });
  }
  const lefts = new Set(items.filter((p) => READ.includes(p.role)).map((p) => Math.round(p.box.x)));
  return { issues, ok: issues.length === 0, sharedEdges: lefts.size };
}

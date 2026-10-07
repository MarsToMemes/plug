import React from 'react';
import { THEME, clamp01, lerp } from '../theme';

/**
 * Morph toolkit for the bridges between scenes. Everything is a rounded rectangle (rect, capsule,
 * ellipse are all rx/ry variants), a set of units, a line, or a word: so any of them can turn into
 * any other by interpolating numbers.
 */
export type Shape = { x: number; y: number; w: number; h: number; rx?: number; ry?: number; fill?: number; o?: number; color?: string; stroke?: number };
export const ellipse = (cx: number, cy: number, rx: number, ry: number, extra: Partial<Shape> = {}): Shape => ({ x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2, rx, ry, ...extra });
export const capsule = (x: number, y: number, w: number, h: number, extra: Partial<Shape> = {}): Shape => ({ x, y, w, h, rx: h / 2, ry: h / 2, ...extra });

export function mixShape(a: Shape, b: Shape, t: number): Shape {
  return {
    x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t),
    rx: lerp(a.rx ?? 0, b.rx ?? 0, t), ry: lerp(a.ry ?? a.rx ?? 0, b.ry ?? b.rx ?? 0, t),
    fill: lerp(a.fill ?? 0, b.fill ?? 0, t), o: lerp(a.o ?? 1, b.o ?? 1, t), stroke: lerp(a.stroke ?? 2, b.stroke ?? 2, t),
    color: t < 0.5 ? a.color : b.color,
  };
}
export const ShapeEl: React.FC<{ s: Shape }> = ({ s }) => (
  <rect x={s.x} y={s.y} width={Math.max(0, s.w)} height={Math.max(0, s.h)} rx={Math.min(s.rx ?? 0, s.w / 2)} ry={Math.min(s.ry ?? s.rx ?? 0, s.h / 2)} fill={s.color ?? THEME.ink} fillOpacity={s.fill ?? 0} stroke={s.color ?? THEME.ink} strokeWidth={s.stroke ?? 2} opacity={s.o ?? 1} />
);

export type U = { x: number; y: number; w: number; h: number };
/** Pair two sets of units by their relative place in their own bounds (nearest free target). */
export function pairUnits(a: U[], b: U[]): number[] {
  const bounds = (us: U[]) => { const x0 = Math.min(...us.map((u) => u.x)), y0 = Math.min(...us.map((u) => u.y)); return { x0, y0, w: Math.max(1, Math.max(...us.map((u) => u.x + u.w)) - x0), h: Math.max(1, Math.max(...us.map((u) => u.y + u.h)) - y0) }; };
  const ba = bounds(a), bb = bounds(b);
  const na = a.map((u) => [(u.x + u.w / 2 - ba.x0) / ba.w, (u.y + u.h / 2 - ba.y0) / ba.h]);
  const nb = b.map((u) => [(u.x + u.w / 2 - bb.x0) / bb.w, (u.y + u.h / 2 - bb.y0) / bb.h]);
  // For every target, its source: the nearest source unit (several targets may share one = it splits).
  return nb.map((p) => { let best = 0, bd = Infinity; na.forEach((q, i) => { const d = (p[0]! - q[0]!) ** 2 + (p[1]! - q[1]!) ** 2; if (d < bd) { bd = d; best = i; } }); return best; });
}
/**
 * Units of `a` become the units of `b`: each target starts on its nearest source (so one source can
 * split into many), then travels and resizes to its place. Sources that feed nothing dissolve.
 */
export const UnitsMorph: React.FC<{ a: U[]; b: U[]; t: number; fillA?: number; fillB?: number; colorA?: string; colorB?: string; stagger?: number }> = ({ a, b, t, fillA = 0, fillB = 0, colorA = THEME.ink, colorB = THEME.ink, stagger = 0.25 }) => {
  const src = React.useMemo(() => pairUnits(a, b), [a, b]);
  const used = new Set(src);
  return (
    <g>
      {a.map((u, i) => (used.has(i) ? null : <rect key={`a${i}`} x={u.x} y={u.y} width={u.w} height={u.h} rx={3} fill={colorA} fillOpacity={fillA} stroke={colorA} strokeWidth={1.4} opacity={1 - clamp01(t * 3)} />))}
      {b.map((v, j) => {
        const u = a[src[j]!]!;
        const k = clamp01((t - (j / b.length) * stagger) / (1 - stagger));
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        return <rect key={`b${j}`} x={lerp(u.x, v.x, e)} y={lerp(u.y, v.y, e)} width={lerp(u.w, v.w, e)} height={lerp(u.h, v.h, e)} rx={3} fill={e < 0.5 ? colorA : colorB} fillOpacity={lerp(fillA, fillB, e)} stroke={e < 0.5 ? colorA : colorB} strokeWidth={1.4} />;
      })}
    </g>
  );
};

/** Points spread along a shape outline or a line, as tiny units (to morph lines/circles into grids). */
export const pointsOnEllipse = (cx: number, cy: number, rx: number, ry: number, n: number, s = 6): U[] => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return { x: cx + Math.cos(a) * rx - s / 2, y: cy + Math.sin(a) * ry - s / 2, w: s, h: s }; });
export const pointsOnLine = (x0: number, y0: number, x1: number, y1: number, n: number, s = 6): U[] => Array.from({ length: n }, (_, i) => ({ x: lerp(x0, x1, i / Math.max(1, n - 1)) - s / 2, y: lerp(y0, y1, i / Math.max(1, n - 1)) - s / 2, w: s, h: s }));
export const pointsInRect = (x: number, y: number, w: number, h: number, n: number, s = 6): U[] => { const c = Math.ceil(Math.sqrt((n * w) / h)), r = Math.ceil(n / c); return Array.from({ length: n }, (_, i) => ({ x: x + ((i % c) + 0.5) * (w / c) - s / 2, y: y + (Math.floor(i / c) + 0.5) * (h / r) - s / 2, w: s, h: s })); };

/** A word becoming another: the first opens up and dissolves, the second gathers from blur. */
export const WordMorph: React.FC<{ a: string; b: string; t: number; ax: number; ay: number; bx: number; by: number; aSize: number; bSize: number; aFont?: string; bFont?: string; color?: string }> = ({ a, b, t, ax, ay, bx, by, aSize, bSize, aFont = THEME.serif, bFont = THEME.serif, color = THEME.ink }) => {
  const x = lerp(ax, bx, t), y = lerp(ay, by, t);
  const base: React.CSSProperties = { position: 'absolute', left: x - 900, width: 1800, textAlign: 'center', fontWeight: 300, textTransform: 'uppercase', color, whiteSpace: 'nowrap' };
  return (
    <>
      <div style={{ ...base, top: y - aSize * 0.6, fontFamily: aFont, fontSize: lerp(aSize, bSize, t), opacity: 1 - clamp01(t * 1.6), letterSpacing: `${0.03 + t * 0.5}em`, filter: `blur(${t * 10}px)` }}>{a}</div>
      <div style={{ ...base, top: y - bSize * 0.6, fontFamily: bFont, fontSize: lerp(aSize, bSize, t), opacity: clamp01(t * 1.6 - 0.6), letterSpacing: `${0.5 - t * 0.47}em`, filter: `blur(${(1 - t) * 10}px)` }}>{b}</div>
    </>
  );
};

import React from 'react';

/**
 * Flat garment illustrations (drawn for this piece, no product photography): each one in a
 * 100 × 120 box, a base colour and a darker fold colour derived from it.
 * Stored as drawing operations so the same drawings serve React (SVG) and <canvas> (Path2D).
 * The first operation of each garment is its silhouette (used alone when drawn very small).
 */
export type Kind = 'tee' | 'dress' | 'hoodie' | 'jeans' | 'skirt' | 'jacket' | 'cami' | 'shorts' | 'sweater' | 'bag';
export const KINDS: Kind[] = ['dress', 'tee', 'hoodie', 'jeans', 'skirt', 'jacket', 'cami', 'shorts', 'sweater', 'bag'];

export type Paint = 'base' | 'fold' | 'light';
export type Op = { d: string; fill?: Paint; stroke?: Paint; sw?: number; op?: number };

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
const L = (d: string, op?: number): Op => ({ d, stroke: 'fold', sw: 1.4, op });

export const GARMENTS: Record<Kind, Op[]> = {
  tee: [{ d: 'M30 18 L42 14 Q50 20 58 14 L70 18 L86 32 L77 42 L70 37 L70 104 L30 104 L30 37 L23 42 L14 32 Z', fill: 'base' }, L('M42 14 Q50 22 58 14'), L('M38 60 L40 100 M62 58 L60 100', 0.5)],
  dress: [{ d: 'M40 10 L44 10 L46 26 L54 26 L56 10 L60 10 L62 30 Q60 40 58 46 L78 108 Q50 114 22 108 L42 46 Q40 40 38 30 Z', fill: 'base' }, L('M42 46 Q50 50 58 46'), L('M50 52 L46 108 M50 52 L56 109 M50 52 L36 107 M50 52 L66 108', 0.55)],
  hoodie: [{ d: 'M28 24 L40 16 Q50 6 60 16 L72 24 L88 74 L78 78 L70 50 L70 106 L30 106 L30 50 L22 78 L12 74 Z', fill: 'base' }, { d: 'M40 16 Q50 34 60 16', fill: 'fold', op: 0.55 }, { d: 'M38 76 L62 76 L66 92 L34 92 Z', fill: 'fold', op: 0.35 }, L('M46 26 L45 44 M54 26 L55 44'), L('M30 100 L70 100')],
  jeans: [{ d: 'M30 12 L70 12 L76 110 L56 110 L50 44 L44 110 L24 110 Z', fill: 'base' }, L('M30 20 L70 20'), L('M50 20 L50 44 M34 22 Q38 32 46 30 M66 22 Q62 32 54 30'), L('M30 104 L42 104 M58 104 L70 104', 0.6)],
  skirt: [{ d: 'M34 22 L66 22 L84 104 Q50 112 16 104 Z', fill: 'base' }, { d: 'M34 22 L66 22 L66 30 L34 30 Z', fill: 'fold' }, L('M44 30 L36 106 M56 30 L64 106 M50 30 L50 108', 0.5)],
  jacket: [{ d: 'M30 16 L44 12 L50 30 L56 12 L70 16 L86 40 L84 104 L74 104 L72 52 L70 92 L30 92 L28 52 L26 104 L16 104 L14 40 Z', fill: 'base' }, L('M44 12 L50 30 L50 92 M56 12 L50 30'), { d: 'M44 12 L40 30 L50 44 M56 12 L60 30 L50 44', fill: 'fold', op: 0.45 }, { d: circle(53, 56, 1.6) + circle(53, 70, 1.6), fill: 'fold' }],
  cami: [{ d: 'M38 12 L40 12 L42 34 L58 34 L60 12 L62 12 L64 36 Q70 60 70 98 L30 98 Q30 60 36 36 Z', fill: 'base' }, L('M36 36 Q50 44 64 36'), L('M40 50 L40 94 M50 52 L50 96 M60 50 L60 94', 0.35)],
  shorts: [{ d: 'M26 30 L74 30 L82 86 L56 90 L50 58 L44 90 L18 86 Z', fill: 'base' }, L('M26 38 L74 38'), L('M46 38 L44 46 M54 38 L56 46')],
  sweater: [{ d: 'M30 16 L42 12 Q50 18 58 12 L70 16 L88 30 L92 98 L80 100 L74 46 L72 104 L28 104 L26 46 L20 100 L8 98 L12 30 Z', fill: 'base' }, L('M42 12 Q50 20 58 12'), L('M28 98 L72 98 M10 92 L22 92 M78 92 L90 92'), { d: 'M40 40 L40 94 M50 40 L50 96 M60 40 L60 94', stroke: 'light', sw: 1.2, op: 0.5 }],
  bag: [{ d: rect(20, 40, 60, 56, 8), fill: 'base' }, { d: 'M32 40 Q32 22 50 22 Q68 22 68 40', stroke: 'fold', sw: 4 }, L('M20 54 L80 54'), { d: rect(46, 52, 8, 6, 1.5), fill: 'fold' }],
};

export const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};
export const paints = (color: string): Record<Paint, string> => ({ base: color, fold: shade(color, 0.78), light: shade(color, 1.12) });

export const Garment: React.FC<{ kind: Kind; color: string }> = ({ kind, color }) => {
  const p = paints(color);
  return (
    <g>
      {GARMENTS[kind].map((o, i) => (
        <path key={i} d={o.d} fill={o.fill ? p[o.fill] : 'none'} stroke={o.stroke ? p[o.stroke] : undefined} strokeWidth={o.sw} strokeLinecap="round" opacity={o.op} />
      ))}
    </g>
  );
};

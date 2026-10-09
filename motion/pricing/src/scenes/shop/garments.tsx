import React from 'react';

/**
 * Flat garment illustrations (drawn for this piece, no product photography): each one in a
 * 100 × 120 box, a base colour and a darker fold colour derived from it.
 */
export type Kind = 'tee' | 'dress' | 'hoodie' | 'jeans' | 'skirt' | 'jacket' | 'cami' | 'shorts' | 'sweater' | 'bag';
export const KINDS: Kind[] = ['dress', 'tee', 'hoodie', 'jeans', 'skirt', 'jacket', 'cami', 'shorts', 'sweater', 'bag'];

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

export const Garment: React.FC<{ kind: Kind; color: string }> = ({ kind, color }) => {
  const fold = shade(color, 0.78), light = shade(color, 1.12);
  const st = { fill: color } as const;
  const line = { fill: 'none', stroke: fold, strokeWidth: 1.4, strokeLinecap: 'round' as const };
  switch (kind) {
    case 'tee': return (<g><path d="M30 18 L42 14 Q50 20 58 14 L70 18 L86 32 L77 42 L70 37 L70 104 L30 104 L30 37 L23 42 L14 32 Z" {...st} /><path d="M42 14 Q50 22 58 14" {...line} /><path d="M38 60 L40 100 M62 58 L60 100" {...line} opacity={0.5} /></g>);
    case 'dress': return (<g><path d="M40 10 L44 10 L46 26 L54 26 L56 10 L60 10 L62 30 Q60 40 58 46 L78 108 Q50 114 22 108 L42 46 Q40 40 38 30 Z" {...st} /><path d="M42 46 Q50 50 58 46" {...line} /><path d="M50 52 L46 108 M50 52 L56 109 M50 52 L36 107 M50 52 L66 108" {...line} opacity={0.55} /></g>);
    case 'hoodie': return (<g><path d="M28 24 L40 16 Q50 6 60 16 L72 24 L88 74 L78 78 L70 50 L70 106 L30 106 L30 50 L22 78 L12 74 Z" {...st} /><path d="M40 16 Q50 34 60 16" fill={fold} opacity={0.55} /><path d="M38 76 L62 76 L66 92 L34 92 Z" fill={fold} opacity={0.35} /><path d="M46 26 L45 44 M54 26 L55 44" {...line} /><path d="M30 100 L70 100" {...line} /></g>);
    case 'jeans': return (<g><path d="M30 12 L70 12 L76 110 L56 110 L50 44 L44 110 L24 110 Z" {...st} /><path d="M30 20 L70 20" {...line} /><path d="M50 20 L50 44 M34 22 Q38 32 46 30 M66 22 Q62 32 54 30" {...line} /><path d="M30 104 L42 104 M58 104 L70 104" {...line} opacity={0.6} /></g>);
    case 'skirt': return (<g><path d="M34 22 L66 22 L84 104 Q50 112 16 104 Z" {...st} /><path d="M34 22 L66 22 L66 30 L34 30 Z" fill={fold} /><path d="M44 30 L36 106 M56 30 L64 106 M50 30 L50 108" {...line} opacity={0.5} /></g>);
    case 'jacket': return (<g><path d="M30 16 L44 12 L50 30 L56 12 L70 16 L86 40 L84 104 L74 104 L72 52 L70 92 L30 92 L28 52 L26 104 L16 104 L14 40 Z" {...st} /><path d="M44 12 L50 30 L50 92 M56 12 L50 30" {...line} /><path d="M44 12 L40 30 L50 44 M56 12 L60 30 L50 44" fill={fold} opacity={0.45} /><circle cx={53} cy={56} r={1.6} fill={fold} /><circle cx={53} cy={70} r={1.6} fill={fold} /></g>);
    case 'cami': return (<g><path d="M38 12 L40 12 L42 34 L58 34 L60 12 L62 12 L64 36 Q70 60 70 98 L30 98 Q30 60 36 36 Z" {...st} /><path d="M36 36 Q50 44 64 36" {...line} /><path d="M40 50 L40 94 M50 52 L50 96 M60 50 L60 94" {...line} opacity={0.35} /></g>);
    case 'shorts': return (<g><path d="M26 30 L74 30 L82 86 L56 90 L50 58 L44 90 L18 86 Z" {...st} /><path d="M26 38 L74 38" {...line} /><path d="M46 38 L44 46 M54 38 L56 46" {...line} /></g>);
    case 'sweater': return (<g><path d="M30 16 L42 12 Q50 18 58 12 L70 16 L88 30 L92 98 L80 100 L74 46 L72 104 L28 104 L26 46 L20 100 L8 98 L12 30 Z" {...st} /><path d="M42 12 Q50 20 58 12" {...line} /><path d="M28 98 L72 98 M10 92 L22 92 M78 92 L90 92" {...line} /><path d="M40 40 L40 94 M50 40 L50 96 M60 40 L60 94" stroke={light} strokeWidth={1.2} opacity={0.5} /></g>);
    case 'bag': return (<g><path d="M32 40 Q32 22 50 22 Q68 22 68 40" fill="none" stroke={fold} strokeWidth={4} /><rect x={20} y={40} width={60} height={56} rx={8} {...st} /><path d="M20 54 L80 54" {...line} /><rect x={46} y={52} width={8} height={6} rx={1.5} fill={fold} /></g>);
  }
};

import React from 'react';
import { measure, type TextStyle } from '../layout/measure';
import { THEME, clamp01, rng } from '../theme';
import { at, type Curve, type P } from './curve';

/**
 * The spark write head (skill word-synced-motion, W2): a white core in an orange glow, shedding
 * particles from where it has just been. Fully deterministic: the particles are re-derived from
 * the spark's past positions (`pos(time)`), so any frame renders the same.
 */
export const Spark: React.FC<{ t: number; pos: (t: number) => P | null; color?: string; size?: number }> = ({ t, pos, color = THEME.accent, size = 1 }) => {
  const p = pos(t);
  if (!p) return null;
  const parts: React.ReactNode[] = [];
  for (let k = 0; k < 36; k++) {
    const te = Math.floor(t * 60 - k) / 60; // emitted one per 1/60 s
    const age = t - te;
    const q = pos(te);
    if (!q || age > 0.6) continue;
    const r = rng(Math.floor(te * 600) + 7);
    const a = r() * Math.PI * 2, v = 40 + r() * 140;
    const x = q.x + Math.cos(a) * v * age, y = q.y + Math.sin(a) * v * age + 180 * age * age;
    parts.push(<circle key={k} cx={x} cy={y} r={(1 + r() * 1.6) * size} fill={r() > 0.4 ? '#ffd2a8' : color} opacity={(1 - age / 0.6) * 0.9} />);
  }
  return (
    <g>
      <defs>
        <radialGradient id="sparkGlow"><stop offset="0" stopColor="#fff2e0" stopOpacity="1" /><stop offset="0.25" stopColor={color} stopOpacity="0.55" /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx={p.x} cy={p.y} r={70 * size} fill="url(#sparkGlow)" />
      {parts}
      <circle cx={p.x} cy={p.y} r={5 * size} fill="#fffaf2" />
    </g>
  );
};

/**
 * A word laid on a curve (W3): letters measured on the real font, placed by arc length from `s0`,
 * rotated with the tangent, `offset` px above the curve. Each letter is written when the spark
 * passes it (`head` = the spark's distance along the curve): it pops out of the spark.
 */
export const PathText: React.FC<{ curve: Curve; text: string; s0: number; head: number; style: TextStyle; color: string; offset?: number; opacity?: number }> = ({ curve, text, s0, head, style, color, offset = 26, opacity = 1 }) => {
  const chars = [...(style.upper ? text.toUpperCase() : text)];
  const adv = chars.map((_, i) => (i ? measure(chars.slice(0, i).join(''), style).advance : 0));
  const m = measure(text, style);
  return (
    <g opacity={opacity}>
      {chars.map((ch, i) => {
        const w = measure(ch, style).advance;
        const s = s0 + adv[i]! + w / 2;
        const shown = clamp01((head - s) / 40); // the spark has passed it by 40 px: fully written
        if (shown <= 0 || ch === ' ') return null;
        const q = at(curve, s);
        const nx = Math.sin(q.a), ny = -Math.cos(q.a);
        const x = q.x + nx * offset, y = q.y + ny * offset;
        const k = 0.5 + 0.5 * shown;
        return (
          <text key={i} x={0} y={0} transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(q.a * 180 / Math.PI).toFixed(2)}) scale(${k}) translate(${(-w / 2).toFixed(1)},${(m.capAscent / 2).toFixed(1)})`}
            fontFamily={style.font === 'serif' ? THEME.serif : THEME.sans} fontStyle={style.italic ? 'italic' : 'normal'} fontWeight={style.weight ?? 600} fontSize={style.size}
            fill={color} opacity={shown} style={{ filter: shown < 1 ? `drop-shadow(0 0 6px ${THEME.accent})` : undefined }}>{ch}</text>
        );
      })}
    </g>
  );
};

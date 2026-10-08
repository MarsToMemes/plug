import React from 'react';
import { THEME } from '../theme';
import type { CharLayout } from './layout';

/**
 * Renders characters as independent elements from a choreography: a function of time that returns
 * one pose per character (screen position of the glyph's optical centre, size, rotation, squash,
 * opacity, colour). Each glyph gets a directional motion blur computed from its real screen velocity
 * (pose at t and t - 1/60 s): a letter at rest is sharp, a fast one smears along its motion.
 * The glyph is centred on its pose by its ink box and its cap height (optical centre).
 */
export type Pose = { x: number; y: number; size: number; rot?: number; sx?: number; sy?: number; o?: number; color?: string; dot?: number };
export type Choreo = (t: number) => Pose[];

export const KineticLetters: React.FC<{ layout: CharLayout; choreo: Choreo; t: number; weight?: number; family?: string; blur?: number; idPrefix: string }> = ({ layout, choreo, t, weight = 800, family = THEME.sans, blur = 0.45, idPrefix }) => {
  const now = choreo(t), prev = choreo(t - 1 / 60);
  const base = 100, k0 = base / layout.style.size; // glyphs are drawn at 100 px and scaled by their pose
  return (
    <g>
      <defs>
        {now.map((p, i) => {
          const q = prev[i]!, vx = Math.abs(p.x - q.x), vy = Math.abs(p.y - q.y);
          return <filter key={i} id={`${idPrefix}${i}`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={`${Math.min(60, vx * blur).toFixed(1)} ${Math.min(60, vy * blur).toFixed(1)}`} /></filter>;
        })}
      </defs>
      {now.map((p, i) => {
        const c = layout.chars[i]!, o = p.o ?? 1;
        if (o <= 0.001 || p.size <= 0.5) return null;
        const q = prev[i]!, moving = Math.abs(p.x - q.x) + Math.abs(p.y - q.y) > 0.6;
        const s = p.size / base;
        return (
          <g key={i} filter={moving ? `url(#${idPrefix}${i})` : undefined} opacity={o}>
            <g transform={`translate(${p.x.toFixed(2)},${p.y.toFixed(2)}) rotate(${(p.rot ?? 0).toFixed(2)}) scale(${(s * (p.sx ?? 1)).toFixed(4)},${(s * (p.sy ?? 1)).toFixed(4)})`}>
              <text x={-((c.inkL + c.inkR) / 2) * k0} y={(layout.cap * k0) / 2} fontFamily={family} fontWeight={weight} fontSize={base} fill={p.color ?? THEME.ink}>{c.ch}</text>
            </g>
          </g>
        );
      })}
    </g>
  );
};

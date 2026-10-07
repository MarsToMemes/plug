import React from 'react';
import { THEME } from '../theme';

/**
 * InventoryRibbon — the inventory as a band along time: its height is the share of units
 * still available. Drawn from the start up to `tau`; the deadline drop is drawn by `perish`.
 */
export const InventoryRibbon: React.FC<{
  x0: number; x1: number; y: number; h: number; tau: number; share: (tau: number) => number; perish?: number; steps?: number;
}> = ({ x0, x1, y, h, tau, share, perish = 0, steps = 120 }) => {
  if (tau <= 0) return null;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tau;
    pts.push([x0 + (x1 - x0) * t, y - h * share(t)]);
  }
  const last = pts[pts.length - 1]!;
  const top = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const dropY = last[1] + (y - last[1]) * perish;
  const area = `${top} L${last[0]},${dropY} L${last[0]},${y} L${x0},${y} Z`;
  return (
    <g>
      <path d={area} fill={THEME.ink} fillOpacity={0.08} />
      <path d={top} fill="none" stroke={THEME.ink} strokeWidth={2.4} />
      {perish > 0 && <path d={`M${last[0]},${last[1]} L${last[0]},${dropY}`} stroke={THEME.accent} strokeWidth={3} />}
    </g>
  );
};

/** MilestoneTick — a labelled step on a time axis. */
export const MilestoneTick: React.FC<{ x: number; y: number; label: string; o?: number; strong?: boolean }> = ({ x, y, label, o = 1, strong }) => (
  <g transform={`translate(${x},${y})`} opacity={o}>
    <line y1={-10} y2={10} stroke={strong ? THEME.accent : THEME.ink} strokeWidth={2} />
    <text y={44} textAnchor="middle" fill={strong ? THEME.accent : THEME.ink} fontFamily={THEME.sans} fontSize={20} letterSpacing="0.18em">{label.toUpperCase()}</text>
  </g>
);

import React from 'react';
import { THEME, rng } from '../theme';

/** Which seats are booked: deterministic from a seed, so the same data always draws the same cabin. */
export function bookedSet(total: number, available: number, seed = 7) {
  const r = rng(seed);
  const idx = Array.from({ length: total }, (_, i) => i).sort(() => r() - 0.5);
  return new Set(idx.slice(0, total - available));
}

export type SeatState = 'free' | 'booked' | 'highlight';

/** Seat — one seat seen from above. */
export const Seat: React.FC<{ x: number; y: number; size?: number; state?: SeatState }> = ({ x, y, size = 18, state = 'free' }) => (
  <g transform={`translate(${x},${y})`}>
    <rect width={size} height={size} rx={size * 0.22} fill={state === 'booked' ? THEME.ink : 'none'} stroke={state === 'highlight' ? THEME.accent : state === 'booked' ? THEME.ink : THEME.line} strokeWidth={state === 'highlight' ? 2.4 : 1.4} />
    <rect x={size * 0.12} y={-size * 0.18} width={size * 0.76} height={size * 0.14} rx={2} fill={state === 'booked' ? THEME.ink : THEME.line} />
  </g>
);

/** SeatGrid — rows × layout (e.g. [3, 3] = 3 + aisle + 3), with booked seats from data. */
export const SeatGrid: React.FC<{ rows: number; layout: number[]; booked: Set<number>; size?: number; gap?: number; highlight?: number[]; reveal?: number }> = ({ rows, layout, booked, size = 18, gap = 6, highlight = [], reveal = 1 }) => {
  const per = layout.reduce((a, b) => a + b, 0);
  const seats: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    let x = 0, c = 0;
    layout.forEach((n, g) => {
      for (let k = 0; k < n; k++, c++) {
        const i = r * per + c;
        if (i / (rows * per) > reveal) continue;
        const state: SeatState = highlight.includes(i) ? 'highlight' : booked.has(i) ? 'booked' : 'free';
        seats.push(<Seat key={i} x={x} y={r * (size + gap)} size={size} state={state} />);
        x += size + gap;
      }
      if (g < layout.length - 1) x += size; // aisle
    });
  }
  return <g>{seats}</g>;
};

/** Aircraft — a plan silhouette (top view). */
export const Aircraft: React.FC<{ length?: number; color?: string; strokeOnly?: boolean }> = ({ length = 600, color = THEME.ink, strokeOnly = true }) => {
  const L = length, W = L * 0.13;
  const d = `M${L * 0.5},0 C${L * 0.5 + W * 0.5},${L * 0.04} ${L * 0.5 + W * 0.5},${L * 0.12} ${L * 0.5 + W * 0.5},${L * 0.2}
    L${L * 0.5 + W * 0.5},${L * 0.36} L${L * 0.98},${L * 0.56} L${L * 0.98},${L * 0.6} L${L * 0.5 + W * 0.5},${L * 0.5}
    L${L * 0.5 + W * 0.4},${L * 0.82} L${L * 0.68},${L * 0.92} L${L * 0.68},${L * 0.95} L${L * 0.5},${L * 0.92}
    L${L * 0.32},${L * 0.95} L${L * 0.32},${L * 0.92} L${L * 0.5 - W * 0.4},${L * 0.82} L${L * 0.5 - W * 0.5},${L * 0.5}
    L${L * 0.02},${L * 0.6} L${L * 0.02},${L * 0.56} L${L * 0.5 - W * 0.5},${L * 0.36} L${L * 0.5 - W * 0.5},${L * 0.2}
    C${L * 0.5 - W * 0.5},${L * 0.12} ${L * 0.5 - W * 0.5},${L * 0.04} ${L * 0.5},0 Z`;
  return <path d={d} fill={strokeOnly ? 'none' : color} stroke={color} strokeWidth={2} strokeLinejoin="round" />;
};

/** AircraftCabin — the fuselage cut open, with its seat grid inside. Data: seats, available. */
export const AircraftCabin: React.FC<{ seats: number; available: number; layout?: number[]; seed?: number; reveal?: number; highlight?: number[] }> = ({ seats, available, layout = [3, 3], seed = 7, reveal = 1, highlight }) => {
  const per = layout.reduce((a, b) => a + b, 0);
  const rows = Math.ceil(seats / per);
  const size = 18, gap = 6;
  const w = per * (size + gap) + size * (layout.length - 1) + 40;
  const h = rows * (size + gap) + 60;
  return (
    <g>
      <path d={`M0,${h * 0.06} Q0,-${h * 0.04} ${w / 2},-${h * 0.06} Q${w},-${h * 0.04} ${w},${h * 0.06} L${w},${h} Q${w / 2},${h + 30} 0,${h} Z`} fill="none" stroke={THEME.line} strokeWidth={2} />
      <g transform="translate(20,30)">
        <SeatGrid rows={rows} layout={layout} booked={bookedSet(rows * per, available + (rows * per - seats), seed)} size={size} gap={gap} reveal={reveal} highlight={highlight} />
      </g>
    </g>
  );
};

/** Passenger — a person glyph. */
export const Passenger: React.FC<{ x?: number; y?: number; size?: number; color?: string }> = ({ x = 0, y = 0, size = 40, color = THEME.ink }) => (
  <g transform={`translate(${x},${y}) scale(${size / 40})`} fill={color}>
    <circle cx={20} cy={8} r={7} />
    <path d="M6,40 Q6,18 20,18 Q34,18 34,40 Z" />
  </g>
);

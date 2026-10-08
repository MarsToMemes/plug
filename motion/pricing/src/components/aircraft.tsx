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

/**
 * AircraftPlan — the aircraft seen from above, nose to the right, built around its fuselage
 * box (so the cabin can be filled with seats). `fill` 1 = solid silhouette, 0 = transparent.
 */
export const AircraftPlan: React.FC<{ body: { x: number; y: number; w: number; h: number }; fill?: number; parts?: number; line?: number }> = ({ body: b, fill = 0, parts = 1, line = 1 }) => {
  const style = { fill: THEME.ink, fillOpacity: fill * 0.92, stroke: THEME.ink, strokeOpacity: line * (0.35 + 0.65 * (1 - fill)), strokeWidth: 2, strokeLinejoin: 'round' as const };
  // `parts` < 1 (the aircraft turning into the hotel): the outline gives way to the bare fuselage box.
  return (
    <g>
      {parts > 0 && <path d={aircraftOutline(b)} {...style} opacity={parts} />}
      {parts < 1 && <rect x={b.x} y={b.y} width={b.w} height={b.h} {...style} opacity={1 - parts} />}
    </g>
  );
};

/**
 * One continuous outline (no seams): ogive nose, straight cabin, swept wings, a fuselage that
 * tapers into the tail cone, small swept stabilisers. Drawn around the cabin box (nose to the right).
 */
export function aircraftOutline(b: { x: number; y: number; w: number; h: number }) {
  const { x: x0, w, h } = b, x1 = x0 + w, cy = b.y + h / 2, r = h / 2;
  // Top half, from the nose tip backwards; y as an offset from the axis (negative = up).
  const top: Array<string> = [];
  const P = (x: number, dy: number) => `${x.toFixed(1)},${(cy + dy).toFixed(1)}`;
  top.push(`M${P(x1 + h * 1.2, 0)}`);
  top.push(`C${P(x1 + h * 1.2, -r * 0.62)} ${P(x1 + h * 0.62, -r)} ${P(x1, -r)}`); // nose
  top.push(`L${P(x0 + w * 0.63, -r)}`); // cabin to the wing root
  top.push(`L${P(x0 + w * 0.41, -r - h * 1.6)}`); // swept leading edge
  top.push(`Q${P(x0 + w * 0.37, -r - h * 1.66)} ${P(x0 + w * 0.335, -r - h * 1.6)}`); // rounded tip
  top.push(`L${P(x0 + w * 0.46, -r)}`); // trailing edge back to the fuselage
  top.push(`L${P(x0, -r)}`); // rear cabin
  top.push(`C${P(x0 - h * 0.3, -r)} ${P(x0 - h * 0.55, -r * 0.82)} ${P(x0 - h * 0.7, -r * 0.62)}`); // the fuselage starts to taper
  top.push(`L${P(x0 - h * 1.02, -r - h * 0.62)}`); // stabiliser leading edge
  top.push(`L${P(x0 - h * 1.2, -r - h * 0.62)}`); // stabiliser tip
  top.push(`L${P(x0 - h * 1.06, -r * 0.4)}`); // stabiliser trailing edge
  top.push(`L${P(x0 - h * 1.46, -r * 0.14)}`); // the cone keeps tapering
  top.push(`Q${P(x0 - h * 1.52, -r * 0.1)} ${P(x0 - h * 1.52, 0)}`); // narrow rounded tail end
  // Bottom half: the same points mirrored, in reverse order.
  const pts = top.join(' ');
  const mirror = pts.replace(/(-?[0-9.]+),(-?[0-9.]+)/g, (_, X, Y) => `${X},${(2 * cy - Number(Y)).toFixed(1)}`);
  const segs = mirror.split(/(?=[MLCQ])/).slice(1); // drop the first M (the nose tip)
  // Re-walk the mirrored segments backwards so the outline closes as one loop.
  const coords = (seg: string) => seg.slice(1).trim().split(/\s+/);
  const ends = [mirror.split(/(?=[MLCQ])/)[0]!.slice(1).trim(), ...segs.map((sg) => coords(sg).slice(-1)[0]!)];
  let back = '';
  for (let k = segs.length - 1; k >= 0; k--) {
    const sg = segs[k]!, c = coords(sg), type = sg[0]!;
    const start = ends[k]!; // reversed segment ends where the original started
    if (type === 'L') back += ` L${start}`;
    if (type === 'Q') back += ` Q${c[0]} ${start}`;
    if (type === 'C') back += ` C${c[1]} ${c[0]} ${start}`;
  }
  return `${pts}${back} Z`;
}

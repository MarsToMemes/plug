import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, THEME, clamp01, seg } from '../theme';

/** AlgorithmNode — a node of the pricing system: ring, label, optional pulse when it fires. */
export const AlgorithmNode: React.FC<{ x: number; y: number; label: string; r?: number; appear?: number; pulseAt?: number; strong?: boolean; labelSize?: number }> = ({ x, y, label, r = 10, appear = 0, pulseAt, strong, labelSize = 22 }) => {
  const frame = useCurrentFrame();
  const a = EASE.out(seg(frame, appear, appear + 14));
  const p = pulseAt === undefined ? 0 : clamp01(1 - (frame - pulseAt) / 20) * (frame >= pulseAt ? 1 : 0);
  return (
    <g transform={`translate(${x},${y})`} opacity={a}>
      {p > 0 && <circle r={r + 30 * (1 - p)} fill="none" stroke={THEME.accent} strokeWidth={2} opacity={p} />}
      <circle r={r * a} fill={strong ? THEME.ink : THEME.bg} stroke={strong ? THEME.ink : THEME.muted} strokeWidth={1.6} />
      <text y={r + 34} textAnchor="middle" fill={THEME.ink} opacity={0.82} fontFamily={THEME.sans} fontSize={labelSize} letterSpacing="0.16em">{label.toUpperCase()}</text>
    </g>
  );
};

/** A link between two points, drawn from a to b over [appear, appear + dur]. */
export const Link: React.FC<{ a: [number, number]; b: [number, number]; appear?: number; dur?: number; color?: string; width?: number; dashed?: boolean }> = ({ a, b, appear = 0, dur = 20, color = THEME.line, width = 1.4, dashed }) => {
  const frame = useCurrentFrame();
  const t = EASE.out(seg(frame, appear, appear + dur));
  if (t <= 0) return null;
  return <line x1={a[0]} y1={a[1]} x2={a[0] + (b[0] - a[0]) * t} y2={a[1] + (b[1] - a[1]) * t} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '3 7' : undefined} />;
};

/**
 * RevenueManager — the system: inputs placed on a ring around a centre, links flowing in.
 * The centre is left to the caller (a word, a price) so it can MORPH from what came before.
 */
export const RevenueManager: React.FC<{ cx: number; cy: number; radius: number; inputs: string[]; appear?: number; stagger?: number; centreR?: number }> = ({ cx, cy, radius, inputs, appear = 0, stagger = 5, centreR = 130 }) => (
  <g>
    {inputs.map((label, i) => {
      const ang = -Math.PI / 2 + (i / inputs.length) * Math.PI * 2;
      const x = cx + Math.cos(ang) * radius, y = cy + Math.sin(ang) * radius * 0.62;
      const ex = cx + Math.cos(ang) * centreR, ey = cy + Math.sin(ang) * centreR * 0.62;
      const t0 = appear + i * stagger;
      return (
        <g key={label}>
          <Link a={[ex, ey]} b={[x, y]} appear={t0} dur={22} />
          <AlgorithmNode x={x} y={y} label={label} appear={t0 + 14} />
        </g>
      );
    })}
  </g>
);

/** Timeline — a horizontal time axis with labelled ticks and an optional playhead (0..1). */
export const Timeline: React.FC<{ x: number; y: number; w: number; ticks: string[]; playhead?: number; progress?: number }> = ({ x, y, w, ticks, playhead, progress = 1 }) => (
  <g transform={`translate(${x},${y})`}>
    <line x1={0} y1={0} x2={w * clamp01(progress)} y2={0} stroke={THEME.line} strokeWidth={1.6} />
    {ticks.map((t, i) => {
      const tx = (i / (ticks.length - 1)) * w;
      if (tx > w * progress + 0.5) return null;
      return (
        <g key={t} transform={`translate(${tx},0)`}>
          <line y1={-6} y2={6} stroke={THEME.line} strokeWidth={1.6} />
          <text y={32} textAnchor="middle" fill={THEME.muted} fontFamily={THEME.sans} fontSize={15} letterSpacing="0.1em">{t}</text>
        </g>
      );
    })}
    {playhead !== undefined && <g transform={`translate(${w * playhead},0)`}><line y1={-22} y2={10} stroke={THEME.accent} strokeWidth={2.4} /><circle cy={-22} r={5} fill={THEME.accent} /></g>}
  </g>
);

/** EventMarker — a flag on a timeline: an event that moves demand (concert, fair, holiday). */
export const EventMarker: React.FC<{ x: number; y: number; label: string; h?: number; appear?: number }> = ({ x, y, label, h = 90, appear = 0 }) => {
  const frame = useCurrentFrame();
  const t = EASE.out(seg(frame, appear, appear + 16));
  return (
    <g transform={`translate(${x},${y})`} opacity={t}>
      <line y1={0} y2={-h * t} stroke={THEME.accent} strokeWidth={2} />
      <rect x={0} y={-h * t - 4} width={10} height={10} fill={THEME.accent} />
      <text x={16} y={-h * t + 6} fill={THEME.ink} fontFamily={THEME.sans} fontSize={18} letterSpacing="0.08em">{label}</text>
    </g>
  );
};

/** Booking — a reservation travelling from a point to its seat/room, then landing (filled). */
export const Booking: React.FC<{ from: [number, number]; to: [number, number]; at: number; dur?: number; size?: number }> = ({ from, to, at, dur = 18, size = 10 }) => {
  const frame = useCurrentFrame();
  const t = EASE.inOut(seg(frame, at, at + dur));
  if (frame < at) return null;
  const x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * 60;
  const land = clamp01((frame - at - dur) / 10);
  return (
    <g>
      <circle cx={x} cy={y} r={size * (1 - 0.3 * land)} fill={THEME.accent} />
      {land > 0 && land < 1 && <circle cx={to[0]} cy={to[1]} r={size + 22 * land} fill="none" stroke={THEME.accent} opacity={1 - land} />}
    </g>
  );
};

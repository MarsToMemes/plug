import React from 'react';
import { THEME } from '../theme';

/** RoomPlan — an hotel room seen from above, in a frame of size w × h (walls, window, bed, desk, door). */
export const RoomPlan: React.FC<{ x: number; y: number; w: number; h: number; draw?: number; line?: string; o?: number }> = ({ x, y, w, h, draw = 1, line = THEME.ink, o = 1 }) => {
  const d = (k: number) => ({ pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - Math.min(1, Math.max(0, draw * 1.6 - k * 0.12)) });
  const bw = w * 0.34, bh = h * 0.58, bx = x + w * 0.33, by = y + h * 0.08;
  const s = { fill: 'none', stroke: line, strokeWidth: 2 } as const;
  return (
    <g opacity={o}>
      <rect x={x} y={y} width={w} height={h} {...s} strokeWidth={3} {...d(0)} />
      <path d={`M${x + w * 0.3},${y} L${x + w * 0.7},${y}`} stroke={line} strokeWidth={7} opacity={0.5} {...d(1)} />
      <rect x={bx} y={by} width={bw} height={bh} rx={8} {...s} {...d(2)} />
      <rect x={bx + bw * 0.08} y={by + 12} width={bw * 0.38} height={bh * 0.14} rx={6} {...s} {...d(3)} />
      <rect x={bx + bw * 0.54} y={by + 12} width={bw * 0.38} height={bh * 0.14} rx={6} {...s} {...d(3)} />
      <path d={`M${bx},${by + bh * 0.36} L${bx + bw},${by + bh * 0.36}`} {...s} {...d(4)} />
      <rect x={bx - w * 0.08} y={by + 6} width={w * 0.06} height={w * 0.06} {...s} {...d(4)} />
      <rect x={bx + bw + w * 0.02} y={by + 6} width={w * 0.06} height={w * 0.06} {...s} {...d(4)} />
      <rect x={x + w * 0.86} y={y + h * 0.3} width={w * 0.1} height={h * 0.36} {...s} {...d(5)} />
      <path d={`M${x + w * 0.06},${y + h} A${w * 0.12},${w * 0.12} 0 0 1 ${x + w * 0.18},${y + h - w * 0.12} L${x + w * 0.06},${y + h - w * 0.12}`} {...s} strokeWidth={1.4} {...d(6)} />
    </g>
  );
};

/** RoomFront — the same room seen from the front: bed, headboard, lamp, window. Never changes. */
export const RoomFront: React.FC<{ x: number; y: number; w: number; h: number; o?: number }> = ({ x, y, w, h, o = 1 }) => {
  const s = { fill: 'none', stroke: THEME.ink, strokeWidth: 2 } as const;
  const floor = y + h * 0.82;
  return (
    <g opacity={o}>
      <path d={`M${x},${floor} L${x + w},${floor}`} stroke={THEME.line} strokeWidth={2} />
      <rect x={x + w * 0.62} y={y + h * 0.12} width={w * 0.26} height={h * 0.36} {...s} />
      <path d={`M${x + w * 0.75},${y + h * 0.12} L${x + w * 0.75},${y + h * 0.48} M${x + w * 0.62},${y + h * 0.3} L${x + w * 0.88},${y + h * 0.3}`} stroke={THEME.line} strokeWidth={1.4} />
      <rect x={x + w * 0.16} y={y + h * 0.38} width={w * 0.42} height={h * 0.2} rx={10} {...s} />
      <rect x={x + w * 0.12} y={y + h * 0.56} width={w * 0.5} height={h * 0.16} rx={8} {...s} />
      <rect x={x + w * 0.2} y={y + h * 0.5} width={w * 0.14} height={h * 0.07} rx={10} {...s} />
      <rect x={x + w * 0.37} y={y + h * 0.5} width={w * 0.14} height={h * 0.07} rx={10} {...s} />
      <path d={`M${x + w * 0.14},${y + h * 0.72} L${x + w * 0.14},${floor} M${x + w * 0.6},${y + h * 0.72} L${x + w * 0.6},${floor}`} {...s} />
      <rect x={x + w * 0.66} y={y + h * 0.62} width={w * 0.12} height={h * 0.2} {...s} />
      <path d={`M${x + w * 0.72},${y + h * 0.62} L${x + w * 0.72},${y + h * 0.5} M${x + w * 0.68},${y + h * 0.5} L${x + w * 0.76},${y + h * 0.5} L${x + w * 0.74},${y + h * 0.43} L${x + w * 0.7},${y + h * 0.43} Z`} {...s} />
    </g>
  );
};

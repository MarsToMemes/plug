import React from 'react';
import { THEME } from '../theme';
import { bookedSet } from './aircraft';

/** HotelRoom — one window: lit when the room is taken, outlined when it is free. */
export const HotelRoom: React.FC<{ x: number; y: number; w?: number; h?: number; taken: boolean; highlight?: boolean }> = ({ x, y, w = 22, h = 28, taken, highlight }) => (
  <rect x={x} y={y} width={w} height={h} fill={taken ? THEME.ink : 'none'} opacity={taken ? 0.9 : 1} stroke={highlight ? THEME.accent : taken ? THEME.ink : THEME.line} strokeWidth={highlight ? 2.4 : 1.3} />
);

/** HotelFloor — one floor: a row of rooms. `taken` holds room indexes on this floor. */
export const HotelFloor: React.FC<{ y: number; rooms: number; taken: (i: number) => boolean; w?: number; gap?: number; highlight?: (i: number) => boolean }> = ({ y, rooms, taken, w = 22, gap = 12, highlight }) => (
  <g>{Array.from({ length: rooms }, (_, i) => <HotelRoom key={i} x={i * (w + gap)} y={y} w={w} taken={taken(i)} highlight={highlight?.(i)} />)}</g>
);

/** RoomGrid — every room of the hotel as a grid of floors × rooms (bottom floor first). */
export const RoomGrid: React.FC<{ rooms: number; available: number; perFloor?: number; seed?: number; reveal?: number; highlight?: number[] }> = ({ rooms, available, perFloor = 20, seed = 11, reveal = 1, highlight = [] }) => {
  const floors = Math.ceil(rooms / perFloor);
  const taken = bookedSet(rooms, available, seed);
  return (
    <g>
      {Array.from({ length: floors }, (_, f) => {
        const vis = (f + 1) / floors <= reveal + 1e-6;
        if (!vis) return null;
        return <HotelFloor key={f} y={(floors - 1 - f) * 40} rooms={perFloor} taken={(i) => taken.has(f * perFloor + i)} highlight={(i) => highlight.includes(f * perFloor + i)} />;
      })}
    </g>
  );
};

/** Hotel — the building: facade outline, roof line and its room grid. */
export const Hotel: React.FC<{ rooms: number; available: number; perFloor?: number; reveal?: number; name?: string }> = ({ rooms, available, perFloor = 20, reveal = 1, name }) => {
  const floors = Math.ceil(rooms / perFloor);
  const w = perFloor * 34 + 28, h = floors * 40 + 60;
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} fill="none" stroke={THEME.line} strokeWidth={2} />
      <path d={`M-14,0 L${w + 14},0`} stroke={THEME.ink} strokeWidth={3} />
      {name && <text x={w / 2} y={-18} textAnchor="middle" fill={THEME.muted} fontFamily={THEME.sans} fontSize={16} letterSpacing="0.2em">{name.toUpperCase()}</text>}
      <g transform="translate(18,24)"><RoomGrid rooms={rooms} available={available} perFloor={perFloor} reveal={reveal} /></g>
    </g>
  );
};

/** Guest — a person glyph with a key card. */
export const Guest: React.FC<{ x?: number; y?: number; size?: number; color?: string }> = ({ x = 0, y = 0, size = 40, color = THEME.ink }) => (
  <g transform={`translate(${x},${y}) scale(${size / 40})`} fill={color}>
    <circle cx={18} cy={8} r={7} />
    <path d="M4,40 Q4,18 18,18 Q32,18 32,40 Z" />
    <rect x={30} y={24} width={10} height={7} rx={1.5} fill={THEME.accent} />
  </g>
);

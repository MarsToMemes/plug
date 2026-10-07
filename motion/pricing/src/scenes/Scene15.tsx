import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AircraftPlan } from '../components/aircraft';
import { HotelFacade } from '../components/hotel';
import { flight, hotel } from '../data/entities';
import { S15 } from '../data/scene15';
import { EASE, THEME, lerp, seg } from '../theme';
import { Title } from '../type/Title';
import { aircraftLayout, hotelLayout, place } from './layout02';

const B = S15.beats, N = S15.left.rows.length;
const RY = (i: number) => 460 + i * 90;
const LX = 560, RX = 1360;
const AC = aircraftLayout(flight.seats, flight.layout), HO = hotelLayout(hotel.rooms, hotel.perFloor);

export const Scene15: React.FC = () => {
  const f = useCurrentFrame();
  const heads = EASE.out(seg(f, B.heads, B.heads + 30));
  const m = EASE.inOut(seg(f, B.merge, B.merge + 60)); // both columns slide into the centre
  const title = EASE.out(seg(f, B.title, B.title + 30));
  // One pulse runs down both columns at the same time: the two systems work in step.
  const cyc = f >= B.pulse && f < B.pulseEnd ? ((f - B.pulse) / 100) % 1 : -1;
  const row = (side: 'l' | 'r', i: number) => {
    const label = (side === 'l' ? S15.left : S15.right).rows[i]!;
    const o = EASE.out(seg(f, B.rows + i * 14, B.rows + i * 14 + 20));
    const lit = cyc >= 0 && Math.abs(cyc * (N + 1) - 0.5 - i) < 0.5;
    const x = side === 'l' ? lerp(LX, 960, m) : lerp(RX, 960, m);
    return (
      <div key={side + i} style={{ position: 'absolute', left: x - 300, width: 600, top: RY(i) - 18 + (lerp(0, 0, m)), textAlign: 'center', opacity: o * (1 - seg(f, B.merge + 18, B.merge + 46)), filter: `blur(${seg(f, B.merge + 10, B.merge + 46) * 8}px)`, fontFamily: THEME.sans, fontSize: 26, letterSpacing: '0.24em', textTransform: 'uppercase', color: lit ? THEME.accent : THEME.ink }}>{label}</div>
    );
  };
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <line x1={960} y1={lerp(140, 540, m)} x2={960} y2={lerp(940, 540, m)} stroke={THEME.line} strokeWidth={1.4} opacity={heads * (1 - m)} />
        <g opacity={heads * (1 - m)}>
          <AircraftPlan body={place(AC.body, 0.22, LX - 960 - 20, 190 - 540)} />
          <HotelFacade body={place(HO.body, 0.3, RX - 960, 190 - 540)} />
          {[LX, RX].map((x) => Array.from({ length: N - 1 }, (_, i) => <line key={`${x}${i}`} x1={x} y1={RY(i) + 18} x2={x} y2={RY(i + 1) - 30} stroke={THEME.faint} strokeWidth={1.4} />))}
        </g>
      </svg>
      {[[LX, S15.left.title], [RX, S15.right.title]].map(([x, t]) => (
        <div key={t as string} style={{ position: 'absolute', left: (x as number) - 300, width: 600, top: 330, textAlign: 'center', opacity: heads * (1 - m), fontFamily: THEME.serif, fontWeight: 300, fontSize: 52, letterSpacing: '0.06em', textTransform: 'uppercase', color: THEME.ink }}>{t}</div>
      ))}
      {S15.left.rows.map((_, i) => row('l', i))}
      {S15.right.rows.map((_, i) => row('r', i))}
      <Title text={S15.merged} at={B.title} top={480} size={96} family="TITLE_MORPH" tracking={0.03} speed={1.4} />
    </AbsoluteFill>
  );
};

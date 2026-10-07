import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { Caps } from '../components/ui';
import { S13 } from '../data/scene13';
import { EASE, THEME, clamp01, lerp, rng, seg } from '../theme';

const B = S13.beats, C = { x: 960, y: 560 }, R = 400;
// The city: blocks on a street grid, clipped to a rough circle; some blocks are hotels.
const CITY = (() => {
  const r = rng(1313), blocks: Array<{ x: number; y: number; w: number; h: number; hotel: boolean; d: number }> = [];
  for (let gx = -9; gx <= 9; gx++) for (let gy = -6; gy <= 6; gy++) {
    const x = C.x + gx * 44, y = C.y + gy * 44, d = Math.hypot((x - C.x) / R, (y - C.y) / (R * 0.75));
    if (d > 1 - r() * 0.15 || (Math.abs(gx) <= 1 && Math.abs(gy) <= 1)) continue;
    blocks.push({ x: x - 16 + r() * 4, y: y - 16 + r() * 4, w: 26 + r() * 8, h: 26 + r() * 8, hotel: false, d });
  }
  const order = blocks.map((_, i) => i).sort(() => r() - 0.5).slice(0, S13.hotels);
  order.forEach((i) => (blocks[i]!.hotel = true));
  return blocks;
})();
const HOTELS = CITY.filter((b) => b.hotel);
const VISITORS = (() => {
  const r = rng(1314);
  return Array.from({ length: S13.visitors }, (_, i) => {
    const a = r() * Math.PI * 2, far = 1150 + r() * 700, near = Math.pow(r(), 0.7) * R * 0.9;
    const b = r() * Math.PI * 2;
    return { sx: C.x + Math.cos(a) * far * 1.4, sy: C.y + Math.sin(a) * far, tx: C.x + Math.cos(b) * near, ty: C.y + Math.sin(b) * near * 0.75, at: lerp(B.arrive, B.arriveEnd - 60, Math.pow(i / S13.visitors, 0.8)), dur: 60 + r() * 50 };
  });
})();

const Bar: React.FC<{ y: number; label: string; v: number; hot: boolean }> = ({ y, label, v, hot }) => (
  <div style={{ position: 'absolute', left: 120, top: y }}>
    <Caps size={16}>{label}</Caps>
    <div style={{ marginTop: 8, width: 300, height: 6, background: THEME.faint }}><div style={{ width: `${v * 100}%`, height: '100%', background: hot ? THEME.accent : THEME.ink }} /></div>
  </div>
);

export const Scene13: React.FC = () => {
  const f = useCurrentFrame();
  const ev = EASE.out(seg(f, B.event, B.event + 24));
  const arrived = clamp01((f - B.arrive) / (B.arriveEnd - B.arrive));
  const pressure = EASE.inOut(arrived);
  const full = Math.round(HOTELS.length * pressure * 0.92); // hotels fully booked
  const bars = EASE.out(seg(f, B.bars, B.bars + 20));
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S13.camera}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {CITY.map((b, i) => {
            const o = EASE.out(seg(f, B.city + b.d * 40, B.city + b.d * 40 + 20));
            if (!b.hotel) return <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={THEME.ink} fillOpacity={0.07} stroke={THEME.line} strokeWidth={1} opacity={o} />;
            const k = HOTELS.indexOf(b), booked = k < full;
            return <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={booked ? THEME.ink : 'none'} fillOpacity={0.9} stroke={THEME.ink} strokeWidth={1.8} opacity={o} />;
          })}
          {/* The venue. */}
          <g opacity={ev}>
            <ellipse cx={C.x} cy={C.y} rx={56} ry={40} fill="none" stroke={THEME.accent} strokeWidth={2.4} />
            <ellipse cx={C.x} cy={C.y} rx={56 + 40 * ((f * 0.02) % 1)} ry={40 + 30 * ((f * 0.02) % 1)} fill="none" stroke={THEME.accent} strokeWidth={1.2} opacity={1 - ((f * 0.02) % 1)} />
          </g>
          {/* Visitors converging. */}
          {VISITORS.map((v, i) => {
            const t = (f - v.at) / v.dur;
            if (t <= 0) return null;
            const e = EASE.inOut(clamp01(t));
            return <circle key={i} cx={lerp(v.sx, v.tx, e)} cy={lerp(v.sy, v.ty, e)} r={2.6} fill={THEME.accent} opacity={0.75} />;
          })}
        </svg>
      </CameraRig>
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 110, textAlign: 'center', opacity: ev * (1 - seg(f, B.chain[0]! - 20, B.chain[0]!)) }}>
        <Caps size={26} color={THEME.accent}>{S13.text.event}</Caps>
      </div>
      <div style={{ opacity: bars }}>
        <Bar y={700} label={S13.text.demand} v={lerp(0.15, 1, pressure)} hot={pressure > 0.05 && pressure < 1} />
        <Bar y={770} label={S13.text.avail} v={lerp(0.85, 0.08, pressure)} hot={pressure > 0.05 && pressure < 1} />
        <Bar y={840} label={S13.text.price} v={lerp(0.3, 0.92, Math.pow(pressure, 1.4))} hot={pressure > 0.05 && pressure < 1} />
      </div>
      {/* The mechanism, said in one line, piece by piece. */}
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 970, textAlign: 'center', fontFamily: THEME.serif, fontWeight: 300, fontSize: 44, color: THEME.ink, textTransform: 'uppercase', letterSpacing: '0.03em', textShadow: `0 0 20px ${THEME.bg}` }}>
        {S13.text.chain.map((t, k) => {
          const o = EASE.out(seg(f, B.chain[k]!, B.chain[k]! + 24));
          return <span key={t} style={{ opacity: o, filter: `blur(${(1 - o) * 4}px)` }}>{k ? <span style={{ color: THEME.accent, margin: '0 22px' }}>→</span> : null}{t}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

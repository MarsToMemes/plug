import React from 'react';
import { Title } from '../type/Title';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AircraftPlan } from '../components/aircraft';
import { Caps, Statement } from '../components/ui';
import { S18 } from '../data/scene18';
import { EASE, THEME, clamp01, lerp, rng, seg } from '../theme';

const B = S18.beats;
/** Log-interpolated zoom: every step of the pull-back feels like the same distance travelled. */
function zoomAt(f: number) {
  const z = S18.zoom;
  for (let i = 1; i < z.length; i++) if (f <= z[i]!.at) return Math.exp(lerp(Math.log(z[i - 1]!.s), Math.log(z[i]!.s), EASE.inOut(seg(f, z[i - 1]!.at, z[i]!.at))));
  return z[z.length - 1]!.s;
}
const NS = { vectorEffect: 'non-scaling-stroke' as const };
// Hotel: the split screen sits in one window of the facade.
const WIN = { w: 1120, h: 520 }, PX = 1500, PY = 800, COLS = 12, FLOORS = 8, HC = 6, HF = 3;
const HOTEL = { x: -HC * PX - WIN.w / 2 - 600, y: -(FLOORS - 1 - HF) * PY - WIN.h / 2 - 900, w: COLS * PX + 1200 - (PX - WIN.w), h: FLOORS * PY + 1500 - (PY - WIN.h) };
const CITY = (() => { const r = rng(1818), out: Array<{ x: number; y: number; s: number }> = []; for (let gx = -8; gx <= 8; gx++) for (let gy = -6; gy <= 6; gy++) { if (!gx && !gy) continue; const d = Math.hypot(gx / 8, gy / 6); if (d > 1 - r() * 0.2) continue; out.push({ x: gx * 30000, y: gy * 30000, s: 18000 + r() * 6000 }); } return out; })();
const CROWD = (() => { const r = rng(1819); return Array.from({ length: 1400 }, () => ({ a: r() * Math.PI * 2, r0: 400000 + r() * 900000, ph: r(), sp: 0.5 + r() })); })();

export const Scene18: React.FC = () => {
  const f = useCurrentFrame();
  const s = zoomAt(f);
  const vis = (minS: number, maxS: number) => clamp01(Math.min((s - minS * 0.5) / (minS * 0.5), (maxS * 2 - s) / maxS)); // fade a layer outside its useful range
  const sys = seg(f, 560, 640);
  const endText = seg(f, B.chainAt - 30, B.chainAt);
  const black = seg(f, B.black, B.black + 40);
  const lvl = [...S18.levels].reverse().find((l) => f >= l.at);
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: (1 - endText * 0.85) * (1 - 0.45 * seg(f, B.never - 10, B.never + 20)) }}>
        <g transform={`translate(960,540) scale(${s})`}>
          {/* System: the largest ring. */}
          <g opacity={sys}>
            {S18.system.map((label, i) => {
              const a = -Math.PI / 2 + (i / S18.system.length) * Math.PI * 2, x = Math.cos(a) * 3200000, y = Math.sin(a) * 2100000;
              return (
                <g key={label}>
                  <line x1={x} y1={y} x2={x * 0.32} y2={y * 0.32} stroke={THEME.line} strokeWidth={1.4} {...NS} />
                  <circle cx={x} cy={y} r={45000} fill={THEME.bg} stroke={THEME.ink} strokeWidth={1.6} {...NS} />
                </g>
              );
            })}
            <circle r={950000} fill="none" stroke={THEME.accent} strokeWidth={1.4} strokeDasharray="6 8" {...NS} />
          </g>
          {/* Demand: crowds flowing to the city. */}
          <g opacity={seg(f, 400, 470)}>
            {CROWD.map((c, i) => { const t = (c.ph + f * 0.004 * c.sp) % 1, rr = lerp(c.r0, 260000, t); return <circle key={i} cx={Math.cos(c.a) * rr * 1.3} cy={Math.sin(c.a) * rr} r={2.4 / s} fill={THEME.accent} opacity={Math.sin(Math.PI * t) * 0.8} />; })}
          </g>
          {/* City. */}
          <g opacity={vis(0.0002, 0.02) * seg(f, 270, 330)}>
            {CITY.map((b, i) => <rect key={i} x={b.x - b.s / 2} y={b.y - b.s / 2} width={b.s} height={b.s} fill={THEME.ink} fillOpacity={0.07} stroke={THEME.line} strokeWidth={1} {...NS} />)}
          </g>
          {/* Hotel. */}
          <g opacity={vis(0.003, 0.4) * seg(f, 150, 210)}>
            <rect x={HOTEL.x} y={HOTEL.y} width={HOTEL.w} height={HOTEL.h} fill="none" stroke={THEME.ink} strokeWidth={2} {...NS} />
            {Array.from({ length: COLS * FLOORS }, (_, k) => {
              const c = k % COLS, fl = Math.floor(k / COLS); if (c === HC && fl === HF) return null;
              const x = (c - HC) * PX - WIN.w / 2, y = (fl - HF) * PY - WIN.h / 2;
              return <rect key={k} x={x} y={y} width={WIN.w} height={WIN.h} fill={THEME.ink} fillOpacity={(k * 37) % 5 ? 0.85 : 0} stroke={THEME.ink} strokeWidth={1.2} {...NS} />;
            })}
            <rect x={-WIN.w / 2} y={-WIN.h / 2} width={WIN.w} height={WIN.h} fill="none" stroke={THEME.accent} strokeWidth={2} {...NS} />
          </g>
          {/* The split screen: aircraft | price | hotel. */}
          <g opacity={vis(0.05, 20)}>
            <line x1={-170} y1={-130} x2={-170} y2={130} stroke={THEME.line} strokeWidth={1.2} {...NS} />
            <line x1={170} y1={-130} x2={170} y2={130} stroke={THEME.line} strokeWidth={1.2} {...NS} />
            <AircraftPlan body={{ x: -334, y: -42, w: 56, h: 11 }} />
            <text x={-300} y={36} textAnchor="middle" fontFamily={THEME.sans} fontSize={20} letterSpacing="0.24em" fill={THEME.ink}>{S18.text.plane.toUpperCase()}</text>
            <rect x={276} y={-70} width={48} height={60} fill="none" stroke={THEME.ink} strokeWidth={1.6} {...NS} />
            {Array.from({ length: 9 }, (_, k) => <rect key={k} x={282 + (k % 3) * 14} y={-62 + Math.floor(k / 3) * 16} width={8} height={10} fill={THEME.ink} />)}
            <text x={300} y={36} textAnchor="middle" fontFamily={THEME.sans} fontSize={20} letterSpacing="0.24em" fill={THEME.ink}>{S18.text.hotel.toUpperCase()}</text>
            <text x={0} y={-62} textAnchor="middle" fontFamily={THEME.sans} fontSize={13} letterSpacing="0.3em" fill={THEME.muted}>{S18.text.price.toUpperCase()}</text>
            <text x={0} y={22} textAnchor="middle" fontFamily={THEME.sans} fontWeight={300} fontSize={64} fill={THEME.ink}>{S18.price} €</text>
          </g>
        </g>
      </svg>
      {/* System labels, set in screen space (they would be far too large as world text). */}
      {S18.system.map((label, i) => {
        const a = -Math.PI / 2 + (i / S18.system.length) * Math.PI * 2, x = 960 + Math.cos(a) * 3200000 * s, y = 540 + Math.sin(a) * 2100000 * s;
        return <div key={label} style={{ position: 'absolute', left: x - 200, width: 400, top: y + (Math.sin(a) < 0 ? -44 : 22), textAlign: 'center', opacity: sys * (1 - 0.45 * seg(f, B.never - 10, B.never + 20)) * (1 - endText * 0.85) }}><Caps size={18} color={THEME.ink}>{label}</Caps></div>;
      })}
      {/* Where we are in the system. */}
      {lvl && f < B.never && <div style={{ position: 'absolute', left: 112, top: 928, opacity: EASE.out(seg(f, lvl.at, lvl.at + 20)) }}><Caps size={18} color={THEME.ink}>{lvl.label}</Caps></div>}
      <Statement family="TITLE_REVEAL_SLOW" focus={[1]} accent={THEME.accent} text={S18.text.never} at={B.never} out={B.chainAt - 30} top={430} size={72} />
      <Statement family="TITLE_SLIDE" text={S18.text.time} at={B.time} out={B.chainAt - 30} top={540} size={72} color={THEME.accent} />
      {/* The conclusion as a chain read left to right: each link slides in after the previous one. */}
      <Title text={S18.text.chain.join('|→|')} at={B.chainAt - 30} top={500} size={64} family="TITLE_MASK" layout="inline" focus={[1, 3, 5]} accent={THEME.accent} tracking={0.04} speed={1.5} camera={false} />
      <AbsoluteFill style={{ background: '#000', opacity: black }} />
    </AbsoluteFill>
  );
};

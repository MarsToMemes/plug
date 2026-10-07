import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { Caps } from '../components/ui';
import { S09 } from '../data/scene09';
import { EASE, THEME, clamp01, lerp, rng, seg } from '../theme';

const B = S09.beats;
const pressureAt = (f: number) => {
  const a = S09.pressure;
  for (let i = 1; i < a.length; i++) if (f <= a[i]!.at) return lerp(a[i - 1]!.p, a[i]!.p, EASE.inOut(seg(f, a[i - 1]!.at, a[i]!.at)));
  return a[a.length - 1]!.p;
};
const ROWS = S09.rooms / S09.cols, CELL = 26, PITCH = 34;
const GW = S09.cols * PITCH - (PITCH - CELL), GH = ROWS * PITCH - (PITCH - CELL);
const GX = 960 - GW / 2, GY = 430 - GH / 2;
const ORDER = (() => { const r = rng(909); return Array.from({ length: S09.rooms }, (_, i) => i).sort(() => r() - 0.5); })();
const PARTS = (() => { const r = rng(919); return Array.from({ length: S09.demand.max }, () => ({ y: 250 + r() * 360, ph: r(), sp: 0.6 + r() * 0.8, wob: r() * 6 })); })();

/** A vertical gauge with its arrow; the three share one driver. */
const Gauge: React.FC<{ x: number; label: string; v: number; arrow: string; hot: boolean; o: number }> = ({ x, label, v, arrow, hot, o }) => (
  <g transform={`translate(${x},0)`} opacity={o}>
    <rect x={-14} y={760} width={28} height={140} fill="none" stroke={THEME.line} strokeWidth={1.4} />
    <rect x={-14} y={900 - 140 * v} width={28} height={140 * v} fill={hot ? THEME.accent : THEME.ink} opacity={0.85} />
    <text x={0} y={940} textAnchor="middle" fontFamily={THEME.sans} fontSize={18} letterSpacing="0.2em" fill={THEME.ink}>{label.toUpperCase()}</text>
    <text x={30} y={790} fontFamily={THEME.sans} fontSize={34} fill={THEME.accent} opacity={hot ? 1 : 0}>{arrow}</text>
  </g>
);

export const Scene09: React.FC = () => {
  const f = useCurrentFrame();
  const P = pressureAt(f);
  const nDemand = Math.round(lerp(S09.demand.min, S09.demand.max, P));
  const availShare = lerp(1, S09.availability.keepAtMax, P);
  const nAvail = Math.round(S09.rooms * availShare);
  const price = Math.round(lerp(S09.price.low, S09.price.high, Math.pow(P, 1.3)) / 5) * 5;
  const lay = EASE.out(seg(f, B.layout, B.layout + 30));
  const g = EASE.out(seg(f, B.gauges, B.gauges + 30));
  const rising = f > S09.pressure[1]!.at + 10 && f < S09.pressure[2]!.at + 20;
  // One link pulse travels Demande → Disponibilité → Prix, at a rate set by the same pressure.
  const pulse = ((f * (0.004 + 0.02 * P)) % 1);

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S09.camera}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} opacity={lay}>
          {/* Demand: clients flowing from the left towards the rooms; the denser the flow, the higher the pressure. */}
          {PARTS.slice(0, nDemand).map((p, k) => {
            const t = (p.ph + f * 0.004 * p.sp * (1 + 2 * P)) % 1;
            const x = lerp(140, GX - 30, t), y = lerp(p.y, 430 + (p.y - 430) * 0.35, t) + Math.sin(t * 6 + p.wob) * 6;
            return <circle key={k} cx={x} cy={y} r={5} fill={THEME.accent} opacity={0.25 + 0.65 * Math.sin(Math.PI * t)} />;
          })}
          {/* Rooms: the ones still available are bright. */}
          {ORDER.map((idx, k) => {
            const x = GX + (idx % S09.cols) * PITCH, y = GY + Math.floor(idx / S09.cols) * PITCH;
            const avail = k < nAvail;
            return <rect key={idx} x={x} y={y} width={CELL} height={CELL} rx={3} fill={avail ? THEME.ink : 'none'} fillOpacity={0.88} stroke={THEME.line} strokeWidth={1.2} />;
          })}
        </svg>
      </CameraRig>

      {/* Labels of the three zones. */}
      <div style={{ position: 'absolute', left: 140, top: 180, opacity: lay }}><Caps color={THEME.ink}>{S09.text.demand}</Caps></div>
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 180, textAlign: 'center', opacity: lay }}><Caps color={THEME.ink}>{S09.text.rooms}</Caps><span style={{ fontFamily: THEME.sans, fontSize: 22, color: THEME.muted, marginLeft: 16, fontVariantNumeric: 'tabular-nums' }}>{nAvail}</span></div>
      <div style={{ position: 'absolute', right: 160, top: 180, textAlign: 'right', opacity: lay }}>
        <Caps color={THEME.ink}>{S09.text.price}</Caps>
        <div style={{ fontFamily: THEME.sans, fontWeight: 300, fontSize: 110, color: rising ? THEME.accent : THEME.ink, fontVariantNumeric: 'tabular-nums', marginTop: 70 }}>{price}<span style={{ fontSize: 40, color: THEME.muted, marginLeft: 10 }}>€</span></div>
      </div>
      {/* Calm phase: little demand, a price that does not move. */}
      <div style={{ position: 'absolute', left: 112, top: 648, display: 'flex', flexDirection: 'column', gap: 16, opacity: seg(f, B.calm, B.calm + 20) * (1 - seg(f, B.calmOut, B.calmOut + 20)), fontFamily: THEME.sans, fontSize: 24, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.muted, lineHeight: 1.2 }}>
        <div>{`→ ${S09.text.calm1}`}</div><div>{`→ ${S09.text.calm2}`}</div>
      </div>

      {/* The three linked indicators. */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <g opacity={g}>
          <path d="M760,830 L920,830 M1000,830 L1160,830" stroke={THEME.line} strokeWidth={1.6} />
          <path d="M910,822 L920,830 L910,838 M1150,822 L1160,830 L1150,838" stroke={THEME.line} strokeWidth={1.6} fill="none" />
          {rising && <circle cx={pulse < 0.5 ? lerp(760, 920, pulse * 2) : lerp(1000, 1160, (pulse - 0.5) * 2)} cy={830} r={6} fill={THEME.accent} />}
        </g>
        <Gauge x={720} label={S09.text.demand} v={P} arrow="↑" hot={rising} o={g} />
        <Gauge x={960} label={S09.text.avail} v={availShare} arrow="↓" hot={rising} o={g} />
        <Gauge x={1200} label={S09.text.price} v={clamp01((price - S09.price.low * 0.8) / (S09.price.high - S09.price.low * 0.8))} arrow="↑" hot={rising} o={g} />
      </svg>
    </AbsoluteFill>
  );
};

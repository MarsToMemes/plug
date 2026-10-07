import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PriceCounter, type PriceStep } from '../components/price';
import { RoomFront } from '../components/rooms';
import { Caps, Statement } from '../components/ui';
import { S12 } from '../data/scene12';
import { EASE, THEME, clamp01, lerp, seg } from '../theme';

const B = S12.beats, N = S12.days.length;
const X0 = 300, X1 = 1620, BASE = 800, H = 420;
const dx = (i: number) => X0 + (i / (N - 1)) * (X1 - X0);
const pMin = Math.min(...S12.price) * 0.85, pMax = Math.max(...S12.price) * 1.05;
const py = (v: number) => BASE - 40 - ((v - pMin) / (pMax - pMin)) * (H - 40);
/** Smooth demand at a fractional day (cosine interpolation between days). */
const dem = (t: number) => { const i = Math.min(N - 2, Math.floor(t)), u = t - i, w = (1 - Math.cos(u * Math.PI)) / 2; return lerp(S12.demand[i]!, S12.demand[i + 1]!, w); };

export const Scene12: React.FC = () => {
  const f = useCurrentFrame();
  const ax = EASE.out(seg(f, B.axis, B.axis + 40));
  const t1 = (N - 1) * EASE.inOut(seg(f, B.sweep, B.sweepEnd)); // first pass: the week is drawn
  const rev = EASE.inOut(seg(f, B.reveal, B.reveal + 50)); // the chart steps down, the room appears
  const t2 = (N - 1) * EASE.inOut(seg(f, B.sweep2, B.sweep2End)); // second pass: the same room, priced day by day
  const t = rev > 0 ? t2 : t1;
  const day = Math.round(t);
  // The price changes exactly when the playhead reaches a new day (same easing as the sweep).
  const steps: PriceStep[] = S12.days.map((_, i) => {
    let at = 0;
    if (i > 0) for (at = B.sweep2; at < B.sweep2End && (N - 1) * EASE.inOut(seg(at, B.sweep2, B.sweep2End)) < i - 0.5; at++);
    return { at, value: S12.price[i]! };
  });

  // Demand area up to the playhead (first pass), full afterwards.
  const upTo = rev > 0 ? N - 1 : t1;
  const pts: Array<[number, number]> = [];
  for (let k = 0; k <= 120; k++) { const tt = (k / 120) * upTo; pts.push([dx(tt), BASE - dem(tt) * H * 0.8]); }
  const area = `M${dx(0)},${BASE} ${pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} L${dx(upTo)},${BASE} Z`;
  // Price follows: a step line drawn to the same day.
  let price = '';
  for (let i = 0; i <= Math.floor(upTo + 1e-6) && i < N; i++) {
    const x0 = i === 0 ? dx(0) : dx(i - 0.5), x1 = Math.min(dx(Math.min(N - 1, i + 0.5)), dx(upTo));
    price += `${i ? 'L' : 'M'}${x0},${py(S12.price[i]!)} L${Math.max(x0, x1)},${py(S12.price[i]!)} `;
  }
  const s = lerp(1, 0.64, rev), oy = lerp(0, 290, rev);

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(960,${540 + oy}) scale(${s}) translate(-960,-540)`}>
          <line x1={X0 - 40} y1={BASE} x2={X1 + 40} y2={BASE} stroke={THEME.line} strokeWidth={1.6} opacity={ax} />
          {S12.days.map((d, i) => (
            <text key={d} x={dx(i)} y={BASE + 44} textAnchor="middle" fontFamily={THEME.sans} fontSize={24} letterSpacing="0.2em" fill={i === day && (rev === 0 ? f > B.sweep : f > B.sweep2) ? THEME.accent : THEME.ink} opacity={ax}>{d.toUpperCase()}</text>
          ))}
          <path d={area} fill={THEME.ink} fillOpacity={0.12} stroke={THEME.ink} strokeOpacity={0.7} strokeWidth={2} />
          <path d={price} fill="none" stroke={THEME.accent} strokeWidth={3} />
          <text x={X0 - 40} y={BASE - H - 10} fontFamily={THEME.sans} fontSize={18} letterSpacing="0.3em" fill={THEME.muted} opacity={ax}>{S12.text.demand.toUpperCase()} <tspan fill={THEME.accent}>· {S12.text.price.toUpperCase()}</tspan></text>
          {(f > B.sweep) && <line x1={dx(t)} y1={BASE - H} x2={dx(t)} y2={BASE + 10} stroke={THEME.ink} strokeOpacity={0.5} strokeWidth={1.4} />}
        </g>
        {rev > 0 && <RoomFront x={720} y={110} w={480} h={300} o={rev} />}
      </svg>
      {rev > 0 && (
        <div style={{ position: 'absolute', left: 1260, top: 220, opacity: rev }}>
          <Caps>{S12.text.room}</Caps>
          <PriceCounter steps={steps} size={96} style={{ marginTop: 8 }} />
          <Caps size={20} color={THEME.ink} style={{ display: 'block', marginTop: 8 }}>{S12.days[clamp01(t2 / (N - 1)) >= 0 ? day : 0]}</Caps>
        </div>
      )}
      <Statement text={S12.text.message} at={B.message} top={44} size={56} />
    </AbsoluteFill>
  );
};

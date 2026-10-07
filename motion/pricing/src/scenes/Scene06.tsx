import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { PriceCounter, type PriceStep } from '../components/price';
import { Caps, Statement } from '../components/ui';
import { S06 } from '../data/scene06';
import { EASE, THEME, clamp01, lerp, rng, seg } from '../theme';

const B = S06.beats;
const CW = 112, CH = 52, GAP = 10, ROWS = S06.rooms / S06.cols;
const GX = 960 - (S06.cols * (CW + GAP) - GAP) / 2, GY = 560 - (ROWS * (CH + GAP) - GAP) / 2;
const cell = (i: number) => ({ x: GX + (i % S06.cols) * (CW + GAP), y: GY + Math.floor(i / S06.cols) * (CH + GAP) });
const MAX = S06.demandAt[0]!.clients;
const steps: PriceStep[] = [{ at: 0, value: S06.fixedPrice }, ...B.prices.map((at, k) => ({ at, value: S06.demandAt[k + 1]!.price }))];

/** Clients: arrival order, the most they would pay (rank among all), where they hover. */
const CLIENTS = (() => {
  const r = rng(606);
  const willing = Array.from({ length: MAX }, (_, i) => i).sort(() => r() - 0.5); // willing[k] = rank by budget (0 = richest)
  return willing.map((rank, k) => {
    const inGrid = k < S06.rooms;
    const ang = r() * Math.PI * 2, rad = 380 + r() * 260;
    const c = cell(k % S06.rooms);
    return {
      rank,
      x: inGrid ? c.x + CW / 2 + (r() - 0.5) * 30 : 960 + Math.cos(ang) * rad * 1.45,
      y: inGrid ? c.y + CH / 2 + (r() - 0.5) * 16 : 560 + Math.sin(ang) * rad * 0.62,
      from: r() < 0.5 ? -60 : 1980, fy: r() * 1080, jit: r() * 6.28,
    };
  });
})();

/** Clients on screen at a frame: stepwise from the arrivals, then a rush to the full crowd. */
function clientsAt(f: number) {
  const a = S06.arrivals;
  let n = 0;
  for (let i = 0; i < a.length; i++) {
    if (f < a[i]!.at) break;
    const next = a[i + 1];
    n = a[i]!.n;
    if (i === a.length - 2 && next) n = Math.round(lerp(a[i]!.n, next.n, EASE.in(seg(f, B.saturate, next.at))));
  }
  return n;
}

export const Scene06: React.FC = () => {
  const f = useCurrentFrame();
  const n = clientsAt(f);
  // After each price step, the clients who would not pay it leave.
  let keep = MAX;
  B.prices.forEach((at, k) => { if (f >= at) keep = Math.round(lerp(S06.demandAt[k]!.clients, S06.demandAt[k + 1]!.clients, EASE.inOut(seg(f, at, at + 30)))); });
  const settle = EASE.inOut(seg(f, B.seat, B.seat + 40)); // the remaining clients take the rooms
  const curPrice = f < B.prices[0]! ? S06.fixedPrice : steps[steps.findLastIndex((s) => s.at <= f)]!.value;
  const shown = Math.min(n, keep);

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S06.camera}>
        {/* While the verdict is said, the picture steps back so the words can be read. */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: 1 - 0.7 * seg(f, B.verdict - 6, B.verdict + 14) * (1 - seg(f, B.prices[0]! - 16, B.prices[0]!)) }}>
          {Array.from({ length: S06.rooms }, (_, i) => {
            const c = cell(i), o = clamp01((f - B.grid - (i / S06.rooms) * 30) / 8);
            const taken = settle > 0 && i < S06.rooms;
            return (
              <g key={i} opacity={o}>
                <rect x={c.x} y={c.y} width={CW} height={CH} rx={4} fill={THEME.ink} fillOpacity={taken ? 0.85 * settle : 0} stroke={THEME.line} strokeWidth={1.4} />
                <text x={c.x + CW / 2} y={c.y + CH / 2 + 8} textAnchor="middle" fontFamily={THEME.sans} fontSize={22} fill={taken && settle > 0.5 ? THEME.bg : THEME.ink} opacity={0.9} style={{ fontVariantNumeric: 'tabular-nums' }}>{curPrice} €</text>
              </g>
            );
          })}
          {CLIENTS.map((c, k) => {
            if (k >= n) return null;
            const t = EASE.out(clamp01((f - (k < 10 ? B.counter + k * 4 : 0) - (k >= 10 ? (k / MAX) * 0 : 0)) / 18));
            const leaving = c.rank >= keep; // would not pay the current price
            const leave = leaving ? EASE.in(clamp01((f - (B.prices.find((at, j) => c.rank >= S06.demandAt[j + 1]!.clients) ?? 0)) / 40)) : 0;
            if (leave >= 1) return null;
            let x = lerp(c.from, c.x, t), y = lerp(c.fy, c.y, t);
            x += Math.sin(f * 0.07 + c.jit) * 3; y += Math.cos(f * 0.06 + c.jit) * 3;
            if (leave > 0) { x = lerp(x, x < 960 ? -80 : 2000, leave); }
            if (settle > 0 && !leaving) { const target = cell(c.rank); x = lerp(x, target.x + CW - 14, settle); y = lerp(y, target.y + 14, settle); }
            return <circle key={k} cx={x} cy={y} r={8} fill={THEME.accent} opacity={0.85 * (1 - leave)} />;
          })}
        </svg>
      </CameraRig>

      {/* Header: the price (stuck, then moving) and the clients count. */}
      <div style={{ position: 'absolute', left: 140, top: 40, opacity: EASE.out(seg(f, B.header, B.header + 20)) }}>
        <Caps>{S06.text.price}</Caps>
        <PriceCounter steps={steps} size={84} style={{ marginTop: 8 }} />
      </div>
      <div style={{ position: 'absolute', right: 140, top: 40, textAlign: 'right', opacity: EASE.out(seg(f, B.counter, B.counter + 20)) }}>
        <Caps>{S06.text.clients}</Caps>
        <div style={{ fontFamily: THEME.sans, fontWeight: 300, fontSize: 84, color: shown > S06.rooms ? THEME.accent : THEME.ink, fontVariantNumeric: 'tabular-nums', marginTop: 8 }}>{shown}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 70, textAlign: 'center', opacity: EASE.out(seg(f, B.header, B.header + 20)) }}>
        <Caps>{S06.rooms} {S06.text.rooms}</Caps>
      </div>

      <Statement family="TITLE_COLLISION" text={S06.text.verdict} at={B.verdict} out={B.prices[0]! - 10} top={500} size={80} />
      <Statement family="TITLE_REVEAL_SLOW" layout="stack" focus={[1]} text={S06.text.message} at={B.message} top={948} size={52} />
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';

/**
 * ShopReward — a generic progression mechanic, as reward systems in shopping apps can use one.
 *
 * Deliberately generic (the exact mechanism of a given app is not documented here): tiers are
 * « Palier 1 … 5 », badges carry an abstract level mark (bars), and the only figure is the
 * progression percentage. No points, no bonus, no named reward.
 *
 * The bar fills by steps (in-out, precise). At each tier: the node fills and a check is drawn
 * (discreet validation), the node compresses slightly (anticipation), then the badge rises into
 * place with a short, firm deceleration — no bounce. The camera follows the fill head (critically
 * damped spring), then closes in on the last tier.
 */
export const REWARD = { fps: 60, seconds: 8 };

// ---------------------------------------------------------------- layout (world)
const N = 5, X0 = 260, GAP = 470, Y = 560;
const nodeX = (k: number) => X0 + k * GAP; // node 0 = start, 1..5 = tiers
const BG = '#0E0F11', TRACK = '#2A2B30', INK = '#F2EFE9', MUTED = '#7D7B77', ACCENT = '#E8442B';

// ---------------------------------------------------------------- timing
const SEG = 0.62, STEP = 1.02, T0 = 0.55;
const segStart = (k: number) => T0 + (k - 1) * STEP; // fill from node k-1 to node k
const reach = (k: number) => segStart(k) + SEG;
const LAST = reach(N), PUSH = [LAST + 0.55, LAST + 1.5] as const;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const fillEase = bez(0.65, 0, 0.25, 1), settle = bez(0.16, 1, 0.3, 1), camEase = bez(0.6, 0, 0.2, 1);

/** Fill head position (world x) at t. */
function head(t: number) {
  for (let k = 1; k <= N; k++) { if (t < segStart(k)) return nodeX(k - 1); if (t < reach(k)) return lerp(nodeX(k - 1), nodeX(k), fillEase((t - segStart(k)) / SEG)); }
  return nodeX(N);
}
/** Camera x: a critically damped spring on the fill head, integrated from 0 (deterministic per frame). */
function follow(t: number) {
  const w = 6.5, dt = 1 / 240; let x = nodeX(0) + 300, v = 0;
  for (let s = 0; s < t; s += dt) { const g = Math.max(nodeX(0) + 300, head(s) + 120); v += (w * w * (g - x) - 2 * w * v) * dt; x += v * dt; }
  return x;
}

// ---------------------------------------------------------------- pieces
const Badge: React.FC<{ k: number; t: number; big?: boolean }> = ({ k, t, big }) => {
  const r = reach(k), antic = big ? 0.3 : 0.16, at = r + 0.12 + antic;
  const u = settle((t - at) / (big ? 0.42 : 0.3));
  if (t < at) return null;
  const S = big ? 116 : 68, y = Y - (big ? 150 : 104);
  const bars = Array.from({ length: k }, (_, i) => i);
  return (
    <g transform={`translate(${nodeX(k)}, ${y + (1 - u) * 14}) scale(${lerp(0.9, 1, u)})`} opacity={clamp(u * 2.2)}>
      <rect x={-S / 2} y={-S / 2} width={S} height={S} rx={S * 0.22} fill={big ? ACCENT : '#18191C'} stroke={big ? 'none' : '#3A3B40'} strokeWidth={1.5} />
      {bars.map((i) => {
        const bw = S * 0.07, gap = S * 0.06, total = k * bw + (k - 1) * gap, x = -total / 2 + i * (bw + gap), h = S * (0.2 + 0.06 * i);
        // the bars rise one after the other, a few frames apart
        const bu = settle((t - at - 0.04 - i * 0.03) / 0.22);
        return <rect key={i} x={x} y={S * 0.2 - h * bu} width={bw} height={h * bu} rx={bw / 2} fill={big ? '#fff' : INK} />;
      })}
    </g>
  );
};

const Node: React.FC<{ k: number; t: number }> = ({ k, t }) => {
  const r = reach(k), done = k === 0 || t >= r, big = k === N;
  const fillU = k === 0 ? 1 : settle((t - r) / 0.16);
  const check = k === 0 ? 1 : clamp((t - r - 0.04) / 0.16);
  const antic = big ? 0.3 : 0.16, a = t - r - 0.12; // anticipation: a short compression before the badge
  const squeeze = k > 0 && a > 0 && a < antic ? Math.sin((Math.PI * a) / antic) : 0;
  const R = big ? 20 : 15;
  return (
    <g transform={`translate(${nodeX(k)}, ${Y}) scale(${1 - 0.1 * squeeze})`}>
      <circle r={R} fill={BG} stroke={done ? INK : TRACK} strokeWidth={2} />
      {done && <circle r={R * fillU} fill={INK} />}
      {done && k > 0 && <path d={`M ${-R * 0.42} 0 L ${-R * 0.1} ${R * 0.32} L ${R * 0.45} ${-R * 0.32}`} fill="none" stroke={BG} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={40} strokeDashoffset={40 * (1 - check)} />}
    </g>
  );
};

export const ShopReward: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const h = head(t), pct = Math.round(((h - nodeX(0)) / (nodeX(N) - nodeX(0))) * 100);
  // Camera: follows horizontally at a fixed scale, then closes in on the last tier.
  const p = camEase((t - PUSH[0]) / (PUSH[1] - PUSH[0]));
  const cs = Math.exp(lerp(Math.log(1.75), Math.log(2.6 * (1 + 0.02 * clamp((t - PUSH[1]) / 1.4))), p));
  const cx = lerp(follow(t), nodeX(N), p), cy = lerp(Y - 50, Y - 62, p);
  const sub = (s: string, size: number, color = MUTED): React.CSSProperties => ({ fontFamily: THEME.mono, fontSize: size, letterSpacing: '0.22em', fill: color } as React.CSSProperties & { fill: string });
  return (
    <AbsoluteFill style={{ background: BG }}>
      <svg width={1920} height={1080}>
        <g transform={`translate(960,540) scale(${cs}) translate(${-cx},${-cy})`}>
          {/* Track and fill. */}
          <rect x={nodeX(0)} y={Y - 2} width={nodeX(N) - nodeX(0)} height={4} rx={2} fill={TRACK} />
          <rect x={nodeX(0)} y={Y - 2} width={h - nodeX(0)} height={4} rx={2} fill={INK} />
          {Array.from({ length: N + 1 }, (_, k) => <Node key={k} k={k} t={t} />)}
          {Array.from({ length: N }, (_, i) => <Badge key={i} k={i + 1} t={t} big={i + 1 === N} />)}
          {Array.from({ length: N }, (_, i) => {
            const k = i + 1, on = t >= reach(k);
            return <text key={k} x={nodeX(k)} y={Y + 48} textAnchor="middle" style={sub('', 14, on ? INK : MUTED)}>PALIER {k}</text>;
          })}
          <text x={nodeX(0)} y={Y + 48} textAnchor="middle" style={sub('', 14)}>DÉPART</text>
          {/* Last tier: a quiet confirmation line under the label. */}
          <text x={nodeX(N)} y={Y + 76} textAnchor="middle" style={sub('', 12, ACCENT)} opacity={settle((t - LAST - 0.75) / 0.35)}>ATTEINT</text>
        </g>
        {/* Progress readout, fixed on screen (it stays readable while the camera travels). */}
        <g opacity={1 - p}>
          <text x={120} y={128} style={sub('', 16)}>PROGRESSION</text>
          <text x={118} y={196} fontFamily={THEME.sans} fontWeight={700} fontSize={60} fill={INK} style={{ fontVariantNumeric: 'tabular-nums' }}>{pct} %</text>
          <text x={120} y={236} style={sub('', 14)}>PALIER {Math.min(N, Array.from({ length: N }, (_, i) => i + 1).filter((k) => t >= reach(k)).length)} / {N}</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

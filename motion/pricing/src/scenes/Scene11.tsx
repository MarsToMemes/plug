import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Caps } from '../components/ui';
import { S11 } from '../data/scene11';
import { EASE, THEME, clamp01, lerp, rng, seg } from '../theme';

const B = S11.beats;
const ROW = (i: number) => 400 + i * 92;
const M = { x: 700, y: 400, cols: 26, rows: 14, cell: 14, pitch: 20 };
const MW = M.cols * M.pitch, MH = M.rows * M.pitch;
const W = (() => { const r = rng(1111); return Array.from({ length: M.cols * M.rows }, () => r()); })();
const CANDS = Array.from({ length: (S11.candidates.to - S11.candidates.from) / S11.candidates.step + 1 }, (_, i) => S11.candidates.from + i * S11.candidates.step);
const D = { x: 1330, base: 850, w: 460, h: 300 };

export const Scene11: React.FC = () => {
  const f = useCurrentFrame();
  const comp = seg(f, B.compute, B.computeEnd);
  const sharp = EASE.inOut(seg(f, B.sharpen, B.sharpen + 70));
  const dist = EASE.out(seg(f, B.dist, B.dist + 50));
  const price = EASE.out(seg(f, B.price, B.price + 60));
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {/* Inputs feeding the engine: one line each, data packets travelling along it. */}
        {S11.inputs.map((_, i) => {
          const y = ROW(i), on = seg(f, B.feed + i * 6, B.feed + i * 6 + 20), ty = M.y + ((i + 0.5) / S11.inputs.length) * MH;
          return (
            <g key={i} opacity={on}>
              <path d={`M560,${y} C630,${y} 640,${ty} ${M.x - 10},${ty}`} fill="none" stroke={THEME.line} strokeWidth={1.4} />
              {f > B.feed && Array.from({ length: 3 }, (_, j) => {
                const t = ((f - B.feed) * 0.018 + j / 3 + i * 0.13) % 1, u = 1 - t;
                const x = u * u * u * 560 + 3 * u * u * t * 630 + 3 * u * t * t * 640 + t * t * t * (M.x - 10);
                const yy = u * u * u * y + 3 * u * u * t * y + 3 * u * t * t * ty + t * t * t * ty;
                return <circle key={j} cx={x} cy={yy} r={3.5} fill={THEME.accent} opacity={Math.sin(Math.PI * t) * (1 - seg(f, B.computeEnd, B.computeEnd + 20))} />;
              })}
            </g>
          );
        })}
        {/* The engine: a weight matrix; computation passes through it as waves. */}
        <rect x={M.x - 20} y={M.y - 20} width={MW + 30} height={MH + 30} fill="none" stroke={THEME.line} strokeWidth={1.4} opacity={EASE.out(seg(f, 30, 60))} />
        {W.map((w, k) => {
          const c = k % M.cols, r = Math.floor(k / M.cols);
          const wave = comp > 0 && comp < 1 ? Math.max(0, 1 - Math.abs(c / M.cols - ((comp * 3) % 1)) * 9) : 0;
          const settled = seg(f, B.computeEnd - 30, B.computeEnd + 10);
          const v = lerp(0.12, 0.25 + 0.75 * w, Math.max(wave, settled * w));
          const s = M.cell * (0.35 + 0.65 * v);
          return <rect key={k} x={M.x + c * M.pitch + (M.cell - s) / 2} y={M.y + r * M.pitch + (M.cell - s) / 2} width={s} height={s} fill={wave > 0.6 ? THEME.accent : THEME.ink} opacity={(0.15 + 0.8 * v) * EASE.out(seg(f, 30 + (k / W.length) * 30, 50 + (k / W.length) * 30))} />;
        })}
        {/* Output: candidate prices, the distribution sharpening on one. */}
        <line x1={M.x + MW + 20} y1={M.y + MH / 2} x2={D.x - 20} y2={M.y + MH / 2} stroke={THEME.line} strokeWidth={1.4} opacity={dist} />
        <line x1={D.x} y1={D.base} x2={D.x + D.w} y2={D.base} stroke={THEME.line} strokeWidth={1.4} opacity={dist} />
        {CANDS.map((p, i) => {
          const bw = D.w / CANDS.length;
          const d = (p - S11.recommended) / 30;
          const broad = 0.35 + 0.4 * Math.exp(-d * d * 0.5) + 0.2 * W[i * 7]!;
          const narrow = Math.exp(-d * d * 4);
          const h = D.h * dist * lerp(broad, narrow, sharp);
          const best = p === S11.recommended;
          return (
            <g key={p}>
              <rect x={D.x + i * bw + 3} y={D.base - h} width={bw - 6} height={h} fill={best && sharp > 0.5 ? THEME.accent : THEME.ink} opacity={best ? 0.95 : lerp(0.6, 0.25, sharp)} />
              {i % 3 === 0 && <text x={D.x + i * bw + bw / 2} y={D.base + 28} textAnchor="middle" fontFamily={THEME.sans} fontSize={14} fill={THEME.muted} opacity={dist}>{p}</text>}
            </g>
          );
        })}
      </svg>
      {S11.inputs.map((t, i) => (
        <div key={t} style={{ position: 'absolute', left: 120, top: ROW(i) - 16, opacity: EASE.out(seg(f, B.inputs + i * 12, B.inputs + i * 12 + 20)), transform: `translateX(${(1 - EASE.out(seg(f, B.inputs + i * 12, B.inputs + i * 12 + 20))) * -20}px)` }}>
          <Caps size={22} color={THEME.ink}>{t}</Caps>
        </div>
      ))}
      <div style={{ position: 'absolute', left: D.x, width: D.w, top: 300, textAlign: 'center', opacity: seg(f, B.label, B.label + 20) }}>
        <Caps size={20} color={THEME.accent}>{S11.text.label}</Caps>
        <div style={{ fontFamily: THEME.sans, fontWeight: 300, fontSize: 132, color: THEME.ink, fontVariantNumeric: 'tabular-nums', opacity: price, filter: `blur(${(1 - price) * 14}px)`, transform: `scale(${lerp(0.96, 1, price)})`, marginTop: 6 }}>
          {S11.recommended}<span style={{ fontSize: 48, color: THEME.muted, marginLeft: 12 }}>€</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

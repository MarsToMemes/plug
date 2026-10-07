import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, THEME, clamp01, lerp, seg } from '../theme';

export type PriceStep = { at: number; value: number };

/** Value of a stepped series at a frame (the step that applies). */
export const stepIndex = (steps: PriceStep[], frame: number) => {
  let i = 0;
  while (i + 1 < steps.length && steps[i + 1]!.at <= frame) i++;
  return i;
};

/**
 * PriceCounter — an odometer. On each step, every digit rolls from its old value to its new
 * one, right to left, and the number flashes in the accent colour for a moment.
 */
export const PriceCounter: React.FC<{
  steps: PriceStep[]; size?: number; currency?: string; color?: string; accent?: string; roll?: number; style?: React.CSSProperties;
}> = ({ steps, size = 160, currency = '€', color = THEME.ink, accent = THEME.accent, roll = 11, style }) => {
  const frame = useCurrentFrame();
  const i = stepIndex(steps, frame);
  const cur = steps[i]!, prev = steps[Math.max(0, i - 1)]!;
  const age = frame - cur.at;
  const digitsN = Math.max(...steps.map((s) => String(Math.round(s.value)).length));
  const pad = (v: number) => String(Math.round(v)).padStart(digitsN, ' ');
  const a = pad(i === 0 ? cur.value : prev.value), b = pad(cur.value);
  const flash = i === 0 ? 0 : clamp01(1 - (age - roll) / 16) * (age >= 0 ? 1 : 0);
  const up = cur.value >= prev.value;
  const ink = flash > 0 ? mix(color, up ? accent : THEME.cool, flash) : color;
  const h = size * 1.0;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: THEME.sans, fontWeight: 300, fontSize: size, color: ink, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, ...style }}>
      {b.split('').map((ch, k) => {
        const from = a[k] === ' ' ? 0 : Number(a[k]);
        const to = ch === ' ' ? 0 : Number(ch);
        const blank = ch === ' ';
        // Right-most digit leads, the others follow by 2 frames each.
        const t = i === 0 ? 1 : EASE.out(clamp01((age - (digitsN - 1 - k) * 2) / roll));
        const target = to >= from ? to : to + 10;
        const pos = lerp(from, target, t);
        return (
          <span key={k} style={{ display: 'inline-block', width: '0.62em', height: h, overflow: 'hidden', position: 'relative', opacity: blank && t >= 1 ? 0 : 1, WebkitMaskImage: ROLL_MASK, maskImage: ROLL_MASK }}>
            <span style={{ position: 'absolute', left: 0, top: 0, display: 'flex', flexDirection: 'column', transform: `translateY(${-pos * h}px)`, filter: t > 0 && t < 1 ? `blur(${(2.6 * Math.sin(Math.PI * t)).toFixed(2)}px)` : undefined }}>
              {Array.from({ length: 20 }, (_, d) => <span key={d} style={{ height: h, lineHeight: `${h}px`, textAlign: 'center', width: '0.62em' }}>{d % 10}</span>)}
            </span>
          </span>
        );
      })}
      <span style={{ fontSize: size * 0.42, marginLeft: size * 0.12, color: THEME.muted, fontWeight: 400 }}>{currency}</span>
    </div>
  );
};

// Digits fade at the top and bottom of their window, so a roll reads as motion, not as two glyphs.
const ROLL_MASK = 'linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)';

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i]!, t))).join(',')})`;
}

/** PriceTag — a compact label + price, for prices that are shown rather than watched. */
export const PriceTag: React.FC<{ label: string; value: number; currency?: string; highlight?: boolean; style?: React.CSSProperties }> = ({ label, value, currency = '€', highlight, style }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '10px 18px', border: `1.5px solid ${highlight ? THEME.accent : THEME.line}`, borderRadius: 999, fontFamily: THEME.sans, color: THEME.ink, ...style }}>
    <span style={{ fontSize: 15, letterSpacing: '0.14em', textTransform: 'uppercase', color: THEME.muted }}>{label}</span>
    <span style={{ fontSize: 26, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: highlight ? THEME.accent : THEME.ink }}>{Math.round(value)} {currency}</span>
  </div>
);

/** DemandIndicator — a level gauge (0..1) drawn as ticks that light up. */
export const DemandIndicator: React.FC<{ level: number; label?: string; ticks?: number; style?: React.CSSProperties }> = ({ level, label = 'Demande', ticks = 12, style }) => (
  <div style={{ fontFamily: THEME.sans, color: THEME.ink, ...style }}>
    <div style={{ fontSize: 14, letterSpacing: '0.16em', textTransform: 'uppercase', color: THEME.muted, marginBottom: 10 }}>{label}</div>
    <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end' }}>
      {Array.from({ length: ticks }, (_, i) => {
        const on = clamp01(level * ticks - i);
        return <div key={i} style={{ width: 9, height: 14 + i * 3, background: on > 0 ? (i / ticks > 0.7 ? THEME.accent : THEME.ink) : THEME.faint, opacity: 0.35 + 0.65 * on }} />;
      })}
    </div>
  </div>
);

/** InventoryCounter — "42 / 180" with a thin bar of what is left. */
export const InventoryCounter: React.FC<{ available: number; total: number; unit: string; style?: React.CSSProperties }> = ({ available, total, unit, style }) => (
  <div style={{ fontFamily: THEME.sans, color: THEME.ink, ...style }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontVariantNumeric: 'tabular-nums' }}>
      <span style={{ fontSize: 56, fontWeight: 300 }}>{Math.round(available)}</span>
      <span style={{ fontSize: 22, color: THEME.muted }}>/ {total} {unit}</span>
    </div>
    <div style={{ marginTop: 10, width: 320, height: 3, background: THEME.faint }}>
      <div style={{ width: `${(available / total) * 100}%`, height: '100%', background: available / total < 0.15 ? THEME.accent : THEME.ink }} />
    </div>
  </div>
);

type Pt = [number, number];
const path = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const Axis: React.FC<{ w: number; h: number; x: string; y: string }> = ({ w, h, x, y }) => (
  <g stroke={THEME.line} strokeWidth={1.2} fill="none">
    <path d={`M0,0 L0,${h} L${w},${h}`} />
    <text x={w} y={h + 30} fill={THEME.muted} stroke="none" fontFamily={THEME.sans} fontSize={15} textAnchor="end" letterSpacing="0.12em">{x.toUpperCase()}</text>
    <text x={0} y={-14} fill={THEME.muted} stroke="none" fontFamily={THEME.sans} fontSize={15} letterSpacing="0.12em">{y.toUpperCase()}</text>
  </g>
);

/** PriceHistory — a stepped price line over time, drawn up to `progress` (0..1). */
export const PriceHistory: React.FC<{ values: number[]; w?: number; h?: number; progress?: number; min?: number; max?: number; color?: string; xLabel?: string; yLabel?: string }> = ({ values, w = 640, h = 260, progress = 1, min, max, color = THEME.accent, xLabel = 'Temps', yLabel = 'Prix' }) => {
  const lo = min ?? Math.min(...values) * 0.9, hi = max ?? Math.max(...values) * 1.05;
  const pts: Pt[] = [];
  values.forEach((v, i) => {
    const x = (i / (values.length - 1)) * w, y = h - ((v - lo) / (hi - lo)) * h;
    if (i) pts.push([x, pts[pts.length - 1]![1]]);
    pts.push([x, y]);
  });
  return (
    <svg width={w + 40} height={h + 60} viewBox={`-20 -30 ${w + 40} ${h + 60}`} overflow="visible">
      <Axis w={w} h={h} x={xLabel} y={yLabel} />
      <path d={path(pts)} fill="none" stroke={color} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(progress)} />
    </svg>
  );
};

/** DemandCurve — classic downward demand curve with an optional point (price, quantity). */
export const DemandCurve: React.FC<{ w?: number; h?: number; progress?: number; point?: number }> = ({ w = 560, h = 320, progress = 1, point }) => {
  const f = (x: number) => h * (0.08 + 0.84 * Math.pow(x, 0.55));
  const pts: Pt[] = Array.from({ length: 41 }, (_, i) => [(i / 40) * w, f(i / 40)]);
  const px = point !== undefined ? point * w : 0, py = point !== undefined ? f(point) : 0;
  return (
    <svg width={w + 40} height={h + 60} viewBox={`-20 -30 ${w + 40} ${h + 60}`} overflow="visible">
      <Axis w={w} h={h} x="Quantité" y="Prix" />
      <path d={path(pts)} fill="none" stroke={THEME.ink} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(progress)} />
      {point !== undefined && progress >= 1 && (
        <g>
          <path d={`M${px},${h} L${px},${py} L0,${py}`} stroke={THEME.muted} strokeDasharray="4 6" fill="none" />
          <circle cx={px} cy={py} r={7} fill={THEME.accent} />
        </g>
      )}
    </svg>
  );
};

/** InventoryCurve — remaining inventory falling as the date approaches. */
export const InventoryCurve: React.FC<{ remaining: number[]; total: number; w?: number; h?: number; progress?: number }> = ({ remaining, total, w = 560, h = 260, progress = 1 }) => {
  const pts: Pt[] = remaining.map((r, i) => [(i / (remaining.length - 1)) * w, h - (r / total) * h]);
  return (
    <svg width={w + 40} height={h + 60} viewBox={`-20 -30 ${w + 40} ${h + 60}`} overflow="visible">
      <Axis w={w} h={h} x="Jours avant départ" y="Disponible" />
      <path d={path(pts)} fill="none" stroke={THEME.cool} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(progress)} />
    </svg>
  );
};

/** FareBucket — fare classes from cheapest to most expensive; closed classes are struck through. */
export const FareBucket: React.FC<{ buckets: Array<{ code: string; price: number; open: boolean }>; frame?: number; style?: React.CSSProperties }> = ({ buckets, style }) => {
  const max = Math.max(...buckets.map((b) => b.price));
  return (
    <div style={{ fontFamily: THEME.sans, color: THEME.ink, display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {buckets.map((b) => (
        <div key={b.code} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: b.open ? 1 : 0.38 }}>
          <span style={{ width: 28, fontSize: 18, fontWeight: 600, letterSpacing: '0.06em' }}>{b.code}</span>
          <div style={{ width: 300 * (b.price / max), height: 14, background: b.open ? THEME.ink : THEME.faint, position: 'relative' }}>
            {!b.open && <div style={{ position: 'absolute', left: -6, right: -6, top: 6, height: 2, background: THEME.accent }} />}
          </div>
          <span style={{ fontSize: 18, fontVariantNumeric: 'tabular-nums', color: THEME.muted }}>{b.price} €</span>
        </div>
      ))}
    </div>
  );
};

export { seg };

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';
import { Garment, type Kind } from './garments';
import { product, mix, euro, NAMES, type Product } from './products';

/**
 * ShopPick — personalised recommendations, shown as a visual filter (not as an entity).
 *
 * A grid of product sheets. A discreet band of light sweeps across it: where it passes, the cards
 * that are not kept dim, the kept ones receive a soft luminous mask (glow + hairline). The others
 * then recede (smaller, blurred, fainter) and are wiped out by a mask, while the camera moves in on
 * the selection; the kept cards regroup into a compact grid.
 *
 * Nothing claims to know the platform's criteria: the kept cards simply share a palette (a visible
 * coherence, no stated reason), and the footnote says « signaux observés — critères exacts non
 * publics ». No eye, no brain, no character: the filter is light and masks, nothing else.
 */
export const PICK = { fps: 60, seconds: 9 };

// ---------------------------------------------------------------- grid (world)
const COLS = 8, ROWS = 4, CW = 200, CH = 290, IMG = 214, GX = 24, GY = 26;
const GW = COLS * (CW + GX) - GX, GH = ROWS * (CH + GY) - GY;
const cell = (c: number, r: number) => ({ x: -GW / 2 + c * (CW + GX), y: -GH / 2 + r * (CH + GY) });
const KEPT: Array<[number, number]> = [[1, 0], [6, 0], [3, 1], [0, 2], [5, 2], [2, 3]]; // (col, row), spread out
const KEPT_PRODUCTS: Array<{ kind: Kind; color: string; bg: string; price: number; was: number }> = [
  { kind: 'dress', color: '#8A2F3A', bg: '#EDE1E0', price: 12.49, was: 34.99 },
  { kind: 'skirt', color: '#C9B48F', bg: '#EFE9DF', price: 9.99, was: 24.99 },
  { kind: 'cami', color: '#B4876A', bg: '#F2EDE4', price: 6.99, was: 17.99 },
  { kind: 'jacket', color: '#8A2F3A', bg: '#ECE7E2', price: 19.99, was: 44.99 },
  { kind: 'dress', color: '#C9B48F', bg: '#F0E5E6', price: 14.99, was: 32.99 },
  { kind: 'bag', color: '#B4876A', bg: '#EEE8E0', price: 8.49, was: 21.99 },
];
const keptIndex = (c: number, r: number) => KEPT.findIndex(([kc, kr]) => kc === c && kr === r);
const COMPACT = { cols: 3, gap: 28 };
const compactCell = (j: number) => {
  const w = COMPACT.cols * (CW + COMPACT.gap) - COMPACT.gap, h = 2 * (CH + COMPACT.gap) - COMPACT.gap;
  return { x: -w / 2 + (j % 3) * (CW + COMPACT.gap), y: -h / 2 + 30 + Math.floor(j / 3) * (CH + COMPACT.gap) };
};

// ---------------------------------------------------------------- timing
const SWEEP = [1.3, 3.0] as const, RECEDE = [3.2, 4.4] as const, WIPE = [4.3, 4.95] as const, REGROUP = [4.75, 6.05] as const, LABELS = 6.2;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const move = bez(0.65, 0, 0.2, 1), settle = bez(0.16, 1, 0.3, 1), soft = bez(0.4, 0, 0.2, 1);
/** When the sweep reaches world x. */
const sweepX = (t: number) => lerp(-GW / 2 - 300, GW / 2 + 300, soft((t - SWEEP[0]) / (SWEEP[1] - SWEEP[0])));
const sweepAt = (x: number) => { let lo = SWEEP[0], hi = SWEEP[1]; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (sweepX(m) < x) lo = m; else hi = m; } return (lo + hi) / 2; };

// ---------------------------------------------------------------- card
const Card: React.FC<{ p: Product; glow: number }> = ({ p, glow }) => (
  <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: '#F4F1EC', overflow: 'hidden', boxShadow: glow > 0 ? `0 0 0 ${1.5 * glow}px rgba(255,244,228,${0.9 * glow}), 0 0 ${46 * glow}px rgba(255,236,210,${0.28 * glow})` : undefined }}>
    <div style={{ position: 'absolute', left: 6, top: 6, width: CW - 12, height: IMG - 6, borderRadius: 5, background: p.bg, overflow: 'hidden' }}>
      <svg viewBox="0 0 100 120" width={CW - 12} height={IMG - 6} preserveAspectRatio="xMidYMid meet"><g transform="translate(9,8) scale(0.82)"><Garment kind={p.kind} color={p.color} /></g></svg>
    </div>
    <div style={{ position: 'absolute', left: 10, top: IMG + 10, fontSize: 12.5, color: '#6A6762', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: CW - 20 }}>{NAMES[p.kind]}</div>
    <div style={{ position: 'absolute', left: 10, top: IMG + 32, display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 16, fontWeight: 750, color: '#111' }}>{euro(p.price)}</span>
      <span style={{ fontSize: 11.5, color: '#A29E97', textDecoration: 'line-through' }}>{euro(p.was)}</span>
    </div>
  </div>
);

export const ShopPick: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;

  // Camera: the whole grid, then towards the selection, then onto the compact grid.
  const kc = KEPT.reduce((a, [c, r]) => { const p = cell(c, r); return { x: a.x + (p.x + CW / 2) / KEPT.length, y: a.y + (p.y + CH / 2) / KEPT.length }; }, { x: 0, y: 0 });
  const push = move((t - RECEDE[0]) / (RECEDE[1] - RECEDE[0] + 0.4)), fin = move((t - REGROUP[0]) / (REGROUP[1] - REGROUP[0] + 0.3));
  const s0 = Math.min(1920 / (GW + 160), 1080 / (GH + 140));
  const cs = Math.exp(lerp(lerp(Math.log(s0), Math.log(0.98), push), Math.log(1.32), fin));
  const cx = lerp(lerp(0, kc.x * 0.5, push), 0, fin), cy = lerp(lerp(0, kc.y * 0.5, push), 30 + 2, fin);

  const recede = move((t - RECEDE[0]) / (RECEDE[1] - RECEDE[0]));
  const wipe = move((t - WIPE[0]) / (WIPE[1] - WIPE[0]));
  const cards: React.ReactNode[] = [];
  const keptCards: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const pos = cell(c, r), j = keptIndex(c, r), cxw = pos.x + CW / 2;
    const appear = settle((t - 0.05 - (c + r) * 0.045) / 0.5);
    const hit = settle((t - sweepAt(cxw)) / 0.45); // the sweep has passed this card
    if (j < 0) {
      const p = product(r * COLS + c, mix(6100 + r * COLS + c));
      const dim = lerp(1, 0.38, hit) * lerp(1, 0.3, recede);
      cards.push(
        <div key={`${c}-${r}`} style={{ position: 'absolute', left: pos.x, top: pos.y, width: CW, height: CH, opacity: appear * dim * (1 - wipe), transform: `translateY(${(1 - appear) * 16}px) scale(${lerp(1, 0.94, recede)})`, filter: recede > 0.01 ? `blur(${2.4 * recede}px)` : undefined, clipPath: wipe > 0 ? `inset(${50 * wipe}% ${50 * wipe}% ${50 * wipe}% ${50 * wipe}% round 8px)` : undefined }}>
          <Card p={p} glow={0} />
        </div>,
      );
    } else {
      const kp = KEPT_PRODUCTS[j]!, p: Product = { ...kp, sold: 0 };
      const to = compactCell(j), u = move((t - REGROUP[0] - j * 0.06) / (REGROUP[1] - REGROUP[0] - 0.3));
      const x = lerp(pos.x, to.x, u), y = lerp(pos.y, to.y, u);
      const glow = hit * (1 - 0.65 * settle((t - REGROUP[1]) / 0.6));
      keptCards.push(
        <div key={`k${j}`} style={{ position: 'absolute', left: x, top: y, width: CW, height: CH, opacity: appear, transform: `translateY(${(1 - appear) * 16}px) scale(${1 + 0.025 * hit * (1 - u)})` }}>
          <Card p={p} glow={glow} />
        </div>,
      );
    }
  }
  const band = sweepX(t), bandOn = t > SWEEP[0] - 0.1 && t < SWEEP[1] + 0.1;
  const lab = settle((t - LABELS) / 0.55);
  return (
    <AbsoluteFill style={{ background: '#101113', fontFamily: THEME.sans }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: '0 0', transform: `translate(${960 - cx * cs}px, ${540 - cy * cs}px) scale(${cs})` }}>
        {cards}
        {/* The sweep: a discreet band of light, the only « agent » of the filter. */}
        {bandOn && <div style={{ position: 'absolute', left: band - 180, top: -GH / 2 - 80, width: 360, height: GH + 160, background: 'linear-gradient(90deg, rgba(255,240,220,0) 0%, rgba(255,240,220,0.07) 45%, rgba(255,240,220,0.13) 50%, rgba(255,240,220,0.07) 55%, rgba(255,240,220,0) 100%)', mixBlendMode: 'screen' }} />}
        {keptCards}
        {/* Labels of the compact selection. */}
        <div style={{ position: 'absolute', left: compactCell(0).x, top: compactCell(0).y - 58, opacity: lab, transform: `translateY(${(1 - lab) * 10}px)`, fontFamily: THEME.mono, fontSize: 15, letterSpacing: '0.28em', color: '#F2EFE9' }}>POUR TOI</div>
        <div style={{ position: 'absolute', left: compactCell(2).x + CW, top: compactCell(0).y - 58, transform: `translateX(-100%) translateY(${(1 - lab) * 10}px)`, opacity: lab, fontFamily: THEME.mono, fontSize: 13, letterSpacing: '0.22em', color: '#8C8984', whiteSpace: 'nowrap' }}>6 ARTICLES</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 42, textAlign: 'center', fontFamily: THEME.mono, fontSize: 15, letterSpacing: '0.2em', color: '#8C8984', opacity: settle((t - LABELS - 0.4) / 0.6) }}>
        SÉLECTION ADAPTÉE À DES SIGNAUX OBSERVÉS — CRITÈRES EXACTS NON PUBLICS
      </div>
    </AbsoluteFill>
  );
};

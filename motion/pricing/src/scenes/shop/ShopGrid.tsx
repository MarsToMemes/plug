import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME, rng } from '../../theme';
import { GARMENTS, paints, type Kind } from './garments';
import { product, mix, euro, NAMES, type Product } from './products';

/**
 * ShopGrid — a product grid that replicates itself.
 *
 * One card. Then the whole block is copied by waves: each copy slides out, rigid, from under the block
 * (1 → 3 → 9×3 → 27×9 → 81×27 → 243×81 cards). A copy first carries its source's product, then,
 * once landed, mutates into its own (same mechanism, endless variants). Sideways/vertical copies
 * leave first, diagonals a beat later. A few cards have a double lifted towards the camera: nearer, it
 * travels faster, larger, and parallaxes outwards — the depth. The camera pulls back continuously (log-scale curve through the
 * wave framings), accelerating with the waves, then settles on the mass. Then « TOUJOURS PLUS ».
 *
 * Drawn on a <canvas> (≈ 20 000 cards at the end), with levels of detail by on-screen size.
 */
export const GRID = { fps: 60, seconds: 9.5 };

// ---------------------------------------------------------------- geometry (world units)
const CW = 186, CH = 308, IMG = 248, GAP = 12, PW = CW + GAP, PH = CH + GAP;
const blockW = (hc: number) => (2 * hc + 1) * PW - GAP, blockH = (hr: number) => (2 * hr + 1) * PH - GAP;
/** Camera scale at which a block occupies `f` of the frame (on its limiting side). */
const fit = (hc: number, hr: number, f: number) => f / Math.max(blockW(hc) / 1920, blockH(hr) / 1080);

// ---------------------------------------------------------------- waves
// Half extents (cols, rows) of the block after each wave; the first wave copies sideways only.
const EXT = [[0, 0], [1, 0], [4, 1], [13, 4], [40, 13], [121, 40]] as const;
const WT = [0.5, 1.5, 2.55, 3.6, 4.65]; // wave starts
const SLIDE = 0.75;
// The block's share of the frame when its wave starts: replication is legible first, then the
// copies overflow the frame (the grid spreads in every direction).
const START_FIT = [0, 0.42, 0.55, 0.7, 0.8];
const END_SCALE = 0.075, END = GRID.seconds; // the mass still overflows the frame: no edge, no end

// ---------------------------------------------------------------- camera: monotone cubic in log scale
const KEYS: Array<[number, number]> = [[0, 2.3], [WT[0]!, 2.0], ...WT.slice(1).map((t, i): [number, number] => [t, fit(EXT[i + 1]![0], EXT[i + 1]![1], START_FIT[i + 1]!)]), [END, END_SCALE]];
const camScale = (() => {
  const x = KEYS.map((k) => k[0]), y = KEYS.map((k) => Math.log(k[1])), n = x.length;
  const d = x.slice(1).map((xi, i) => (y[i + 1]! - y[i]!) / (xi - x[i]!));
  const m = x.map((_, i) => {
    if (i === 0) return d[0]!;
    if (i === n - 1) return 0; // the travelling comes to rest on the last frame
    const a = d[i - 1]!, b = d[i]!;
    if (a * b <= 0) return 0;
    const h0 = x[i]! - x[i - 1]!, h1 = x[i + 1]! - x[i]!; // Fritsch–Butland weighted harmonic mean
    return (3 * (h0 + h1)) / ((2 * h1 + h0) / a + (h1 + 2 * h0) / b);
  });
  return (t: number) => {
    const tt = Math.min(x[n - 1]!, Math.max(0, t));
    let i = 0; while (i < n - 2 && tt > x[i + 1]!) i++;
    const h = x[i + 1]! - x[i]!, u = (tt - x[i]!) / h;
    const v = (2 * u ** 3 - 3 * u ** 2 + 1) * y[i]! + (u ** 3 - 2 * u ** 2 + u) * h * m[i]! + (-2 * u ** 3 + 3 * u ** 2) * y[i + 1]! + (u ** 3 - u ** 2) * h * m[i + 1]!;
    return Math.exp(v);
  };
})();

// ---------------------------------------------------------------- easing: cubic-bezier(.6, 0, .15, 1), tabulated
const bezier = (a: number, b: number, c: number, d: number) => {
  const N = 1024, tab = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) {
    const X = i / N; let lo = 0, hi = 1;
    for (let k = 0; k < 30; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
    const s = (lo + hi) / 2; tab[i] = 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
  }
  return (u: number) => { const x = Math.min(1, Math.max(0, u)) * N, i = Math.floor(x); return i >= N ? 1 : tab[i]! + (tab[i + 1]! - tab[i]!) * (x - i); };
};
const glide = bezier(0.6, 0, 0.15, 1);
const outExpo = (u: number) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---------------------------------------------------------------- cells (precomputed once)
type Cell = { x: number; y: number; wave: number; dx: number; dy: number; src: number; lag: number; dur: number; lifted: boolean; mut: number; own: Product };
const HC = EXT[5][0], HR = EXT[5][1], COLS = 2 * HC + 1;
const idx = (c: number, r: number) => (r + HR) * COLS + (c + HC);
const CELLS: Cell[] = [];
for (let r = -HR; r <= HR; r++) for (let c = -HC; c <= HC; c++) {
  let w = 0; while (Math.abs(c) > EXT[w]![0] || Math.abs(r) > EXT[w]![1]) w++;
  const h = rng(mix(7700 + idx(c, r))), h2 = (h(), h()), h3 = h();
  let dx = 0, dy = 0, sc = c, sr = r, lag = 0;
  if (w > 0) {
    const C = 2 * EXT[w - 1]![0] + 1, R = 2 * EXT[w - 1]![1] + 1;
    dx = Math.round(c / C); dy = Math.round(r / R); sc = c - dx * C; sr = r - dy * R;
    lag = dx && dy ? 0.12 : 0; // sideways and vertical copies first, then the diagonals: two clean beats
  }
  const lifted = w > 0 && h2 < 0.06;
  CELLS.push({ x: c * PW, y: r * PH, wave: w, dx: dx * PW * (2 * EXT[Math.max(0, w - 1)]![0] + 1), dy: dy * PH * (2 * EXT[Math.max(0, w - 1)]![1] + 1), src: idx(sc, sr), lag, dur: lifted ? SLIDE * 0.78 : SLIDE, lifted, mut: 0.04 + 0.22 * h3, own: product(idx(c, r), mix(idx(c, r) + 1)) });
}
// The first card is the one the film opens on.
CELLS[idx(0, 0)]!.own = { ...product(42), kind: 'skirt' };
// Draw order: newest waves underneath (copies come out from under their source), diagonal copies under the others.
const ORDER = CELLS.map((_, i) => i).sort((a, b) => {
  const A = CELLS[a]!, B = CELLS[b]!;
  if (A.wave !== B.wave) return B.wave - A.wave;
  return (A.dx && A.dy ? 0 : 1) - (B.dx && B.dy ? 0 : 1);
});

// ---------------------------------------------------------------- canvas drawing
const PATHS = new Map<Kind, Path2D[]>();
const pathsOf = (k: Kind) => { let p = PATHS.get(k); if (!p) { p = GARMENTS[k].map((o) => new Path2D(o.d)); PATHS.set(k, p); } return p; };
const PAINTS = new Map<string, ReturnType<typeof paints>>();
const paintsOf = (c: string) => { let p = PAINTS.get(c); if (!p) { p = paints(c); PAINTS.set(c, p); } return p; };
const G = 1.86 * 0.9, GX = -CW / 2 + 1.86 * 5, GY = -CH / 2 + (IMG - 120 * 1.86) / 2 + 1.86 * 4; // garment box in the card

function drawImage(ctx: CanvasRenderingContext2D, p: Product, S: number, X: number, Y: number, a: number) {
  ctx.globalAlpha = a;
  ctx.setTransform(S, 0, 0, S, X, Y);
  ctx.fillStyle = p.bg;
  if (S > 0.2) { ctx.beginPath(); ctx.roundRect(-CW / 2, -CH / 2, CW, IMG, 6); ctx.fill(); } else ctx.fillRect(-CW / 2, -CH / 2, CW, IMG);
  const ops = GARMENTS[p.kind], paths = pathsOf(p.kind), pal = paintsOf(p.color);
  ctx.setTransform(S * G, 0, 0, S * G, X + S * GX, Y + S * GY);
  const n = S * G < 0.12 ? 1 : ops.length; // tiny: the silhouette only
  for (let i = 0; i < n; i++) {
    const o = ops[i]!;
    ctx.globalAlpha = a * (o.op ?? 1);
    if (o.fill) { ctx.fillStyle = pal[o.fill]; ctx.fill(paths[i]!); }
    if (o.stroke) { ctx.strokeStyle = pal[o.stroke]; ctx.lineWidth = o.sw ?? 1.4; ctx.stroke(paths[i]!); }
  }
  ctx.globalAlpha = 1;
}

function drawText(ctx: CanvasRenderingContext2D, p: Product, S: number, X: number, Y: number) {
  ctx.setTransform(S, 0, 0, S, X, Y);
  const top = -CH / 2 + IMG, left = -CW / 2 + 8;
  if (S >= 0.45) {
    const off = Math.round((1 - p.price / p.was) * 100);
    ctx.fillStyle = '#111'; ctx.fillRect(-CW / 2, -CH / 2 + 10, 38, 18);
    ctx.fillStyle = '#fff'; ctx.font = `700 11px Geist`; ctx.textBaseline = 'middle'; ctx.fillText(`-${off}%`, -CW / 2 + 6, -CH / 2 + 19.5);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#6b6b6b'; ctx.font = `400 12px Geist`; ctx.fillText(NAMES[p.kind], left, top + 22);
    ctx.fillStyle = '#E8442B'; ctx.font = `800 17px Geist`; const pr = euro(p.price); ctx.fillText(pr, left, top + 46);
    const w = ctx.measureText(pr).width;
    ctx.fillStyle = '#9a9a9a'; ctx.font = `400 11px Geist`; const was = euro(p.was); ctx.fillText(was, left + w + 6, top + 46);
    ctx.fillRect(left + w + 6, top + 42.5, ctx.measureText(was).width, 1);
  } else if (S >= 0.1) {
    ctx.fillStyle = '#111'; ctx.fillRect(-CW / 2, -CH / 2 + 10, 38, 18);
    ctx.fillStyle = '#D6D6D6'; ctx.fillRect(left, top + 12, 110, 8);
    ctx.fillStyle = '#E8442B'; ctx.fillRect(left, top + 32, 56, 13);
  } else {
    ctx.fillStyle = '#E8442B'; ctx.fillRect(left, top + 22, 70, 18);
  }
}

function draw(ctx: CanvasRenderingContext2D, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0B0B0D'; ctx.fillRect(0, 0, 1920, 1080);
  const s = camScale(t);
  const flying: Array<() => void> = [];
  // A card: its block position at progress u, scaled by k (k > 1: nearer the camera, parallax outwards).
  const paint = (c: Cell, u: number, lift: number, m: number) => {
    const e = glide(u), k = 1 + 0.16 * lift;
    const wx = c.x - c.dx * (1 - e), wy = c.y - c.dy * (1 - e);
    const X = 960 + s * k * wx, Y = 540 + s * k * wy, S = s * k;
    if (X + S * CW / 2 < 0 || X - S * CW / 2 > 1920 || Y + S * CH / 2 < 0 || Y - S * CH / 2 > 1080) return;
    const src = c.wave > 0 ? CELLS[c.src]!.own : c.own;
    ctx.setTransform(S, 0, 0, S, X, Y);
    if (lift > 0.01 && S * CW > 14) { ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50 * lift * Math.min(1, S * 2); ctx.shadowOffsetY = 24 * lift * Math.min(1, S * 2); }
    ctx.fillStyle = '#FBFBFA';
    if (S > 0.2) { ctx.beginPath(); ctx.roundRect(-CW / 2, -CH / 2, CW, CH, 7); ctx.fill(); } else ctx.fillRect(-CW / 2, -CH / 2, CW, CH);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    if (m < 1) drawImage(ctx, src, S, X, Y, 1);
    if (m > 0) drawImage(ctx, c.own, S, X, Y, m);
    drawText(ctx, m < 0.5 ? src : c.own, S, X, Y);
  };
  for (const i of ORDER) {
    const c = CELLS[i]!;
    if (c.wave === 0) { paint(c, 1, 0, 1); continue; }
    const t0 = t - WT[c.wave - 1]! - c.lag, u = t0 / SLIDE;
    if (u <= 0) continue;
    paint(c, u, 0, outExpo(clamp((t0 - SLIDE - c.mut) / 0.16)));
    // Lifted: a double of the card leaves with it, nearer the camera, so faster, and waits in the slot
    // until the block arrives (the block never shows a hole).
    if (c.lifted && u < 1) { const ug = t0 / c.dur; flying.push(() => paint(c, ug, Math.sin(Math.PI * clamp(ug)), 0)); }
  }
  for (const f of flying) f();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ---------------------------------------------------------------- type: « TOUJOURS PLUS »
const DIM = [5.75, 6.35] as const, WORD1 = 6.0, WORD2 = 6.62;

const Type: React.FC<{ t: number }> = ({ t }) => {
  const base: React.CSSProperties = { fontFamily: THEME.wide, fontStretch: '125%', fontWeight: 800, fontSize: 132, lineHeight: 1, letterSpacing: '-0.005em' };
  const letters = [...'TOUJOURS'];
  const p2 = glide((t - WORD2) / 0.7); // the same glide as the copies: PLUS comes out from under TOUJOURS
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <div style={{ ...base, color: '#F6F4EF', display: 'flex', overflow: 'hidden', paddingBottom: 6 }}>
          {letters.map((ch, i) => (
            <span key={i} style={{ display: 'inline-block', transform: `translateY(${(1 - outExpo(clamp((t - WORD1 - i * 0.032) / 0.55))) * 105}%)` }}>{ch}</span>
          ))}
        </div>
        <div style={{ overflow: 'hidden', marginLeft: '0.32em', fontSize: base.fontSize, paddingBottom: 6 }}>
          <div style={{ ...base, color: '#E8442B', transform: `translateX(${(p2 - 1) * 104}%)` }}>PLUS</div>
        </div>
      </div>
    </div>
  );
};

export const ShopGrid: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender('ShopGrid: canvas fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const loaded = () => [...document.fonts].some((f) => f.family.replace(/["']/g, '') === 'Geist' && f.status === 'loaded');
    const tick = () => { if (!alive) return; if (loaded()) { setReady(true); continueRender(handle); } else setTimeout(tick, 25); };
    tick();
    return () => { alive = false; };
  }, [handle]);
  useLayoutEffect(() => { const ctx = ref.current?.getContext('2d'); if (ready && ctx) draw(ctx, t); }, [t, ready]);
  const dim = outExpo(clamp((t - DIM[0]) / (DIM[1] - DIM[0])));
  return (
    <AbsoluteFill style={{ background: '#0B0B0D' }}>
      <canvas ref={ref} width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(9,9,11,${0.18 * dim}) 0%, rgba(9,9,11,${0.8 * dim}) 38%, rgba(9,9,11,${0.8 * dim}) 62%, rgba(9,9,11,${0.18 * dim}) 100%)` }} />
      {t >= WORD1 && <Type t={t} />}
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';
import { measure, type TextStyle } from '../../layout/measure';
import { Garment, type Kind } from './garments';

/**
 * ShopPrice — typography around a fashion product sheet.
 *
 * Extreme close-up on the price slot: the price arrives horizontally, ACCELERATING all the way
 * (motion blur from its real velocity), and locks dead centre — hard stop, a stiff recoil of a few
 * pixels, a camera punch. The old price cuts in, a fast stroke strikes it, the discount lands with a
 * slight physical overshoot (spring). Whip pull-back: four more sheets come in, in cascade, with
 * the same accelerate-and-lock move, each followed by its strike and its discount. A second whip
 * dives into the sheet with the deepest discount: the film ends as it began, on a price.
 *
 * Hierarchy: price (Geist 800, very large) ≫ name (serif) > old price > labels (mono). One accent.
 */
export const PRICE = { fps: 60, seconds: 6.4 };

type Sheet = { kind: Kind; color: string; bg: string; label: string; name: string; price: number; was: number };
const SHEETS: Sheet[] = [
  { kind: 'dress', color: '#8A2F3A', bg: '#EDE1E0', label: 'Femme — Robes', name: 'Robe midi plissée', price: 7.99, was: 23.99 },
  { kind: 'jacket', color: '#2F4B7C', bg: '#E2E6EA', label: 'Femme — Vestes', name: 'Veste cropped', price: 12.49, was: 34.99 },
  { kind: 'cami', color: '#C2453A', bg: '#ECE7DF', label: 'Femme — Tops', name: 'Top à bretelles', price: 3.49, was: 11.99 },
  { kind: 'jeans', color: '#6B7F99', bg: '#E3E7E0', label: 'Femme — Jeans', name: 'Jean large', price: 9.99, was: 27.99 },
  { kind: 'sweater', color: '#B4876A', bg: '#EFE9DF', label: 'Femme — Mailles', name: 'Pull côtelé', price: 8.49, was: 26.99 },
];
const PAPER = '#F2EFE9', INK = '#111111', GREY = '#8C877F', ACCENT = '#E8442B';

// ---------------------------------------------------------------- sheet layout (world units)
const W = 520, IMG = 600, STEP_X = W + 80, STEP_Y = 56;
const S_LABEL: TextStyle = { size: 15, font: 'mono', weight: 400, tracking: 0.24 };
const S_NAME: TextStyle = { size: 52, font: 'serif', weight: 400, upper: false };
const S_PRICE: TextStyle = { size: 156, font: 'sans', weight: 800, tracking: -0.045, upper: false };
const S_EURO: TextStyle = { size: 60, font: 'sans', weight: 700, upper: false };
const S_WAS: TextStyle = { size: 38, font: 'sans', weight: 400, upper: false };
const S_BADGE: TextStyle = { size: 32, font: 'sans', weight: 800, upper: false };
const Y_LABEL = IMG + 48, Y_NAME = IMG + 110, Y_PRICE = IMG + 262, Y_WAS = IMG + 330;
const amount = (v: number) => v.toFixed(2).replace('.', ',');
const off = (s: Sheet) => Math.round((1 - s.price / s.was) * 100);

// ---------------------------------------------------------------- timing
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const outCubic = (u: number) => 1 - (1 - clamp(u)) ** 3;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const whip = bez(0.75, 0, 0.12, 1);

/** Accelerate all the way, then lock: a hard stop with a stiff recoil of a few units. */
const RUSH = 0.42;
function rush(t: number, lock: number, dist: number) {
  const u = (t - (lock - RUSH)) / RUSH;
  if (u <= 0) return dist;
  if (u < 1) return dist * (1 - u ** 2.6);
  const tau = t - lock;
  return -Math.sign(dist) * 12 * Math.exp(-tau * 32) * Math.sin(tau * 60);
}
const HERO_LOCK = 0.56;
const LOCKS = [HERO_LOCK, 2.5, 2.68, 2.86, 3.04];
const DELAYS = [{ was: 0.2, strike: 0.36, badge: 0.56 }, ...Array(4).fill({ was: 0.12, strike: 0.22, badge: 0.34 })] as Array<{ was: number; strike: number; badge: number }>;
const PULL = [1.95, 2.6] as const;
const DIVE = [4.15, 4.75] as const; // back into the deepest discount
const LAST = SHEETS.reduce((b, s, i) => (off(s) > off(SHEETS[b]!) ? i : b), 0);

// ---------------------------------------------------------------- one sheet
const SheetView: React.FC<{ s: Sheet; i: number; t: number; frame: number; fps: number }> = ({ s, i, t, frame, fps }) => {
  const lock = LOCKS[i]!, d = DELAYS[i]!;
  const intW = measure(amount(s.price), S_PRICE), eu = measure('€', S_EURO);
  const was = measure(`${amount(s.was)} €`, S_WAS), wasCap = measure('0', S_WAS).ascent;
  const wasOn = t >= lock + d.was;
  const strike = outCubic((t - lock - d.strike) / 0.14);
  const sp = spring({ frame: frame - Math.round((lock + d.badge) * fps), fps, config: { damping: 10, stiffness: 240, mass: 0.6 } });
  const badgeTxt = `−${off(s)} %`, bm = measure(badgeTxt, S_BADGE), bw = bm.advance + 28, bh = 50;
  const bx = was.inkRight + 26, by = Y_WAS - wasCap / 2 - bh / 2;
  // The hero's price rushes in from the left alone; the other sheets come in whole, from the right.
  const priceDx = i === 0 ? rush(t, lock, -1500) : 0;
  const priceV = i === 0 ? Math.abs(priceDx - rush(t - 1 / fps, lock, -1500)) : 0;
  return (
    <g>
      <rect x={0} y={0} width={W} height={IMG} fill={s.bg} />
      <svg x={(W - 450) / 2} y={36} width={450} height={540} viewBox="0 0 100 120"><Garment kind={s.kind} color={s.color} /></svg>
      <text x={0} y={Y_LABEL} fontFamily={THEME.mono} fontSize={S_LABEL.size} letterSpacing={`${S_LABEL.tracking}em`} fill={GREY}>{s.label.toUpperCase()}</text>
      <text x={W} y={Y_LABEL} textAnchor="end" fontFamily={THEME.mono} fontSize={S_LABEL.size} letterSpacing={`${S_LABEL.tracking}em`} fill={GREY}>{`N° 0${i + 1}`}</text>
      <text x={0} y={Y_NAME} fontFamily={THEME.serif} fontSize={S_NAME.size} fill={INK}>{s.name}</text>
      <g transform={`translate(${priceDx.toFixed(2)},0)`} filter={priceV > 0.5 ? `url(#pblur${i})` : undefined}>
        <filter id={`pblur${i}`} x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation={`${Math.min(40, priceV * 0.5).toFixed(1)} 0`} /></filter>
        <text x={-intW.inkLeft} y={Y_PRICE} fontFamily={THEME.sans} fontWeight={800} fontSize={S_PRICE.size} letterSpacing={`${S_PRICE.tracking}em`} fill={INK}>{amount(s.price)}</text>
        <text x={intW.inkRight + 14 - eu.inkLeft} y={Y_PRICE - intW.ascent + eu.ascent} fontFamily={THEME.sans} fontWeight={700} fontSize={S_EURO.size} fill={INK}>€</text>
      </g>
      {wasOn && (
        <g>
          <text x={-was.inkLeft} y={Y_WAS} fontFamily={THEME.sans} fontSize={S_WAS.size} fill={GREY}>{`${amount(s.was)} €`}</text>
          <rect x={-4} y={Y_WAS - wasCap * 0.42 - 1.5} width={(was.inkWidth + 8) * strike} height={3} fill={INK} />
        </g>
      )}
      {sp > 0.001 && (
        <g transform={`translate(${bx},${by + bh / 2}) scale(${sp}) translate(0,${-bh / 2 + (1 - Math.min(1, sp)) * 18})`}>
          <rect x={0} y={0} width={bw} height={bh} fill={ACCENT} />
          <text x={14 - bm.inkLeft} y={bh / 2 + bm.ascent / 2} fontFamily={THEME.sans} fontWeight={800} fontSize={S_BADGE.size} fill="#fff">{badgeTxt}</text>
        </g>
      )}
    </g>
  );
};

export const ShopPrice: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;

  // Camera. Close-up: centred on the hero price slot, it catches the price as it locks.
  const p0 = measure(amount(SHEETS[0]!.price), S_PRICE), e0 = measure('€', S_EURO);
  const heroC = { x: (p0.inkWidth + 14 + e0.inkWidth) / 2, y: Y_PRICE - p0.ascent / 2 };
  const catchU = outCubic((t - (HERO_LOCK - RUSH)) / RUSH);
  const close = { x: heroC.x - 70 * (1 - catchU), y: heroC.y, s: 1.9 + 0.05 * clamp(t / PULL[0]) };
  // Wide: the five sheets in cascade, then a slow push.
  const rowW = 4 * STEP_X + W, rowH = IMG + 360 + 4 * STEP_Y;
  const wideS = Math.min((1920 * 0.86) / rowW, (1080 * 0.86) / rowH);
  const wide = { x: rowW / 2 - 40 * (1 - outCubic((t - PULL[1]) / 1.4)), y: rowH / 2, s: wideS * (1 + 0.035 * clamp((t - PULL[1]) / (PRICE.seconds - PULL[1]))) };
  const w = whip((t - PULL[0]) / (PULL[1] - PULL[0]));
  // Interpolate the scale in log space (a zoom reads linear in log), the centre with the same curve.
  let cs = Math.exp(lerp(Math.log(close.s), Math.log(wide.s), w)), cx = lerp(close.x, wide.x, w), cy = lerp(close.y, wide.y, w);
  // Second whip: into the sheet with the deepest discount, its price and its badge.
  const pl = measure(amount(SHEETS[LAST]!.price), S_PRICE), el = measure('€', S_EURO);
  const end = { x: LAST * STEP_X + (pl.inkWidth + 14 + el.inkWidth) / 2, y: LAST * STEP_Y + Y_PRICE - pl.ascent / 2 + 36, s: 1.8 * (1 + 0.03 * clamp((t - DIVE[1]) / (PRICE.seconds - DIVE[1]))) };
  const w2 = whip((t - DIVE[0]) / (DIVE[1] - DIVE[0]));
  cs = Math.exp(lerp(Math.log(cs), Math.log(end.s), w2)); cx = lerp(cx, end.x, w2); cy = lerp(cy, end.y, w2);
  // A punch at each lock (strong on the hero, light in the cascade).
  const punch = LOCKS.reduce((a, L, i) => { const tau = t - L; return tau < 0 ? a : a + (i === 0 ? 0.035 : 0.01) * Math.exp(-tau / 0.09) * (1 - Math.exp(-tau / 0.012)); }, 0);
  cs *= 1 + punch;

  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <svg width={1920} height={1080}>
        <g transform={`translate(960,540) scale(${cs}) translate(${-cx},${-cy})`}>
          {SHEETS.map((s, i) => {
            const focus = i === LAST ? 1 : 1 - 0.88 * w2; // the dive isolates its sheet
            if (i === 0) return <g key={i} opacity={focus}><SheetView s={s} i={i} t={t} frame={frame} fps={fps} /></g>;
            const dx = rush(t, LOCKS[i]!, 1800), v = Math.abs(dx - rush(t - 1 / fps, LOCKS[i]!, 1800)) * cs;
            if (dx > 1700) return null;
            return (
              <g key={i} opacity={focus} transform={`translate(${i * STEP_X + dx},${i * STEP_Y})`} filter={v > 0.5 ? `url(#sblur${i})` : undefined}>
                <filter id={`sblur${i}`} x="-30%" y="-5%" width="160%" height="110%"><feGaussianBlur stdDeviation={`${Math.min(30, (v * 0.45) / cs).toFixed(1)} 0`} /></filter>
                <SheetView s={s} i={i} t={t} frame={frame} fps={fps} />
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

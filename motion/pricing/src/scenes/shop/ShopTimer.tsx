import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';
import { measure } from '../../layout/measure';
import { Garment } from './garments';

/**
 * ShopTimer — tension from rhythm and composition, around a flash-sale countdown.
 *
 * One interface, one camera. The ticks come slightly faster each time (0.64 s → 0.30 s). Digits are
 * mechanical drums: the old digit drops out, the new one drops in with a short detent; on a carry
 * (01:00 → 00:59) the wheels follow one another, two frames apart. The cuts are camera jumps made
 * ON ticks: extreme close-up on the seconds, close-up on the carry, then the whole sale panel; a
 * product card slides into the foreground (a plane nearer the camera), and the camera pushes in
 * to the seconds — the card, nearer, leaves the frame faster. Last tick, cut to black.
 */
export const TIMER = { fps: 60, seconds: 8.1 };

// ---------------------------------------------------------------- rhythm
const N = 16, FIRST = 0.38, I0 = 0.64, I1 = 0.3, R = Math.pow(I1 / I0, 1 / (N - 1));
const TICKS = Array.from({ length: N }, (_, k) => FIRST + (I0 * (1 - Math.pow(R, k))) / (1 - R));
const START = 63; // 00:01:03
const ticksAt = (t: number) => { let c = 0; while (c < N && TICKS[c]! <= t) c++; return c; };
const CUT_B = TICKS[1]!, CUT_C = TICKS[4]!, PUSH = [TICKS[6]!, TICKS[14]! + 0.1] as const, BLACK = TICKS[N - 1]! + 0.42;

// ---------------------------------------------------------------- page layout (world = screen at scale 1)
const PAGE = '#09090B', TILE = '#17171A', WHITE = '#F4F2EE', GREY = '#8A8780', ACCENT = '#E8442B', PAPER = '#F2EFE9';
const TW = 128, TH = 184, PG = 12, CG = 64, X0 = (1920 - (6 * TW + 3 * PG + 2 * CG)) / 2, TY = 540 - TH / 2;
const tileX = (i: number) => X0 + i * TW + Math.floor(i / 2) * (PG + CG) + (i % 2) * PG; // h h : m m : s s
const colonX = (j: number) => tileX(2 * j + 1) + TW + CG / 2;
const DIGIT_SIZE = 152, DRUM = 0.1;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const outExpo = (u: number) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(u)));
const detent = (u: number) => { const x = clamp(u) - 1, c = 1.25; return 1 + (c + 1) * x ** 3 + c * x ** 2; }; // back-out: a short overshoot
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const pushEase = bez(0.5, 0, 0.2, 1);

/** Digit i (0 = hours tens … 5 = seconds ones) of the time shown after c ticks. */
const digitOf = (c: number, i: number) => { const v = START - c, h = Math.floor(v / 3600), m = Math.floor(v / 60) % 60, s = v % 60; return [Math.floor(h / 10), h % 10, Math.floor(m / 10), m % 10, Math.floor(s / 10), s % 10][i]!; };
const CARRY = [10, 8, 6, 4, 2, 0].map((f) => f / 60); // a carry runs from the seconds wheel leftwards

// ---------------------------------------------------------------- pieces
const Drum: React.FC<{ i: number; t: number }> = ({ i, t }) => {
  const c = ticksAt(t - CARRY[i]!), x = tileX(i);
  let cur = digitOf(c, i), prev = cur, u = 1;
  if (c > 0) { const p = digitOf(c - 1, i); if (p !== cur) { prev = p; u = (t - CARRY[i]! - TICKS[c - 1]!) / DRUM; } }
  const e = u >= 1 ? 1 : detent(u);
  const m = measure('0', { size: DIGIT_SIZE, font: 'sans', weight: 700, upper: false });
  const base = TH / 2 + m.ascent / 2; // optical centre of the figures
  const glyph = (d: number, dy: number) => <text x={TW / 2} y={base + dy} textAnchor="middle" fontFamily={THEME.sans} fontWeight={700} fontSize={DIGIT_SIZE} fill={WHITE}>{d}</text>;
  return (
    <g transform={`translate(${x},${TY})`}>
      <clipPath id={`drum${i}`}><rect width={TW} height={TH} rx={10} /></clipPath>
      <rect width={TW} height={TH} rx={10} fill={TILE} />
      <g clipPath={`url(#drum${i})`}>
        {u < 1 && glyph(prev, e * TH)}
        {glyph(cur, u < 1 ? (e - 1) * TH : 0)}
        {/* The wheel's curvature: the figures darken as they leave the window. */}
        <rect width={TW} height={TH} fill={`url(#drumShade)`} />
      </g>
    </g>
  );
};

const Card: React.FC = () => (
  <g>
    <rect x={-220} y={-320} width={440} height={640} rx={14} fill={PAPER} />
    <rect x={-220} y={-320} width={440} height={430} rx={14} fill="#E2E6EA" />
    <rect x={-220} y={90} width={440} height={20} fill="#E2E6EA" />
    <svg x={-170} y={-300} width={340} height={408} viewBox="0 0 100 120"><Garment kind="jacket" color="#2F4B7C" /></svg>
    <rect x={-220} y={-292} width={86} height={34} fill="#111" />
    <text x={-177} y={-268} textAnchor="middle" fontFamily={THEME.sans} fontWeight={800} fontSize={20} fill="#fff">−64 %</text>
    <text x={-192} y={160} fontFamily={THEME.serif} fontSize={40} fill="#111">Veste cropped</text>
    <text x={-194} y={250} fontFamily={THEME.sans} fontWeight={800} fontSize={84} letterSpacing="-0.04em" fill="#111">12,49 €</text>
    <text x={-192} y={298} fontFamily={THEME.sans} fontSize={28} fill={GREY} textDecoration="line-through">34,99 €</text>
  </g>
);

export const ShopTimer: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const c = ticksAt(t);

  // ---- camera: cuts are jumps between framings, made on ticks; inside a shot, a slow push.
  const secs = { x: tileX(4) + TW + PG / 2, y: 540 }, carry = { x: colonX(1), y: 540 };
  const wide = { x: 1220, y: 560, s: 1 };
  let cam: { x: number; y: number; s: number };
  if (t < CUT_B) cam = { ...secs, s: 5.0 * (1 + 0.025 * t) };
  else if (t < CUT_C) cam = { ...carry, s: 3.6 * (1 + 0.025 * (t - CUT_B)) };
  else {
    const p = pushEase((t - PUSH[0]) / (PUSH[1] - PUSH[0]));
    const end = { ...secs, s: 5.2 * (1 + 0.02 * clamp((t - PUSH[1]) / 0.6)) };
    cam = { x: lerp(wide.x, end.x, p), y: lerp(wide.y, end.y, p), s: Math.exp(lerp(Math.log(wide.s * (1 + 0.012 * (t - CUT_C))), Math.log(end.s), p)) };
  }
  // Each tick lands with a tiny jolt (the same on every shot: the beat, not an effect).
  const last = c > 0 ? TICKS[c - 1]! : -9;
  cam.s *= 1 + 0.006 * Math.exp(-(t - last) / 0.07) * (t >= last ? 1 : 0);

  // ---- the foreground card: a plane nearer the camera (depth dz), so it scales and parallaxes more.
  const DZ = 0.2, near = 1 - DZ * cam.s, cs = near > 0.1 ? cam.s / near : 0;
  const slide = outExpo((t - CUT_C - 0.04) / 0.55);
  const card = { x: wide.x + 600 / 1.25 + (1 - slide) * 1100, y: 560 + 40 / 1.25 };

  // ---- interface state
  const interval = c > 0 && c < N ? TICKS[c]! - TICKS[c - 1]! : I0;
  const colon = c === 0 || t - last < interval * 0.5 ? 1 : 0.32;
  const sold = 73 + c, fill = lerp(73 + Math.max(0, c - 1), sold, outExpo((t - last) / 0.18)) / 100;
  const BAR = { x: X0, y: 760, w: 6 * TW + 3 * PG + 2 * CG };

  if (t >= BLACK) return <AbsoluteFill style={{ background: '#000' }} />;
  return (
    <AbsoluteFill style={{ background: PAGE }}>
      <svg width={1920} height={1080}>
        <defs>
          <linearGradient id="drumShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity={0.55} /><stop offset="0.22" stopColor="#000" stopOpacity={0} />
            <stop offset="0.78" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.55} />
          </linearGradient>
          <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx={0} dy={30} stdDeviation={40} floodColor="#000" floodOpacity={0.6} /></filter>
        </defs>
        <g transform={`translate(960,540) scale(${cam.s}) translate(${-cam.x},${-cam.y})`}>
          <rect x={-2000} y={-2000} width={6000} height={5000} fill={PAGE} />
          {/* Sale panel. */}
          <rect x={X0} y={300} width={170} height={36} fill={ACCENT} />
          <text x={X0 + 85} y={325} textAnchor="middle" fontFamily={THEME.sans} fontWeight={800} fontSize={19} letterSpacing="0.12em" fill="#fff">VENTE FLASH</text>
          <text x={X0} y={400} fontFamily={THEME.mono} fontSize={18} letterSpacing="0.3em" fill={GREY}>SE TERMINE DANS</text>
          {[0, 1, 2, 3, 4, 5].map((i) => <Drum key={i} i={i} t={t} />)}
          {[0, 1].map((j) => (
            <g key={j} opacity={colon} fill={WHITE}><rect x={colonX(j) - 7} y={540 - 34} width={14} height={14} /><rect x={colonX(j) - 7} y={540 + 20} width={14} height={14} /></g>
          ))}
          {['HEURES', 'MINUTES', 'SECONDES'].map((u, j) => (
            <text key={u} x={tileX(2 * j)} y={TY + TH + 40} fontFamily={THEME.mono} fontSize={15} letterSpacing="0.28em" fill={GREY}>{u}</text>
          ))}
          <rect x={BAR.x} y={BAR.y} width={BAR.w} height={6} fill="#26262A" />
          <rect x={BAR.x} y={BAR.y} width={BAR.w * fill} height={6} fill={ACCENT} />
          <text x={BAR.x} y={BAR.y + 44} fontFamily={THEME.mono} fontSize={16} letterSpacing="0.24em" fill={GREY}>DÉJÀ VENDU</text>
          <text x={BAR.x + BAR.w} y={BAR.y + 44} textAnchor="end" fontFamily={THEME.sans} fontWeight={700} fontSize={22} fill={WHITE}>{sold} %</text>
        </g>
        {t >= CUT_C && cs > 0 && (
          <g transform={`translate(${960 + (card.x - cam.x) * cs},${540 + (card.y - cam.y) * cs}) scale(${cs})`} filter="url(#cardShadow)">
            <Card />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

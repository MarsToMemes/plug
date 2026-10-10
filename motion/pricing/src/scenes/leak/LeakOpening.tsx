import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';

/**
 * LeakOpening — opening titles of the Plug Leak documentary « Comment Temu peut vendre des produits à 1 € ? ».
 * Flat editorial 2D: charcoal ground, white black-weight type (Archivo 900), one orange accent (the underline).
 *
 * Hierarchy, decided before any motion:
 *   1. the price « 1 € » — the biggest thing on screen, the only thing touched by orange;
 *   2. « COMMENT » — the question, full grid width;
 *   3. « COÛTE » — the verb, smaller, links the two;
 *   4. mono labels (show name, the full question) — information, never decoration.
 * Each element has its own way in: price = cut then zoom out; decimals = slide out from behind the 1;
 * € = shrinks into the decimal slot; COMMENT = hard cut then vertical lift; COÛTE = letters sliding
 * behind a rectangular mask, closing their spacing as they brake; 1 = drops in its cell; € = snaps in
 * from the right; underline = drawn left to right; ? = hard cut, and everything stops.
 * Last: hard cut to the underline alone, which becomes the conveyor line of the next (real) shot.
 *
 * Every cue is a prop (seconds), to lock on the voice or the music; `audio` plays a track for checking.
 * `line` is where the conveyor sits in the next shot; `next` optionally shows that shot to check the match.
 */
export type LeakTiming = {
  price: number; // cut to the monumental « 1 € » (black before)
  zoom: number; zoomDur: number; // zoom out: the price becomes readable
  decimals: number; decimalsDur: number; // decimals slide out, € moves into the retail layout
  comment: number; // hard cut on « COMMENT » (the voice asks how)
  coute: number; couteDur: number; // « COMMENT » lifts, « COÛTE » slides in behind its mask
  one: number; euro: number; underline: number; // « 1 € » in three beats
  question: number; // « ? »: the motion stops
  match: number; matchDur: number; // hard cut to the line alone, which moves onto the conveyor
  end: number;
};
export type LeakProps = {
  timing: LeakTiming;
  line: { y: number; x0: number; x1: number; thickness: number }; // the conveyor in the next shot (px, 1920 × 1080)
  title: string; show: string;
  audio: string | null; // e.g. "voice/hook.wav" (public/), only to check the sync
  next: string | null; // e.g. "clips/convoyeur.mp4" (public/), only to check the match cut
};
// Default cues on a 120 BPM grid (0.25 s): replace with the times of the voice / music.
export const LEAK_DEFAULTS: LeakProps = {
  timing: {
    price: 0.25, zoom: 1.25, zoomDur: 0.42, decimals: 1.75, decimalsDur: 0.45, comment: 2.5, coute: 3.0, couteDur: 0.5,
    one: 3.5, euro: 3.75, underline: 4.0, question: 4.5, match: 5.5, matchDur: 0.55, end: 6.5,
  },
  line: { y: 742, x0: -20, x1: 1940, thickness: 6 },
  title: 'COMMENT TEMU PEUT VENDRE DES PRODUITS À 1 € ?',
  show: 'PLUG LEAK',
  audio: null,
  next: null,
};
export const LEAK_FPS = 60;

// ---------------------------------------------------------------- palette, grid, type
const BG = '#121212', INK = '#F5F3EE', ORANGE = '#FF5A1F', MUTED = '#77746F';
const M = 96, W = 1920 - 2 * M; // grid margins; 12 columns of 122 + 11 gutters of 24 inside W
const DISPLAY = "Archivo, Geist, Helvetica, sans-serif";

let ctx: CanvasRenderingContext2D | null = null;
/** Ink metrics of a string in Archivo 900 at a size (measured on the real font). */
function ink(text: string, size: number) {
  ctx ??= document.createElement('canvas').getContext('2d')!;
  ctx.font = `900 1000px ${DISPLAY}`;
  const m = ctx.measureText(text), k = size / 1000;
  return { l: -m.actualBoundingBoxLeft * k, r: m.actualBoundingBoxRight * k, w: (m.actualBoundingBoxRight + m.actualBoundingBoxLeft) * k, asc: m.actualBoundingBoxAscent * k, desc: m.actualBoundingBoxDescent * k, adv: m.width * k };
}

// ---------------------------------------------------------------- easing
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const hard = bez(0.8, 0, 0.1, 1); // frank acceleration, clean braking
const snap = bez(0.9, 0, 0.05, 1); // even harder: a snap that stops dead
const brake = bez(0.2, 0.9, 0.1, 1); // already fast, brakes hard
const span = (t: number, a: number, d: number) => clamp((t - a) / d);

const Txt: React.FC<{ x: number; y: number; size: number; children: string; fill?: string; spacing?: number }> = ({ x, y, size, children, fill = INK, spacing }) => (
  <text x={x} y={y} fontFamily={DISPLAY} fontWeight={900} fontSize={size} fill={fill} letterSpacing={spacing} style={{ fontKerning: 'normal' }}>{children}</text>
);
const Mono: React.FC<{ x: number; y: number; children: string; anchor?: 'start' | 'end'; color?: string }> = ({ x, y, children, anchor = 'start', color = MUTED }) => (
  <text x={x} y={y} fontFamily={THEME.mono} fontWeight={500} fontSize={17} letterSpacing="0.24em" fill={color} textAnchor={anchor}>{children}</text>
);

// ---------------------------------------------------------------- 1. the price (world units, then a camera)
const P = 600, Q = 0.4 * P; // price size; decimals / € size in the retail layout
function priceShot(t: number, T: LeakTiming) {
  const m1 = ink('1', P), mE = ink('€', P), md = ink(',00', Q), m00 = ink('00', Q);
  const gap = 0.14 * P, R1 = m1.w; // « 1 » ink from 0 to R1, baseline 0
  const zU = hard(span(t, T.zoom, T.zoomDur)), dU = hard(span(t, T.decimals, T.decimalsDur));
  const sU = hard(span(t, T.decimals + 0.12, T.decimalsDur)); // the decimals leave once the € has made room
  // « € »: full size beside the 1 → small, under the decimals (it moves into the new composition).
  const eSize = lerp(P, Q, dU), eInkL = lerp(R1 + gap, R1 + 0.05 * P, dU);
  // Decimals: slide out from behind the 1, top-aligned with it.
  const dX = lerp(R1 - md.w - 10, R1 + 0.05 * P, sU), dY = -m1.asc + m00.asc;
  // Camera: monumental (1 cut by the left edge) → readable whole → re-cropped onto the retail layout.
  const wB = R1 + gap + mE.w, wC = R1 + 0.05 * P + Math.max(md.w, ink('€', Q).w);
  // The « 1 » loses about 40 % of its width to the left edge; the € almost touches the top and bottom.
  const zA0 = 2.35, zA = zA0 * (1 + 0.025 * span(t, T.price, T.zoom - T.price)), cA = { x: (960 + 0.4 * R1 * zA0) / zA0, y: -m1.asc / 2 };
  const cB = { x: wB / 2, y: -m1.asc / 2 }, cC = { x: wC / 2 - 260 / 1.2, y: -m1.asc / 2 + 10 };
  let z = Math.exp(lerp(Math.log(zA), 0, zU)), cx = lerp(cA.x, cB.x, zU), cy = lerp(cA.y, cB.y, zU);
  z *= lerp(1, 1.2, dU); cx = lerp(cx, cC.x, dU); cy = lerp(cy, cC.y, dU);
  const blur = t > T.zoom && t < T.zoom + T.zoomDur ? 6 * Math.sin(Math.PI * zU) : 0; // a touch of motion blur at full speed
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <defs><clipPath id="behind1"><rect x={R1} y={-2000} width={4000} height={4000} /></clipPath></defs>
      <g transform={`translate(${960 - cx * z} ${540 - cy * z}) scale(${z})`} style={{ filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
        <Txt x={-m1.l} y={0} size={P}>1</Txt>
        {sU > 0 && <g clipPath="url(#behind1)"><Txt x={dX - md.l} y={dY} size={Q}>,00</Txt></g>}
        <Txt x={eInkL - ink('€', eSize).l} y={0} size={eSize}>€</Txt>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------- 2. the question
function layout() {
  const sC = W / ink('COMMENT', 1).w, mC = ink('COMMENT', sC);
  // Row 2: COÛTE (s2) · 1 € (s3) · ? — fills the grid width; the price is the biggest type of the frame.
  const g1 = 90, r = 0.34; // gap COÛTE → price; COÛTE size relative to the price
  const unit = ink('COÛTE', r).w + ink('1', 1).w + 0.16 + ink('€', 1).w + 0.2 + ink('?', 1).w; // French spacing: 1 € ?
  const s3 = (W - g1) / unit, s2 = r * s3;
  const base2 = 1080 - 120;
  const x2 = M, xP = M + ink('COÛTE', s2).w + g1;
  const x1 = xP, xE = x1 + ink('1', s3).w + 0.16 * s3, xQ = xE + ink('€', s3).w + 0.2 * s3;
  return { sC, mC, s2, s3, base2, x2, x1, xE, xQ, topC: 150 };
}

const COUTE = ['C', 'O', 'Û', 'T', 'E'];

function questionShot(t: number, T: LeakTiming, p: LeakProps) {
  const L = layout();
  const lift = hard(span(t, T.coute, 0.42));
  const yC = lerp(540 + L.mC.asc / 2, L.topC + L.mC.asc, lift); // centred at the cut, lifted to the top row
  // A slow lateral drift of the whole page… stopped dead by the question, exactly on the grid.
  const drift = 26 * (1 - clamp((Math.min(t, T.question) - T.coute) / (T.question - T.coute))); // lands on the grid when it stops
  const still = t >= T.question;

  // COÛTE: each letter slides right behind the mask, the later ones further back: they close up as they brake.
  const m2 = ink('COÛTE', L.s2), y2 = L.base2;
  const letters = COUTE.map((ch, i) => {
    const pre = ink('COÛTE'.slice(0, i), L.s2).adv;
    const u = brake(span(t, T.coute + 0.05 + (COUTE.length - 1 - i) * 0.035, T.couteDur));
    const from = -m2.w - 60 - i * 70;
    return <Txt key={i} x={L.x2 - m2.l + pre + lerp(from, 0, u)} y={y2} size={L.s2}>{ch}</Txt>;
  });

  // 1 € : three beats.
  const m1 = ink('1', L.s3), mE = ink('€', L.s3), mQ = ink('?', L.s3);
  const uOne = snap(span(t, T.one, 0.28)), uEuro = snap(span(t, T.euro, 0.24)), uLine = hard(span(t, T.underline, 0.36));
  const lineY = y2 + 0.075 * L.s3, lineH = 0.034 * L.s3, lx0 = L.x1, lx1 = L.xE + mE.w;
  const cap = m1.asc;

  // The match cut: only the line stays; it travels onto the conveyor of the next shot.
  const mU = hard(span(t, T.match, T.matchDur)), matched = t >= T.match;
  const ln = matched
    ? { x0: lerp(lx0 + drift, p.line.x0, mU), x1: lerp(lx1 + drift, p.line.x1, mU), y: lerp(lineY + lineH / 2, p.line.y, mU), h: lerp(lineH, p.line.thickness, mU) }
    : { x0: lx0 + drift, x1: lx0 + drift + (lx1 - lx0) * uLine, y: lineY + lineH / 2, h: lineH };

  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <clipPath id="couteMask"><rect x={L.x2 + m2.l - m2.l} y={y2 - m2.asc - 20} width={m2.w + 4} height={m2.asc + m2.desc + 40} /></clipPath>
        <clipPath id="oneMask"><rect x={L.x1 - 10} y={y2 - cap - 30} width={m1.w + 20} height={cap + 40} /></clipPath>
        <clipPath id="euroMask"><rect x={L.xE - 10} y={y2 - mE.asc - 30} width={mE.w + 20} height={mE.asc + mE.desc + 60} /></clipPath>
      </defs>
      {!matched && (
        <g transform={`translate(${drift} 0)`}>
          {/* Labels: the show, a hairline on the grid; the full question once the motion stops. */}
          <g opacity={t >= T.comment + 0.08 ? 1 : 0}>
            <Mono x={M} y={78} color={INK}>{p.show}</Mono>
            <rect x={M} y={98} width={W * hard(span(t, T.comment + 0.08, 0.5))} height={1} fill="#3a3936" />
          </g>
          {still && <Mono x={M} y={1048}>{p.title}</Mono>}
          <Txt x={M - L.mC.l} y={yC} size={L.sC}>COMMENT</Txt>
          {t >= T.coute && <g clipPath="url(#couteMask)">{letters}</g>}
          {t >= T.one && <g clipPath="url(#oneMask)"><Txt x={L.x1 - m1.l} y={y2 - (1 - uOne) * (cap + 60)} size={L.s3}>1</Txt></g>}
          {t >= T.euro && <g clipPath="url(#euroMask)"><Txt x={L.xE - mE.l + (1 - uEuro) * (mE.w + 80)} y={y2} size={L.s3}>€</Txt></g>}
          {still && <Txt x={L.xQ - mQ.l} y={y2} size={L.s3}>?</Txt>}
        </g>
      )}
      {t >= T.underline && <rect x={ln.x0} y={ln.y - ln.h / 2} width={Math.max(0, ln.x1 - ln.x0)} height={ln.h} fill={ORANGE} />}
    </svg>
  );
}

export const LeakOpening: React.FC<Partial<LeakProps>> = (props) => {
  const p = { ...LEAK_DEFAULTS, ...props, timing: { ...LEAK_DEFAULTS.timing, ...props.timing }, line: { ...LEAK_DEFAULTS.line, ...props.line } };
  const T = p.timing;
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const nextAt = Math.round((T.match + T.matchDur + 0.1) * fps);
  return (
    <AbsoluteFill style={{ background: BG }}>
      {p.next && <Sequence from={nextAt}><OffthreadVideo src={staticFile(p.next)} muted /></Sequence>}
      {t >= T.price && t < T.comment && priceShot(t, T)}
      {t >= T.comment && !(p.next && frame >= nextAt + 9) && questionShot(t, T, p)}
      {p.audio && <Audio src={staticFile(p.audio)} />}
    </AbsoluteFill>
  );
};

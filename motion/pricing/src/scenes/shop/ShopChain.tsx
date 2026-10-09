import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';
import { Garment, shade, type Kind } from './garments';
import { product, mix, euro, NAMES, type Product } from './products';

/**
 * ShopChain — from one product sheet to the next, through a detail.
 *
 * The camera closes in on a detail of the first garment (a round button); the detail becomes a mask
 * (an iris of the same shape, first filled with the button's colour) that opens on the next sheet,
 * which comes forward and takes the focus. Second link, a little faster: the bag's clasp becomes a
 * rounded-rectangle mask onto the third sheet. Then a pull-back reveals the grid all three belong to.
 *
 * Match cuts: shape (button → circle, clasp → rounded rectangle), colour (each new sheet's backdrop is
 * tinted with the previous garment), movement (the forward push carries on into the next sheet).
 * The three sheets live in ONE world (the final grid): each mask shows the same world through another
 * camera. Illustration: the footnote says the selection was made for the demonstration.
 */
export const CHAIN = { fps: 60, seconds: 9 };

// ---------------------------------------------------------------- the world: a 5 × 3 grid of sheets
const CW = 420, CH = 600, IMG = 470, GAP = 60, COLS = 5, ROWS = 3;
const cellPos = (c: number, r: number) => ({ x: (c - (COLS - 1) / 2) * (CW + GAP), y: (r - (ROWS - 1) / 2) * (CH + GAP) });
type Sheet = { c: number; r: number; p: Product };
const A: Sheet = { c: 0, r: 0, p: { kind: 'jacket', color: '#8A2F3A', bg: '#ECE7E2', price: 19.99, was: 44.99, sold: 0 } };
const B: Sheet = { c: 4, r: 2, p: { kind: 'bag', color: '#B4876A', bg: '#EBDADB', price: 8.49, was: 21.99, sold: 0 } }; // backdrop: a tint of A's bordeaux
const C: Sheet = { c: 2, r: 1, p: { kind: 'dress', color: '#C9B48F', bg: '#F1E7DC', price: 14.99, was: 32.99, sold: 0 } }; // backdrop: a tint of B's camel
const FOCAL = [A, B, C];
const isFocal = (c: number, r: number) => FOCAL.some((s) => s.c === c && s.r === r);

/** A point of the garment drawing (viewBox 100 × 120) in world coordinates, for a sheet. */
const GS = Math.min(CW / 100, IMG / 120), GOX = (CW - 100 * GS) / 2;
const garmentPt = (s: Sheet, gx: number, gy: number) => { const o = cellPos(s.c, s.r); return { x: o.x - CW / 2 + GOX + (8 + 0.84 * gx) * GS, y: o.y - CH / 2 + (6 + 0.84 * gy) * GS }; };
const BUTTON = { ...garmentPt(A, 53, 56), r: 1.6 * 0.84 * GS }; // jacket's upper button
const CLASP = { ...garmentPt(B, 50, 55), w: 8 * 0.84 * GS, h: 6 * 0.84 * GS, rr: 1.5 * 0.84 * GS }; // bag's clasp
const centre = (s: Sheet) => cellPos(s.c, s.r);

// ---------------------------------------------------------------- timing
const PUSH1 = [1.0, 2.05] as const, IRIS1 = [1.95, 2.7] as const;
const PUSH2 = [3.55, 4.3] as const, IRIS2 = [4.22, 4.8] as const; // the second link is faster
const BACK = [5.75, 7.5] as const, LABEL = 7.2;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const dive = bez(0.7, 0, 0.84, 0.4), open = bez(0.45, 0, 0.2, 1), arrive = bez(0.2, 0.7, 0.3, 1), back = bez(0.6, 0, 0.2, 1), settle = bez(0.16, 1, 0.3, 1);
const logLerp = (a: number, b: number, u: number) => Math.exp(lerp(Math.log(a), Math.log(b), u));

type Cam = { x: number; y: number; s: number };
const Z1 = 64 / BUTTON.r, Z2 = 150 / CLASP.w; // the button ends 64 px in radius, the clasp 150 px wide
/** Camera of shot k (0 = A, 1 = B, 2 = C and the final pull-back). */
function camOf(k: number, t: number): Cam {
  if (k === 0) { const u = dive((t - PUSH1[0]) / (PUSH1[1] - PUSH1[0])), c = centre(A); return { x: lerp(c.x, BUTTON.x, u), y: lerp(c.y, BUTTON.y, u), s: logLerp(1 + 0.04 * clamp(t / PUSH1[0]), Z1, u) }; }
  if (k === 1) {
    const a = arrive((t - IRIS1[0]) / (IRIS1[1] - IRIS1[0] + 0.25)), c = centre(B), u = dive((t - PUSH2[0]) / (PUSH2[1] - PUSH2[0]));
    const s = logLerp(0.5, 1.0, a) * (1 + 0.03 * clamp((t - IRIS1[1]) / (PUSH2[0] - IRIS1[1])));
    return { x: lerp(c.x, CLASP.x, u), y: lerp(c.y, CLASP.y, u), s: logLerp(s, Z2, u) };
  }
  const a = arrive((t - IRIS2[0]) / (IRIS2[1] - IRIS2[0] + 0.25)), c = centre(C), b = back((t - BACK[0]) / (BACK[1] - BACK[0]));
  const s = logLerp(0.55, 1.0, a) * (1 + 0.025 * clamp((t - IRIS2[1]) / (BACK[0] - IRIS2[1])));
  return { x: lerp(c.x, 0, b), y: lerp(c.y, 12, b), s: logLerp(s, 0.48, b) };
}

// ---------------------------------------------------------------- the world
const Card: React.FC<{ p: Product; label?: boolean }> = ({ p }) => {
  const off = Math.round((1 - p.price / p.was) * 100);
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: '#F6F3EE', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: CW, height: IMG, background: p.bg }}>
        <svg viewBox="0 0 100 120" width={CW} height={IMG} preserveAspectRatio="xMidYMin meet" style={{ position: 'absolute', inset: 0 }}><g transform="translate(8,6) scale(0.84)"><Garment kind={p.kind} color={p.color} /></g></svg>
        <div style={{ position: 'absolute', left: 18, top: 18, padding: '4px 9px', background: '#111', color: '#fff', fontSize: 15, fontWeight: 700 }}>-{off}%</div>
      </div>
      <div style={{ position: 'absolute', left: 22, top: IMG + 22, fontSize: 21, color: '#3C3A36' }}>{NAMES[p.kind]}</div>
      <div style={{ position: 'absolute', left: 22, top: IMG + 58, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 750, color: '#111', letterSpacing: '-0.02em' }}>{euro(p.price)}</span>
        <span style={{ fontSize: 17, color: '#A29E97', textDecoration: 'line-through' }}>{euro(p.was)}</span>
      </div>
    </div>
  );
};

const World: React.FC<{ cam: Cam; others: number; focus: Sheet }> = ({ cam, others, focus }) => {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const f = FOCAL.find((s) => s.c === c && s.r === r), o = cellPos(c, r);
    const op = f === focus ? 1 : others; // only the current sheet until the pull-back; the chain's other links then come back with the grid
    if (op <= 0.001) continue;
    const p = f ? f.p : product(r * COLS + c, mix(8400 + r * COLS + c));
    cells.push(<div key={`${c}-${r}`} style={{ position: 'absolute', left: o.x - CW / 2, top: o.y - CH / 2, width: CW, height: CH, opacity: op }}><Card p={p} /></div>);
  }
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: '0 0', transform: `translate(${960 - cam.x * cam.s}px, ${540 - cam.y * cam.s}px) scale(${cam.s})` }}>{cells}</div>
  );
};

export const ShopChain: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const others = settle((t - BACK[0] - 0.35) / 1.0);
  // Iris 1: the button (circle) opens; first filled with the button's colour, which dissolves.
  const i1 = open((t - IRIS1[0]) / (IRIS1[1] - IRIS1[0]));
  const R1 = lerp(BUTTON.r * Z1, 1200, i1);
  // Iris 2: the clasp (rounded rectangle) opens.
  const i2 = open((t - IRIS2[0]) / (IRIS2[1] - IRIS2[0]));
  const w2 = lerp(CLASP.w * Z2, 2400, i2), h2 = lerp(CLASP.h * Z2, 1500, i2), r2 = lerp(CLASP.rr * Z2, 40, i2);
  const fill1 = 1 - clamp((t - IRIS1[0] - 0.05) / 0.3), fill2 = 1 - clamp((t - IRIS2[0] - 0.04) / 0.24);
  const shot = t < IRIS1[0] ? 0 : t < IRIS1[1] ? 0.5 : t < IRIS2[0] ? 1 : t < IRIS2[1] ? 1.5 : 2;
  const lab = settle((t - LABEL) / 0.6);
  return (
    <AbsoluteFill style={{ background: '#121214', fontFamily: THEME.sans, overflow: 'hidden' }}>
      {shot <= 0.5 && <World cam={camOf(0, t)} others={0} focus={A} />}
      {shot >= 0.5 && shot <= 1.5 && (
        <AbsoluteFill style={{ clipPath: shot === 0.5 ? `circle(${R1}px at 960px 540px)` : undefined, background: '#121214' }}>
          <World cam={camOf(1, t)} others={0} focus={B} />
          {shot === 0.5 && <AbsoluteFill style={{ background: shade(A.p.color, 0.78), opacity: fill1 }} />}
        </AbsoluteFill>
      )}
      {shot >= 1.5 && (
        <AbsoluteFill style={{ clipPath: shot === 1.5 ? `inset(${540 - h2 / 2}px ${960 - w2 / 2}px ${540 - h2 / 2}px ${960 - w2 / 2}px round ${r2}px)` : undefined, background: '#121214' }}>
          <World cam={camOf(2, t)} others={others} focus={C} />
          {shot === 1.5 && <AbsoluteFill style={{ background: shade(B.p.color, 0.78), opacity: fill2 }} />}
        </AbsoluteFill>
      )}
      {/* Final labels: a neutral heading, and what this is. */}
      <div style={{ position: 'absolute', left: 80, top: 56, fontFamily: THEME.mono, fontSize: 16, letterSpacing: '0.28em', color: '#F2EFE9', opacity: lab, transform: `translateY(${(1 - lab) * 10}px)` }}>ARTICLES SIMILAIRES</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 30, textAlign: 'center', fontFamily: THEME.mono, fontSize: 14, letterSpacing: '0.2em', color: '#8C8984', opacity: lab }}>ILLUSTRATION — SÉLECTION CRÉÉE POUR LA DÉMONSTRATION, NON ISSUE D’UNE PERSONNALISATION RÉELLE</div>
    </AbsoluteFill>
  );
};

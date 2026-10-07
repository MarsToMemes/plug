import React, { useContext, useMemo } from 'react';
import { AbsoluteFill, Easing, useCurrentFrame } from 'remotion';
import { CHAR, PAPER_WHITE } from './Charcoal';
import { rng } from './Engraving';
import { InFilm } from './film';

/**
 * Planche 03 — Combinatorics of a face, charcoal. A few features, more and more variants,
 * a grid of faces that keeps growing as the camera pulls back, a few look-alikes, and two
 * very similar faces among hundreds. No number anywhere: the point is the combinatorics.
 */
export const P3_DURATION = 940;
const T = { cols: 40, multiply: 110, combine: 236, toGrid: 330, grid: 372, zoomEnd: 600, pairs: 600, final: 724, caption: 830 };

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const hand = '"Caveat Brush", cursive';
const script = 'Caveat, cursive';

// ---------------------------------------------------------------- face model (120 x 150 box)
type Face = { shape: number; eyes: number; nose: number; jaw: number; cheeks: number; j: number[] };
type Stroke = { d: string; w: number; fill?: boolean; o?: number };
const SHAPES = [
  { w: 78, cw: 76, hC: 140 }, { w: 88, cw: 90, hC: 134 }, { w: 70, cw: 68, hC: 148 }, { w: 84, cw: 84, hC: 138 }, { w: 90, cw: 80, hC: 141 },
];
const JAWS = [{ jw: 46, chw: 14 }, { jw: 58, chw: 20 }, { jw: 72, chw: 26 }, { jw: 66, chw: 40 }, { jw: 50, chw: 6 }];
const CHEEKS = [{ dc: 0, line: 0 }, { dc: 8, line: 1 }, { dc: -6, line: 0 }, { dc: 4, line: 2 }];
const EYES = [
  { ew: 16, eh: 6, es: 30, tilt: 0, lid: false }, { ew: 14, eh: 9, es: 28, tilt: 0, lid: false }, { ew: 16, eh: 5, es: 30, tilt: 0, lid: true },
  { ew: 18, eh: 4, es: 30, tilt: -3, lid: false }, { ew: 15, eh: 6, es: 38, tilt: 1, lid: false },
];
const NOSES = [{ nl: 26, nw: 14, t: 0 }, { nl: 32, nw: 15, t: 1 }, { nl: 24, nw: 22, t: 0 }, { nl: 18, nw: 12, t: 2 }, { nl: 23, nw: 14, t: 3 }];
const f1 = (n: number) => n.toFixed(1);
const mx = (x: number) => 120 - x;

/** The strokes of a face, or of one of its features alone. */
function faceStrokes(f: Face, only?: 'shape' | 'eyes' | 'nose' | 'jaw' | 'cheeks'): Stroke[] {
  const [j0 = 0, j1 = 0, j2 = 0, j3 = 0, j4 = 0, j5 = 0] = f.j;
  const S = SHAPES[f.shape]!, J = JAWS[f.jaw]!, C = CHEEKS[f.cheeks]!, E = EYES[f.eyes]!, N = NOSES[f.nose]!;
  const w = S.w + j0 * 4, cw = S.cw + C.dc + j0 * 3, hC = S.hC + j1 * 4 + (f.jaw === 4 ? 5 : 0), jw = J.jw + j2 * 4, chw = J.chw;
  const out: Stroke[] = [];
  const side = (s: 1 | -1) => {
    const X = (x: number) => (s === 1 ? 60 + x : 60 - x);
    return `M60,12 C${f1(X(w * 0.5))},12 ${f1(X(w / 2))},28 ${f1(X(w / 2))},52 C${f1(X(w / 2))},72 ${f1(X(cw / 2))},80 ${f1(X(cw / 2))},92 C${f1(X(cw / 2))},104 ${f1(X(jw / 2))},108 ${f1(X(jw / 2))},117 C${f1(X(jw / 2))},128 ${f1(X(chw / 2 + 8))},${f1(hC - 3)} ${f1(X(chw / 2))},${f1(hC)} L60,${f1(hC)}`;
  };
  const upper = (s: 1 | -1) => {
    const X = (x: number) => (s === 1 ? 60 + x : 60 - x);
    return `M60,12 C${f1(X(w * 0.5))},12 ${f1(X(w / 2))},28 ${f1(X(w / 2))},52 C${f1(X(w / 2))},72 ${f1(X(cw / 2))},80 ${f1(X(cw / 2))},92`;
  };
  const lower = (s: 1 | -1) => {
    const X = (x: number) => (s === 1 ? 60 + x : 60 - x);
    return `M${f1(X(cw / 2))},96 C${f1(X(cw / 2))},104 ${f1(X(jw / 2))},108 ${f1(X(jw / 2))},117 C${f1(X(jw / 2))},128 ${f1(X(chw / 2 + 8))},${f1(hC - 3)} ${f1(X(chw / 2))},${f1(hC)} L60,${f1(hC)}`;
  };
  if (!only || only === 'shape') {
    out.push({ d: only ? side(1) : side(1), w: 2.4 }, { d: side(-1), w: 2.4 });
    out.push({ d: `M${f1(60 + w / 2)},56 C${f1(60 + w / 2 + 8)},52 ${f1(60 + w / 2 + 9)},74 ${f1(60 + w / 2 - 1)},78`, w: 1.8 });
    out.push({ d: `M${f1(60 - w / 2)},56 C${f1(60 - w / 2 - 8)},52 ${f1(60 - w / 2 - 9)},74 ${f1(60 - w / 2 + 1)},78`, w: 1.8 });
  }
  if (only === 'jaw') out.push({ d: lower(1), w: 2.6 }, { d: lower(-1), w: 2.6 }, { d: upper(1), w: 1.2, o: 0.25 }, { d: upper(-1), w: 1.2, o: 0.25 });
  if (only === 'cheeks') out.push({ d: side(1), w: 1.2, o: 0.25 }, { d: side(-1), w: 1.2, o: 0.25 });
  if (!only || only === 'cheeks') {
    const cx = cw / 2 - 6;
    if (C.line > 0 || only) {
      const len = C.line === 2 ? 28 : 20;
      for (const s of [1, -1] as const) out.push({ d: `M${f1(60 + s * cx)},${f1(82 + j3)} C${f1(60 + s * (cx - 6))},${f1(92 + j3)} ${f1(60 + s * (cx - len * 0.6))},${f1(96 + j3)} ${f1(60 + s * (cx - len))},${f1(97 + j3)}`, w: 1.5, o: only ? 1 : 0.8 });
    }
  }
  const ey = 62 + j3 * 2;
  if (!only || only === 'eyes') {
    const es = E.es + j4 * 2;
    for (const s of [1, -1] as const) {
      const ex = 60 + (s * es) / 2, a = E.ew / 2, t = E.tilt * s;
      const L = (x: number) => (s === 1 ? x : x);
      out.push({ d: `M${f1(L(ex - a))},${f1(ey - (s === -1 ? t : 0))} C${f1(ex - a / 2)},${f1(ey - E.eh)} ${f1(ex + a / 2)},${f1(ey - E.eh)} ${f1(ex + a)},${f1(ey - (s === 1 ? t : 0))} C${f1(ex + a / 2)},${f1(ey + E.eh * 0.8)} ${f1(ex - a / 2)},${f1(ey + E.eh * 0.8)} ${f1(ex - a)},${f1(ey - (s === -1 ? t : 0))}`, w: 1.6 });
      out.push({ d: `M${f1(ex - 1)},${f1(ey)} a${f1(E.eh * 0.5)},${f1(E.eh * 0.5)} 0 1,0 0.1,0`, w: 0, fill: true });
      if (E.lid) out.push({ d: `M${f1(ex - a - 1)},${f1(ey - 4)} C${f1(ex - a / 2)},${f1(ey - 10)} ${f1(ex + a / 2)},${f1(ey - 10)} ${f1(ex + a + 1)},${f1(ey - 3)}`, w: 1.8 });
      out.push({ d: `M${f1(ex - a - 3)},${f1(ey - 12 - (s === -1 ? t : 0))} Q${f1(ex)},${f1(ey - 17)} ${f1(ex + a + 3)},${f1(ey - 12 - (s === 1 ? t : 0))}`, w: 2.6 });
    }
  }
  if (!only || only === 'nose') {
    const nl = N.nl + j5 * 3, nw = N.nw, base = ey + 6 + nl;
    const hook = N.t === 1 ? 4 : N.t === 3 ? -3 : 0;
    out.push({ d: `M57,${f1(ey + 4)} C56,${f1(ey + nl * 0.4)} ${f1(55 - hook)},${f1(base - nl * 0.3)} ${f1(55 - hook / 2)},${f1(base - 5)}`, w: 1.4, o: 0.8 });
    out.push({ d: `M${f1(60 - nw / 2)},${f1(base - 4)} C${f1(60 - nw / 2 - 3)},${f1(base + 3)} 56,${f1(base + 4 - (N.t === 3 ? 2 : 0))} 60,${f1(base + 2 + hook / 2)} C64,${f1(base + 4 - (N.t === 3 ? 2 : 0))} ${f1(60 + nw / 2 + 3)},${f1(base + 3)} ${f1(60 + nw / 2)},${f1(base - 4)}`, w: 1.8 });
  }
  if (!only) {
    const nl = N.nl + j5 * 3, base = ey + 6 + nl;
    const my = base + (hC - base) * 0.42, mw = 14 + (jw - 46) * 0.25 + j1 * 2;
    out.push({ d: `M${f1(60 - mw)},${f1(my)} C${f1(60 - mw / 2)},${f1(my + 2)} ${f1(60 + mw / 2)},${f1(my + 2)} ${f1(60 + mw)},${f1(my)}`, w: 1.9 });
    out.push({ d: `M${f1(60 - mw * 0.55)},${f1(my + 6)} C58,${f1(my + 9)} 62,${f1(my + 9)} ${f1(60 + mw * 0.55)},${f1(my + 6)}`, w: 1.1, o: 0.6 });
  }
  return out;
}

function jitter(d: string, seed: number, amp: number) {
  const r = rng(seed);
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) =>
    `${(Number(x) + (r() - 0.5) * 2 * amp).toFixed(1)},${(Number(y) + (r() - 0.5) * 2 * amp).toFixed(1)}`);
}

const FaceArt: React.FC<{ f: Face; seed: number; boil: number; sw?: number; draw?: number; only?: Parameters<typeof faceStrokes>[1]; o?: number }> = ({ f, seed, boil, sw = 1, draw = 1, only, o = 1 }) => {
  const st = faceStrokes(f, only);
  return (
    <g opacity={o}>
      {st.map((s, i) => s.fill ? (
        <path key={i} d={s.d} fill={CHAR} stroke={CHAR} strokeWidth={2.5 * sw} opacity={draw >= 0.6 ? 1 : 0} />
      ) : (
        <path key={i} d={jitter(s.d, seed + i * 17 + boil * 101, 0.7)} fill="none" stroke={CHAR} strokeWidth={s.w * sw} opacity={s.o ?? 1}
          strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(draw * 1.3 - (i / st.length) * 0.3)} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- the grid
const COLS = 44, ROWS = 26, GX = 132, GY = 168;
const CENTER = { c: 22, r: 13 };
const BASE: Face = { shape: 0, eyes: 0, nose: 0, jaw: 1, cheeks: 1, j: [0, 0, 0, 0, 0, 0] };
// Look-alikes: a few pairs, and the final pair near the centre.
const PAIRS: Array<[[number, number], [number, number]]> = [[[9, 6], [11, 7]], [[33, 8], [34, 10]], [[14, 19], [16, 18]], [[30, 18], [31, 16]]];
const FINAL_PAIR: [[number, number], [number, number]] = [[20, 12], [23, 14]];
const GRID = (() => {
  const r = rng(2024);
  const faces: Face[][] = [];
  for (let c = 0; c < COLS; c++) {
    faces[c] = [];
    for (let rr = 0; rr < ROWS; rr++) {
      faces[c]![rr] = {
        shape: Math.floor(r() * 5), eyes: Math.floor(r() * 5), nose: Math.floor(r() * 5), jaw: Math.floor(r() * 5), cheeks: Math.floor(r() * 4),
        j: Array.from({ length: 6 }, () => (r() - 0.5) * 2),
      };
    }
  }
  faces[CENTER.c]![CENTER.r] = BASE;
  for (const [a, b] of [...PAIRS, FINAL_PAIR]) {
    const src = faces[a[0]]![a[1]]!;
    faces[b[0]]![b[1]] = { ...src, j: src.j.map((v, i) => v + (i === 1 ? 0.25 : i === 4 ? -0.2 : 0.08)) };
  }
  return faces;
})();
const world = (c: number, r: number) => ({ x: (c - CENTER.c) * GX, y: (r - CENTER.r) * GY });

export const Plate03: React.FC = () => {
  const frame = useCurrentFrame();
  const fq = Math.floor(frame / 2) * 2;
  const boil = Math.floor(frame / 2) % 3;
  const inFilm = useContext(InFilm);
  const endFade = inFilm ? 1 : 1 - seg(frame, P3_DURATION - 24, P3_DURATION);

  // ---- intro: columns of variants
  const cols = [
    { key: 'shape' as const, name: 'Forme', n: 5, make: (v: number): Face => ({ ...BASE, shape: v }) },
    { key: 'eyes' as const, name: 'Yeux', n: 5, make: (v: number): Face => ({ ...BASE, eyes: v }) },
    { key: 'nose' as const, name: 'Nez', n: 5, make: (v: number): Face => ({ ...BASE, nose: v }) },
    { key: 'jaw' as const, name: 'Mâchoire', n: 5, make: (v: number): Face => ({ ...BASE, jaw: v }) },
    { key: 'cheeks' as const, name: 'Pommettes', n: 4, make: (v: number): Face => ({ ...BASE, cheeks: v }) },
  ];
  const introOut = 1 - ease(seg(fq, T.toGrid, T.toGrid + 30));
  // While combining, each column picks a variant: the face on the right follows.
  const combining = fq >= T.combine && fq < T.toGrid;
  const pickR = rng(Math.floor(fq / 4) * 7 + 3);
  const picks = cols.map((c) => (combining ? Math.floor(pickR() * c.n) : 0));
  const combo: Face = combining
    ? { shape: picks[0]!, eyes: picks[1]!, nose: picks[2]!, jaw: picks[3]!, cheeks: picks[4]!, j: [0, 0, 0, 0, 0, 0] }
    : BASE;

  // ---- camera over the grid (world origin = centre face)
  const zoomOut = ease(seg(fq, T.grid, T.zoomEnd));
  const toPair = ease(seg(fq, T.final, T.final + 90));
  const pa = world(...FINAL_PAIR[0]), pb = world(...FINAL_PAIR[1]);
  const pairC = { x: (pa.x + pb.x) / 2 + 60, y: (pa.y + pb.y) / 2 + 75 };
  // Scale: 3.2 (one face fills the frame) -> 0.34 (the whole grid) -> 0.6 (hundreds, the pair at the centre).
  const scale = Math.exp(lerp(lerp(Math.log(3.2), Math.log(0.34), zoomOut), Math.log(0.6), toPair));
  const camX = lerp(60, pairC.x, toPair), camY = lerp(75, pairC.y, toPair);
  const sw = 1 / Math.sqrt(Math.max(scale, 0.3)) * (scale > 1.5 ? 1.3 : 1);
  const vis = { x0: camX - 960 / scale - GX, x1: camX + 960 / scale + GX, y0: camY - 540 / scale - GY, y1: camY + 540 / scale + GY };
  const gridOn = fq >= T.toGrid + 20;
  const dimOthers = seg(fq, T.final + 40, T.final + 90);

  // Composite face: right of the columns, then it becomes the centre of the grid.
  const toG = ease(seg(fq, T.toGrid, T.grid));
  const compX = lerp(1640, 960, toG), compY = lerp(560, 540, toG), compS = lerp(2.6, 3.2, toG);

  return (
    <AbsoluteFill style={{ background: PAPER_WHITE }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="p3ch" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={3} seed={boil * 7 + 1} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.7" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves={2} seed={boil * 7 + 3} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={3.5} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" result="g" />
            <feGaussianBlur in="d" stdDeviation={2.2} result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.34 0" result="halo" />
            <feMerge><feMergeNode in="halo" /><feMergeNode in="g" /></feMerge>
          </filter>
          <filter id="tooth3"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} /><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.11 0" /></filter>
          <filter id="ch-text3" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} seed={boil + 40} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.95" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={boil + 44} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={3} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" result="g" />
            <feGaussianBlur in="d" stdDeviation={1.6} result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0" result="halo" />
            <feMerge><feMergeNode in="halo" /><feMergeNode in="g" /></feMerge>
          </filter>
        </defs>
        <rect width="1920" height="1080" filter="url(#tooth3)" />
        {(() => {
          const r = rng(91 + boil * 31);
          return Array.from({ length: 60 }, (_, i) => <circle key={i} cx={r() * 1920} cy={r() * 1080} r={0.4 + r() * 1.4} fill={CHAR} opacity={0.15 + r() * 0.35} />);
        })()}

        <g opacity={endFade} filter="url(#p3ch)">
          {/* Columns of variants. */}
          {introOut > 0 && (
            <g opacity={introOut}>
              {cols.map((c, ci) => {
                const x = 170 + ci * 232;
                return Array.from({ length: c.n }, (_, v) => {
                  const t0 = v === 0 ? T.cols + ci * 8 : T.multiply + (v - 1) * 22 + ci * 5;
                  const d = seg(fq, t0, t0 + 18);
                  if (d <= 0) return null;
                  const y = 210 + v * 165;
                  const sel = combining && picks[ci] === v;
                  return (
                    <g key={`${ci}-${v}`} transform={`translate(${x},${y}) scale(1.05)`}>
                      {/* Eyes and nose are small: shown enlarged in their cell. */}
                      <g transform={c.key === 'eyes' ? 'translate(60,78) scale(2.1) translate(-60,-62)' : c.key === 'nose' ? 'translate(60,78) scale(2.1) translate(-60,-84)' : ''}>
                        <FaceArt f={c.make(v)} only={c.key} seed={ci * 100 + v * 7} boil={boil} draw={d} sw={c.key === 'eyes' || c.key === 'nose' ? 0.6 : 1.1} />
                      </g>
                      {sel && <ellipse cx={60} cy={78} rx={74} ry={82} fill="none" stroke={CHAR} strokeWidth={2.6} opacity={0.85} />}
                    </g>
                  );
                });
              })}
            </g>
          )}

          {/* The composite face: one combination, then the centre of the grid. */}
          {fq >= T.cols + 20 && !gridOn && (
            <g transform={`translate(${compX - 60 * compS},${compY - 75 * compS}) scale(${compS})`}>
              <FaceArt f={combo} seed={5} boil={boil} draw={seg(fq, T.cols + 20, T.cols + 56)} sw={0.75} />
            </g>
          )}

          {/* The grid of faces, the camera pulling back. */}
          {gridOn && (
            <g transform={`translate(960,540) scale(${scale}) translate(${-camX},${-camY})`}>
              {GRID.map((col, c) => col.map((f, r) => {
                const p = world(c, r);
                if (p.x < vis.x0 || p.x > vis.x1 || p.y < vis.y0 || p.y > vis.y1) return null;
                const dist = Math.hypot(c - CENTER.c, (r - CENTER.r) * 1.3);
                const appear = c === CENTER.c && r === CENTER.r ? 1 : seg(fq, T.grid + dist * 9, T.grid + dist * 9 + 10);
                if (appear <= 0) return null;
                const isPair = FINAL_PAIR.some(([pc, pr]) => pc === c && pr === r);
                return (
                  <g key={`${c}-${r}`} transform={`translate(${p.x},${p.y})`}>
                    <FaceArt f={f} seed={c * 131 + r * 17} boil={boil} draw={appear} sw={sw} o={isPair ? 1 : 1 - dimOthers * 0.55} />
                  </g>
                );
              }))}
              {/* Look-alikes, circled in charcoal as they show up. */}
              {PAIRS.map(([a, b], i) => {
                const t0 = T.pairs + i * 22;
                const o = seg(fq, t0, t0 + 10) * (1 - seg(fq, T.final, T.final + 30));
                if (o <= 0) return null;
                const A = world(...a), B = world(...b);
                return (
                  <g key={i} opacity={o}>
                    {[A, B].map((P, k) => <ellipse key={k} cx={P.x + 60} cy={P.y + 76} rx={68} ry={84} fill="none" stroke={CHAR} strokeWidth={4 * sw} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - seg(fq, t0 + k * 4, t0 + k * 4 + 10)} />)}
                    <path d={`M${A.x + 60},${A.y + 160} Q${(A.x + B.x) / 2 + 60},${Math.max(A.y, B.y) + 220} ${B.x + 60},${B.y + 160}`} fill="none" stroke={CHAR} strokeWidth={2.5 * sw} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - seg(fq, t0 + 10, t0 + 20)} />
                  </g>
                );
              })}
              {/* The final pair. */}
              {fq >= T.final + 50 && [pa, pb].map((P, k) => (
                <ellipse key={k} cx={P.x + 60} cy={P.y + 76} rx={70} ry={86} fill="none" stroke={CHAR} strokeWidth={4.5 * sw}
                  pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - seg(fq, T.final + 50 + k * 8, T.final + 66 + k * 8)} />
              ))}
            </g>
          )}
        </g>
      </svg>

      <AbsoluteFill style={{ opacity: endFade }}>
        {/* Column titles and the × between them. */}
        <div style={{ opacity: introOut }}>
          {cols.map((c, ci) => (
            <React.Fragment key={c.key}>
              <Rub t={(fq - T.cols - ci * 8) / 16} style={{ position: 'absolute', left: 170 + ci * 232 - 40, top: 140, width: 210, textAlign: 'center', fontFamily: hand, fontSize: 40, color: CHAR }}>{c.name}</Rub>
              {ci < 4 && <Rub t={(fq - T.multiply - 40 - ci * 6) / 14} style={{ position: 'absolute', left: 170 + ci * 232 + 160, top: 520, fontFamily: hand, fontSize: 64, color: CHAR, opacity: 0.55 }}>×</Rub>}
            </React.Fragment>
          ))}
          <Rub t={(fq - T.combine) / 16} style={{ position: 'absolute', left: 1330, top: 520, fontFamily: hand, fontSize: 64, color: CHAR, opacity: 0.55 }}>=</Rub>
        </div>
        <Caption show={[6, T.multiply - 6]} fq={fq} text="Quelques caractéristiques simples" />
        <Caption show={[T.multiply, T.combine - 4]} fq={fq} text="chacune existe sous de nombreuses formes" />
        <Caption show={[T.combine, T.toGrid]} fq={fq} text="chaque combinaison donne un autre visage" />
        <Caption show={[T.grid + 60, T.pairs - 8]} fq={fq} text="et les combinaisons se multiplient" />
        <Caption show={[T.pairs + 10, T.final + 20]} fq={fq} text="certaines finissent par se ressembler" />
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 950, textAlign: 'center' }}>
          <Rub t={(fq - T.caption) / 40} style={{ fontFamily: hand, fontSize: 56, color: CHAR, display: 'inline-block', background: `rgba(245,243,238,0.85)`, padding: '0 24px', boxShadow: '0 0 30px 20px rgba(245,243,238,0.85)' }}>
            D’innombrables combinaisons… et pourtant, des visages qui se ressemblent.
          </Rub>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Rub: React.FC<{ t: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, children, style }) => {
  const e = clamp(t) * 120 - 10;
  const mask = `linear-gradient(100deg, #000 ${e - 8}%, rgba(0,0,0,0.35) ${e}%, transparent ${e + 6}%)`;
  return <div style={{ ...style, WebkitMaskImage: mask, maskImage: mask, filter: 'url(#ch-text3)' }}>{children}</div>;
};

const Caption: React.FC<{ show: [number, number]; fq: number; text: string }> = ({ show, fq, text }) => {
  const [a, b] = show;
  if (fq < a || fq > b + 10) return null;
  return (
    <div style={{ position: 'absolute', left: 0, width: 1920, top: 40, textAlign: 'center', opacity: 1 - seg(fq, b, b + 10) }}>
      <Rub t={(fq - a) / 20} style={{ display: 'inline-block', fontFamily: hand, fontSize: 52, color: CHAR, background: 'rgba(245,243,238,0.85)', padding: '0 24px', boxShadow: '0 0 30px 20px rgba(245,243,238,0.85)' }}>{text}</Rub>
    </div>
  );
};

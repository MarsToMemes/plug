import React, { useMemo } from 'react';
import { getBoundingBox, getLength, getPointAtLength } from '@remotion/paths';
import { GRAPHITE, INK, SEPIA, SIL_PATHS, type LayerDef, type Tone } from './face';

/** Small seeded PRNG: the same drawing every render. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** The same path, redrawn by hand: every point a little off. */
function jitter(d: string, seed: number, amp: number) {
  const r = rng(seed);
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) =>
    `${(Number(x) + (r() - 0.5) * 2 * amp).toFixed(1)},${(Number(y) + (r() - 0.5) * 2 * amp).toFixed(1)}`);
}

type Seg = { x1: number; y1: number; x2: number; y2: number; cx: number; cy: number; w: number; o: number; k: number };

/** Pen hatching: quick, slightly curved strokes, uneven angle and weight; k = 0..1 across. */
function hatchLines(t: Tone, angle: number, gap: number, seed: number): Seg[] {
  const b = getBoundingBox(t.d);
  const cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
  const R = Math.hypot(b.x2 - b.x1, b.y2 - b.y1) / 2 + 4;
  const r = rng(seed);
  const out: Seg[] = [];
  const nx = -Math.sin((angle * Math.PI) / 180), ny = Math.cos((angle * Math.PI) / 180);
  for (let off = -R; off <= R; off += gap * (0.75 + r() * 0.5)) {
    const a = ((angle + (r() - 0.5) * 7) * Math.PI) / 180;
    const ux = Math.cos(a), uy = Math.sin(a);
    let s = -R + r() * 14;
    while (s < R) {
      const len = 18 + r() * 60;
      const e = Math.min(R, s + len);
      const x1 = cx + nx * off + ux * s, y1 = cy + ny * off + uy * s;
      const x2 = cx + nx * off + ux * e, y2 = cy + ny * off + uy * e;
      const bow = (r() - 0.5) * 3.5;
      out.push({
        x1, y1, x2, y2, cx: (x1 + x2) / 2 + nx * bow, cy: (y1 + y2) / 2 + ny * bow,
        w: (t.w ?? 0.85) * (0.55 + r() * 0.8), o: 0.55 + r() * 0.45, k: (off + R) / (2 * R),
      });
      s = e + 1 + r() * 5;
    }
  }
  return out;
}

const BOIL = 3; // drawings in the boil cycle

/**
 * One layer of the drawing. `p` (0..1) sketches it on fast: contours, then hatching
 * swept across, fills last. `boil` picks one of three redrawn versions (line boil).
 */
export const LayerArt: React.FC<{ def: LayerDef; p: number; boil: number }> = ({ def, p, boil }) => {
  const variants = useMemo(() => {
    // Keep only what is really inside the region (and the head): no stroke drawn outside.
    const ctx = document.createElement('canvas').getContext('2d')!;
    const sil = SIL_PATHS().map((d) => new Path2D(d));
    const trim = (t: Tone, lines: Seg[]) => {
      const reg = new Path2D(t.d);
      const inside = (x: number, y: number) => ctx.isPointInPath(reg, x, y) && sil.some((sp) => ctx.isPointInPath(sp, x, y));
      const out: Seg[] = [];
      for (const l of lines) {
        const N = 14;
        let best: [number, number] | null = null, run: number | null = null;
        for (let i = 0; i <= N; i++) {
          const f = i / N;
          const ok = inside(l.x1 + (l.x2 - l.x1) * f, l.y1 + (l.y2 - l.y1) * f);
          if (ok && run === null) run = f;
          if ((!ok || i === N) && run !== null) {
            const end = ok ? f : (i - 1) / N;
            if (!best || end - run > best[1] - best[0]) best = [run, end];
            run = null;
          }
        }
        if (!best || best[1] - best[0] < 0.08) continue;
        const [f0, f1] = best;
        const x1 = l.x1 + (l.x2 - l.x1) * f0, y1 = l.y1 + (l.y2 - l.y1) * f0;
        const x2 = l.x1 + (l.x2 - l.x1) * f1, y2 = l.y1 + (l.y2 - l.y1) * f1;
        const bx = l.cx - (l.x1 + l.x2) / 2, by = l.cy - (l.y1 + l.y2) / 2;
        out.push({ ...l, x1, y1, x2, y2, cx: (x1 + x2) / 2 + bx * (f1 - f0), cy: (y1 + y2) / 2 + by * (f1 - f0) });
      }
      return out;
    };
    return Array.from({ length: BOIL }, (_, v) =>
      (def.tones ?? []).map((t, i) => {
        const seed = hash(def.id) + i * 101 + v * 7919;
        const base = hatchLines(t, t.angle, t.gap, seed);
        const cross = t.cross !== undefined ? hatchLines(t, t.cross, t.crossGap ?? t.gap, seed + 31) : [];
        return { t, lines: trim(t, [...base, ...cross.map((c) => ({ ...c, o: c.o * 0.85 }))]) };
      }));
  }, [def]);
  const bristles = useMemo(() => {
    if (!def.bristles) return [];
    return Array.from({ length: BOIL }, (_, v) => {
      const r = rng(hash('hair') + v * 13);
      return Array.from({ length: 170 }, (_, i) => {
        const x = 204 + (i / 169) * 192 + (r() - 0.5) * 2.4;
        const arc = Math.sin(((x - 204) / 192) * Math.PI);
        const base = 186 - arc * 12 + r() * 4;
        const top = 132 - arc * 14 - r() * 12;
        return { x1: x, y1: base, x2: x + (r() - 0.5) * 5, y2: top, w: 0.6 + r() * 1.1, k: i / 169 };
      });
    });
  }, [def]);

  // The hand: contours one after the other at a steady speed, then hatching stroke by stroke.
  const lens = useMemo(() => def.strokes.map((st) => getLength(st.d)), [def]);
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  const cum = lens.reduce<number[]>((acc, l, i) => [...acc, (acc[i] ?? 0) + l], [0]);
  const contour = clamp(p / 0.52) * total;
  const id = def.id;
  const tones = variants[boil % BOIL]!;
  // Hatching laid in one sequence, region after region, across each region.
  const flat = tones.flatMap(({ t, lines }, ti) => [...lines].sort((a, b) => a.k - b.k).map((l) => ({ ...l, ti, o: l.o * (t.o ?? 1) })));
  const hair = bristles[boil % BOIL] ?? [];
  const nHatch = flat.length + hair.length;
  const hp = clamp((p - 0.5) / 0.44) * (nHatch + 2);
  const fillP = clamp((p - 0.6) / 0.3);

  // Where the pen is.
  let pen: { x: number; y: number } | null = null;
  if (p > 0 && p < 1) {
    if (contour < total && def.strokes.length) {
      const i = Math.max(0, cum.findIndex((c, k) => k > 0 && c >= contour) - 1);
      const st = def.strokes[i]!;
      pen = getPointAtLength(st.d, Math.min(lens[i]!, Math.max(0, contour - cum[i]!)));
    } else if (nHatch && hp < nHatch) {
      const j = Math.min(nHatch - 1, Math.floor(hp));
      const f = hp - j;
      if (j < flat.length) { const l = flat[j]!; pen = { x: l.x1 + (l.x2 - l.x1) * f, y: l.y1 + (l.y2 - l.y1) * f }; }
      else { const b = hair[j - flat.length]!; pen = { x: b.x1 + (b.x2 - b.x1) * f, y: b.y1 + (b.y2 - b.y1) * f }; }
    }
  }

  return (
    <svg viewBox="0 0 600 800" width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', inset: 0 }}>
      <defs>
        <clipPath id={`sil-${id}`}>{SIL_PATHS().map((d, i) => <path key={i} d={d} />)}</clipPath>
        {tones.map(({ t }, i) => (
          <clipPath id={`clip-${id}-${i}`} key={i}><path d={t.d} /></clipPath>
        ))}
        <clipPath id={`eyeclip-${id}-0`}><path d="M234,402 C246,390 276,388 290,400 C276,412 248,414 234,402 Z" /></clipPath>
        <clipPath id={`eyeclip-${id}-1`}><path d="M366,402 C354,390 324,388 310,400 C324,412 352,414 366,402 Z" /></clipPath>
      </defs>
      {(def.fills ?? []).map((f, i) => (
        <path key={i} d={jitter(f.d, boil * 17 + i, 0.6)} fill={f.fill} opacity={(f.o ?? 1) * clamp(p / 0.2)} />
      ))}
      <g>
        {flat.map((l, j) => {
          const o = clamp(hp - j);
          return o > 0 ? (
            <path key={j} d={`M${l.x1.toFixed(1)},${l.y1.toFixed(1)} Q${l.cx.toFixed(1)},${l.cy.toFixed(1)} ${l.x2.toFixed(1)},${l.y2.toFixed(1)}`}
              fill="none" stroke={INK} strokeWidth={l.w} strokeLinecap="round" opacity={l.o} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - o} />
          ) : null;
        })}
      </g>
      {hair.map((b, j) => {
        const o = clamp(hp - flat.length - j);
        return o > 0 ? <line key={j} x1={b.x1} y1={b.y1} x2={b.x1 + (b.x2 - b.x1) * o} y2={b.y1 + (b.y2 - b.y1) * o} stroke={INK} strokeWidth={b.w} strokeLinecap="round" /> : null;
      })}
      {id === 'eyes' &&
        [270, 352].map((x, i) => (
          <g key={i} opacity={fillP} clipPath={`url(#eyeclip-${id}-${i})`}>
            <circle cx={x} cy={405} r={9.5} fill="none" stroke={INK} strokeWidth={1.2} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
              const a = (k / 8) * Math.PI * 2 + boil;
              return <line key={k} x1={x + Math.cos(a) * 4.6} y1={405 + Math.sin(a) * 4.6} x2={x + Math.cos(a) * 9} y2={405 + Math.sin(a) * 9} stroke={INK} strokeWidth={0.7} />;
            })}
            <circle cx={x} cy={405} r={4.6} fill={INK} />
            <circle cx={x + 3} cy={401} r={1.7} fill="#f3ead6" />
          </g>
        ))}
      {def.strokes.map((st, i) => {
        const local = clamp((contour - cum[i]!) / lens[i]!);
        if (local <= 0) return null;
        const color = st.color === 'sepia' ? SEPIA : st.color === 'graphite' ? GRAPHITE : INK;
        const passes = st.w >= 1.5 ? 3 : 2;
        return (
          <g key={i} opacity={st.o ?? 1}>
            {Array.from({ length: passes }, (_, k) => (
              <path key={k} d={jitter(st.d, hash(id) + i * 53 + k * 997 + boil * 7, 0.5 + k * 1.1)} fill="none" stroke={color}
                strokeWidth={st.w * [1, 0.55, 0.35][k]!} opacity={[1, 0.75, 0.5][k]} strokeLinecap="round" strokeLinejoin="round"
                pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(local * 1.08 - k * 0.04)} />
            ))}
          </g>
        );
      })}
      {(def.topFills ?? []).map((f, i) => (
        <path key={i} d={jitter(f.d, boil * 23 + i, 0.7)} fill={f.fill} opacity={(f.o ?? 1) * fillP} />
      ))}
      {pen && <Pen x={pen.x} y={pen.y} />}
    </svg>
  );
};

/** A dip pen: the nib on the paper, the holder going up to the right. */
const Pen: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y}) rotate(-38)`}>
    <ellipse cx={0} cy={6} rx={3} ry={1.6} fill="rgba(40,25,10,0.18)" />
    <path d="M0,0 L-3.2,-16 L3.2,-16 Z" fill="#6b6257" />
    <path d="M0,-2 L0,-13" stroke="#2a251f" strokeWidth={0.6} />
    <rect x={-4} y={-28} width={8} height={12} rx={1.5} fill="#2a251f" />
    <rect x={-3.4} y={-120} width={6.8} height={93} rx={3} fill="#3b2a1e" />
    <rect x={-1.2} y={-118} width={1.4} height={88} rx={0.7} fill="rgba(255,240,220,0.25)" />
  </g>
);

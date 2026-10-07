import React, { useMemo } from 'react';
import { getBoundingBox, getLength } from '@remotion/paths';
import { SIL_PATHS, type LayerDef, type Tone } from './face';
import { rng } from './Engraving';

/**
 * Charcoal on paper, animated on twos: grainy, gestural lines that boil, smudged masses
 * rubbed in across the form, a few coarse dry strokes on top. One drawing per frame pair.
 */
export const CHAR = '#161514';
export const PAPER_WHITE = '#f5f3ee';

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const clamp = (v: number) => Math.min(1, Math.max(0, v));

function jitter(d: string, seed: number, amp: number) {
  const r = rng(seed);
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) =>
    `${(Number(x) + (r() - 0.5) * 2 * amp).toFixed(1)},${(Number(y) + (r() - 0.5) * 2 * amp).toFixed(1)}`);
}

type Seg = { x1: number; y1: number; x2: number; y2: number; w: number; o: number };

/** Coarse dry strokes across a region, trimmed to what is inside it (and the head). */
function dryStrokes(t: Tone, seed: number, ctx: CanvasRenderingContext2D, sil: Path2D[]): Seg[] {
  const b = getBoundingBox(t.d);
  const cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
  const R = Math.hypot(b.x2 - b.x1, b.y2 - b.y1) / 2;
  const a = (t.angle * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const reg = new Path2D(t.d);
  const inside = (x: number, y: number) => ctx.isPointInPath(reg, x, y) && sil.some((s) => ctx.isPointInPath(s, x, y));
  const r = rng(seed);
  const out: Seg[] = [];
  for (let off = -R; off <= R; off += t.gap * (2.2 + r() * 1.4)) {
    let s = -R;
    while (s < R) {
      const e = Math.min(R, s + 16 + r() * 40);
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= 8; i++) {
        const f = s + ((e - s) * i) / 8;
        const x = cx + nx * off + ux * f, y = cy + ny * off + uy * f;
        if (inside(x, y)) pts.push([x, y]);
      }
      if (pts.length >= 3 && r() < 0.75) {
        const [x1, y1] = pts[0]!, [x2, y2] = pts[pts.length - 1]!;
        out.push({ x1, y1, x2, y2, w: 1.4 + r() * 1.6, o: 0.45 + r() * 0.4 });
      }
      s = e + 3 + r() * 10;
    }
  }
  return out;
}

export const CharcoalArt: React.FC<{ def: LayerDef; p: number; boil: number }> = ({ def, p, boil }) => {
  const id = def.id;
  const data = useMemo(() => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    const sil = SIL_PATHS().map((d) => new Path2D(d));
    return (def.tones ?? []).map((t, i) => {
      const b = getBoundingBox(t.d);
      return { t, b, dry: [0, 1, 2].map((v) => dryStrokes(t, hash(id) + i * 97 + v * 4241, ctx, sil)) };
    });
  }, [def, id]);
  const lens = useMemo(() => def.strokes.map((st) => getLength(st.d)), [def]);
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  const cum = lens.reduce<number[]>((acc, l, i) => [...acc, (acc[i] ?? 0) + l], [0]);
  const contour = clamp(p / 0.5) * total;
  const toneAll = clamp((p - 0.42) / 0.5);
  const fillP = clamp((p - 0.55) / 0.3);
  const seed = (hash(id) % 50) + boil * 11;

  return (
    <svg viewBox="0 0 600 800" width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', inset: 0 }}>
      <defs>
        {/* Charcoal line: wobble, grain eating into it, a soft dusty halo. Seed changes on twos (boil). */}
        <filter id={`ch-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={3} seed={seed} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.85" result="grain" />
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={seed + 3} result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale={4.5} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feComposite in="d" in2="grain" operator="in" result="g" />
          <feGaussianBlur in="d" stdDeviation={3.2} result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.38 0" result="halo" />
          <feMerge><feMergeNode in="halo" /><feMergeNode in="g" /></feMerge>
        </filter>
        {/* Smudge: rubbed charcoal, soft and grainy. */}
        <filter id={`sm-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={seed + 7} result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale={18} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={8} result="b" />
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={seed + 9} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -0.15" result="grain" />
          <feComposite in="b" in2="grain" operator="in" />
        </filter>
        {data.map(({ t, b }, i) => {
          // Rubbed in across the region, along its stroke direction.
          const local = clamp(toneAll * data.length - i);
          const a = ((t.angle + 90) * Math.PI) / 180;
          const cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2, R = Math.hypot(b.x2 - b.x1, b.y2 - b.y1) / 2;
          return (
            <linearGradient key={i} id={`rub-${id}-${i}`} gradientUnits="userSpaceOnUse"
              x1={cx - Math.cos(a) * R} y1={cy - Math.sin(a) * R} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R}>
              <stop offset={Math.max(0, local - 0.15)} stopColor="#fff" />
              <stop offset={local} stopColor="#000" />
            </linearGradient>
          );
        })}
        {data.map(({ b }, i) => (
          <mask key={i} id={`rm-${id}-${i}`} maskUnits="userSpaceOnUse" x={b.x1 - 60} y={b.y1 - 60} width={b.x2 - b.x1 + 120} height={b.y2 - b.y1 + 120}>
            <rect x={b.x1 - 60} y={b.y1 - 60} width={b.x2 - b.x1 + 120} height={b.y2 - b.y1 + 120} fill={`url(#rub-${id}-${i})`} />
          </mask>
        ))}
        <clipPath id={`sil-${id}`}>{SIL_PATHS().map((d, i) => <path key={i} d={d} />)}</clipPath>
        <clipPath id={`eye-${id}-0`}><path d="M234,402 C246,390 276,388 290,400 C276,412 248,414 234,402 Z" /></clipPath>
        <clipPath id={`eye-${id}-1`}><path d="M366,402 C354,390 324,388 310,400 C324,412 352,414 366,402 Z" /></clipPath>
      </defs>

      {(def.fills ?? []).map((f, i) => (
        f.fill.startsWith('#f')
          ? <path key={i} d={f.d} fill={PAPER_WHITE} opacity={(f.o ?? 1) * clamp(p / 0.15)} />
          : <g key={i} opacity={clamp((p - 0.3) / 0.4)}>
              <path d={f.d} fill={CHAR} opacity={0.35} filter={`url(#sm-${id})`} transform="translate(300 160) scale(0.94) translate(-300 -160)" />
              <path d={jitter(f.d, boil * 5 + i, 1.5)} fill={CHAR} opacity={0.9} filter={`url(#ch-${id})`} />
            </g>
      ))}

      {/* Rubbed masses, then coarse dry strokes over them. */}
      <g clipPath={`url(#sil-${id})`}>
        {data.map(({ t, dry }, i) => {
          const local = clamp(toneAll * data.length - i);
          if (local <= 0) return null;
          const dark = (t.cross !== undefined ? 0.75 : 0.52) * (t.o ?? 1);
          const strokes = dry[boil % 3]!;
          return (
            <g key={i} mask={`url(#rm-${id}-${i})`}>
              <path d={t.d} fill={CHAR} opacity={dark} filter={`url(#sm-${id})`} />
              <g filter={`url(#ch-${id})`}>
                {strokes.map((s, j) => (j / strokes.length < local * 1.1 ? (
                  <line key={j} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={CHAR} strokeWidth={s.w} strokeLinecap="round" opacity={s.o * (t.o ?? 1)} />
                ) : null))}
              </g>
            </g>
          );
        })}
      </g>

      {def.bristles && (
        <g filter={`url(#ch-${id})`}>
          {Array.from({ length: 90 }, (_, i) => {
            const r = rng(hash('hair') + i * 7 + boil * 1013);
            const x = 204 + (i / 89) * 192 + (r() - 0.5) * 4;
            const arc = Math.sin(((x - 204) / 192) * Math.PI);
            const o = clamp(toneAll * 1.2 - i / 89);
            const base = 188 - arc * 12, top = 130 - arc * 14 - r() * 14;
            return o > 0 ? <line key={i} x1={x} y1={base} x2={x + (r() - 0.5) * 7} y2={base + (top - base) * o} stroke={CHAR} strokeWidth={2.4 + r() * 3} strokeLinecap="round" /> : null;
          })}
        </g>
      )}

      {id === 'eyes' && [270, 352].map((x, i) => (
        <g key={i} opacity={fillP} clipPath={`url(#eye-${id}-${i})`} filter={`url(#ch-${id})`}>
          <circle cx={x} cy={405} r={9} fill="#5b544c" />
          <circle cx={x} cy={405} r={5} fill={CHAR} />
        </g>
      ))}

      <g filter={`url(#ch-${id})`}>
        {def.strokes.map((st, i) => {
          const local = clamp((contour - cum[i]!) / lens[i]!);
          if (local <= 0) return null;
          const col = st.color === 'graphite' ? '#7d7a74' : st.color === 'sepia' ? '#5e5a55' : CHAR;
          const w = st.color === 'graphite' ? st.w * 1.4 : st.w * 2.3;
          return (
            <g key={i} opacity={st.o ?? 1}>
              <path d={jitter(st.d, hash(id) + i * 53 + boil * 7, 1.2)} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
                pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - local} />
              <path d={jitter(st.d, hash(id) + i * 59 + boil * 13 + 500, 2.6)} fill="none" stroke={col} strokeWidth={w * 0.45} opacity={0.6} strokeLinecap="round"
                pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(local * 1.1 - 0.05)} />
            </g>
          );
        })}
      </g>

      <g filter={`url(#ch-${id})`}>
        {(def.topFills ?? []).map((f, i) => (
          <path key={i} d={jitter(f.d, boil * 23 + i, 1.2)} fill={CHAR} opacity={(f.o ?? 1) * fillP} />
        ))}
      </g>
      {id === 'eyes' && [270, 352].map((x, i) => (
        <circle key={i} cx={x + 3} cy={401} r={1.8} fill={PAPER_WHITE} opacity={fillP} />
      ))}
    </svg>
  );
};

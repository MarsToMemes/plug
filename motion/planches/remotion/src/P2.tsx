import React, { useContext, useMemo } from 'react';
import { AbsoluteFill, Easing, staticFile, useCurrentFrame } from 'remotion';
import { getLength } from '@remotion/paths';
import { CHAR, PAPER_WHITE } from './Charcoal';
import { rng } from './Engraving';
import { InFilm } from './film';
import strokesData from './p2strokes.json';

/**
 * Planche 02 — From genetic variation to a face. Charcoal on paper, on twos.
 * Scientific caution: hundreds of variants spread over the whole genome, each with a small
 * effect; development (and environment, chance) turns them into a face. No gene -> trait arrows.
 */
export const P2_DURATION = 1140;
const T = {
  genes: 50, ticks: 120, converge: 262, dev: 330, cells: 336, prominences: 420, fuse: 470,
  skull: 548, tissue: 700, skin: 836, detail: 872, hair: 930, final: 1010,
};
const PX = 540, PY = 196; // portrait plate (840 x 864, crop coordinates)
const CX = 438; // face midline in the plate

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const hand = '"Caveat Brush", cursive';
const script = 'Caveat, cursive';

function jitter(d: string, seed: number, amp: number) {
  const r = rng(seed);
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) =>
    `${(Number(x) + (r() - 0.5) * 2 * amp).toFixed(1)},${(Number(y) + (r() - 0.5) * 2 * amp).toFixed(1)}`);
}
const mir = (d: string) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(2 * CX - Number(x)).toFixed(1)},${y}`);
const both = (d: string) => [d, mir(d)];

// ---- The skull, front view, fitted on the portrait (eyes 340/538 at y 352, nose 470, mouth 568, chin 655).
const SKULL: Array<[string, number]> = [
  ['M240,332 C222,196 300,26 438,22 C576,26 654,196 636,332', 3.2],
  ...both('M240,332 C232,372 226,404 240,428 C252,446 272,452 292,454').map((d): [string, number] => [d, 2.6]),
  ...both('M282,312 C306,296 368,294 396,312 C410,336 408,382 392,400 C366,414 310,414 286,398 C270,378 268,334 282,312 Z').map((d): [string, number] => [d, 2.6]),
  ...both('M276,300 C310,284 372,282 404,300').map((d): [string, number] => [d, 2.2]),
  ['M426,330 C424,360 424,392 428,418 M450,330 C452,360 452,392 448,418', 1.8],
  ['M438,420 C418,428 402,470 412,492 C420,502 430,500 438,496 C446,500 456,502 464,492 C474,470 458,428 438,420 Z', 2.6],
  ...both('M262,470 C258,520 260,560 270,584 C300,628 360,656 438,662').map((d): [string, number] => [d, 3]),
  ['M376,536 C404,530 472,530 500,536 C500,548 498,560 494,568 C470,572 406,572 382,568 C378,560 376,548 376,536 Z', 2],
  ['M382,568 C406,574 470,574 494,568 C492,580 488,588 480,594 C460,598 416,598 396,594 C388,588 384,580 382,568 Z', 2],
  ...[392, 408, 424, 438, 452, 468, 484].map((x): [string, number] => [`M${x},${537} L${x + (x < CX ? -1 : 1)},${569} M${x},${570} L${x},${595}`, 1.2]),
  ...both('M300,236 C290,270 288,290 292,306').map((d): [string, number] => [d, 1.2]),
  ['M410,636 C424,648 452,648 466,636', 1.6],
];

// ---- Muscles (schematic, fitted on the same landmarks): masses and fibres.
const MUSCLES: string[] = [
  ...both('M244,330 C236,260 266,196 330,170 C320,230 300,290 290,330 C276,346 256,348 244,330 Z'), // temporalis
  ...both('M246,436 C262,430 286,434 300,446 C306,500 300,550 290,582 C276,586 266,584 262,574 C254,530 246,480 246,436 Z'), // masseter
  ...both('M338,300 C392,298 418,330 414,360 C410,398 380,420 338,420 C292,420 262,396 264,358 C266,320 296,302 338,300 Z'), // orbicularis oculi
  'M438,526 C486,526 520,548 520,570 C520,594 486,612 438,612 C390,612 356,594 356,570 C356,548 390,526 438,526 Z', // orbicularis oris
  ...both('M292,452 C320,478 346,512 368,552 L360,560 C336,520 310,486 284,462 Z'), // zygomaticus major
  'M300,120 C350,104 526,104 576,120 C580,170 570,230 552,282 C510,272 366,272 324,282 C306,230 296,170 300,120 Z', // frontalis
];
const FIBRES: string[] = [
  ...[0, 1, 2, 3, 4, 5].flatMap((i) => both(`M${262 + i * 6},${330 - i * 2} C${266 + i * 8},${270 - i * 6} ${284 + i * 6},${220 - i * 4} ${310 + i * 3},${182 - i}`)),
  ...[0, 1, 2, 3].flatMap((i) => both(`M${256 + i * 10},${444} C${262 + i * 8},${500} ${266 + i * 6},${540} ${270 + i * 4},${576}`)),
  ...[0, 1, 2].flatMap((i) => both(`M${294 + i * 8},${466 + i * 6} C${318 + i * 6},${492 + i * 4} ${338 + i * 4},${520 + i * 3} ${356 + i * 2},${548}`)),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `M${336 + i * 28},${126 - Math.abs(i - 3.5) * 2} C${338 + i * 28},${170} ${340 + i * 28},${220} ${342 + i * 28},${270}`),
];
const PROPORTION: Array<[number, string]> = [[115, ''], [298, ''], [495, ''], [655, '']];

// ---- Chromosomes (a karyotype in a row) and variants spread everywhere.
const CHROMS = Array.from({ length: 23 }, (_, i) => {
  const len = 210 - i * 6.5 + (i === 22 ? -40 : 0);
  const x = 610 + i * 48;
  return { x, top: 560 - len / 2, len, cen: 0.35 + ((i * 37) % 30) / 100 };
});
const VARIANTS = (() => {
  const r = rng(77);
  return Array.from({ length: 320 }, () => {
    const c = CHROMS[Math.floor(r() * CHROMS.length)]!;
    return { x: c.x + (r() < 0.5 ? -7 : 7), y: c.top + 8 + r() * (c.len - 16), t: r(), size: 0.6 + r() * 0.9 };
  });
})();

const Filters: React.FC<{ boil: number }> = ({ boil }) => (
  <defs>
    <filter id="p2ch" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={3} seed={boil * 7 + 1} result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.85" result="grain" />
      <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={boil * 7 + 3} result="w" />
      <feDisplacementMap in="SourceGraphic" in2="w" scale={4.5} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feComposite in="d" in2="grain" operator="in" result="g" />
      <feGaussianBlur in="d" stdDeviation={3} result="b" />
      <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.36 0" result="halo" />
      <feMerge><feMergeNode in="halo" /><feMergeNode in="g" /></feMerge>
    </filter>
    <filter id="p2sm" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={boil * 5 + 9} result="w" />
      <feDisplacementMap in="SourceGraphic" in2="w" scale={16} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feGaussianBlur in="d" stdDeviation={7} result="b" />
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={boil * 5 + 11} result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -0.15" result="grain" />
      <feComposite in="b" in2="grain" operator="in" />
    </filter>
    {/* Image layers: charcoal grain eating into the tone, slight wobble. */}
    <filter id="p2img" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={boil * 3 + 21} result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.62" result="grain" />
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={1} seed={boil * 3 + 23} result="w" />
      <feDisplacementMap in="SourceGraphic" in2="w" scale={2.5} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feComposite in="d" in2="grain" operator="in" />
    </filter>
    {/* Gooey: blobs that touch fuse, like the facial prominences of the embryo. */}
    <filter id="p2goo" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation={14} result="b" />
      <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={3} seed={boil * 5 + 31} result="w" />
      <feDisplacementMap in="goo" in2="w" scale={14} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feGaussianBlur in="d" stdDeviation={4} result="soft" />
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={boil * 5 + 33} result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.2 0 0 0 -0.45" result="grain" />
      <feComposite in="soft" in2="grain" operator="in" />
    </filter>
  </defs>
);

/** A path drawn on (charcoal), from t=0 to t=1. */
const Draw: React.FC<{ d: string; w: number; t: number; seed: number; boil: number; o?: number }> = ({ d, w, t, seed, boil, o = 1 }) => {
  if (t <= 0) return null;
  return (
    <g opacity={o}>
      <path d={jitter(d, seed + boil * 7, 1.1)} fill="none" stroke={CHAR} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(t)} />
      <path d={jitter(d, seed + 500 + boil * 13, 2.4)} fill="none" stroke={CHAR} strokeWidth={w * 0.45} opacity={0.55} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(t * 1.1 - 0.05)} />
    </g>
  );
};

/** Draw a list of paths one after the other at a steady pace. */
const DrawSeq: React.FC<{ items: Array<[string, number]>; t: number; boil: number; seed: number; o?: number }> = ({ items, t, boil, seed, o }) => {
  const lens = useMemo(() => items.map(([d]) => getLength(d)), [items]);
  const total = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  return (
    <>
      {items.map(([d, w], i) => {
        const start = acc / total; acc += lens[i]!;
        const local = clamp((t - start) / (lens[i]! / total));
        return <Draw key={i} d={d} w={w} t={local} seed={seed + i * 31} boil={boil} o={o} />;
      })}
    </>
  );
};

const Rub: React.FC<{ t: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, children, style }) => {
  const e = clamp(t) * 120 - 10;
  const mask = `linear-gradient(100deg, #000 ${e - 8}%, rgba(0,0,0,0.35) ${e}%, transparent ${e + 6}%)`;
  return <div style={{ ...style, WebkitMaskImage: mask, maskImage: mask, filter: 'url(#ch-text2)' }}>{children}</div>;
};

/** Image layer of the portrait, rubbed in along a direction. */
const RubImage: React.FC<{ href: string; t: number; id: string; angle?: number; o?: number }> = ({ href, t, id, angle = 100, o = 1 }) => {
  if (t <= 0) return null;
  const a = (angle * Math.PI) / 180;
  const p = clamp(t) * 1.25;
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id={`g-${id}`} x1={0.5 - Math.cos(a) / 2} y1={0.5 - Math.sin(a) / 2} x2={0.5 + Math.cos(a) / 2} y2={0.5 + Math.sin(a) / 2}>
          <stop offset={Math.max(0, p - 0.2)} stopColor="#fff" />
          <stop offset={Math.max(0, p)} stopColor="#000" />
        </linearGradient>
        <mask id={`m-${id}`} maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill={`url(#g-${id})`} /></mask>
      </defs>
      <image href={staticFile(href)} width={840} height={864} mask={`url(#m-${id})`} filter={id === 'detail' ? 'url(#p2ch)' : 'url(#p2img)'} />
    </g>
  );
};

export const Plate02: React.FC = () => {
  const frame = useCurrentFrame();
  const fq = Math.floor(frame / 2) * 2;
  const boil = Math.floor(frame / 2) % 3;
  const S = strokesData as { skin: number[][]; hair: number[][] };

  // Which link of the chain we are on.
  const stage = fq < T.dev ? 0 : fq < T.skull ? 1 : fq < T.skin ? 2 : 3;
  const chain = ['Variation génétique', 'Développement', 'Structure du visage', 'Apparence'];
  const inFilm = useContext(InFilm);
  const endFade = inFilm ? 1 : 1 - seg(frame, P2_DURATION - 24, P2_DURATION);

  // Genetics.
  const chromDraw = seg(fq, T.genes, T.genes + 70);
  const genesOut = 1 - ease(seg(fq, T.converge + 30, T.dev + 20));
  const conv = ease(seg(fq, T.converge, T.dev + 6));
  const center = { x: PX + CX, y: PY + 430 };

  // Development: one cell, divisions, then five prominences that fuse.
  const divisions = Math.floor(seg(fq, T.cells + 6, T.prominences) * 5); // 1, 2, 4, 8, 16, 32
  const cellsOn = seg(fq, T.cells, T.cells + 8) * (1 - seg(fq, T.prominences, T.prominences + 24));
  const prom = seg(fq, T.prominences, T.prominences + 30);
  const fuse = ease(seg(fq, T.fuse, T.skull - 8));
  const devOut = 1 - seg(fq, T.skull + 10, T.skull + 70);

  // Structure: skull, then tissues and proportions.
  const skullT = seg(fq, T.skull, T.skull + 120);
  const skullOp = 1 - 0.75 * seg(fq, T.tissue + 40, T.tissue + 90) - 0.25 * seg(fq, T.skin + 30, T.skin + 90);
  const muscleT = seg(fq, T.tissue, T.tissue + 70);
  const fibreT = seg(fq, T.tissue + 30, T.tissue + 110);
  const tissueOp = 1 - seg(fq, T.skin + 20, T.skin + 90);
  const propT = seg(fq, T.tissue + 50, T.tissue + 100);

  // Appearance.
  const skinT = seg(fq, T.skin, T.skin + 50);
  const detailT = seg(fq, T.detail, T.detail + 40);
  const strokeT = seg(fq, T.detail + 10, T.hair);
  const hairT = seg(fq, T.hair, T.hair + 60);

  const proms = [
    { x: CX, y: 290, rx: 150, ry: 120, from: [0, -120] }, // frontonasal
    { x: 300, y: 470, rx: 92, ry: 80, from: [-170, 10] }, { x: 576, y: 470, rx: 92, ry: 80, from: [170, 10] }, // maxillary
    { x: 350, y: 610, rx: 96, ry: 66, from: [-140, 90] }, { x: 526, y: 610, rx: 96, ry: 66, from: [140, 90] }, // mandibular
  ];

  return (
    <AbsoluteFill style={{ background: PAPER_WHITE }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <Filters boil={boil} />
        <defs>
          <filter id="tooth2"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} /><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.11 0" /></filter>
          <filter id="ch-text2" x="-5%" y="-20%" width="110%" height="140%">
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
        <rect width="1920" height="1080" filter="url(#tooth2)" />
        {(() => {
          const r = rng(91 + boil * 31);
          return Array.from({ length: 70 }, (_, i) => <circle key={i} cx={r() * 1920} cy={r() * 1080} r={0.4 + r() * 1.5} fill={CHAR} opacity={0.15 + r() * 0.4} />);
        })()}

        <g opacity={endFade}>
          {/* 1. Genetic variation: the genome, variants everywhere. */}
          {genesOut > 0 && (
            <g opacity={genesOut}>
              <g filter="url(#p2ch)">
                {CHROMS.map((c, i) => {
                  const t = clamp(chromDraw * 1.6 - i * 0.03);
                  const cy = c.top + c.len * c.cen;
                  const arm = (x: number) => `M${x},${c.top + 6} C${x - 3},${c.top} ${x + 3},${c.top} ${x},${c.top + 6} L${x},${cy - 4} M${x},${cy + 4} L${x},${c.top + c.len - 6}`;
                  return (
                    <g key={i}>
                      <Draw d={arm(c.x - 7)} w={9} t={t} seed={i * 11} boil={boil} />
                      <Draw d={arm(c.x + 7)} w={9} t={t} seed={i * 11 + 5} boil={boil} />
                      {t > 0.9 && [0.2, 0.5, 0.75].map((b, k) => <line key={k} x1={c.x - 13} x2={c.x + 13} y1={c.top + c.len * b} y2={c.top + c.len * b} stroke={PAPER_WHITE} strokeWidth={2.2} />)}
                    </g>
                  );
                })}
              </g>
              {VARIANTS.map((v, i) => {
                const on = seg(fq, T.ticks + v.t * 120, T.ticks + v.t * 120 + 6);
                if (on <= 0) return null;
                const k = conv;
                const x = lerp(v.x, center.x, k), y = lerp(v.y, center.y, k);
                return (
                  <g key={i} opacity={on}>
                    <circle cx={x} cy={y} r={3.2 * v.size * (1 - k * 0.5)} fill={CHAR} />
                    {k > 0 && <line x1={v.x} y1={v.y} x2={x} y2={y} stroke={CHAR} strokeWidth={0.5} opacity={0.25 * (1 - k)} />}
                  </g>
                );
              })}
            </g>
          )}

          {/* 2. Development: cell divisions, then the prominences of the embryonic face fuse. */}
          {fq >= T.cells && devOut > 0 && (
            <g opacity={devOut} transform={`translate(${PX},${PY})`}>
              {cellsOn > 0 && (
                <g filter="url(#p2ch)" opacity={cellsOn}>
                  {Array.from({ length: 2 ** divisions }, (_, i) => {
                    const r = rng(i * 13 + divisions);
                    const n = 2 ** divisions;
                    const rad = 34 / Math.sqrt(n) + 6;
                    const ang = i * 2.399 + r() * 0.3; const dist = Math.sqrt(i / n) * 26 * Math.sqrt(n) * 0.9;
                    return <circle key={`${divisions}-${i}`} cx={CX + Math.cos(ang) * dist} cy={430 + Math.sin(ang) * dist} r={rad} fill="none" stroke={CHAR} strokeWidth={2.4} />;
                  })}
                </g>
              )}
              {prom > 0 && (
                <g opacity={prom}>
                  <g filter="url(#p2goo)">
                    {proms.map((p, i) => {
                      const k = 1 - fuse;
                      return <ellipse key={i} cx={p.x + p.from[0]! * k * 0.6} cy={p.y + p.from[1]! * k * 0.6} rx={p.rx * (0.4 + 0.6 * prom)} ry={p.ry * (0.4 + 0.6 * prom)} fill="#2a2826" opacity={0.55} />;
                    })}
                  </g>
                  <g filter="url(#p2ch)" opacity={0.9 * (1 - fuse)}>
                    {proms.map((p, i) => {
                      const k = 1 - fuse;
                      return <ellipse key={i} cx={p.x + p.from[0]! * k * 0.6} cy={p.y + p.from[1]! * k * 0.6} rx={p.rx} ry={p.ry} fill="none" stroke={CHAR} strokeWidth={2} />;
                    })}
                  </g>
                </g>
              )}
            </g>
          )}

          {/* 3. Structure: skull, then tissues and proportions. */}
          <g transform={`translate(${PX},${PY})`}>
            {fq >= T.tissue && tissueOp > 0 && (
              <g opacity={tissueOp}>
                <g filter="url(#p2sm)" opacity={0.42}>
                  {MUSCLES.map((d, i) => <path key={i} d={d} fill={CHAR} opacity={clamp(muscleT * MUSCLES.length * 0.6 - i * 0.6)} />)}
                </g>
                <g filter="url(#p2ch)">
                  {FIBRES.map((d, i) => <Draw key={i} d={d} w={1.3} t={clamp(fibreT * 1.6 - (i / FIBRES.length) * 0.6)} seed={i * 17} boil={boil} o={0.6} />)}
                  {PROPORTION.map(([y], i) => <Draw key={i} d={`M150,${y} L730,${y}`} w={1.2} t={clamp(propT * 1.5 - i * 0.15)} seed={900 + i} boil={boil} o={0.5} />)}
                  <Draw d={`M${CX},70 L${CX},700`} w={1.2} t={propT} seed={950} boil={boil} o={0.45} />
                </g>
              </g>
            )}
            {fq >= T.skull && skullOp > 0 && (
              <g filter="url(#p2ch)" opacity={skullOp}>
                <DrawSeq items={SKULL} t={skullT} boil={boil} seed={300} />
              </g>
            )}

            {/* 4. Appearance: skin tone and pigmentation, features, strokes, hair. */}
            <RubImage href="p2/skin.png" t={skinT} id="skin" angle={100} />
            <RubImage href="p2/detail.png" t={detailT} id="detail" angle={90} o={0.95} />
            {strokeT > 0 && (
              <g filter="url(#p2ch)">
                {S.skin.map((s, i) => (i / S.skin.length < strokeT ? (
                  <line key={i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={CHAR} strokeWidth={s[4]! * 1.0} opacity={s[5]! * 0.8} strokeLinecap="round" />
                ) : null))}
              </g>
            )}
            <RubImage href="p2/hair.png" t={hairT} id="hair" angle={80} />
            {hairT > 0 && (
              <g filter="url(#p2ch)">
                {S.hair.map((s, i) => (s[6]! < hairT * 1.1 ? (
                  <line key={i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={CHAR} strokeWidth={s[4]! * 0.9} opacity={s[5]! * 0.7} strokeLinecap="round" />
                ) : null))}
              </g>
            )}
          </g>
        </g>
      </svg>

      <AbsoluteFill style={{ opacity: endFade }}>
        {/* The chain, top: the current link in full charcoal. */}
        <div style={{ position: 'absolute', top: 54, left: 0, width: 1920, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26 }}>
          {chain.map((c, i) => (
            <React.Fragment key={c}>
              <Rub t={(fq - 6 - i * 8) / 20} style={{ fontFamily: hand, fontSize: 40, color: CHAR, opacity: i === stage ? 1 : i < stage ? 0.55 : 0.28, transform: `scale(${i === stage ? 1.06 : 1})` }}>{c}</Rub>
              {i < 3 && <Rub t={(fq - 12 - i * 8) / 16} style={{ fontFamily: hand, fontSize: 40, color: CHAR, opacity: 0.4 }}>→</Rub>}
            </React.Fragment>
          ))}
        </div>

        {/* Stage notes, left column. */}
        <Note show={[T.genes + 30, T.dev - 6]} fq={fq} title="Des centaines de variations" lines={['réparties sur tout le génome,', 'chacune avec un petit effet.']} />
        <Note show={[T.dev + 10, T.skull - 6]} fq={fq} title="Le développement" lines={['l’embryon forme des bourgeons', 'qui fusionnent en visage', '(environ 4 à 10 semaines).']} />
        <Note show={[T.skull + 10, T.tissue - 4]} fq={fq} title="Les os" lines={['le crâne fixe l’architecture.']} />
        <Note show={[T.tissue + 4, T.skin - 4]} fq={fq} title="Tissus et proportions" lines={['muscles, graisse, cartilage', 'et proportions du visage.']} />
        <Note show={[T.skin + 4, T.final - 4]} fq={fq} title="Peau, pigmentation, cheveux" lines={['la surface que l’on reconnaît.']} />
        {/* Caution, right column, stays from development on. */}
        <div style={{ position: 'absolute', right: 110, top: 470, width: 340, textAlign: 'right' }}>
          <Rub t={(fq - T.dev - 30) / 24} style={{ fontFamily: script, fontSize: 30, color: CHAR, opacity: 0.6 * (1 - seg(fq, T.final - 10, T.final)) }}>
            + l’environnement<br />+ le hasard du développement
          </Rub>
        </div>

        {/* Final statement. */}
        <div style={{ position: 'absolute', left: 110, top: 440, width: 420 }}>
          <Rub t={(fq - T.final - 4) / 34} style={{ fontFamily: hand, fontSize: 56, lineHeight: 1.04, color: CHAR }}>Aucun gène ne dessine seul un trait.</Rub>
          <Rub t={(fq - T.final - 40) / 34} style={{ fontFamily: script, fontSize: 32, lineHeight: 1.15, color: CHAR, opacity: 0.7, marginTop: 18 }}>Un visage naît de très nombreuses petites influences, combinées.</Rub>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Note: React.FC<{ show: [number, number]; fq: number; title: string; lines: string[] }> = ({ show, fq, title, lines }) => {
  const [a, b] = show;
  if (fq < a || fq > b + 10) return null;
  const out = 1 - seg(fq, b, b + 10);
  return (
    <div style={{ position: 'absolute', left: 110, top: 440, width: 420, opacity: out }}>
      <Rub t={(fq - a) / 18} style={{ fontFamily: hand, fontSize: 50, lineHeight: 1.05, color: CHAR }}>{title}</Rub>
      {lines.map((l, i) => (
        <Rub key={i} t={(fq - a - 12 - i * 8) / 16} style={{ fontFamily: script, fontSize: 32, lineHeight: 1.2, color: CHAR, opacity: 0.72, marginTop: i === 0 ? 14 : 0 }}>{l}</Rub>
      ))}
    </div>
  );
};

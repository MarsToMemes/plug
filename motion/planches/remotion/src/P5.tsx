import React from 'react';
import { AbsoluteFill, Easing, staticFile, useCurrentFrame } from 'remotion';
import { CHAR, PAPER_WHITE } from './Charcoal';
import { rng } from './Engraving';
import data from './p4data.json';

/**
 * Planche 05 — "One gene, one feature" is wrong. A naive mapping is drawn, crossed out and
 * rubbed away; a network of many genes, each touching several regions, converges on one
 * face, which then slides into the opening frame of Planche 04.
 */
export const P5_DURATION = 570;
const T = { naive: 10, strike: 120, erase: 150, net: 182, pulses: 250, message: 300, converge: 420, slide: 500 };
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const hand = '"Caveat Brush", cursive';

type LM = Record<string, [number, number]>;
const A = (data as unknown as { A: { strokes: number[][]; lm: LM } }).A;
// Face: big in the middle-right, then where Planche 04 starts (x 262, y 250, scale 0.66).
const FACE0 = { x: 1010, y: 150, s: 0.95 };
const FACE1 = { x: 262, y: 250, s: 0.66 };

// Face regions the network reaches.
const REGIONS: Array<[string, [number, number]]> = [
  ['forehead', A.lm.forehead!], ['browL', A.lm.browL2!], ['browR', A.lm.browR1!], ['eyeL', [338, 352]], ['eyeR', [540, 352]],
  ['nose', A.lm.noseTip!], ['cheekL', [300, 450]], ['cheekR', [578, 450]], ['mouth', [437, 570]], ['jawL', A.lm.jawL!], ['jawR', A.lm.jawR!], ['chin', A.lm.chin!],
];
const NODES = (() => {
  const r = rng(505);
  return Array.from({ length: 54 }, (_, i) => {
    let x = 0, y = 0;
    do { x = 130 + r() * 1660; y = 150 + r() * 820; } while (x > 920 && x < 1760 && y > 120 && y < 960 && r() < 0.92);
    const targets = Array.from({ length: 2 + Math.floor(r() * 3) }, () => Math.floor(r() * REGIONS.length));
    return { x, y, targets: [...new Set(targets)], t: r(), size: 3 + r() * 4 };
  });
})();
const NODE_EDGES = (() => {
  const r = rng(77);
  return Array.from({ length: 34 }, () => [Math.floor(r() * NODES.length), Math.floor(r() * NODES.length)] as [number, number]).filter(([a, b]) => a !== b);
})();

const NAIVE: Array<{ label: string; region: [number, number]; y: number }> = [
  { label: 'GENE 01 → NEZ', region: A.lm.noseTip!, y: 330 },
  { label: 'GENE 02 → YEUX', region: [338, 352], y: 470 },
  { label: 'GENE 03 → MÂCHOIRE', region: A.lm.jawL!, y: 610 },
];

const Line: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number; w: number; boil: number; seed: number; o?: number; bow?: number }> = ({ x1, y1, x2, y2, t, w, boil, seed, o = 1, bow = 0 }) => {
  if (t <= 0) return null;
  const r = rng(seed + boil * 17);
  const mx = (x1 + x2) / 2 + (r() - 0.5) * 4 - (y2 - y1) * bow, my = (y1 + y2) / 2 + (r() - 0.5) * 4 + (x2 - x1) * bow;
  return <path d={`M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`} fill="none" stroke={CHAR} strokeWidth={w} opacity={o} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(t)} />;
};

export const Plate05: React.FC<{ startSketched?: boolean }> = ({ startSketched = false }) => {
  const frame = useCurrentFrame();
  const fq = Math.floor(frame / 2) * 2;
  const boil = Math.floor(frame / 2) % 3;

  const slide = ease(seg(fq, T.slide, T.slide + 56));
  const F = { x: lerp(FACE0.x, FACE1.x, slide), y: lerp(FACE0.y, FACE1.y, slide), s: lerp(FACE0.s, FACE1.s, slide) };
  const at = (p: [number, number]) => ({ x: F.x + p[0] * F.s, y: F.y + p[1] * F.s });

  // The face: a light sketch for the naive mapping; fully drawn as the network converges.
  const sketch = startSketched ? 1 : seg(fq, 0, 40);
  const toneT = seg(fq, T.converge - 10, T.converge + 60);
  const strokeT = seg(fq, T.converge + 20, T.converge + 80);
  const tp = clamp(toneT) * 1.25;

  const strike = seg(fq, T.strike, T.strike + 24);
  const erase = seg(fq, T.erase, T.erase + 30);
  const netT = seg(fq, T.net, T.net + 80);
  const conv = ease(seg(fq, T.converge, T.converge + 70));
  const netOut = seg(fq, T.converge + 50, T.converge + 80);
  const msgOut = seg(fq, T.slide - 20, T.slide + 4);

  return (
    <AbsoluteFill style={{ background: PAPER_WHITE }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="p4ch" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={3} seed={boil * 7 + 1} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.85" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={boil * 7 + 3} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={4} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" result="g" />
            <feGaussianBlur in="d" stdDeviation={2.6} result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.34 0" result="halo" />
            <feMerge><feMergeNode in="halo" /><feMergeNode in="g" /></feMerge>
          </filter>
          <filter id="p4img" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={boil * 3 + 21} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.62" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={1} seed={boil * 3 + 23} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={2.5} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" />
          </filter>
          <filter id="p5sm" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={10} />
          </filter>
          <filter id="tooth4"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} /><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.11 0" /></filter>
          <filter id="ch-text5" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} seed={boil + 40} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.95" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={boil + 44} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={3} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" result="g" />
            <feGaussianBlur in="d" stdDeviation={1.6} result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0" result="halo" />
            <feMerge><feMergeNode in="halo" /><feMergeNode in="g" /></feMerge>
          </filter>
          <linearGradient id="g5" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset={Math.max(0, tp - 0.2)} stopColor="#fff" /><stop offset={tp} stopColor="#000" />
          </linearGradient>
          <mask id="m5" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#g5)" /></mask>
        </defs>
        {/* Same paper as Planche 04, so the cut is invisible. */}
        <rect width="1920" height="1080" filter="url(#tooth4)" />
        {(() => {
          const r = rng(91 + boil * 31);
          return Array.from({ length: 60 }, (_, i) => <circle key={i} cx={r() * 1920} cy={r() * 1080} r={0.4 + r() * 1.4} fill={CHAR} opacity={0.15 + r() * 0.35} />);
        })()}

        {/* The face. */}
        <g transform={`translate(${F.x},${F.y}) scale(${F.s})`}>
          <image href={staticFile('p4/A_tone.png')} width={840} height={864} opacity={0.22 * sketch * (1 - toneT)} filter="url(#p4img)" />
          <image href={staticFile('p4/A_lines.png')} width={840} height={864} opacity={sketch} filter="url(#p4ch)" />
          {toneT > 0 && <image href={staticFile('p4/A_tone.png')} width={840} height={864} mask="url(#m5)" filter="url(#p4img)" />}
          {strokeT > 0 && (
            <g filter="url(#p4ch)">
              {A.strokes.map((s, i) => (i / A.strokes.length < strokeT ? <line key={i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={CHAR} strokeWidth={s[4]!} opacity={s[5]! * 0.75} strokeLinecap="round" /> : null))}
            </g>
          )}
        </g>

        <g filter="url(#p4ch)">
          {/* The naive mapping: arrows from each label to one region; then crossed out and rubbed away. */}
          <g opacity={1 - erase}>
            {NAIVE.map((n, i) => {
              const t0 = T.naive + i * 26;
              const p = at(n.region);
              return (
                <g key={i}>
                  <Line x1={640} y1={n.y + 8} x2={p.x} y2={p.y} t={seg(fq, t0 + 16, t0 + 34)} w={2.6} boil={boil} seed={i * 11} bow={0.06} />
                  {seg(fq, t0 + 34, t0 + 36) > 0 && <circle cx={p.x} cy={p.y} r={7} fill={CHAR} />}
                  <Line x1={150} y1={n.y + 4 + (i - 1) * 3} x2={lerp(150, 620, strike)} y2={n.y + 10 - (i - 1) * 2} t={strike > 0 ? 1 : 0} w={6} boil={boil} seed={50 + i} />
                </g>
              );
            })}
          </g>

          {/* The network: many genes, each touching several regions; genes touch each other too. */}
          <g opacity={1 - netOut}>
            {NODE_EDGES.map(([a, b], i) => {
              const A1 = NODES[a]!, B1 = NODES[b]!;
              const pa = { x: lerp(A1.x, F.x + 437 * F.s, conv), y: lerp(A1.y, F.y + 430 * F.s, conv) };
              const pb = { x: lerp(B1.x, F.x + 437 * F.s, conv), y: lerp(B1.y, F.y + 430 * F.s, conv) };
              return <Line key={`e${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} t={netT * 1.6 - 0.5 - (i / NODE_EDGES.length) * 0.4} w={1} boil={boil} seed={300 + i} o={0.35} bow={0.12} />;
            })}
            {NODES.map((n, i) => {
              const on = seg(fq, T.net + n.t * 50, T.net + n.t * 50 + 8);
              if (on <= 0) return null;
              const x = lerp(n.x, F.x + 437 * F.s, conv), y = lerp(n.y, F.y + 430 * F.s, conv);
              return (
                <g key={i} opacity={on}>
                  {n.targets.map((ti, k) => {
                    const p = at(REGIONS[ti]![1]);
                    const t = seg(fq, T.net + n.t * 50 + 6 + k * 6, T.net + n.t * 50 + 26 + k * 6);
                    // A pulse running along the link: the influence reaching the face.
                    const pulse = fq > T.pulses ? ((fq * 0.012 + n.t + k * 0.37) % 1) : -1;
                    return (
                      <g key={k}>
                        <Line x1={x} y1={y} x2={p.x} y2={p.y} t={t} w={1.3} boil={boil} seed={i * 31 + k} o={0.5} bow={0.08} />
                        {pulse >= 0 && t >= 1 && <circle cx={lerp(x, p.x, pulse)} cy={lerp(y, p.y, pulse)} r={3} fill={CHAR} opacity={0.8} />}
                      </g>
                    );
                  })}
                  <circle cx={x} cy={y} r={n.size} fill={CHAR} />
                  <circle cx={x} cy={y} r={n.size + 5} fill="none" stroke={CHAR} strokeWidth={1.2} opacity={0.5} />
                </g>
              );
            })}
            {/* Regions darken as influences pile up. */}
            {REGIONS.map(([, p], i) => {
              const q = at(p);
              const load = seg(fq, T.net + 30 + i * 4, T.net + 120);
              return <circle key={i} cx={q.x} cy={q.y} r={10 + 14 * load} fill={CHAR} opacity={0.18 * load} filter="url(#p5sm)" />;
            })}
          </g>
        </g>
      </svg>

      <AbsoluteFill>
        {NAIVE.map((n, i) => (
          <div key={i} style={{ position: 'absolute', left: 150, top: n.y - 34, opacity: 1 - erase }}>
            <Rub t={(fq - T.naive - i * 26) / 18} style={{ fontFamily: hand, fontSize: 56, color: CHAR, letterSpacing: '0.04em' }}>{n.label}</Rub>
          </div>
        ))}
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 830, textAlign: 'center', opacity: 1 - msgOut }}>
          <Rub t={(fq - T.message) / 34} style={{ display: 'inline-block', fontFamily: hand, fontSize: 64, letterSpacing: '0.05em', color: CHAR, background: 'rgba(245,243,238,0.85)', padding: '0 26px', boxShadow: '0 0 30px 20px rgba(245,243,238,0.85)' }}>
            LA RÉALITÉ EST BEAUCOUP PLUS COMPLEXE
          </Rub>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Rub: React.FC<{ t: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, children, style }) => {
  const e = clamp(t) * 120 - 10;
  const mask = `linear-gradient(100deg, #000 ${e - 8}%, rgba(0,0,0,0.35) ${e}%, transparent ${e + 6}%)`;
  return <div style={{ ...style, WebkitMaskImage: mask, maskImage: mask, filter: 'url(#ch-text5)' }}>{children}</div>;
};

import React from 'react';
import { AbsoluteFill, Easing, staticFile, useCurrentFrame } from 'remotion';
import { CHAR, PAPER_WHITE } from './Charcoal';
import { rng } from './Engraving';
import data from './p4data.json';

/**
 * Planche 06 — From the face into the genome and back. Many small variations, some light up,
 * each linked faintly to several regions: a distributed network, never one variant -> one face.
 * Ends on the face exactly as Planche 05 starts (sketch + light wash).
 */
export const P6_DURATION = 744;
const T = { zoom: 44, zoomEnd: 204, genome: 196, variants: 244, glow: 320, shrink: 384, links: 440, message: 560, fade: 624, lighten: 700 };
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const hand = '"Caveat Brush", cursive';

type LM = Record<string, [number, number]>;
const A = (data as unknown as { A: { strokes: number[][]; lm: LM } }).A;
const FACE = { x: 1010, y: 150, s: 0.95 }; // where Planche 05 starts
const at = (p: [number, number]) => ({ x: FACE.x + p[0] * FACE.s, y: FACE.y + p[1] * FACE.s });
const TARGET = at([330, 470]); // the cheek we dive into

const REGIONS: Array<[number, number]> = [
  A.lm.forehead!, A.lm.browL2!, A.lm.browR1!, [338, 352], [540, 352], A.lm.noseTip!, [300, 450], [578, 450], [437, 570], A.lm.jawL!, A.lm.jawR!, A.lm.chin!,
];
// Skin, then cells, around the cheek (screen coordinates before the camera).
const CELLS = (() => {
  const r = rng(66);
  return Array.from({ length: 520 }, () => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 70;
    return { x: TARGET.x + Math.cos(a) * d, y: TARGET.y + Math.sin(a) * d, r: 1.6 + r() * 1.4 };
  });
})();
// The genome: strands, many small variations, a few that light up.
const STRANDS = Array.from({ length: 9 }, (_, i) => 230 + i * 74);
const VARIANTS = (() => {
  const r = rng(606);
  return Array.from({ length: 300 }, (_, i) => {
    const s = Math.floor(r() * STRANDS.length);
    return { s, x: 170 + r() * 1580, t: r(), lit: r() < 0.16, targets: Array.from({ length: 2 + Math.floor(r() * 3) }, () => Math.floor(r() * REGIONS.length)), i };
  });
})();
const strandY = (s: number, x: number, phase: number) => STRANDS[s]! + Math.sin(x * 0.012 + s * 1.7 + phase) * 7;

const Line: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number; w: number; boil: number; seed: number; o?: number; bow?: number }> = ({ x1, y1, x2, y2, t, w, boil, seed, o = 1, bow = 0 }) => {
  if (t <= 0) return null;
  const r = rng(seed + boil * 17);
  const mx = (x1 + x2) / 2 + (r() - 0.5) * 4 - (y2 - y1) * bow, my = (y1 + y2) / 2 + (r() - 0.5) * 4 + (x2 - x1) * bow;
  return <path d={`M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`} fill="none" stroke={CHAR} strokeWidth={w} opacity={o} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(t)} />;
};

export const Plate06: React.FC<{ captioned?: boolean }> = ({ captioned = false }) => {
  const frame = useCurrentFrame();
  const fq = Math.floor(frame / 2) * 2;
  const boil = Math.floor(frame / 2) % 3;

  // Camera: dive into the cheek (log zoom), the target drifting to the centre of the frame.
  const zk = ease(seg(fq, T.zoom, T.zoomEnd));
  const z = Math.exp(zk * Math.log(160));
  const k = 1 - 1 / Math.pow(z, 1.6);
  const fx = lerp(960, TARGET.x, k), fy = lerp(540, TARGET.y, k);
  const cam = `translate(960,540) scale(${z}) translate(${-fx},${-fy})`;
  const worldOut = seg(fq, T.genome, T.genome + 24); // the dive ends in the genome
  const faceBack = ease(seg(fq, T.shrink, T.shrink + 50)); // the face comes back for the network
  const faceDraw = seg(fq, 0, 40);
  const lighten = seg(fq, T.lighten, P6_DURATION - 4);

  // Genome layer.
  const gIn = seg(fq, T.genome, T.genome + 30);
  const shrink = ease(seg(fq, T.shrink, T.shrink + 56));
  const G = { x: lerp(0, 90, shrink), y: lerp(0, 160, shrink), s: lerp(1, 0.5, shrink) };
  const gScreen = (x: number, y: number) => ({ x: G.x + x * G.s, y: G.y + y * G.s });
  const netOut = seg(fq, T.fade, T.fade + 60);
  const phase = fq * 0.01;

  const skin = seg(z, 2.5, 7) * (1 - seg(fq, T.genome - 6, T.genome + 16));
  const cells = seg(z, 9, 22);
  const nucleus = seg(z, 30, 70);

  const tp = clamp(faceDraw) * 1.25;
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
          <filter id="p6glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation={9} /></filter>
          <filter id="p6soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={3} /></filter>
          <filter id="tooth4"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} /><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.11 0" /></filter>
          <filter id="ch-text6" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} seed={boil + 40} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.95" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={boil + 44} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={3} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" result="g" />
            <feGaussianBlur in="d" stdDeviation={1.6} result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0" result="halo" />
            <feMerge><feMergeNode in="halo" /><feMergeNode in="g" /></feMerge>
          </filter>
          <linearGradient id="g6" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset={Math.max(0, tp - 0.2)} stopColor="#fff" /><stop offset={tp} stopColor="#000" />
          </linearGradient>
          <mask id="m6" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#g6)" /></mask>
        </defs>
        <rect width="1920" height="1080" filter="url(#tooth4)" />
        {(() => {
          const r = rng(91 + boil * 31);
          return Array.from({ length: 60 }, (_, i) => <circle key={i} cx={r() * 1920} cy={r() * 1080} r={0.4 + r() * 1.4} fill={CHAR} opacity={0.15 + r() * 0.35} />);
        })()}

        {/* The dive: face, skin, cells, nucleus. */}
        {worldOut < 1 && (
          <g transform={cam} opacity={1 - worldOut}>
            <g transform={`translate(${FACE.x},${FACE.y}) scale(${FACE.s})`}>
              <image href={staticFile('p4/A_tone.png')} width={840} height={864} mask="url(#m6)" filter="url(#p4img)" />
              <image href={staticFile('p4/A_lines.png')} width={840} height={864} opacity={faceDraw} filter="url(#p4ch)" />
            </g>
            {skin > 0 && (
              <g opacity={skin}>
                <circle cx={TARGET.x} cy={TARGET.y} r={72} fill="#9a958e" opacity={0.35} filter="url(#p6glow)" />
                {CELLS.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r={c.r * (0.6 + 0.4 * cells)} fill="none" stroke={CHAR} strokeWidth={1.8 / z} opacity={0.35 + 0.45 * cells} />
                ))}
              </g>
            )}
            {nucleus > 0 && (
              <g opacity={nucleus}>
                <circle cx={TARGET.x} cy={TARGET.y} r={1.45} fill={CHAR} opacity={0.32} />
                <circle cx={TARGET.x - 0.3} cy={TARGET.y - 0.3} r={0.8} fill={CHAR} opacity={0.18} />
                <circle cx={TARGET.x} cy={TARGET.y} r={1.5} fill="none" stroke={CHAR} strokeWidth={2.4 / z} />
                {Array.from({ length: 12 }, (_, i) => {
                  const r = rng(i * 7 + 3);
                  const a = r() * 6.28, d = r() * 1.1;
                  const x = TARGET.x + Math.cos(a) * d, y = TARGET.y + Math.sin(a) * d;
                  return <path key={i} d={`M${x.toFixed(3)},${y.toFixed(3)} q${((r() - 0.5) * 0.6).toFixed(3)},${((r() - 0.5) * 0.6).toFixed(3)} ${((r() - 0.5) * 0.9).toFixed(3)},${((r() - 0.5) * 0.9).toFixed(3)}`} fill="none" stroke={CHAR} strokeWidth={5 / z} opacity={0.45} strokeLinecap="round" />;
                })}
              </g>
            )}
          </g>
        )}

        {/* The face again, for the network and the end. */}
        {faceBack > 0 && (
          <g transform={`translate(${FACE.x},${FACE.y}) scale(${FACE.s})`} opacity={faceBack}>
            <image href={staticFile('p4/A_tone.png')} width={840} height={864} opacity={lerp(1, 0.22, lighten)} filter="url(#p4img)" />
            <image href={staticFile('p4/A_lines.png')} width={840} height={864} filter="url(#p4ch)" />
          </g>
        )}

        {/* The genome, abstract: strands, variations, a few lit. */}
        {gIn > 0 && netOut < 1 && (
          <g opacity={gIn * (1 - netOut)} filter="url(#p4ch)">
            {STRANDS.map((_, s) => {
              const pts = Array.from({ length: 64 }, (_, i) => {
                const x = 160 + (i / 63) * 1600;
                const p = gScreen(x, strandY(s, x, phase));
                return `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              }).join(' ');
              return <path key={s} d={pts} fill="none" stroke={CHAR} strokeWidth={2.6 * G.s + 0.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - seg(fq, T.genome + s * 3, T.genome + 30 + s * 3)} />;
            })}
            {VARIANTS.map((v) => {
              const on = seg(fq, T.variants + v.t * 70, T.variants + v.t * 70 + 6);
              if (on <= 0) return null;
              const p = gScreen(v.x, strandY(v.s, v.x, phase));
              const lit = v.lit ? seg(fq, T.glow + v.t * 40, T.glow + v.t * 40 + 14) : 0;
              const pulse = 0.75 + 0.25 * Math.sin(fq * 0.2 + v.i);
              return (
                <g key={v.i} opacity={on}>
                  {lit > 0 && <circle cx={p.x} cy={p.y} r={14 * G.s + 4} fill={CHAR} opacity={0.22 * lit * pulse} filter="url(#p6soft)" />}
                  <line x1={p.x} y1={p.y - 9 * G.s - 2} x2={p.x} y2={p.y + 9 * G.s + 2} stroke={CHAR} strokeWidth={lit > 0 ? 3.2 : 1.6} opacity={lit > 0 ? 1 : 0.6} />
                </g>
              );
            })}
          </g>
        )}

        {/* Distributed links: each lit variation to several regions, each region from many variations. */}
        {fq >= T.links && netOut < 1 && (
          <g opacity={1 - netOut} filter="url(#p4ch)">
            {VARIANTS.filter((v) => v.lit).map((v, n) => {
              const p = gScreen(v.x, strandY(v.s, v.x, phase));
              return v.targets.map((ti, k) => {
                const q = at(REGIONS[ti]!);
                const t = seg(fq, T.links + n * 2 + k * 5, T.links + n * 2 + k * 5 + 26);
                const pulse = fq > T.links + 60 ? ((fq * 0.01 + v.t + k * 0.3) % 1) : -1;
                return (
                  <g key={`${v.i}-${k}`}>
                    <Line x1={p.x} y1={p.y} x2={q.x} y2={q.y} t={t} w={1} boil={boil} seed={v.i * 13 + k} o={0.32} bow={0.06} />
                    {pulse >= 0 && t >= 1 && <circle cx={lerp(p.x, q.x, pulse)} cy={lerp(p.y, q.y, pulse)} r={2.4} fill={CHAR} opacity={0.6} />}
                  </g>
                );
              });
            })}
            {REGIONS.map((r, i) => {
              const q = at(r);
              const load = seg(fq, T.links + 20 + i * 4, T.links + 110);
              return <circle key={i} cx={q.x} cy={q.y} r={8 + 12 * load} fill={CHAR} opacity={0.2 * load} filter="url(#p6glow)" />;
            })}
          </g>
        )}
      </svg>

      <AbsoluteFill>
        <div style={{ position: 'absolute', left: 0, width: 1920, top: captioned ? 56 : 830, textAlign: 'center', opacity: 1 - seg(fq, T.fade + 10, T.fade + 50) }}>
          <Rub t={(fq - T.message) / 30} style={{ display: 'inline-block', fontFamily: hand, fontSize: 72, letterSpacing: '0.06em', color: CHAR, background: 'rgba(245,243,238,0.85)', padding: '0 26px', boxShadow: '0 0 30px 20px rgba(245,243,238,0.85)' }}>
            UN TRAIT COMPLEXE
          </Rub>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Rub: React.FC<{ t: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, children, style }) => {
  const e = clamp(t) * 120 - 10;
  const mask = `linear-gradient(100deg, #000 ${e - 8}%, rgba(0,0,0,0.35) ${e}%, transparent ${e + 6}%)`;
  return <div style={{ ...style, WebkitMaskImage: mask, maskImage: mask, filter: 'url(#ch-text6)' }}>{children}</div>;
};

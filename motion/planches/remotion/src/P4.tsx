import React from 'react';
import { AbsoluteFill, Easing, staticFile, useCurrentFrame } from 'remotion';
import { CHAR, PAPER_WHITE } from './Charcoal';
import { rng } from './Engraving';
import data from './p4data.json';

/**
 * Planche 04 — An editorial visualisation inspired by a 2022 study (look-alikes found by
 * facial recognition, then compared genetically). Charcoal. No real interface, no real photos
 * of the study: two anonymised look-alike portraits drawn for the purpose.
 */
export const P4_DURATION = 800;
const T = { draw: 0, unrelated: 72, grid: 120, points: 196, links: 250, lift: 300, y2022: 392, facial: 430, flow: 500, genetic: 560, source: 640 };
const SC = 0.66;
const POS = { A: { x: 262, y: 250 }, B: { x: 1104, y: 250 } };
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const hand = '"Caveat Brush", cursive';
const script = 'Caveat, cursive';

type LM = Record<string, [number, number]>;
const D = data as unknown as { A: { strokes: number[][]; lm: LM }; B: { strokes: number[][]; lm: LM } };
const KEYS = Object.keys(D.A.lm);
// The second portrait is mirrored: its left landmarks are the first one's right ones.
const MIRROR: Record<string, string> = { eyeLo: 'eyeRo', eyeLi: 'eyeRi', eyeRi: 'eyeLi', eyeRo: 'eyeLo', browL1: 'browR2', browL2: 'browR1', browR1: 'browL2', browR2: 'browL1', nosL: 'nosR', nosR: 'nosL', mouthL: 'mouthR', mouthR: 'mouthL', jawL: 'jawR', jawR: 'jawL', cheekL: 'cheekR', cheekR: 'cheekL' };
const lmOf = (who: 'A' | 'B', k: string): [number, number] => (who === 'A' ? D.A.lm[k]! : D.B.lm[MIRROR[k] ?? k]!);
const toScreen = (who: 'A' | 'B', p: [number, number]) => ({ x: POS[who].x + p[0] * SC, y: POS[who].y + p[1] * SC });
// The constellation: landmarks joined as a face is measured.
const LINKS: Array<[string, string]> = [
  ['eyeLo', 'eyeLi'], ['eyeRi', 'eyeRo'], ['eyeLi', 'eyeRi'], ['browL1', 'browL2'], ['browR1', 'browR2'], ['eyeLi', 'noseTip'], ['eyeRi', 'noseTip'],
  ['nosL', 'nosR'], ['nosL', 'mouthL'], ['nosR', 'mouthR'], ['mouthL', 'lipU'], ['lipU', 'mouthR'], ['mouthL', 'lipD'], ['lipD', 'mouthR'],
  ['lipD', 'chin'], ['chin', 'jawL'], ['chin', 'jawR'], ['jawL', 'cheekL'], ['jawR', 'cheekR'], ['cheekL', 'eyeLo'], ['cheekR', 'eyeRo'],
  ['forehead', 'browL2'], ['forehead', 'browR1'],
];
// Genetic markers: many shared, some not (no number shown).
const MARKERS = (() => {
  const r = rng(2022);
  return Array.from({ length: 46 }, (_, i) => {
    const shared = r() < 0.66;
    return { y: 250 + i * 13.5, shared, side: shared ? 0 : r() < 0.5 ? -1 : 1, w: 2 + r() * 3 };
  });
})();

function jitter(d: string, seed: number, amp: number) {
  const r = rng(seed);
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) =>
    `${(Number(x) + (r() - 0.5) * 2 * amp).toFixed(1)},${(Number(y) + (r() - 0.5) * 2 * amp).toFixed(1)}`);
}

const Line: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number; w: number; boil: number; seed: number; o?: number }> = ({ x1, y1, x2, y2, t, w, boil, seed, o = 1 }) => {
  if (t <= 0) return null;
  const r = rng(seed + boil * 17);
  const mx = (x1 + x2) / 2 + (r() - 0.5) * 3, my = (y1 + y2) / 2 + (r() - 0.5) * 3;
  return <path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" stroke={CHAR} strokeWidth={w} opacity={o} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(t)} />;
};

const Portrait: React.FC<{ who: 'A' | 'B'; fq: number; t0: number; dim: number }> = ({ who, fq, t0, dim }) => {
  const P = POS[who];
  const tone = seg(fq, t0, t0 + 40), lines = seg(fq, t0 + 16, t0 + 50), strokes = seg(fq, t0 + 20, t0 + 64);
  const st = D[who].strokes;
  const p = clamp(tone) * 1.25;
  return (
    <g transform={`translate(${P.x},${P.y}) scale(${SC})`} opacity={1 - dim}>
      <defs>
        <linearGradient id={`g4-${who}`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset={Math.max(0, p - 0.2)} stopColor="#fff" /><stop offset={p} stopColor="#000" />
        </linearGradient>
        <mask id={`m4-${who}`} maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill={`url(#g4-${who})`} /></mask>
      </defs>
      {tone > 0 && <image href={staticFile(`p4/${who}_tone.png`)} width={840} height={864} mask={`url(#m4-${who})`} filter="url(#p4img)" />}
      {lines > 0 && <image href={staticFile(`p4/${who}_lines.png`)} width={840} height={864} opacity={lines} filter="url(#p4ch)" />}
      {strokes > 0 && (
        <g filter="url(#p4ch)">
          {st.map((s, i) => (i / st.length < strokes ? <line key={i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={CHAR} strokeWidth={s[4]!} opacity={s[5]! * 0.75} strokeLinecap="round" /> : null))}
        </g>
      )}
    </g>
  );
};

export const Plate04: React.FC<{ aDrawn?: boolean }> = ({ aDrawn = false }) => {
  const frame = useCurrentFrame();
  const fq = Math.floor(frame / 2) * 2;
  const boil = Math.floor(frame / 2) % 3;
  const endFade = 1 - seg(frame, P4_DURATION - 24, P4_DURATION);

  const gridT = seg(fq, T.grid, T.grid + 70);
  const ptsT = seg(fq, T.points, T.points + 40);
  const linkT = seg(fq, T.links, T.links + 40);
  const lift = ease(seg(fq, T.lift, T.lift + 60));
  const flow = ease(seg(fq, T.flow, T.flow + 70));
  const gridOut = seg(fq, T.lift + 20, T.lift + 60);
  const facesDim = 0.45 * seg(fq, T.flow, T.flow + 50);
  const unrelatedOut = seg(fq, T.lift - 10, T.lift + 10);
  const helixPhase = (fq - T.flow) * 0.03;

  // Horizontal reference lines: at the height of the brows, eyes, nose, mouth and chin.
  const rows = ['forehead', 'browL1', 'eyeLo', 'noseTip', 'mouthL', 'chin'].map((k) => toScreen('A', D.A.lm[k]!).y);
  // The constellations, lifted from the faces and laid one over the other at the centre.
  const centre = (who: 'A' | 'B', k: string) => {
    const s = toScreen(who, lmOf(who, k));
    const faceC = toScreen(who, [437, 420]);
    return { x: lerp(s.x, 960 + (s.x - faceC.x), lift), y: s.y };
  };
  // Then the points flow into the two strands of the genetic ladder.
  const helixX = (y: number, side: -1 | 1) => 960 + side * 70 * Math.cos(helixPhase + y * 0.011);
  const strandPos = (who: 'A' | 'B', i: number) => {
    const m = MARKERS[Math.floor((i / KEYS.length) * MARKERS.length)]!;
    return { x: helixX(m.y, who === 'A' ? -1 : 1), y: m.y };
  };
  const point = (who: 'A' | 'B', k: string, i: number) => {
    const c = centre(who, k);
    const s = strandPos(who, i);
    return { x: lerp(c.x, s.x, flow), y: lerp(c.y, s.y, flow) };
  };

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
          <filter id="tooth4"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} /><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.11 0" /></filter>
          <filter id="ch-text4" x="-5%" y="-20%" width="110%" height="140%">
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
        <rect width="1920" height="1080" filter="url(#tooth4)" />
        {(() => {
          const r = rng(91 + boil * 31);
          return Array.from({ length: 60 }, (_, i) => <circle key={i} cx={r() * 1920} cy={r() * 1080} r={0.4 + r() * 1.4} fill={CHAR} opacity={0.15 + r() * 0.35} />);
        })()}

        <g opacity={endFade}>
          <Portrait who="A" fq={fq} t0={aDrawn ? -1000 : T.draw} dim={facesDim} />
          <Portrait who="B" fq={fq} t0={T.draw + 12} dim={facesDim} />

          <g filter="url(#p4ch)">
            {/* Comparison grid across both faces. */}
            <g opacity={0.55 * (1 - gridOut)}>
              {rows.map((y, i) => <Line key={i} x1={150} y1={y} x2={1770} y2={y} t={gridT * 1.3 - i * 0.06} w={1.4} boil={boil} seed={i * 13} />)}
              {(['A', 'B'] as const).flatMap((who) => ['eyeLo', 'eyeLi', 'noseTip', 'eyeRi', 'eyeRo'].map((k, i) => {
                const x = toScreen(who, D[who].lm[k]!).x;
                return <Line key={`${who}${k}`} x1={x} y1={240} x2={x} y2={830} t={gridT * 1.4 - 0.2 - i * 0.05} w={1.1} boil={boil} seed={200 + i * 7 + (who === 'B' ? 50 : 0)} o={k === 'noseTip' ? 0.9 : 0.6} />;
              }))}
            </g>

            {/* Threads between corresponding points of the two faces. */}
            {linkT > 0 && lift < 1 && KEYS.map((k, i) => {
              const a = toScreen('A', lmOf('A', k)), b = toScreen('B', lmOf('B', k));
              return <Line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} t={linkT * 1.5 - (i / KEYS.length) * 0.5} w={0.9} boil={boil} seed={400 + i} o={0.35 * (1 - lift)} />;
            })}

            {/* Constellations: on the faces, then lifted and laid over each other, then into the strands. */}
            {(['A', 'B'] as const).map((who) => (
              <g key={who} opacity={ptsT * (1 - seg(fq, T.flow + 40, T.flow + 70) * 0.7)}>
                {LINKS.map(([p, q], i) => {
                  const P = point(who, p, KEYS.indexOf(p)), Q = point(who, q, KEYS.indexOf(q));
                  return <Line key={i} x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} t={linkT * 1.4 - (i / LINKS.length) * 0.4} w={1.5} boil={boil} seed={600 + i * 3 + (who === 'B' ? 1 : 0)} o={(who === 'A' ? 0.85 : 0.6) * (1 - flow)} />;
                })}
                {KEYS.map((k, i) => {
                  const P = point(who, k, i);
                  const on = clamp(ptsT * 1.5 - (i / KEYS.length) * 0.5);
                  return on > 0 ? (
                    <g key={k} opacity={on}>
                      <circle cx={P.x} cy={P.y} r={who === 'A' ? 5 : 4} fill={who === 'A' ? CHAR : 'none'} stroke={CHAR} strokeWidth={2} />
                    </g>
                  ) : null;
                })}
              </g>
            ))}

            {/* Genetic analysis: two strands, rungs where the variants are shared. */}
            {flow > 0.6 && (
              <g opacity={seg(fq, T.flow + 40, T.flow + 70)}>
                {([-1, 1] as const).map((side) => {
                  const d = MARKERS.map((m, i) => `${i ? 'L' : 'M'}${helixX(m.y, side).toFixed(1)},${m.y}`).join(' ');
                  return <path key={side} d={jitter(d, side * 7 + boil * 3, 1)} fill="none" stroke={CHAR} strokeWidth={3} strokeLinecap="round" />;
                })}
                {MARKERS.map((m, i) => {
                  const on = seg(fq, T.genetic + i * 2, T.genetic + i * 2 + 8);
                  if (on <= 0) return null;
                  const xl = helixX(m.y, -1), xr = helixX(m.y, 1);
                  if (m.shared) return <Line key={i} x1={xl} y1={m.y} x2={lerp(xl, xr, on)} y2={m.y} t={1} w={m.w} boil={boil} seed={800 + i} o={0.9} />;
                  const x0 = m.side < 0 ? xl : xr;
                  return <Line key={i} x1={x0} y1={m.y} x2={lerp(x0, 960, on)} y2={m.y} t={1} w={m.w * 0.7} boil={boil} seed={800 + i} o={0.35} />;
                })}
              </g>
            )}
          </g>
        </g>
      </svg>

      <AbsoluteFill style={{ opacity: endFade }}>
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 500, textAlign: 'center', opacity: 1 - unrelatedOut }}>
          <Rub t={(fq - T.unrelated) / 24} style={{ display: 'inline-block', fontFamily: hand, fontSize: 64, letterSpacing: '0.08em', color: CHAR }}>UNRELATED</Rub>
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 70, textAlign: 'center' }}>
          <Rub t={(fq - T.y2022) / 24} style={{ display: 'inline-block', fontFamily: hand, fontSize: 120, color: CHAR, lineHeight: 1 }}>2022</Rub>
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 850, textAlign: 'center' }}>
          <div style={{ position: 'absolute', width: 1920, opacity: 1 - seg(fq, T.genetic - 20, T.genetic) }}>
            <Rub t={(fq - T.facial) / 28} style={{ display: 'inline-block', fontFamily: hand, fontSize: 64, letterSpacing: '0.06em', color: CHAR }}>FACIAL RECOGNITION</Rub>
          </div>
          <div style={{ position: 'absolute', width: 1920 }}>
            <Rub t={(fq - T.genetic) / 28} style={{ display: 'inline-block', fontFamily: hand, fontSize: 64, letterSpacing: '0.06em', color: CHAR }}>GENETIC ANALYSIS</Rub>
          </div>
        </div>
        <div style={{ position: 'absolute', right: 110, top: 34 }}>
          <Rub t={(fq - T.source) / 30} style={{ fontFamily: script, fontSize: 26, color: CHAR, opacity: 0.55 }}>after Joshi et al., Cell Reports, 2022 — illustration</Rub>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Rub: React.FC<{ t: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, children, style }) => {
  const e = clamp(t) * 120 - 10;
  const mask = `linear-gradient(100deg, #000 ${e - 8}%, rgba(0,0,0,0.35) ${e}%, transparent ${e + 6}%)`;
  return <div style={{ ...style, WebkitMaskImage: mask, maskImage: mask, filter: 'url(#ch-text4)' }}>{children}</div>;
};

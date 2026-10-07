import React, { useContext } from 'react';
import { AbsoluteFill, Easing, staticFile, useCurrentFrame } from 'remotion';
import { CHAR, PAPER_WHITE } from './Charcoal';
import { rng } from './Engraving';
import { InFilm } from './film';
import data from './p4data.json';

/**
 * Planche 08 — Two look-alike faces side by side. Zones of comparison are circled one after
 * the other (eyes, nose, jaw, cheekbones, proportions), the faces then slide onto each other:
 * some features almost coincide, others not quite. Back side by side: "FORTE RESSEMBLANCE".
 * No score: the resemblance is shown as the sum of many features.
 */
export const P8_DURATION = 900;
const ZONES = ['YEUX', 'NEZ', 'MÂCHOIRE', 'POMMETTES', 'PROPORTIONS'] as const;
type Zone = (typeof ZONES)[number];
const T = { draw: 0, zones: 90, zoneLen: 66, converge: 440, align: 480, merge: 545, apart: 660, final: 720, verdict: 760, sub: 820 };
const SC = 0.66;
const SIDE = { A: { x: 300, y: 205 }, B: { x: 1066 + 23, y: 205 } };
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const hand = '"Caveat Brush", cursive';
const script = 'Caveat, cursive';

type P = [number, number];
type LM = Record<string, P>;
const D = data as unknown as { A: { strokes: number[][]; lm: LM }; B: { strokes: number[][]; lm: LM } };
const KEYS = Object.keys(D.A.lm);
const MIRROR: Record<string, string> = { eyeLo: 'eyeRo', eyeLi: 'eyeRi', eyeRi: 'eyeLi', eyeRo: 'eyeLo', browL1: 'browR2', browL2: 'browR1', browR1: 'browL2', browR2: 'browL1', nosL: 'nosR', nosR: 'nosL', mouthL: 'mouthR', mouthR: 'mouthL', jawL: 'jawR', jawR: 'jawL', cheekL: 'cheekR', cheekR: 'cheekL' };
// Landmarks in each portrait's own pixel space; for B, keyed as seen on screen (mirrored).
const lm = (who: 'A' | 'B', k: string): P => (who === 'A' ? D.A.lm[k]! : D.B.lm[MIRROR[k] ?? k]!);

// Least-squares affine map from B's landmarks onto A's: how B is laid over A.
const FIT = (() => {
  const solve = (m: number[][], v: number[]) => {
    const a = m.map((r, i) => [...r, v[i]!]);
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) { const f = a[j]![i]! / a[i]![i]!; for (let k = i; k < 4; k++) a[j]![k]! -= f * a[i]![k]!; }
    }
    const x = [0, 0, 0];
    for (let i = 2; i >= 0; i--) { let s = a[i]![3]!; for (let k = i + 1; k < 3; k++) s -= a[i]![k]! * x[k]!; x[i] = s / a[i]![i]!; }
    return x;
  };
  const N = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bx = [0, 0, 0], by = [0, 0, 0];
  for (const k of KEYS) {
    const [u, v] = lm('B', k), [x, y] = lm('A', k), r = [u, v, 1];
    for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) N[i]![j]! += r[i]! * r[j]!; bx[i]! += r[i]! * x; by[i]! += r[i]! * y; }
  }
  const [a, c, e] = solve(N, bx), [b, d, f] = solve(N, by);
  return { a: a!, b: b!, c: c!, d: d!, e: e!, f: f! };
})();

// A hand-drawn loop: an ellipse that overshoots its start, slightly irregular, boiling on twos.
function loop(cx: number, cy: number, rx: number, ry: number, rot: number, seed: number) {
  const r = rng(seed);
  const n = 34, a0 = r() * Math.PI * 2, turns = 1.14;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + (i / n) * Math.PI * 2 * turns;
    const k = 1 + (r() - 0.5) * 0.05 + (i / n) * 0.07;
    const x = Math.cos(t) * rx * k, y = Math.sin(t) * ry * k;
    pts.push(`${i ? 'L' : 'M'}${(cx + x * Math.cos(rot) - y * Math.sin(rot)).toFixed(1)},${(cy + x * Math.sin(rot) + y * Math.cos(rot)).toFixed(1)}`);
  }
  return pts.join(' ');
}
const mid = (p: P, q: P): P => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];

// Each zone, in a portrait's own space: the loops to draw, and the areas left un-veiled.
type Shape = { rings: string[]; holes: Array<{ cx: number; cy: number; rx: number; ry: number; rot: number }>; lines?: string[] };
function zone(who: 'A' | 'B', z: Zone, seed: number): Shape {
  const L = (k: string) => lm(who, k);
  if (z === 'YEUX') {
    const h = [L('eyeLo'), L('eyeLi'), L('eyeRi'), L('eyeRo')].map(() => 0);
    void h;
    const l = mid(L('eyeLo'), L('eyeLi')), r = mid(L('eyeRi'), L('eyeRo'));
    const hl = { cx: l[0], cy: l[1] - 4, rx: 78, ry: 44, rot: 0 }, hr = { cx: r[0], cy: r[1] - 4, rx: 78, ry: 44, rot: 0 };
    return { rings: [loop(hl.cx, hl.cy, hl.rx, hl.ry, -0.04, seed), loop(hr.cx, hr.cy, hr.rx, hr.ry, 0.04, seed + 1)], holes: [hl, hr] };
  }
  if (z === 'NEZ') {
    const t = L('noseTip'), top = mid(L('eyeLi'), L('eyeRi'));
    const h = { cx: t[0], cy: (top[1] + L('nosL')[1]) / 2 + 6, rx: 74, ry: 104, rot: 0 };
    return { rings: [loop(h.cx, h.cy, h.rx, h.ry, 0.03, seed)], holes: [h] };
  }
  if (z === 'POMMETTES') {
    const mk = (c: string, e: string, s: number) => {
      const p = L(c), q = L(e);
      return { cx: lerp(p[0], q[0], 0.42), cy: p[1] + 22, rx: 66, ry: 40, rot: s * 0.32 };
    };
    const hl = mk('cheekL', 'eyeLo', 1), hr = mk('cheekR', 'eyeRo', -1);
    return { rings: [loop(hl.cx, hl.cy, hl.rx, hl.ry, hl.rot, seed), loop(hr.cx, hr.cy, hr.rx, hr.ry, hr.rot, seed + 1)], holes: [hl, hr] };
  }
  if (z === 'MÂCHOIRE') {
    const jl = L('jawL'), jr = L('jawR'), c = L('chin'), cl = L('cheekL'), cr = L('cheekR');
    const r = rng(seed);
    const j = () => (r() - 0.5) * 6;
    const d = `M${cl[0] + 8 + j()},${cl[1] + 60} Q${jl[0] - 14 + j()},${jl[1] + 40} ${c[0] - 80 + j()},${c[1] + 8} Q${c[0]},${c[1] + 30 + j()} ${c[0] + 80 + j()},${c[1] + 8} Q${jr[0] + 14 + j()},${jr[1] + 40} ${cr[0] - 8 + j()},${cr[1] + 60}`;
    return { rings: [d], holes: [{ cx: c[0], cy: (jl[1] + c[1]) / 2 + 10, rx: (jr[0] - jl[0]) / 2 + 30, ry: 90, rot: 0 }] };
  }
  // PROPORTIONS: the thirds of the face and its axis.
  const xs = [L('cheekL')[0] - 30, L('cheekR')[0] + 30];
  const ys = [L('forehead')[1] + 40, mid(L('browL1'), L('browR2'))[1], L('nosL')[1], L('chin')[1]];
  const r = rng(seed);
  const lines = ys.map((y) => `M${xs[0]},${y + (r() - 0.5) * 4} L${xs[1]},${y + (r() - 0.5) * 4}`);
  const ax = L('noseTip')[0];
  lines.push(`M${ax + (r() - 0.5) * 4},${ys[0]! - 30} L${ax + (r() - 0.5) * 4},${ys[3]! + 30}`);
  return { rings: [], holes: [], lines };
}

const Portrait: React.FC<{ who: 'A' | 'B'; fq: number; t0: number; m: number[]; opacity: number; mask?: string; defs?: React.ReactNode; children?: React.ReactNode }> = ({ who, fq, t0, m, opacity, mask, defs, children }) => {
  const tone = seg(fq, t0, t0 + 40), lines = seg(fq, t0 + 16, t0 + 50), strokes = seg(fq, t0 + 20, t0 + 64);
  const st = D[who].strokes;
  const p = clamp(tone) * 1.25;
  return (
    <g transform={`matrix(${m.join(' ')})`} opacity={opacity}>
      <defs>
        <linearGradient id={`g8-${who}`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset={Math.max(0, p - 0.2)} stopColor="#fff" /><stop offset={p} stopColor="#000" />
        </linearGradient>
        {defs}
        <mask id={`m8-${who}`} maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill={`url(#g8-${who})`} /></mask>
      </defs>
      <g mask={mask}>
        {tone > 0 && <image href={staticFile(`p4/${who}_tone.png`)} width={840} height={864} mask={`url(#m8-${who})`} filter="url(#p8img)" />}
        {lines > 0 && <image href={staticFile(`p4/${who}_lines.png`)} width={840} height={864} opacity={lines} filter="url(#p8ch)" />}
        {strokes > 0 && (
          <g filter="url(#p8ch)">
            {st.map((s, i) => (i / st.length < strokes ? <line key={i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={CHAR} strokeWidth={s[4]!} opacity={s[5]! * 0.75} strokeLinecap="round" /> : null))}
          </g>
        )}
      </g>
      {children}
    </g>
  );
};

const Rub: React.FC<{ t: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, children, style }) => {
  const e = clamp(t) * 120 - 10;
  const mask = `linear-gradient(100deg, #000 ${e - 8}%, rgba(0,0,0,0.35) ${e}%, transparent ${e + 6}%)`;
  return <div style={{ ...style, WebkitMaskImage: mask, maskImage: mask, filter: 'url(#ch-text8)' }}>{children}</div>;
};

export const Plate08: React.FC = () => {
  const frame = useCurrentFrame();
  const fq = Math.floor(frame / 2) * 2;
  const boil = Math.floor(frame / 2) % 3;
  const inFilm = useContext(InFilm);
  const endFade = inFilm ? 1 : 1 - seg(frame, P8_DURATION - 20, P8_DURATION);

  // Placement: side by side → overlaid at the centre (B fitted onto A) → side by side again.
  const together = ease(seg(fq, T.converge, T.converge + 60)) * (1 - ease(seg(fq, T.apart, T.apart + 56)));
  const fit = ease(seg(fq, T.align, T.align + 60)) * (1 - ease(seg(fq, T.apart, T.apart + 40)));
  const centre = { x: 960 - 437 * SC, y: SIDE.A.y };
  const ax = lerp(SIDE.A.x, centre.x, together), bx = lerp(SIDE.B.x, centre.x + (437 - 402) * SC, together);
  const mA = [SC, 0, 0, SC, ax, SIDE.A.y];
  const mB = [
    SC * lerp(1, FIT.a, fit), SC * lerp(0, FIT.b, fit), SC * lerp(0, FIT.c, fit), SC * lerp(1, FIT.d, fit),
    lerp(bx, centre.x + SC * FIT.e, fit), lerp(SIDE.B.y, centre.y + SC * FIT.f, fit),
  ];
  const bOpacity = lerp(1, 0.6, together);

  // Zone highlights, one after the other.
  const zoneT = (i: number) => T.zones + i * T.zoneLen;
  // Which zone is looked at, and how strongly: one by one, then a quick recap at the end.
  const veil = (i: number) => seg(fq, zoneT(i) + 2, zoneT(i) + 12) * (1 - seg(fq, zoneT(i) + T.zoneLen - 12, zoneT(i) + T.zoneLen));
  const recap = (i: number) => seg(fq, T.final + i * 12, T.final + i * 12 + 6) * (1 - seg(fq, T.final + i * 12 + 12, T.final + i * 12 + 18));
  const focus = (() => {
    for (let i = 0; i < ZONES.length; i++) { const v = Math.max(veil(i), recap(i)); if (v > 0.01) return { i, v }; }
    return null;
  })();
  const active = ZONES.findIndex((_, i) => fq >= zoneT(i) && fq < zoneT(i) + T.zoneLen);

  // Overlaid: features that coincide become one (B's double hidden there), in turn.
  const MERGE: Array<[Zone, number]> = [['YEUX', T.merge], ['NEZ', T.merge + 26], ['POMMETTES', T.merge + 52]];
  const mergeT = (at: number) => ease(seg(fq, at, at + 18)) * (1 - seg(fq, T.apart - 10, T.apart + 10));

  // The focused feature: the rest of the face recedes, the feature itself is inked again, darker.
  const holes = (who: 'A' | 'B', fill: string, o: number) => focus && ZONES[focus.i] !== 'PROPORTIONS'
    ? zone(who, ZONES[focus.i]!, 1).holes.map((h, k) => <ellipse key={k} cx={h.cx} cy={h.cy} rx={h.rx * 1.35} ry={h.ry * 1.35} transform={`rotate(${(h.rot * 180) / Math.PI} ${h.cx} ${h.cy})`} fill={fill} opacity={o} />)
    : null;
  const veilMask = (who: 'A' | 'B') => {
    if (!focus || ZONES[focus.i] === 'PROPORTIONS') return null;
    const v = focus.v * 0.62;
    return (
      <>
        <mask id={`veil8-${who}`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1240} height={1264}>
          <rect x={-200} y={-200} width={1240} height={1264} fill="#fff" opacity={1 - v} />
          {holes(who, 'url(#hole8)', v)}
        </mask>
        <mask id={`ink8-${who}`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1240} height={1264}>{holes(who, 'url(#hole8)', 1)}</mask>
      </>
    );
  };
  const ink = (who: 'A' | 'B') => (focus && ZONES[focus.i] !== 'PROPORTIONS' ? (
    <g mask={`url(#ink8-${who})`} opacity={0.4 * focus.v}>
      <image href={staticFile(`p4/${who}_lines.png`)} width={840} height={864} filter="url(#p8ch)" />
    </g>
  ) : null);
  // Proportions: the thirds of the face and its axis, drawn quickly, no circles.
  const thirds = (who: 'A' | 'B') => {
    const i = ZONES.indexOf('PROPORTIONS');
    const t = Math.max(seg(fq, zoneT(i), zoneT(i) + 20) * (1 - seg(fq, zoneT(i) + T.zoneLen - 12, zoneT(i) + T.zoneLen)), recap(i));
    if (t <= 0.01) return null;
    const sh = zone(who, 'PROPORTIONS', 300 + boil * 3 + (who === 'B' ? 101 : 0));
    return (
      <g filter="url(#p8ch)" opacity={t}>
        {sh.lines!.map((d, k) => <path key={k} d={d} fill="none" stroke={CHAR} strokeWidth={k === 4 ? 2 : 2.6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(t * 1.6 - k * 0.15)} opacity={k === 4 ? 0.5 : 0.8} />)}
      </g>
    );
  };

  // Camera: snap punch-ins on each feature, then a slow drift (as in the 06-05-04 cut).
  const at = (m: number[], p: P) => ({ x: m[0]! * p[0] + m[2]! * p[1] + m[4]!, y: m[1]! * p[0] + m[3]! * p[1] + m[5]! });
  const zc = (who: 'A' | 'B', z: Zone): P => {
    if (z === 'PROPORTIONS') return who === 'A' ? [437, 430] : [402, 430];
    const h = zone(who, z, 1).holes;
    return [h.reduce((a, q) => a + q.cx, 0) / h.length, h.reduce((a, q) => a + q.cy, 0) / h.length];
  };
  const sideA = [SC, 0, 0, SC, SIDE.A.x, SIDE.A.y], sideB = [SC, 0, 0, SC, SIDE.B.x, SIDE.B.y], mid8 = [SC, 0, 0, SC, centre.x, centre.y];
  const pair = (z: Zone) => { const p = at(sideA, zc('A', z)), q = at(sideB, zc('B', z)); return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; };
  const SCALE: Record<Zone, number> = { YEUX: 1.45, NEZ: 1.6, 'MÂCHOIRE': 1.35, POMMETTES: 1.45, PROPORTIONS: 1.1 };
  // Zooms only where the rule allows it (context → detail, key detail, turning point, key word).
  const SHOTS = [
    { at: 0, s: 1, x: 960, y: 500 },
    { at: zoneT(0), s: 1.3, x: 960, y: 490 }, // context → detail: the comparison begins, held for eyes, nose, jaw, cheekbones
    { at: zoneT(4), s: 1, x: 960, y: 500 }, // proportions concern the whole face: back to context
    { at: T.merge, s: 1.6, ...at(mid8, [437, 440]) }, // important detail: the features coincide
    { at: T.apart, s: 1, x: 960, y: 500 },
    { at: T.verdict, s: 1.06, x: 960, y: 490 }, // key word: FORTE RESSEMBLANCE
  ];
  const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  let si = 0;
  while (si + 1 < SHOTS.length && SHOTS[si + 1]!.at <= frame) si++;
  const cur = SHOTS[si]!, prev = SHOTS[Math.max(0, si - 1)]!;
  const ct = expoOut((frame - cur.at) / 8);
  const drift = 1;
  const cam = { s: lerp(prev.s, cur.s, ct) * drift, x: lerp(prev.x, cur.x, ct), y: lerp(prev.y, cur.y, ct) };
  const camBlur = frame - cur.at < 5 && si > 0 && Math.abs(cur.s - prev.s) > 0.1 ? 1.4 * (1 - (frame - cur.at) / 5) : 0;
  const listT = (i: number) => seg(fq, zoneT(i) + 30, zoneT(i) + 46);
  const listOut = seg(fq, T.converge, T.converge + 20);

  return (
    <AbsoluteFill style={{ background: PAPER_WHITE }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="p8ch" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={3} seed={boil * 7 + 1} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.85" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={boil * 7 + 3} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={4} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" result="g" />
            <feGaussianBlur in="d" stdDeviation={2.6} result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.34 0" result="halo" />
            <feMerge><feMergeNode in="halo" /><feMergeNode in="g" /></feMerge>
          </filter>
          <filter id="p8img" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={boil * 3 + 21} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.62" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={1} seed={boil * 3 + 23} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={2.5} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" />
          </filter>
          <radialGradient id="hole8"><stop offset="0.62" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          <radialGradient id="holeK8"><stop offset="0.6" stopColor="#000" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
          <filter id="soft8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={22} /></filter>
          <filter id="tooth8"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} /><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.11 0" /></filter>
          <filter id="ch-text8" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} seed={boil + 40} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.95" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={boil + 44} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={3} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" result="g" />
            <feGaussianBlur in="d" stdDeviation={1.6} result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0" result="halo" />
            <feMerge><feMergeNode in="halo" /><feMergeNode in="g" /></feMerge>
          </filter>
          {/* Where B coincides with A, its double is hidden: one feature, not two. */}
          <mask id="merge8" maskUnits="userSpaceOnUse" x={-200} y={-200} width={1240} height={1264}>
            <rect x={-200} y={-200} width={1240} height={1264} fill="#fff" />
            {MERGE.map(([z, at]) => zone('B', z, 1).holes.map((h, k) => (
              <ellipse key={`${z}${k}`} cx={h.cx} cy={h.cy} rx={h.rx * 1.3} ry={h.ry * 1.3} transform={`rotate(${(h.rot * 180) / Math.PI} ${h.cx} ${h.cy})`} fill="url(#holeK8)" opacity={mergeT(at)} />
            )))}
          </mask>
        </defs>
        <rect width="1920" height="1080" filter="url(#tooth8)" />
        {(() => {
          const r = rng(91 + boil * 31);
          return Array.from({ length: 60 }, (_, i) => <circle key={i} cx={r() * 1920} cy={r() * 1080} r={0.4 + r() * 1.4} fill={CHAR} opacity={0.15 + r() * 0.35} />);
        })()}

        <g opacity={endFade} style={{ filter: camBlur > 0.05 ? `blur(${camBlur}px)` : undefined }}>
          <g transform={`translate(960,540) scale(${cam.s}) translate(${-cam.x},${-cam.y})`}>
          <Portrait who="A" fq={fq} t0={T.draw} m={mA} opacity={1} mask={veilMask('A') ? 'url(#veil8-A)' : undefined} defs={veilMask('A')}>{thirds('A')}</Portrait>
          <Portrait who="B" fq={fq} t0={T.draw + 12} m={mB} opacity={bOpacity} mask={together > 0.01 ? 'url(#merge8)' : veilMask('B') ? 'url(#veil8-B)' : undefined} defs={veilMask('B')}>{thirds('B')}</Portrait>
          </g>
        </g>
      </svg>

      <AbsoluteFill style={{ opacity: endFade }}>
        {/* The zone being looked at, large, above the faces. */}
        {ZONES.map((z, i) => {
          const a = fq - zoneT(i);
          if (a < 0 || a > T.zoneLen) return null;
          return (
            <div key={z} style={{ position: 'absolute', left: 0, width: 1920, top: 72, textAlign: 'center', opacity: 1 - seg(a, T.zoneLen - 12, T.zoneLen) }}>
              <Rub t={a / 16} style={{ display: 'inline-block', textShadow: '0 0 10px #f5f3ee, 0 0 22px #f5f3ee, 0 0 40px #f5f3ee', fontFamily: hand, fontSize: 84, letterSpacing: '0.08em', color: CHAR }}>{z}</Rub>
            </div>
          );
        })}
        {/* The features add up, one after the other. */}
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 900, display: 'flex', justifyContent: 'center' }}><div style={{ display: 'flex', gap: 34, opacity: 1 - listOut, textShadow: '0 0 10px #f5f3ee, 0 0 22px #f5f3ee, 0 0 40px #f5f3ee', }}>
          {ZONES.map((z, i) => (
            <React.Fragment key={z}>
              {i > 0 && <div style={{ fontFamily: hand, fontSize: 44, color: CHAR, opacity: 0.6 * listT(i) }}>+</div>}
              <Rub t={listT(i)} style={{ fontFamily: hand, fontSize: 44, letterSpacing: '0.05em', color: CHAR, opacity: i === active ? 1 : 0.62 }}>{z}</Rub>
            </React.Fragment>
          ))}
        </div></div>
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 950, textAlign: 'center', opacity: 1 - seg(fq, T.apart - 20, T.apart) }}>
          <Rub t={(fq - T.merge) / 24} style={{ display: 'inline-block', textShadow: '0 0 10px #f5f3ee, 0 0 22px #f5f3ee, 0 0 40px #f5f3ee', fontFamily: script, fontSize: 52, color: CHAR, opacity: 0.8 }}>certains traits se superposent presque</Rub>
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 868, textAlign: 'center' }}>
          <Rub t={(fq - T.verdict) / 30} style={{ display: 'inline-block', textShadow: '0 0 10px #f5f3ee, 0 0 22px #f5f3ee, 0 0 40px #f5f3ee', fontFamily: hand, fontSize: 92, letterSpacing: '0.08em', color: CHAR, lineHeight: 1 }}>FORTE RESSEMBLANCE</Rub>
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 982, textAlign: 'center' }}>
          <Rub t={(fq - T.sub) / 30} style={{ display: 'inline-block', fontFamily: script, fontSize: 38, color: CHAR, opacity: 0.7 }}>une combinaison de nombreuses caractéristiques</Rub>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

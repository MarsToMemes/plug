import React from 'react';
import { AbsoluteFill, Easing, staticFile, useCurrentFrame } from 'remotion';
import { rng } from './Engraving';

/**
 * Opening — one face alone in the dark, then two, four, eight, dozens; far away, one face
 * slowly turns into a look-alike of the first. The camera isolates them, the rest goes
 * back to darkness, the title appears, the two faces end side by side. Charcoal lifted
 * out of a dark ground.
 */
export const P7_DURATION = 860;
const T = { push: 20, two: 150, four: 206, eight: 256, dozens: 306, full: 430, morph: 450, isolate: 560, pair: 610, title: 660 };
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const PAPER = '#ece8e1';

const POOL = ['10224139', '5125842', '6274541', '6277890', '6371970', '6665217', '7534371', '8496459', '8724220', '8724312', '8724313', '8724362']
  .flatMap((b) => [0, 1, 2].map((v) => `${b}_${v}`));
const CW = 300, CH = 350, GX = 330, GY = 384;

// Grid slots ordered by distance from the centre: the order in which faces appear.
const SLOTS = (() => {
  const s: Array<{ c: number; r: number; x: number; y: number; d: number }> = [];
  for (let c = -7; c <= 7; c++) for (let r = -3; r <= 3; r++) {
    const x = c * GX + (r % 2 ? GX / 2 : 0), y = r * GY;
    s.push({ c, r, x, y, d: Math.hypot(x / GX, y / GY) });
  }
  return s.sort((a, b) => a.d - b.d);
})();
const R = rng(77);
const FACES = SLOTS.map((s, i) => (i === 0 ? 'Ahero' : POOL[Math.floor(R() * POOL.length)]!));
// The look-alike: a slot a few faces away from the first, that starts as someone else.
const LOOK = SLOTS.findIndex((s) => s.c === 3 && s.r === -1);
// Parents: each new face emerges from the nearest face already there.
const COUNT = (f: number) => (f < T.two ? 1 : f < T.four ? 2 : f < T.eight ? 4 : f < T.dozens ? 8 : Math.round(lerp(8, SLOTS.length, ease(seg(f, T.dozens, T.full)))));
const BORN = SLOTS.map((_, i) => (i === 0 ? 0 : i < 2 ? T.two : i < 4 ? T.four : i < 8 ? T.eight : T.dozens + ((i - 8) / (SLOTS.length - 8)) * (T.full - T.dozens) * 0.95));
const PARENT = SLOTS.map((s, i) => {
  if (i === 0) return 0;
  const n = i < 2 ? 1 : i < 4 ? 2 : i < 8 ? 4 : i;
  let best = 0, bd = Infinity;
  for (let j = 0; j < n && j < i; j++) { const d = Math.hypot(SLOTS[j]!.x - s.x, SLOTS[j]!.y - s.y); if (d < bd) { bd = d; best = j; } }
  return best;
});

export const Plate07: React.FC = () => {
  const frame = useCurrentFrame();
  const fq = Math.floor(frame / 2) * 2;
  const boil = Math.floor(frame / 2) % 3;
  const L = SLOTS[LOOK]!;

  // Camera: scale (log-interpolated) and centre in world coordinates.
  const keys: Array<[number, number, number, number]> = [
    [0, 2.15, 0, 10], [T.two, 2.4, 0, 10], [T.four, 1.5, GX / 2, 0], [T.eight, 1.05, GX / 2, 0], [T.dozens, 0.78, GX / 2, 0],
    [T.full, 0.36, 0, 0], [T.isolate, 0.39, L.x * 0.3, L.y * 0.3], [T.pair, 0.95, L.x / 2, L.y / 2], [T.title, 1.42, L.x / 2, L.y / 2 + 40], [P7_DURATION, 1.48, L.x / 2, L.y / 2 + 40],
  ];
  let k = 0;
  while (k + 2 < keys.length && keys[k + 1]![0] <= frame) k++;
  const [t0, s0, x0, y0] = keys[k]!, [t1, s1, x1, y1] = keys[k + 1]!;
  const u = ease(clamp((frame - t0) / (t1 - t0)));
  const cs = Math.exp(lerp(Math.log(s0), Math.log(s1), u)), cx = lerp(x0, x1, u), cy = lerp(y0, y1, u);

  const dimOthers = ease(seg(frame, T.isolate, T.pair + 20));
  const together = ease(seg(frame, T.pair, T.title + 30)); // the two faces move side by side
  const mid = { x: L.x / 2, y: L.y / 2 };
  const morph = ease(seg(frame, T.morph, T.isolate));
  const vis = { x0: cx - 960 / cs - CW, x1: cx + 960 / cs + CW, y0: cy - 540 / cs - CH, y1: cy + 540 / cs + CH };

  const title = seg(frame, T.title, T.title + 50);
  const intro = seg(frame, 0, 40);

  return (
    <AbsoluteFill style={{ background: '#121110' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          {/* Rubbed charcoal ground: dark, uneven, a few lifted marks. */}
          <filter id="ground7"><feTurbulence type="fractalNoise" baseFrequency="0.0035" numOctaves={4} seed={9} /><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.19  0 0 0 0 0.18  0 0 0 -1.4 0.95" /></filter>
          <filter id="tooth7"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={5} /><feColorMatrix values="0 0 0 0 0.9  0 0 0 0 0.88  0 0 0 0 0.85  0 0 0 0.06 0" /></filter>
          {/* Charcoal grain over the faces, in screen space, re-seeded on twos. */}
          <filter id="ch7" x="0" y="0" width="1920" height="1080" filterUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={boil * 5 + 2} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.2 0 0 0 -0.3" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={boil * 5 + 4} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={3} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" />
          </filter>
          <radialGradient id="vig7" cx="50%" cy="50%" r="75%"><stop offset="0.45" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.7" /></radialGradient>
        </defs>
        <rect width="1920" height="1080" filter="url(#ground7)" opacity={0.22} />
        <rect width="1920" height="1080" filter="url(#tooth7)" />
        {(() => {
          const r = rng(41 + boil * 13);
          return Array.from({ length: 40 }, (_, i) => <circle key={i} cx={r() * 1920} cy={r() * 1080} r={0.4 + r() * 1.2} fill="#d8d3cb" opacity={0.08 + r() * 0.2} />);
        })()}

        <g filter="url(#ch7)" opacity={intro}>
          <g transform={`translate(960,540) scale(${cs}) translate(${-cx},${-cy})`}>
            {SLOTS.map((s, i) => {
              const born = BORN[i]!;
              if (frame < born) return null;
              const isA = i === 0, isL = i === LOOK;
              let x = s.x, y = s.y;
              // Emerging from the parent face.
              const em = easeOut(seg(frame, born, born + (i < 8 ? 36 : 22)));
              const p = SLOTS[PARENT[i]!]!;
              x = lerp(p.x, s.x, em); y = lerp(p.y, s.y, em);
              if (isA || isL) {
                const tx = isA ? mid.x - 175 : mid.x + 175;
                x = lerp(x, tx, together); y = lerp(y, mid.y, together);
              }
              if (x < vis.x0 || x > vis.x1 || y < vis.y0 || y > vis.y1) return null;
              const o = (i === 0 ? 1 : em) * (isA || isL ? 1 : 1 - dimOthers);
              if (o <= 0.01) return null;
              const href = isA ? 'p7/Ahero.png' : `p7/${FACES[i]}.png`;
              return (
                <g key={i} opacity={o}>
                  <image href={staticFile(href)} x={x - CW / 2} y={y - CH / 2} width={CW} height={CH} opacity={isL ? 1 - morph : 1} />
                  {isL && morph > 0 && <image href={staticFile('p7/Bhero.png')} x={x - CW / 2} y={y - CH / 2} width={CW} height={CH} opacity={morph} />}
                </g>
              );
            })}
          </g>
        </g>
        <rect width="1920" height="1080" fill="url(#vig7)" />
      </svg>

      {/* Title: very sober — a hairline, then the words settle from a wider tracking. */}
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 92 }}>
        <div style={{ width: 120 * easeOut(seg(frame, T.title - 6, T.title + 30)), height: 1, background: PAPER, opacity: 0.6, marginBottom: 26 }} />
        <div style={{
          fontFamily: 'Newsreader, serif', fontWeight: 300, fontSize: 58, color: PAPER, textTransform: 'uppercase',
          letterSpacing: `${lerp(0.42, 0.2, easeOut(title))}em`, opacity: title, filter: `blur(${(1 - title) * 4}px)`,
        }}>
          Votre sosie existe-t-il ?
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

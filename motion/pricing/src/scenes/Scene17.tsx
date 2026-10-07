import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { S17 } from '../data/scene17';
import { EASE, THEME, clamp01, lerp, seg } from '../theme';
import { measure } from '../layout/measure';

type V3 = [number, number, number];
const B = S17.beats, O = S17.orbit;
const INPUTS: V3[] = S17.inputs.map((_, i) => { const a = (i / S17.inputs.length) * Math.PI * 2; return [Math.cos(a) * 660, i % 2 ? -90 : 70, Math.sin(a) * 660]; });
const PRICE: V3 = [0, -60, 0], BOOK: V3 = [330, 300, 70], AVAIL: V3 = [-330, 300, -70];

/** Orbit camera: rotate around the vertical axis, tilt, perspective. Returns screen point, depth, scale. */
function project(p: V3, th: number) {
  const x1 = p[0] * Math.cos(th) + p[2] * Math.sin(th), z1 = -p[0] * Math.sin(th) + p[2] * Math.cos(th);
  const y2 = p[1] * Math.cos(O.tilt) - z1 * Math.sin(O.tilt), z2 = p[1] * Math.sin(O.tilt) + z1 * Math.cos(O.tilt);
  const s = O.distance / (O.distance + z2);
  return { x: 960 + x1 * s, y: 500 + y2 * s, z: z2, s };
}
const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const fog = (z: number) => clamp01(0.35 + 0.65 * (1 - (z + 700) / 1400)); // far things recede

export const Scene17: React.FC = () => {
  const f = useCurrentFrame();
  const th = O.from + f * O.speed;
  // The loop is the core of the machine: it always faces us (it does not orbit), the inputs do.
  const pc = project(PRICE, th);
  const LOOP_AT: Record<string, { x: number; y: number; z: number; s: number }> = { book: { x: pc.x + 300, y: pc.y + 300, z: pc.z - 5, s: 1 }, avail: { x: pc.x - 300, y: pc.y + 300, z: pc.z - 5, s: 1 } };
  const P = (p: V3) => (p === BOOK ? LOOP_AT.book! : p === AVAIL ? LOOP_AT.avail! : project(p, th));
  const along = (a: V3, b: V3, u: number) => { const A = P(a), Bp = P(b); return { x: lerp(A.x, Bp.x, u), y: lerp(A.y, Bp.y, u), z: lerp(A.z, Bp.z, u), s: lerp(A.s, Bp.s, u) }; };
  const runs = f >= B.run ? Math.floor((f - B.run) / S17.loopFrames) : 0;
  const price = S17.start.price + runs * S17.perLoop.price;
  const avail = Math.max(0, S17.start.available + runs * S17.perLoop.available);
  const items: Array<{ z: number; el: React.ReactNode }> = [];

  // Inputs: links and data flowing in.
  S17.inputs.forEach((label, i) => {
    const at = B.inputs + i * B.stagger, t = EASE.out(seg(f, at, at + 24));
    if (t <= 0) return;
    const a = P(INPUTS[i]!), c = P(PRICE), z = (a.z + c.z) / 2;
    items.push({ z: z + 1, el: <line key={`l${i}`} x1={a.x} y1={a.y} x2={lerp(a.x, c.x, t)} y2={lerp(a.y, c.y, t)} stroke={THEME.line} strokeWidth={1.3} opacity={fog(z)} /> });
    for (let j = 0; j < 4; j++) {
      const u = ((f - at) * 0.01 + j / 4) % 1, q = P(mix3(INPUTS[i]!, PRICE, u));
      if (f > at + 24) items.push({ z: q.z, el: <circle key={`p${i}-${j}`} cx={q.x} cy={q.y} r={3.2 * q.s} fill={THEME.ink} opacity={Math.sin(Math.PI * u) * fog(q.z)} /> });
    }
    // An orbiting label never crosses the loop's labels: it steps back while it passes behind them.
    const half = measure(label, { size: 21 * a.s, font: 'sans', tracking: 0.16, upper: true }).advance / 2;
    const clear = Math.min(...[LOOP_AT.book!, LOOP_AT.avail!].map((n) => {
      const gx = Math.abs(a.x - n.x) - half - 130, gy = Math.abs(a.y - 22 * a.s - (n.y + 8)) - 60;
      return clamp01(Math.max(gx, gy) / 48);
    }));
    items.push({ z: a.z - 1, el: (
      <g key={`n${i}`} opacity={t * fog(a.z)}>
        <circle cx={a.x} cy={a.y} r={9 * a.s} fill={THEME.bg} stroke={THEME.ink} strokeWidth={1.6} />
        <text opacity={clear} x={a.x} y={a.y - 22 * a.s} textAnchor="middle" fontFamily={THEME.sans} fontSize={21 * a.s} letterSpacing="0.16em" fill={THEME.ink}>{label.toUpperCase()}</text>
      </g>
    ) });
  });

  // The loop: price → bookings → availability ↓ → price ↑, running continuously.
  const legs: Array<[V3, V3, number]> = [[PRICE, BOOK, B.loop[0]!], [BOOK, AVAIL, B.loop[1]!], [AVAIL, PRICE, B.loop[2]!]];
  legs.forEach(([a3, b3, at], k) => {
    const t = EASE.out(seg(f, at, at + 26));
    if (t <= 0) return;
    const a = P(a3), b = P(b3), z = (a.z + b.z) / 2;
    items.push({ z: z + 1, el: <line key={`e${k}`} x1={a.x} y1={a.y} x2={lerp(a.x, b.x, t)} y2={lerp(a.y, b.y, t)} stroke={THEME.accent} strokeWidth={2.2} opacity={0.8} /> });
    if (f >= B.run) {
      for (let j = 0; j < 2; j++) {
        // One continuous circulation: position along the whole loop, shared by the three legs.
        const g = (((f - B.run) / S17.loopFrames) + j / 2) % 1, leg = Math.floor(g * 3);
        if (leg !== k) continue;
        const q = along(a3, b3, g * 3 - k);
        items.push({ z: q.z - 2, el: <circle key={`c${k}-${j}`} cx={q.x} cy={q.y} r={6 * q.s} fill={THEME.accent} /> });
      }
    }
  });
  const node = (p3: V3, label: string, value: string | null, at: number, key: string, strong = false) => {
    const t = EASE.out(seg(f, at, at + 20));
    if (t <= 0) return;
    const p = P(p3);
    items.push({ z: p.z - 3, el: (
      <g key={key} opacity={t}>
        <circle cx={p.x} cy={p.y} r={(strong ? 62 : 14) * p.s} fill={THEME.bg} stroke={strong ? THEME.ink : THEME.accent} strokeWidth={2} />
        <text x={p.x} y={p.y + (strong ? 8 : -26) * p.s} textAnchor="middle" fontFamily={strong ? THEME.serif : THEME.sans} fontSize={(strong ? 30 : 19) * p.s} letterSpacing={strong ? '0.08em' : '0.16em'} fill={THEME.ink}>{label.toUpperCase()}</text>
        {value && <text x={p.x} y={p.y + (strong ? -84 : 44) * p.s} textAnchor="middle" fontFamily={THEME.sans} fontWeight={300} fontSize={(strong ? 40 : 26) * p.s} fill={strong ? THEME.accent : THEME.ink} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</text>}
      </g>
    ) });
  };
  node(PRICE, S17.loop.price, f >= B.loop[0]! ? `${price} €` : null, B.core, 'price', true);
  node(BOOK, S17.loop.bookings, null, B.loop[0]! + 10, 'book');
  node(AVAIL, S17.loop.availability, f >= B.loop[1]! ? String(avail) : null, B.loop[1]! + 10, 'avail');

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      {/* The orbit is framed inside the safe area: its nearest nodes never cross the bottom edge. */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, transformOrigin: `${pc.x}px ${pc.y}px`, transform: 'scale(0.9)' }}>
        {items.sort((a, b) => b.z - a.z).map((it) => it.el)}
      </svg>
      <div style={{ position: 'absolute', left: 112, top: 96 }}>
        {S17.legend.map((t, k) => {
          const o = EASE.out(seg(f, B.loop[k]! + 6, B.loop[k]! + 30));
          return <div key={t} style={{ opacity: o, fontFamily: THEME.sans, fontSize: 22, letterSpacing: '0.18em', textTransform: 'uppercase', color: k === 2 ? THEME.accent : THEME.ink, lineHeight: 1.8 }}>{t}</div>;
        })}
      </div>
    </AbsoluteFill>
  );
};

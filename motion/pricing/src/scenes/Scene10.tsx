import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { S10 } from '../data/scene10';
import { Statement } from '../components/ui';
import { EASE, THEME, clamp01, rng, seg } from '../theme';

const B = S10.beats;
const C = { x: 960, y: 540 }, CR = 170, RX = 700, RY = 380, OUT = { x: 1640, y: 540 };
// Inputs spread around the core, leaving the right-hand side free for the single output.
const node = (i: number, n: number) => { const a = (34 + (i / (n - 1)) * 292) * (Math.PI / 180); return { x: C.x + Math.cos(a) * RX, y: C.y + Math.sin(a) * RY, a }; };

/** Data flowing along a link: a few small marks travelling from a to b, steadily. */
const Flow: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; f: number; on: number; speed?: number; n?: number; color?: string; r?: number }> = ({ a, b, f, on, speed = 0.012, n = 3, color = THEME.ink, r = 3.5 }) => (
  <g opacity={on}>
    {Array.from({ length: n }, (_, j) => {
      const t = (f * speed + j / n) % 1;
      return <circle key={j} cx={a.x + (b.x - a.x) * t} cy={a.y + (b.y - a.y) * t} r={r} fill={color} opacity={Math.sin(Math.PI * t)} />;
    })}
  </g>
);

/** The same engine, small and quiet: one of many in the wider system. */
const Echo: React.FC<{ x: number; y: number; s: number; o: number; f: number }> = ({ x, y, s, o, f }) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
    <circle r={CR} fill="none" stroke={THEME.line} strokeWidth={4} />
    {S10.inputs.map((_, i) => { const p = node(i, S10.inputs.length); return <g key={i}><line x1={(p.x - C.x) * 0.3} y1={(p.y - C.y) * 0.3} x2={p.x - C.x} y2={p.y - C.y} stroke={THEME.faint} strokeWidth={4} /><circle cx={p.x - C.x} cy={p.y - C.y} r={18} fill={THEME.line} /></g>; })}
    <line x1={CR} y1={0} x2={OUT.x - C.x} y2={0} stroke={THEME.line} strokeWidth={4} />
    <Flow a={{ x: CR, y: 0 }} b={{ x: OUT.x - C.x, y: 0 }} f={f} on={1} r={12} color={THEME.accent} />
  </g>
);

export const Scene10: React.FC = () => {
  const f = useCurrentFrame();
  const n = S10.inputs.length;
  const core = EASE.out(seg(f, B.core, B.core + 20));
  const out = EASE.out(seg(f, S10.output.at, S10.output.at + 24));
  const wide = seg(f, B.pull + 10, B.pull + 50) * (1 - seg(f, S10.camera[1]!.at, S10.camera[1]!.at + 40));
  const sig = seg(f, S10.signals, S10.signals + 30);
  // "Énormément de signaux": small marks drifting from everywhere towards the core, all along.
  const field = React.useMemo(() => { const r = rng(1011); return Array.from({ length: 90 }, () => ({ a: r() * Math.PI * 2, d: 0.55 + r() * 0.7, sp: 0.004 + r() * 0.006, ph: r() })); }, []);
  // Echoes: a lattice of the same engine, linked, revealed by the pull-back.
  const echoes = React.useMemo(() => {
    const r = rng(1010), out: Array<{ x: number; y: number; d: number }> = [];
    for (let gx = -3; gx <= 3; gx++) for (let gy = -3; gy <= 3; gy++) if (gx || gy) out.push({ x: C.x + gx * 2300 + (r() - 0.5) * 500, y: C.y + gy * 1500 + (r() - 0.5) * 400, d: Math.hypot(gx, gy) });
    return out;
  }, []);
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S10.camera}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* The wider system (only seen from far away). */}
          {wide > 0 && echoes.map((e, k) => (
            <g key={k}>
              {echoes.filter((o) => Math.hypot(o.x - e.x, o.y - e.y) < 2900 && o.x > e.x).map((o, j) => <line key={j} x1={e.x} y1={e.y} x2={o.x} y2={o.y} stroke={THEME.faint} strokeWidth={6} opacity={wide} />)}
              <Echo x={e.x} y={e.y} s={0.9} o={wide * clamp01(1.4 - e.d * 0.15)} f={f + k * 7} />
            </g>
          ))}

          {/* Inputs converge to the centre. */}
          {sig > 0 && field.map((q, k) => {
            const u = (f * q.sp + q.ph) % 1, R = (1 - u) * q.d * 1150 + CR;
            return <circle key={k} cx={C.x + Math.cos(q.a) * R} cy={C.y + Math.sin(q.a) * R * 0.62} r={2.4} fill={THEME.ink} opacity={sig * 0.5 * Math.sin(Math.PI * u)} />;
          })}
          {S10.inputs.map(({ label, at }, i) => {
            const p = node(i, n);
            const t = EASE.out(seg(f, at, at + 20));
            const edge = { x: C.x + Math.cos(Math.atan2(p.y - C.y, p.x - C.x)) * CR, y: C.y + Math.sin(Math.atan2(p.y - C.y, p.x - C.x)) * CR };
            return (
              <g key={label} opacity={t}>
                <line x1={p.x} y1={p.y} x2={p.x + (edge.x - p.x) * t} y2={p.y + (edge.y - p.y) * t} stroke={THEME.line} strokeWidth={1.4} />
                <Flow a={p} b={edge} f={f + i * 13} on={seg(f, at + 20, at + 40)} />
                <circle cx={p.x} cy={p.y} r={9} fill={THEME.bg} stroke={THEME.ink} strokeWidth={1.8} />
                <text x={p.x} y={p.y + (p.y < C.y ? -24 : 40)} textAnchor="middle" fontFamily={THEME.sans} fontSize={26} letterSpacing="0.14em" fill={THEME.ink}>{label.toUpperCase()}</text>
              </g>
            );
          })}

          {/* The core. */}
          <g opacity={core}>
            <circle cx={C.x} cy={C.y} r={CR} fill={THEME.bg} stroke={THEME.ink} strokeWidth={2} />
            <circle cx={C.x} cy={C.y} r={CR + 10 + 6 * Math.sin(f * 0.12) * seg(f, S10.inputs[1]!.at, S10.inputs[1]!.at + 40)} fill="none" stroke={THEME.accent} strokeWidth={1.2} opacity={0.5 * seg(f, S10.inputs[1]!.at, S10.inputs[1]!.at + 40)} />
            <text x={C.x} y={C.y - 6} textAnchor="middle" fontFamily={THEME.serif} fontSize={40} fontWeight={300} fill={THEME.ink}>GESTION</text>
            <text x={C.x} y={C.y + 40} textAnchor="middle" fontFamily={THEME.serif} fontSize={40} fontWeight={300} fill={THEME.ink}>DES REVENUS</text>
          </g>

          {/* One result comes out. */}
          <g opacity={out}>
            <line x1={C.x + CR} y1={C.y} x2={C.x + CR + (OUT.x - 40 - C.x - CR) * out} y2={C.y} stroke={THEME.accent} strokeWidth={2.4} />
            <Flow a={{ x: C.x + CR, y: C.y }} b={{ x: OUT.x - 40, y: C.y }} f={f} on={seg(f, S10.output.at + 24, S10.output.at + 44)} color={THEME.accent} r={4.5} speed={0.02} />
            <circle cx={OUT.x} cy={OUT.y} r={34} fill="none" stroke={THEME.accent} strokeWidth={2.4} />
            <text x={OUT.x} y={OUT.y - 60} textAnchor="middle" fontFamily={THEME.sans} fontSize={28} letterSpacing="0.24em" fill={THEME.accent}>{S10.output.label.toUpperCase()}</text>
          </g>
        </svg>
      </CameraRig>
      <Statement family="TITLE_FOCUS" text={S10.question.text} at={S10.question.at} out={S10.question.out} top={40} size={52} fade={10} />
      <Statement family="TITLE_SLIDE" text={S10.goal.text} at={S10.goal.at} out={S10.subtle.at - 8} top={40} size={52} fade={10} />
      <Statement family="TITLE_MORPH" text={S10.subtle.text} at={S10.subtle.at} top={40} size={52} fade={10} />
    </AbsoluteFill>
  );
};

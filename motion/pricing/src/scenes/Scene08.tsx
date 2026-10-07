import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { PriceCounter, type PriceStep } from '../components/price';
import { RoomFront } from '../components/rooms';
import { MilestoneTick } from '../components/time';
import { Caps, Statement } from '../components/ui';
import { DemandIndicator } from '../components/price';
import { S08 } from '../data/scene08';
import { EASE, THEME, lerp, seg } from '../theme';

const B = S08.beats, M = S08.milestones;
const steps: PriceStep[] = M.map((m, k) => ({ at: k === 0 ? 0 : m.at, value: m.price }));

/** One measure of the context: its name, then a value that moves (a count, a countdown, a level). */
const Gauge: React.FC<{ g: (typeof S08.gauges)[number]; x: number }> = ({ g, x }) => {
  const f = useCurrentFrame();
  const t = EASE.out(seg(f, g.at - 3, g.at + 14)), run = EASE.inOut(seg(f, g.at + 6, g.at + 60));
  const v = lerp(g.from, g.to, run);
  return (
    <div style={{ position: 'absolute', left: x - 220, width: 440, top: 760, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: t, transform: `translateY(${(1 - t) * 14}px)` }}>
      <Caps size={20} color={THEME.ink}>{g.label}</Caps>
      {g.unit === 'level'
        ? <DemandIndicator level={v} label="" ticks={14} style={{ marginTop: 22 }} />
        : <div style={{ marginTop: 14, fontFamily: THEME.sans, fontWeight: 300, fontSize: 84, color: run > 0.98 ? THEME.accent : THEME.ink, fontVariantNumeric: 'tabular-nums' }}>{Math.round(v)}{g.unit}</div>}
    </div>
  );
};

export const Scene08: React.FC = () => {
  const f = useCurrentFrame();
  const ctx = EASE.inOut(seg(f, S08.context.at, S08.context.at + 14)); // the room steps back, the context comes in
  const tl = EASE.out(seg(f, B.timeline, B.timeline + 40)) * (1 - ctx);
  // The playhead travels from milestone to milestone, arriving exactly when the price changes.
  let px = M[0]!.x;
  for (let k = 1; k < M.length; k++) px = lerp(px, M[k]!.x, EASE.inOut(seg(f, M[k]!.at - 90, M[k]!.at)));
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S08.camera}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <RoomFront x={560} y={150} w={800} h={500} o={EASE.out(seg(f, 0, 30)) * (1 - 0.6 * ctx)} />
          {/* "Le lit est toujours le même. La vue est toujours la même." */}
          {S08.same.map((s, k) => {
            const o = EASE.out(seg(f, s.at - 3, s.at + 12)) * (1 - ctx);
            const r = k === 0 ? { x: 640, y: 330, w: 432, h: 180 } : { x: 1044, y: 198, w: 232, h: 204 };
            return o > 0 && <g key={k} opacity={o}><rect x={r.x} y={r.y} width={r.w} height={r.h} rx={12} fill="none" stroke={THEME.accent} strokeWidth={2} /><text x={r.x + r.w / 2} y={r.y - 18} textAnchor="middle" fontFamily={THEME.sans} fontSize={20} letterSpacing="0.24em" fill={THEME.accent}>{s.label.toUpperCase()}</text></g>;
          })}
        </svg>
      </CameraRig>
      {/* The context: when the room is booked. Not filmed: the camera only goes towards the room. */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} opacity={tl}>
        <line x1={M[0]!.x - 60} y1={900} x2={M[M.length - 1]!.x + 60} y2={900} stroke={THEME.line} strokeWidth={1.6} />
        {M.map((m) => <MilestoneTick key={m.label} x={m.x} y={900} label={m.label} strong={f >= m.at && Math.abs(px - m.x) < 4} />)}
        {f >= M[0]!.at - 10 && <g transform={`translate(${px},900)`}><line y1={-26} y2={8} stroke={THEME.accent} strokeWidth={2.4} /><circle cy={-26} r={6} fill={THEME.accent} /></g>}
      </svg>
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 690, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: EASE.out(seg(f, M[0]!.at, M[0]!.at + 20)) * (1 - ctx) }}>
        <Caps>{S08.text.price}</Caps>
        <PriceCounter steps={steps} size={104} style={{ marginTop: 6 }} />
      </div>
      <Statement text={S08.text.message} at={B.message} out={S08.context.at - 8} top={56} size={64} fade={14} />
      <Statement text={S08.context.text} at={S08.context.at} top={56} size={64} fade={12} />
      {S08.gauges.map((g, k) => <Gauge key={k} g={g} x={480 + k * 480} />)}
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { PriceCounter, type PriceStep } from '../components/price';
import { RoomFront } from '../components/rooms';
import { MilestoneTick } from '../components/time';
import { Caps, Statement } from '../components/ui';
import { S08 } from '../data/scene08';
import { EASE, THEME, lerp, seg } from '../theme';

const B = S08.beats, M = S08.milestones;
const steps: PriceStep[] = M.map((m, k) => ({ at: k === 0 ? 0 : m.at, value: m.price }));

export const Scene08: React.FC = () => {
  const f = useCurrentFrame();
  const tl = EASE.out(seg(f, B.timeline, B.timeline + 40));
  // The playhead travels from milestone to milestone, arriving exactly when the price changes.
  let px = M[0]!.x;
  for (let k = 1; k < M.length; k++) px = lerp(px, M[k]!.x, EASE.inOut(seg(f, M[k]!.at - 90, M[k]!.at)));
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S08.camera}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <RoomFront x={560} y={150} w={800} h={500} o={EASE.out(seg(f, 0, 30))} />
        </svg>
      </CameraRig>
      {/* The context: when the room is booked. Not filmed: the camera only goes towards the room. */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} opacity={tl}>
        <line x1={M[0]!.x - 60} y1={900} x2={M[M.length - 1]!.x + 60} y2={900} stroke={THEME.line} strokeWidth={1.6} />
        {M.map((m) => <MilestoneTick key={m.label} x={m.x} y={900} label={m.label} strong={f >= m.at && Math.abs(px - m.x) < 4} />)}
        {f >= M[0]!.at - 10 && <g transform={`translate(${px},900)`}><line y1={-26} y2={8} stroke={THEME.accent} strokeWidth={2.4} /><circle cy={-26} r={6} fill={THEME.accent} /></g>}
      </svg>
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 690, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: EASE.out(seg(f, M[0]!.at, M[0]!.at + 20)) }}>
        <Caps>{S08.text.price}</Caps>
        <PriceCounter steps={steps} size={104} style={{ marginTop: 6 }} />
      </div>
      <Statement text={S08.text.message} at={B.message} top={56} size={64} />
    </AbsoluteFill>
  );
};

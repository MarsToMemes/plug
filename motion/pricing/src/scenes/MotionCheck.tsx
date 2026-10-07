import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { springValue, useMotion } from '../motion/motion';
import { THEME } from '../theme';

/** Check: Motion driven by the frame (useMotion) and its spring as a pure function. */
export const MotionCheck: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  useMotion(ref, { x: [-900, 0], opacity: [0, 1] }, { duration: 0.8, ease: 'backOut' });
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const s = springValue((f / fps) * 1000 - 300, 0, 1, { stiffness: 300, damping: 14 });
  return (
    <AbsoluteFill style={{ background: THEME.bg, alignItems: 'center', justifyContent: 'center', gap: 60 }}>
      <div ref={ref} style={{ fontFamily: THEME.serif, fontSize: 160, color: THEME.ink }}>MOTION</div>
      <div style={{ width: 600, height: 16, background: THEME.accent, transform: `scaleX(${s})`, transformOrigin: '0 50%' }} />
    </AbsoluteFill>
  );
};

import React from 'react';
import { TimeOffset } from './time';

/**
 * Motion blur as a camera shutter: the subtree is rendered at several instants within the
 * shutter (here `shutter` ms before now), oldest first and faint, the current one last and
 * opaque. A still object: all samples coincide, nothing changes. A fast one: a trail whose
 * length is its speed. An impact: maximal for a few frames, then sharp at once.
 * Children must read time with useT() (src/motion/time).
 */
export const Smear: React.FC<{ samples?: number; shutter?: number; children: React.ReactNode }> = ({ samples = 8, shutter = 36, children }) => {
  if (samples <= 1) return <>{children}</>;
  return (
    <>
      {Array.from({ length: samples }, (_, k) => {
        const i = samples - 1 - k; // oldest first
        const o = i === 0 ? 1 : 0.55 * Math.pow(1 - i / samples, 1.4);
        return (
          <div key={k} style={{ position: 'absolute', inset: 0, opacity: o, filter: i ? `blur(${(1.2 + i * 0.5).toFixed(1)}px)` : undefined }}>
            <TimeOffset ms={(i / (samples - 1)) * shutter}>{children}</TimeOffset>
          </div>
        );
      })}
    </>
  );
};

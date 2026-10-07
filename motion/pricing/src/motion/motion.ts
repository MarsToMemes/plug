import { animate, spring, type AnimationPlaybackControls, type DOMKeyframesDefinition, type AnimationOptions } from 'motion';
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Motion (motion.dev, ex Framer Motion) inside Remotion. Its animations run on the browser's
 * clock: in a render that is not reproducible. Two deterministic ways to use it here:
 *
 * 1. useMotion(): the animation is created, paused, and its time set to the current frame
 *    before every screenshot.
 *      const ref = React.useRef<HTMLDivElement>(null);
 *      useMotion(ref, { x: [-400, 0], opacity: [0, 1] }, { duration: 0.8, ease: 'backOut' });
 *
 * 2. Pure functions, evaluated at a time: springValue(t) (physical spring), and Motion's
 *    easings (cubicBezier, backOut, anticipate…), interpolate, mix.
 *
 * Do not use <motion.div animate=…> or useAnimate() as such in a composition: they play in
 * real time, not on the frame.
 */
export function useMotion(ref: React.RefObject<Element | null>, keyframes: DOMKeyframesDefinition, options: AnimationOptions = {}, startMs = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctl = React.useRef<AnimationPlaybackControls | null>(null);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const c = animate(ref.current, keyframes, options);
    c.pause();
    ctl.current = c;
    return () => { c.stop(); ctl.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useLayoutEffect(() => {
    if (ctl.current) ctl.current.time = Math.max(0, (frame / fps) * 1000 - startMs) / 1000; // seconds
  }, [frame, fps, startMs]);
}

/** A physical spring from `from` to `to`, evaluated at `ms` (deterministic). */
export function springValue(ms: number, from: number, to: number, cfg: { stiffness?: number; damping?: number; mass?: number } = {}) {
  if (ms <= 0) return from;
  return spring({ keyframes: [from, to], stiffness: 260, damping: 20, mass: 1, ...cfg }).next(ms).value as number;
}

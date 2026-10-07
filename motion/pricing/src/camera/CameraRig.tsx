import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, clamp01, lerp } from '../theme';

/**
 * Global camera grammar. Every move carries a narrative meaning, and each meaning has one
 * timing and one easing, used everywhere in the film:
 *   PUSH_IN    enter a mechanism              ~1.2 s, ease in-out
 *   PULL_OUT   reveal the whole system        ~1.6 s, ease in-out
 *   PAN        follow a piece of information  ~1.2 s, ease in-out
 *   ORBIT      show a spatial relation        ~2.4 s, ease in-out (Y rotation, perspective)
 *   SNAP       important change / revelation  4 frames, expo out
 *   SLOW_PUSH  analytical moment              long, linear-ish, very small scale change
 *   RAPID_PUSH revelation or tension          10 frames, expo out
 *   IMPACT     a word lands                   short scale kick + decaying shake
 * MORPH is a content change (one concept becoming another), not a camera move.
 */
export type CameraPose = { x: number; y: number; scale: number; rotY: number };
export type CameraMove = 'PUSH_IN' | 'PULL_OUT' | 'PAN' | 'ORBIT' | 'SNAP' | 'SLOW_PUSH' | 'RAPID_PUSH' | 'HOLD';
export type CameraShot = { at: number; move: CameraMove; to: Partial<CameraPose>; duration?: number };
export type CameraImpact = { at: number; strength?: number };

export const MOVE_TIMING: Record<CameraMove, { duration: number; ease: (t: number) => number }> = {
  PUSH_IN: { duration: 36, ease: EASE.inOut },
  PULL_OUT: { duration: 48, ease: EASE.inOut },
  PAN: { duration: 36, ease: EASE.inOut },
  ORBIT: { duration: 72, ease: EASE.inOut },
  SNAP: { duration: 4, ease: EASE.expoOut },
  SLOW_PUSH: { duration: 150, ease: (t) => t },
  RAPID_PUSH: { duration: 10, ease: EASE.expoOut },
  HOLD: { duration: 1, ease: (t) => t },
};

export const REST: CameraPose = { x: 960, y: 540, scale: 1, rotY: 0 };

/** Pose of the camera at a frame, from a list of shots (sorted by `at`). */
export function cameraPose(frame: number, shots: CameraShot[], start: CameraPose = REST): CameraPose {
  let pose = { ...start };
  for (const s of shots) {
    if (frame < s.at) break;
    const tm = MOVE_TIMING[s.move];
    const t = tm.ease(clamp01((frame - s.at) / (s.duration ?? tm.duration)));
    const target = { ...pose, ...s.to };
    pose = { x: lerp(pose.x, target.x, t), y: lerp(pose.y, target.y, t), scale: lerp(pose.scale, target.scale, t), rotY: lerp(pose.rotY, target.rotY, t) };
  }
  return pose;
}

/** Impacts: a quick scale kick (+3 % max) and a 2-3 px shake that dies in ~8 frames. */
export function impactAt(frame: number, impacts: CameraImpact[]) {
  let kick = 0, dx = 0, dy = 0;
  for (const i of impacts) {
    const t = frame - i.at;
    if (t < 0 || t > 14) continue;
    const k = (i.strength ?? 1) * Math.exp(-t / 3.2);
    kick += 0.03 * k;
    dx += Math.sin(t * 2.7) * 3 * k;
    dy += Math.cos(t * 3.1) * 2 * k;
  }
  return { kick, dx, dy };
}

/** Wraps a world laid out in 1920×1080 coordinates and films it with the camera grammar. */
export const CameraRig: React.FC<{ shots: CameraShot[]; impacts?: CameraImpact[]; start?: CameraPose; children: React.ReactNode }> = ({ shots, impacts = [], start, children }) => {
  const frame = useCurrentFrame();
  const p = cameraPose(frame, shots, start);
  const im = impactAt(frame, impacts);
  const s = p.scale * (1 + im.kick);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', perspective: 2400 }}>
      <div
        style={{
          position: 'absolute', left: 0, top: 0, width: 1920, height: 1080,
          transformOrigin: '0 0',
          transform: `translate(${960 + im.dx}px, ${540 + im.dy}px) rotateY(${p.rotY}deg) scale(${s}) translate(${-p.x}px, ${-p.y}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

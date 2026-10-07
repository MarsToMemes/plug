import React from 'react';
import { useCurrentFrame } from 'remotion';

/**
 * Titles animate in REAL time, even inside a scene whose own time is stretched or compressed to
 * follow the voice. The episode provides the mapping; a scene rendered alone uses its own frames.
 *   now:    the current frame, in real frames
 *   toReal: a scene frame -> the real frame where it is shown
 */
export type TimeMap = { now: number; toReal: (sceneFrame: number) => number };
export const TimeMapContext = React.createContext<TimeMap | null>(null);

/** Milliseconds of real time elapsed since a scene frame (negative before it). */
export function useElapsed() {
  const f = useCurrentFrame();
  const map = React.useContext(TimeMapContext);
  return (sceneFrame: number) => (map ? (map.now - map.toReal(sceneFrame)) : f - sceneFrame) * (1000 / 30);
}

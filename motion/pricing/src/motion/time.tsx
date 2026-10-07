import React from 'react';
import { Easing, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Time and phases — the core of the motion language.
 *
 * A movement is not one tween: it is a short sequence of PHASES (anticipation, entry, impact,
 * overshoot, settle, hold, exit), each with its own duration and curve. `phases()` evaluates such
 * a sequence; times are milliseconds so a choreography reads like a timing sheet.
 */
export type Ease = (t: number) => number;

const bz = (a: number, b: number, c: number, d: number): Ease => Easing.bezier(a, b, c, d);
export const C = {
  linear: (t: number) => t,
  /** anticipation: the object gathers itself (slow start). */
  anticipate: bz(0.55, 0, 0.85, 0.35),
  /** entry: leaves fast, arrives softly. */
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  /** impact: a short, light back.out. */
  impact: (t: number) => { const s = 1.05, c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
  /** settling: quart.out. */
  settle: (t: number) => 1 - Math.pow(1 - t, 4),
  /** exit: power3.in — leaves faster than it came. */
  exit: (t: number) => t * t * t * t,
  /** whip: almost instant in the middle, soft at both ends. */
  whip: bz(0.85, 0, 0.15, 1),
  /** a long editorial glide (camera, slow push). */
  glide: bz(0.3, 0.05, 0.12, 1),
  inOut: bz(0.65, 0, 0.35, 1),
  power2In: (t: number) => t * t,
} as const;

/** One phase: lasts `ms`, goes to `to`, with a curve. `ms` alone (no `to`) is a hold. */
export type Phase = [ms: number, to?: number, ease?: Ease];

/**
 * Value of a phase sequence at time t (ms). Starts at `from` at time `at`, then each phase moves
 * to its target over its duration. Before `at`: `from`. After the last phase: the last value.
 */
export function phases(t: number, at: number, from: number, list: Phase[]): number {
  let v = from, start = at;
  if (t <= at) return from;
  for (const [ms, to, ease] of list) {
    const end = start + ms;
    const target = to ?? v;
    if (t < end) return v + (target - v) * (ease ?? C.settle)((t - start) / ms);
    v = target;
    start = end;
  }
  return v;
}

/** Total duration of a phase list. */
export const span = (list: Phase[]) => list.reduce((a, [ms]) => a + ms, 0);

/** Motion time (ms). A provider can shift it (motion-blur samples render the same tree earlier). */
const Offset = React.createContext(0);
export const TimeOffset: React.FC<{ ms: number; children: React.ReactNode }> = ({ ms, children }) => {
  const parent = React.useContext(Offset);
  return <Offset.Provider value={parent + ms}>{children}</Offset.Provider>;
};
/** A clock override (ms): lets a title run in REAL time inside a scene stretched on the voice. */
export const ClockContext = React.createContext<number | null>(null);
export function useT() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clock = React.useContext(ClockContext);
  return (clock ?? (f / fps) * 1000) - React.useContext(Offset);
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0 → 1 between two times, with a curve. */
export const ramp = (t: number, a: number, b: number, ease: Ease = C.settle) => ease(clamp((t - a) / (b - a)));

/** Absolute keyframes: [time ms, value, curve of the segment that ARRIVES at this key]. */
export type Key = [ms: number, v: number, ease?: Ease];
export function keys(t: number, list: Key[]): number {
  if (t <= list[0]![0]) return list[0]![1];
  for (let k = 1; k < list.length; k++) {
    const [t1, v1, e] = list[k]!, [t0, v0] = list[k - 1]!;
    if (t <= t1) return t1 === t0 ? v1 : v0 + (v1 - v0) * (e ?? C.settle)((t - t0) / (t1 - t0));
  }
  return list[list.length - 1]![1];
}

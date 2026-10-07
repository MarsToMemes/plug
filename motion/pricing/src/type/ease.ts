import { Easing } from 'remotion';

/**
 * Easing curves of the title system. Names follow the usual motion vocabulary (GSAP):
 * power3.out = quart.out = 1-(1-t)^4, power4.out = quint = 1-(1-t)^5.
 */
export type Ease = (t: number) => number;

export const E = {
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  power3Out: (t: number) => 1 - Math.pow(1 - t, 4),
  power4Out: (t: number) => 1 - Math.pow(1 - t, 5),
  quartOut: (t: number) => 1 - Math.pow(1 - t, 4),
  /** back.out, very light: a 2-4 % overshoot, never a bounce. */
  backOut: (s = 0.9) => (t: number) => { const c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
  /** Editorial: fast start, very long settle (for reveals and conclusions). */
  settle: Easing.bezier(0.12, 0.84, 0.18, 1),
  /** A push that gathers speed, then lands: for impacts. */
  strike: Easing.bezier(0.6, 0, 0.12, 1),
  /** Exits leave faster than they came. */
  exit: Easing.bezier(0.55, 0, 0.9, 0.4),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
} as const;

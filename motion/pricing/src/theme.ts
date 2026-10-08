import { Easing } from 'remotion';

/** Visual language of the documentary: near-black ground, warm paper ink, one accent for change. */
export const THEME = {
  bg: '#0d0e10',
  ink: '#f1ede4',
  muted: '#8c8a85',
  faint: '#3a3b3e',
  line: '#5d5e61',
  accent: '#ff5b35', // a price that moves, a tension
  cool: '#8fb2d9', // the second series (hotel), never competing with the accent
  serif: "'Instrument Serif', Geist, Georgia, serif", // Geist supplies the glyphs Instrument Serif lacks (→)
  sans: 'Geist, Inter, Helvetica, Arial, sans-serif',
  mono: "'Geist Mono', ui-monospace, monospace",
  wide: "Archivo, Geist, Helvetica, sans-serif", // reel language: weight 900, font-stretch 125 %
} as const;

export const EASE = {
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic pseudo-random generator (no Math.random in renders). */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const euro = (v: number) => `${Math.round(v)} €`;

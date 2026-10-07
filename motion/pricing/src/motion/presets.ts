import { C, clamp, mix, phases, type Phase } from './time';

/**
 * TYPO_* — the motion library. Each preset is a small choreography for one unit (a letter, a
 * word or a line) as a function of time: it returns a POSE. Phases, not tweens: every preset is
 * written as anticipation → entry → impact → overshoot → settle (→ hold), with its own timings.
 *
 * Params: `at` start (ms) · `speed` (×durations) · `intensity` (×distances) · `dir` (±1, side) ·
 * `stagger` base gap between units (ms; the actual gaps are irregular, see gaps()).
 */
export type Pose = {
  x: number; y: number; // em
  sx: number; sy: number; scale: number; rot: number; // deg
  track: number; // extra tracking, em
  o: number; blur: number; // px
  reveal: number; // 1 = fully out of its mask, 0 = hidden below the line (masked units only)
  weight: number; // added to the font weight (variable fonts)
};
export const REST: Pose = { x: 0, y: 0, sx: 1, sy: 1, scale: 1, rot: 0, track: 0, o: 1, blur: 0, reveal: 1, weight: 0 };

export type Params = { at: number; speed?: number; intensity?: number; dir?: 1 | -1; stagger?: number; mode?: string };
export type Recipe = {
  split: 'char' | 'word' | 'line';
  mask?: boolean; // units live in a clipping window
  smear?: number; // motion-blur samples (fast presets)
  shutter?: number; // ms
  /** Pose of unit i (of n) at time t (ms). `t0` is the unit's own start, already staggered. */
  pose: (t: number, t0: number, i: number, n: number, p: Required<Params>) => Pose;
};

/** Irregular gaps: a human rhythm, never 300/300/300. */
const RHYTHM = [1, 0.62, 1.38, 0.78, 1.16, 0.7, 1.27, 0.9];
export const gaps = (i: number, base: number) => { let s = 0; for (let k = 0; k < i; k++) s += base * RHYTHM[k % RHYTHM.length]!; return s; };

/** Accelerating gaps: each one 30 % shorter than the previous (time speeding up). */
export const accel = (i: number, base: number) => { let s = 0; for (let k = 0; k < i; k++) s += base * Math.pow(0.7, k); return s; };

const P = (t: number, t0: number, from: number, list: Phase[], speed: number) => phases(t, t0, from, list.map(([ms, to, e]) => [ms * speed, to, e] as Phase));

export const PRESETS: Record<string, Recipe> = {
  // A word written out of a line, letter by letter: each letter rises, overshoots its baseline, settles.
  TYPO_REVEAL: { split: 'char', mask: true, pose: (t, t0, _i, _n, p) => ({
    ...REST,
    reveal: P(t, t0, 0, [[260, 1.06, C.expoOut], [140, 1, C.settle]], p.speed),
    sy: P(t, t0, 1.18, [[260, 0.96, C.expoOut], [160, 1, C.settle]], p.speed),
  }) },

  // A blow: drops in a little larger and squashed, hits, overshoots, settles; blur at the hit.
  TYPO_IMPACT: { split: 'line', smear: 8, shutter: 30, pose: (t, t0, _i, _n, p) => ({
    ...REST,
    scale: P(t, t0, 1.45, [[90, 1.45, C.linear], [190, 0.97, C.expoOut], [130, 1.015, C.settle], [160, 1, C.settle]], p.speed),
    sx: P(t, t0, 0.82, [[90, 0.8, C.anticipate], [190, 1.06, C.expoOut], [200, 1, C.settle]], p.speed),
    sy: P(t, t0, 1.2, [[280, 0.94, C.expoOut], [200, 1, C.settle]], p.speed),
    o: P(t, t0, 0, [[120, 1, C.settle]], p.speed),
    blur: P(t, t0, 10, [[240, 0, C.expoOut]], p.speed),
  }) },

  // The hero entrance: compressed off frame (anticipation), fast entry, passes its place (impact),
  // scale 1.00 → 1.08 → 0.98 → 1.00, tracking tightens, then still.
  TYPO_SLAM: { split: 'line', smear: 10, shutter: 40, pose: (t, t0, _i, _n, p) => ({
    ...REST,
    x: p.dir * p.intensity * P(t, t0, 7, [[180, 7.4, C.anticipate], [320, -0.16, C.expoOut], [90, -0.16, C.linear], [140, 0.03, C.impact], [220, 0, C.settle]], p.speed),
    sx: P(t, t0, 0.7, [[180, 0.66, C.anticipate], [320, 1.06, C.expoOut], [230, 1, C.settle]], p.speed),
    scale: P(t, t0, 1, [[500, 1, C.linear], [90, 1.08, C.expoOut], [140, 0.98, C.inOut], [160, 1, C.settle]], p.speed),
    track: P(t, t0, 0.12, [[500, 0.08, C.expoOut], [600, 0, C.settle]], p.speed),
  }) },

  // A word carried by a push: comes from the side, stretched by its speed, lands.
  TYPO_PUSH: { split: 'word', smear: 8, shutter: 34, pose: (t, t0, _i, _n, p) => ({
    ...REST,
    x: -p.dir * p.intensity * P(t, t0, 3.2, [[120, 3.3, C.anticipate], [380, 0, C.expoOut]], p.speed),
    sx: P(t, t0, 1.3, [[120, 1.34, C.anticipate], [300, 0.97, C.expoOut], [200, 1, C.settle]], p.speed),
    o: P(t, t0, 0, [[140, 1, C.settle]], p.speed),
  }) },

  // Comes from the camera: very large and soft, pulls back into place and sharpens.
  TYPO_PULL: { split: 'line', smear: 8, shutter: 30, pose: (t, t0, _i, _n, p) => ({
    ...REST,
    scale: P(t, t0, 2.6, [[520, 0.985, C.expoOut], [260, 1, C.settle]], p.speed),
    blur: P(t, t0, 16, [[420, 0, C.expoOut]], p.speed),
    o: P(t, t0, 0, [[180, 1, C.settle]], p.speed),
    track: P(t, t0, -0.04, [[700, 0, C.settle]], p.speed),
  }) },

  // Letters part from the centre outwards, alternating sides, and close up again.
  TYPO_SPLIT: { split: 'char', smear: 8, pose: (t, t0, i, n, p) => {
    const side = i < (n - 1) / 2 ? -1 : i > (n - 1) / 2 ? 1 : 0, far = Math.abs(i - (n - 1) / 2);
    return { ...REST, x: side * p.intensity * P(t, t0, 1.6 + far * 0.35, [[420, 0, C.expoOut], [1, 0]], p.speed), o: P(t, t0, 0, [[160, 1, C.settle]], p.speed), blur: P(t, t0, 6, [[300, 0, C.expoOut]], p.speed) };
  } },

  // Two words from opposite sides meet; at contact both compress, then recover.
  TYPO_COLLISION: { split: 'word', smear: 9, shutter: 36, pose: (t, t0, i, _n, p) => {
    const side = i % 2 ? 1 : -1;
    return { ...REST,
      x: side * p.intensity * P(t, t0, 6, [[340, -0.12, C.expoOut], [120, 0, C.impact]], p.speed),
      sx: P(t, t0, 1.18, [[340, 0.86, C.expoOut], [90, 0.86, C.linear], [200, 1, C.impact]], p.speed),
      sy: P(t, t0, 1, [[340, 1.08, C.expoOut], [290, 1, C.settle]], p.speed),
    };
  } },

  // Vertical expansion from the baseline: the word grows up (DEMANDE ↑).
  TYPO_STRETCH: { split: 'char', mask: true, pose: (t, t0, _i, _n, p) => ({
    ...REST,
    reveal: P(t, t0, 0, [[200, 1, C.expoOut]], p.speed),
    sy: P(t, t0, 0.2, [[120, 0.15, C.anticipate], [360, 1.28 * p.intensity, C.expoOut], [240, 1.12, C.settle]], p.speed),
    track: P(t, t0, -0.02, [[700, 0.01, C.settle]], p.speed),
  }) },

  // Compression and fading: the word loses height and presence (DISPONIBILITÉ ↓).
  TYPO_COMPRESS: { split: 'char', pose: (t, t0, _i, _n, p) => ({
    ...REST,
    sy: P(t, t0, 1, [[140, 1.06, C.anticipate], [520, 0.32, C.expoOut], [200, 0.36, C.settle]], p.speed),
    track: P(t, t0, 0.04, [[660, -0.03, C.expoOut]], p.speed),
    o: P(t, t0, 1, [[660, 0.45, C.settle]], p.speed),
    y: P(t, t0, 0, [[660, 0.32, C.expoOut]], p.speed),
  }) },

  // A line cut into the frame: rises from behind its mask, a hair of rotation as it lands.
  TYPO_MASK: { split: 'line', mask: true, pose: (t, t0, _i, _n, p) => ({
    ...REST,
    reveal: P(t, t0, 0, [[380, 1, C.expoOut]], p.speed),
    rot: p.dir * P(t, t0, 2.2, [[380, -0.2, C.expoOut], [260, 0, C.settle]], p.speed),
  }) },

  // A word that becomes another: the letters squash into a line, the new ones unfold from it.
  // (Used with Typo's `from`: first half plays the old text out, second half the new one in.)
  TYPO_MORPH: { split: 'char', pose: (t, t0, _i, _n, p) => ({
    ...REST,
    sy: P(t, t0, 0.04, [[220, 1.14, C.expoOut], [180, 1, C.settle]], p.speed),
    track: P(t, t0, 0.3, [[400, 0, C.expoOut]], p.speed),
    o: P(t, t0, 0, [[60, 1, C.linear]], p.speed),
  }) },

  // Monumental to measured: comes in huge with wide tracking, scales down and tightens.
  TYPO_SCALE: { split: 'line', pose: (t, t0, _i, _n, p) => ({
    ...REST,
    scale: P(t, t0, 3.2, [[640, 0.99, C.expoOut], [240, 1, C.settle]], p.speed),
    track: P(t, t0, 0.5, [[760, 0, C.expoOut]], p.speed),
    o: P(t, t0, 0, [[200, 1, C.settle]], p.speed),
    blur: P(t, t0, 8, [[360, 0, C.expoOut]], p.speed),
  }) },

  // Into focus: no translation at all, only blur → sharp and tracking closing (a question).
  TYPO_FOCUS: { split: 'word', pose: (t, t0, _i, _n, p) => ({
    ...REST,
    blur: P(t, t0, 18, [[700, 0, C.glide]], p.speed),
    track: P(t, t0, 0.28, [[900, 0, C.glide]], p.speed),
    scale: P(t, t0, 1.05, [[900, 1, C.glide]], p.speed),
    o: P(t, t0, 0, [[300, 1, C.settle]], p.speed),
  }) },

  // Static type, the camera does the work (see Camera): the unit only settles its tracking.
  TYPO_CAMERA: { split: 'line', pose: (t, t0, _i, _n, p) => ({ ...REST, track: P(t, t0, 0.06, [[1200, 0, C.glide]], p.speed), o: P(t, t0, 0, [[200, 1]], p.speed) }) },

  // Letters on different depths drifting at different speeds (each letter its own plane).
  TYPO_PARALLAX: { split: 'char', pose: (t, t0, i, n, p) => {
    const depth = 0.6 + ((i * 7) % n) / n; // a scattered depth per letter
    const d = (t - t0) / 1000;
    return { ...REST, x: p.dir * p.intensity * (1 - depth) * (P(t, t0, 1.4, [[600, 0, C.expoOut]], p.speed) - d * 0.25), scale: mix(0.96, 1.04, depth - 0.6), o: P(t, t0, 0, [[220, 1]], p.speed) };
  } },

  // Whip: arrives in a few frames with a strong blur, almost no settle.
  TYPO_WHIP: { split: 'line', smear: 11, shutter: 44, pose: (t, t0, _i, _n, p) => ({
    ...REST,
    x: p.dir * p.intensity * P(t, t0, 9, [[230, -0.08, C.whip], [150, 0, C.settle]], p.speed),
    sx: P(t, t0, 1.25, [[230, 1, C.whip]], p.speed),
  }) },

  // Count (see CountNumber): units are digits; this pose only lifts them in.
  TYPO_COUNT: { split: 'char', mask: true, pose: (t, t0, _i, _n, p) => ({ ...REST, reveal: P(t, t0, 0, [[320, 1, C.expoOut]], p.speed) }) },

  // A change of state: the word oscillates between two states, the oscillation dies out
  // ("JAMAIS FIXE"): position and weight never quite settle, then do.
  TYPO_TRANSFORM: { split: 'char', pose: (t, t0, i, _n, p) => {
    const d = Math.max(0, t - t0) / p.speed, damp = Math.exp(-d / 700), w = Math.sin(d / 55 + i * 0.9);
    return { ...REST, x: 0.06 * w * damp * p.intensity, weight: 260 * Math.max(0, w) * damp, sx: 1 + 0.05 * w * damp, o: clamp(d / 120) };
  } },

  // Lines stack from below, each pushing the stack up (one block after another).
  TYPO_STACK: { split: 'line', mask: true, pose: (t, t0, _i, _n, p) => ({
    ...REST,
    reveal: P(t, t0, 0, [[300, 1, C.expoOut]], p.speed),
    y: P(t, t0, 0.5, [[300, -0.04, C.expoOut], [160, 0, C.settle]], p.speed),
  }) },

  // Multiplication: each letter is born from one point and streams to its place (data flow).
  TYPO_EXPLODE: { split: 'char', smear: 8, shutter: 30, pose: (t, t0, i, n, p) => {
    const ang = (i / n) * Math.PI * 2 + 0.6;
    const k = P(t, t0, 0, [[420, 1, C.expoOut]], p.speed);
    return { ...REST, x: (1 - k) * Math.cos(ang) * 3 * p.intensity - (1 - k) * (i - (n - 1) / 2) * 0.6, y: (1 - k) * Math.sin(ang) * 1.6 * p.intensity, scale: mix(0.2, 1, k), o: clamp(k * 3), rot: (1 - k) * 40 * (i % 2 ? 1 : -1) };
  } },
};

export type PresetName = keyof typeof PRESETS;

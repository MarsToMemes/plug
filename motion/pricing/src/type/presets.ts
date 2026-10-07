import { E, type Ease } from './ease';

/**
 * Kinetic typography — central configuration. Every big title of the film picks ONE family,
 * chosen for what the text does in the story (its role), never for variety's sake.
 * Distances are in em (they scale with the title), times in milliseconds of real time.
 */
export type Family =
  | 'TITLE_REVEAL' | 'TITLE_SLIDE' | 'TITLE_SCALE' | 'TITLE_MASK' | 'TITLE_SPLIT' | 'TITLE_COLLISION'
  | 'TITLE_PUSH' | 'TITLE_FOCUS' | 'TITLE_MORPH' | 'TITLE_COUNT' | 'TITLE_REVEAL_SLOW' | 'TITLE_IMPACT';

export type Role = 'main' | 'subtitle' | 'figure' | 'question' | 'reveal' | 'contrast' | 'keyword' | 'quote' | 'chapter' | 'conclusion';

/** A pose relative to the rest state: offsets (em), scale factors, extra tracking (em), blur (px). */
export type Pose = { x?: number; y?: number; scale?: number; scaleX?: number; tracking?: number; blur?: number; rotate?: number; opacity?: number };

export type CameraMove = { move: 'push' | 'pull' | 'drift' | 'kick' | 'none'; amount: number; dur: number };

export type Preset = {
  /** What moves as one piece: a block (line of the hierarchy), a word, or a character. */
  split: 'block' | 'word' | 'char';
  dur: number;
  stagger: number;
  ease: Ease;
  from: Pose;
  /** Units rise from behind an invisible line (the text is "cut" into the frame). */
  mask?: boolean;
  /** Successive blocks come from opposite sides. */
  alternate?: boolean;
  /** The focal block: its own timing and a little more weight at rest. */
  focus?: { dur: number; ease: Ease; delay: number; scale: number; tracking: number };
  camera?: CameraMove;
  /** Velocity blur along the movement (0 = none, 1 = full). Always subtle. */
  motionBlur?: number;
  exit: { dur: number; stagger: number; to: Pose; ease?: Ease };
};

export const PRESETS: Record<Exclude<Family, 'TITLE_COUNT'>, Preset> = {
  // A short word written into place, letter by letter, from behind a line. For names and signs.
  TITLE_REVEAL: { split: 'char', dur: 520, stagger: 40, ease: E.expoOut, mask: true, from: { y: 1.05, blur: 2 }, exit: { dur: 320, stagger: 20, to: { y: -1.05 } } },
  // Time passes, things move on: lateral entry with inertia, then a slow drift.
  TITLE_SLIDE: { split: 'word', dur: 650, stagger: 70, ease: E.power4Out, from: { x: -0.9, blur: 4, opacity: 0 }, motionBlur: 0.8, camera: { move: 'drift', amount: 18, dur: 4000 }, exit: { dur: 340, stagger: 30, to: { x: 0.6, opacity: 0, blur: 4 } } },
  // A quantity that grows: each word rises a little higher and larger than the previous one.
  TITLE_SCALE: { split: 'word', dur: 800, stagger: 110, ease: E.settle, from: { y: 0.45, scale: 0.82, blur: 6, opacity: 0 }, focus: { dur: 950, ease: E.settle, delay: 60, scale: 1.12, tracking: 0.02 }, camera: { move: 'push', amount: 0.03, dur: 2400 }, exit: { dur: 360, stagger: 40, to: { scale: 1.04, opacity: 0, blur: 6 } } },
  // A statement cut into the frame, line by line, with a hair of rotation as it lands.
  TITLE_MASK: { split: 'block', dur: 720, stagger: 110, ease: E.power4Out, mask: true, from: { y: 1.1, rotate: 1.2 }, focus: { dur: 820, ease: E.power4Out, delay: 260, scale: 1, tracking: -0.02 }, exit: { dur: 380, stagger: 60, to: { y: -1.1 }, ease: E.exit } },
  // A hierarchy built block by block, from alternate sides; the focal block lands last and harder.
  TITLE_SPLIT: { split: 'block', dur: 640, stagger: 120, ease: E.power3Out, alternate: true, from: { x: -1.1, blur: 5, opacity: 0 }, motionBlur: 0.7, focus: { dur: 420, ease: E.backOut(0.7), delay: 80, scale: 1.08, tracking: -0.01 }, camera: { move: 'push', amount: 0.035, dur: 1800 }, exit: { dur: 380, stagger: 50, to: { opacity: 0, blur: 6, y: -0.2 } } },
  // Two opposite ideas come from opposite sides and meet.
  TITLE_COLLISION: { split: 'block', dur: 620, stagger: 0, ease: E.expoOut, alternate: true, from: { x: -2.6, scaleX: 1.12, blur: 6, opacity: 0 }, motionBlur: 1, camera: { move: 'kick', amount: 0.022, dur: 620 }, exit: { dur: 380, stagger: 0, to: { opacity: 0, blur: 6 } } },
  // An action that carries the word: fast lateral push with motion blur, then inertia.
  TITLE_PUSH: { split: 'word', dur: 560, stagger: 60, ease: E.expoOut, from: { x: -2.4, scaleX: 1.2, opacity: 0 }, motionBlur: 1, camera: { move: 'drift', amount: 30, dur: 2500 }, exit: { dur: 300, stagger: 30, to: { x: 1.6, scaleX: 1.15, opacity: 0 } } },
  // A question coming into focus: from blurred and wide to sharp and tight; the camera leans in.
  TITLE_FOCUS: { split: 'block', dur: 900, stagger: 110, ease: E.settle, from: { blur: 12, tracking: 0.14, opacity: 0 }, focus: { dur: 760, ease: E.settle, delay: 100, scale: 1.05, tracking: -0.005 }, camera: { move: 'push', amount: 0.02, dur: 2600 }, exit: { dur: 400, stagger: 40, to: { blur: 10, opacity: 0, tracking: 0.08 } } },
  // A sentence that becomes the next one at the same place: tracking opens, blur, then closes.
  TITLE_MORPH: { split: 'block', dur: 620, stagger: 60, ease: E.power3Out, from: { tracking: 0.3, scaleX: 1.06, blur: 9, opacity: 0 }, exit: { dur: 360, stagger: 30, to: { tracking: 0.3, blur: 9, opacity: 0 } } },
  // A conclusion: slow, out of the blur, line by line, the key word settling last; the camera slows into it.
  TITLE_REVEAL_SLOW: { split: 'block', dur: 1300, stagger: 120, ease: E.settle, from: { y: 0.25, blur: 12, tracking: 0.08, opacity: 0 }, focus: { dur: 1500, ease: E.settle, delay: 220, scale: 1.06, tracking: 0.02 }, camera: { move: 'push', amount: 0.035, dur: 4200 }, exit: { dur: 600, stagger: 60, to: { blur: 8, opacity: 0 } } },
  // A blow: the word drops in from slightly larger, compressed, and the frame takes the impact.
  TITLE_IMPACT: { split: 'block', dur: 380, stagger: 110, ease: E.expoOut, from: { scale: 1.32, scaleX: 0.86, blur: 8, opacity: 0 }, motionBlur: 0.4, focus: { dur: 320, ease: E.backOut(1.1), delay: 0, scale: 1.0, tracking: -0.01 }, camera: { move: 'kick', amount: 0.03, dur: 380 }, exit: { dur: 320, stagger: 40, to: { opacity: 0, scale: 0.97, blur: 5 } } },
};

/** The default family for a role (a title can still choose another one for its meaning). */
export const ROLE_FAMILY: Record<Role, Family> = {
  main: 'TITLE_MASK', subtitle: 'TITLE_SLIDE', figure: 'TITLE_COUNT', question: 'TITLE_FOCUS', reveal: 'TITLE_REVEAL_SLOW',
  contrast: 'TITLE_COLLISION', keyword: 'TITLE_SCALE', quote: 'TITLE_MASK', chapter: 'TITLE_SPLIT', conclusion: 'TITLE_REVEAL_SLOW',
};

/** The count: digits roll one by one (right to left), the new value lands heavier. */
export const COUNT = { appear: 520, roll: 760, stagger: 70, ease: E.power4Out, land: E.backOut(1.0), weight: 1.12, camera: { move: 'kick', amount: 0.02, dur: 500 } as CameraMove };

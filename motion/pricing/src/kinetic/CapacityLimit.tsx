import React from 'react';
import { useCurrentFrame } from 'remotion';
import { THEME, lerp, rng } from '../theme';
import { KineticLetters, type Choreo, type Pose } from './KineticLetters';
import { layoutChars, trackingForWidth } from './layout';

/**
 * « Une capacité limitée, à un moment précis, avant qu'elle ne disparaisse. » (voice 9:48–9:53)
 * told only by the behaviour of the letters, each one an independent element:
 *
 *   PETIT      CAPACITÉ, compact and perfectly set, emerges where the previous words converged
 *   EXPANSION  every letter grows on its own curve and delay; the camera pushes in with it
 *   ÉNORME     the word no longer fits: its outer letters leave the frame, the rest trembles
 *   CONTRAINTE a short wind-up (anticipation)…
 *   COMPRESSION …then a brutal contraction, letter by letter: strong acceleration, hard stop,
 *              squash & spring, the outer letters slam into the inner ones (collisions), camera shake
 *   LIMITE     LIMITÉE is pulled in from the negative space the contraction left on both sides,
 *              wide tracking compressed down to exactly the width of CAPACITÉ (one justified block)
 *   then « à un moment précis » typed letter by letter on the voice, and on « disparaisse » the
 *   letters collapse into points that fly to the nodes of the system (scene 18).
 *
 * Everything is a function of the voice time (seconds) and of the real font metrics.
 */
export const CAPACITY = { from: 587.95, to: 593.5 };
const T = {
  appear: 588.0, grow: 588.3, pause: 588.62, resume: 588.7, peak: 589.28, snap: 589.34,
  limit: 589.42, hold: 590.6, vanish: 592.48, toSys: 592.8, fadeOut: 593.28,
};
const WORDS: Array<[string, number, number]> = [['À', 590.22, 590.5], ['UN', 590.5, 590.66], ['MOMENT', 590.66, 590.96], ['PRÉCIS', 590.96, 591.4]];
const C = { x: 960, y: 520 };
const S0 = 84, S1 = 168, WPEAK = 3.1, WEIGHT = 800;
const sans = (size: number, tracking: number) => ({ size, font: 'sans' as const, weight: WEIGHT, tracking, upper: true });
// The system's six nodes in scene 18 (where the points land).
const SYS = Array.from({ length: 6 }, (_, k) => { const a = -Math.PI / 2 + (k / 6) * Math.PI * 2; return { x: 960 + Math.cos(a) * 544, y: 540 + Math.sin(a) * 357, a }; });

// Curves.
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const inOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const expoOut = (u: number) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
const springIn = (u: number) => (u <= 0 ? 0 : 1 - Math.exp(-6 * u) * Math.cos(10 * u)); // 0 → 1 with overshoot

/** Per-letter personality: delay, growth curve, depth, drift, rotation, phase (deterministic). */
function traits(n: number, seed: number) {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({ dl: r() * 0.1, p: 2.2 + r() * 1.2, depth: 0.9 + r() * 0.2, jy: r() * 2 - 1, rot: r() * 2 - 1, ph: r() * Math.PI * 2, jit: r() * 2 - 1 }));
}

export const CapacityLimit: React.FC = () => {
  const t = useCurrentFrame() / 30;
  if (t < CAPACITY.from || t > CAPACITY.to) return null;

  // ---- Layout (real metrics): compact word, final block, justified second line, caption.
  const small = layoutChars('Capacité', sans(S0, -0.02));
  const cap = layoutChars('Capacité', sans(S1, -0.035));
  const w1 = cap.width;
  const lim = layoutChars('Limitée', sans(S1, trackingForWidth('Limitée', sans(S1, 0), w1)));
  const capt = layoutChars('À un moment précis', { size: 30, font: 'mono', weight: 500, tracking: 0.3, upper: true });
  const gap = 48, blockH = cap.cap * 2 + gap, top = C.y - blockH / 2;
  const y1 = top + cap.cap / 2, y2 = top + cap.cap + gap + cap.cap / 2;
  const yC = y2 + cap.cap / 2 + 64 + capt.cap / 2, left = C.x - w1 / 2;
  const half = Math.max(...cap.chars.map((c) => Math.abs(c.x)));
  const tr = traits(8, 1601), tl = traits(7, 1602);

  // ---- The camera: pushes in with the expansion (accelerating), a slight roll at the peak.
  const camU = clamp((t - T.grow) / (T.peak - T.grow));
  const Z = t < T.snap ? 1 + 1.0 * Math.pow(camU, 2.2) : 1;
  const roll = t < T.snap ? -1.4 * camU * camU : 0;
  // Slow push during the hold (nothing is ever frozen), applied to the final block.
  const G = 1 + 0.03 * inOut(clamp((t - T.hold) / (T.vanish - T.hold)));

  /** World scale of a letter during the expansion: grow, micro-pause, accelerate, wind-up. */
  const growth = (tt: number, p: number) => {
    if (tt <= T.grow) return 1;
    if (tt < T.pause) return lerp(1, 1.3, inOut((tt - T.grow) / (T.pause - T.grow)));
    if (tt < T.resume) return 1.3;
    if (tt < T.peak) return lerp(1.3, WPEAK, Math.pow((tt - T.resume) / (T.peak - T.resume), p));
    return WPEAK * (1 + 0.035 * inOut(clamp((tt - T.peak) / (T.snap - T.peak)))); // anticipation
  };

  /**
   * CAPACITÉ before the contraction (appear + expansion), screen space. Each letter has its own
   * size; the word is RE-LAID OUT every frame from those sizes (each letter's advance at its own
   * scale, plus a tracking that opens with the tension), so a letter that grows faster pushes its
   * neighbours instead of covering them. The word stays centred on the expansion point.
   */
  const expandAll = (tt: number): Pose[] => {
    const st = small.chars.map((c, i) => {
      const q = tr[i]!, rank = Math.abs(c.x) / half; // the centre appears first
      const a = T.appear + rank * 0.12 + q.jit * 0.015, u = clamp((tt - a) / 0.32);
      const W = growth(tt - q.dl, q.p), tension = clamp((W - 1) / (WPEAK - 1), 0, 1.1);
      const Zi = 1 + (Z - 1) * q.depth; // depth: parallax between letters
      const size = S0 * W * Zi * lerp(0.5, 1, springIn(u));
      const k = size / S0;
      // Advance of this letter at its size, tracking opening with the tension (-2 % → +8 %).
      const adv = c.advance * k + (-0.02 + 0.1 * tension) * size;
      const inkOff = ((c.inkL + c.inkR) / 2 - c.advance / 2) * k; // ink centre vs advance centre
      return { a, u, tension, size, adv, inkOff, q };
    });
    const total = st.reduce((acc, x) => acc + x.adv, 0);
    let pen = -total / 2;
    const cr = Math.cos((roll * Math.PI) / 180), sr = Math.sin((roll * Math.PI) / 180);
    return st.map((x) => {
      let rx = pen + x.adv / 2 + x.inkOff;
      pen += x.adv;
      let ry = x.q.jy * 0.05 * x.size * x.tension + (1 - expoOut(x.u)) * 0.18 * S0;
      [rx, ry] = [rx * cr - ry * sr, rx * sr + ry * cr];
      const tremble = Math.pow(x.tension, 4) * 0.006 * x.size * Math.sin(2 * Math.PI * 11 * tt + x.q.ph); // pressure
      return { x: C.x + rx + tremble, y: C.y + ry, size: x.size, rot: x.q.rot * 3 * x.tension + roll, o: clamp((tt - x.a) / 0.06) };
    });
  };
  const peakPose = expandAll(T.snap);

  // Contraction: outer letters arrive last and slam into the inner ones.
  const arrive = cap.chars.map((c, i) => T.snap + 0.12 + 0.1 * (Math.abs(c.x) / half) + tr[i]!.jit * 0.015);
  const lastArrival = Math.max(...arrive);
  const inward = (x: number) => (x < 0 ? 1 : -1);

  const capChoreo: Choreo = (tt) => cap.chars.map((c, i) => {
    if (tt < T.snap) return expandAll(tt)[i]!;
    const pk = peakPose[i]!, fx = C.x + c.x, fy = y1, dir = inward(c.x);
    const D = arrive[i]! - T.snap, u = clamp((tt - T.snap) / D);
    const over = dir * 0.05 * S1;
    let p: Pose;
    if (u < 1) {
      const e = Math.pow(u, 3.2), es = Math.pow(u, 2.4), speed = Math.pow(u, 2.2);
      p = { x: lerp(pk.x, fx + over, e), y: lerp(pk.y, fy, Math.pow(e, 0.9)), size: lerp(pk.size, S1, es), rot: (pk.rot ?? 0) * (1 - e), sx: 1 + 0.35 * speed, sy: 1 - 0.12 * speed };
    } else {
      const tau = tt - arrive[i]!, d = Math.exp(-11 * tau) * Math.cos(26 * tau);
      p = { x: fx + over * Math.exp(-13 * tau) * Math.cos(30 * tau), y: fy, size: S1, rot: 2.5 * dir * Math.exp(-10 * tau) * Math.sin(24 * tau), sx: 1 - 0.18 * d, sy: 1 + 0.13 * d };
    }
    // Collision: pushed inwards when the outer neighbour lands after this letter.
    const k = c.x < 0 ? i - 1 : i + 1;
    if (k >= 0 && k < cap.chars.length && arrive[k]! > arrive[i]! && tt > arrive[k]!) {
      const tau = tt - arrive[k]!;
      p.x += dir * 0.03 * S1 * Math.exp(-15 * tau) * Math.sin(32 * tau);
    }
    return hold(p, tt);
  });

  /** The final block breathes (slow push) and then the letters vanish into points. */
  function hold(p: Pose, tt: number): Pose {
    if (tt < T.hold) return p;
    return { ...p, x: C.x + (p.x - C.x) * G, y: C.y + (p.y - C.y) * G, size: p.size * G };
  }
  const vanishAt = (x: number, jit: number) => T.vanish + (1 - Math.min(1, Math.abs(x - C.x) / (w1 / 2))) * 0.16 + jit * 0.01;
  const shrink = (p: Pose, v: number, tt: number): Pose => { const u = clamp((tt - v) / 0.14); return { ...p, size: p.size * (1 - u * u) }; };

  // LIMITÉE: pulled in from the frame edges, then constrained to the width of CAPACITÉ.
  const limChoreo: Choreo = (tt) => lim.chars.map((c, j) => {
    const fx = C.x + c.x, dist = Math.abs(c.x) / (w1 / 2), q = tl[j]!;
    const s = T.limit + (1 - dist) * 0.05 + q.jit * 0.012, tau = tt - s;
    if (tau < 0) return { x: C.x + c.x * 2.5, y: y2, size: S1, o: 0 };
    const spread = tau < 0.3 ? lerp(2.5, 1.12, expoOut(tau / 0.3)) : 1 + 0.12 * Math.exp(-3.5 * (tau - 0.3)) * Math.cos(4.2 * (tau - 0.3));
    const fast = tau < 0.3 ? Math.pow(1 - tau / 0.3, 2) : 0;
    const settle = tau >= 0.3 ? Math.exp(-6 * (tau - 0.3)) * Math.sin(9 * (tau - 0.3)) : 0;
    const p: Pose = { x: C.x + (fx - C.x) * spread, y: y2, size: S1, sx: 1 + 0.25 * fast - 0.05 * settle, sy: 1 + 0.03 * settle, o: clamp(tau / 0.05), color: THEME.accent };
    return shrink(hold(p, tt), vanishAt(fx, q.jit), tt);
  });

  // « à un moment précis », typed letter by letter on the words of the voice.
  let wi = 0, li = 0;
  const captChars = capt.chars.map((c) => {
    if (c.ch === ' ') { wi++; li = 0; return { c, w: wi - 1, idx: -1 }; }
    return { c, w: wi, idx: li++ };
  });
  const captChoreo: Choreo = (tt) => captChars.map(({ c, w, idx }) => {
    const [word, a, b] = WORDS[Math.min(w, WORDS.length - 1)]!, at = a + (Math.max(0, idx) / Math.max(1, word.length)) * (b - a) * 0.85, u = clamp((tt - at) / 0.25);
    const p: Pose = { x: left + capt.width / 2 + c.x, y: yC + (1 - springIn(u)) * 12, size: 30, o: idx < 0 ? 0 : clamp((tt - at) / 0.05), color: w === 3 ? THEME.ink : THEME.muted };
    const vu = clamp((tt - T.vanish + 0.18) / 0.16); // the caption leaves just before the letters collapse
    return { ...hold(p, tt), o: (p.o ?? 1) * (1 - vu) };
  });

  // Points: each letter of the block collapses into a point, the points fly to the system's nodes.
  const dots: React.ReactNode[] = [];
  if (t >= T.vanish) {
    const glyphs = [...cap.chars.map((c, i) => ({ x: C.x + c.x, y: y1, jit: tr[i]!.jit })), ...lim.chars.map((c, j) => ({ x: C.x + c.x, y: y2, jit: tl[j]!.jit }))];
    glyphs.forEach((g, j) => {
      const v = vanishAt(g.x, g.jit), u = clamp((t - v) / 0.14);
      if (u <= 0) return;
      const sx = C.x + (g.x - C.x) * G, sy = C.y + (g.y - C.y) * G;
      const ang = Math.atan2(sy - 540, sx - 960);
      const node = SYS.reduce((best, n) => (Math.abs(Math.atan2(Math.sin(n.a - ang), Math.cos(n.a - ang))) < Math.abs(Math.atan2(Math.sin(best.a - ang), Math.cos(best.a - ang))) ? n : best), SYS[0]!);
      const w = inOut(clamp((t - T.toSys - j * 0.012) / 0.45));
      const o = 1 - clamp((t - T.fadeOut) / 0.17);
      dots.push(<circle key={j} cx={lerp(sx, node.x, w)} cy={lerp(sy, node.y, w)} r={lerp(7, 4, w) * Math.min(1, u * 1.6)} fill={j < 8 ? THEME.ink : THEME.accent} opacity={o} />);
    });
  }

  // Camera shake on the main collision.
  const st = t - lastArrival, shake = st > 0 && st < 0.3 ? { x: 8 * Math.exp(-18 * st) * Math.sin(60 * st), y: 5 * Math.exp(-18 * st) * Math.cos(47 * st) } : { x: 0, y: 0 };
  const capFinal: Choreo = (tt) => capChoreo(tt).map((p, i) => (tt >= T.vanish ? shrink(p, vanishAt(C.x + cap.chars[i]!.x, tr[i]!.jit), tt) : p));

  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <g transform={`translate(${shake.x.toFixed(2)},${shake.y.toFixed(2)})`}>
        <KineticLetters layout={cap} choreo={capFinal} t={t} idPrefix="kcap" />
        <KineticLetters layout={lim} choreo={limChoreo} t={t} idPrefix="klim" />
        <KineticLetters layout={capt} choreo={captChoreo} t={t} idPrefix="kcpt" weight={500} family={THEME.mono} blur={0.3} />
        {dots}
      </g>
    </svg>
  );
};

import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';
import { Garment } from './garments';
import { product, mix, euro, NAMES, type Product } from './products';

/**
 * ShopHand — a filmed hand, a fashion app, a loop.
 *
 * Plate: a real photograph (« Smartphone in Hand », NeONBRAND, CC0, Wikimedia Commons), graded warm,
 * with soft out-of-focus lights behind the hand (a mask keeps them behind it) and film grain.
 * The app is composited on the screen through a homography fitted on its four corners: the UI
 * stays a sharp vector layer. Interaction: the feed scrolls with real momentum (finger drag, then
 * exponential decay), stops, an item is tapped and opens (shared element), back swipe, scrolling
 * again. Touches are shown by discreet touch indicators: the photo's thumb cannot move.
 *
 * Loop: everything is periodic over T. The flicks are summed periodically, and their strengths are
 * scaled so that the feed travels exactly K content periods in T: the last flick IS the first
 * movement of the film (same velocity, same images). The camera push is the only discontinuity.
 */
export const HAND = { fps: 30, seconds: 8 };
const T = HAND.seconds;

// ---------------------------------------------------------------- plate geometry (photo pixels)
const PLATE = { w: 1920, h: 1280 };
// Screen corners, pushed out by 3 px so that no pixel of the original screen survives at the edges.
const SCREEN: Array<[number, number]> = [[798.0, 349.0], [1119.5, 349.0], [1115.5, 915.5], [796.5, 916.0]];
const UW = 375, UH = 667; // the app, in points (the screen is exactly 9:16 of this phone)

/** CSS matrix3d mapping the UI rect (0,0)-(UW,UH) onto the four screen corners. */
const SCREEN_MATRIX = (() => {
  const src: Array<[number, number]> = [[0, 0], [UW, 0], [UW, UH], [0, UH]];
  const A: number[][] = [], b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i]!, [X, Y] = SCREEN[i]!;
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); b.push(Y);
  }
  for (let c = 0; c < 8; c++) { // Gauss-Jordan
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r]![c]!) > Math.abs(A[p]![c]!)) p = r;
    [A[c], A[p]] = [A[p]!, A[c]!]; [b[c], b[p]] = [b[p]!, b[c]!];
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r]![c]! / A[c]![c]!; for (let k = c; k < 8; k++) A[r]![k]! -= f * A[c]![k]!; b[r]! -= f * b[c]!; }
  }
  const h = b.map((v, i) => v / A[i]![i]!); // [a c e  b d f  g h]: X = (a x + c y + e) / (g x + h y + 1)
  const [a, c, e, bb, d, f, g, hh] = h as [number, number, number, number, number, number, number, number];
  return `matrix3d(${a},${bb},0,${g},${c},${d},0,${hh},0,0,1,0,${e},${f},0,1)`;
})();

// ---------------------------------------------------------------- feed layout (UI points)
const HEAD = 100, SIDE = 8, GAP = 7, CW = (UW - 2 * SIDE - GAP) / 2, IMG = 234, PITCH = IMG + 52 + 8;
const ROWS = 6, PERIOD = ROWS * PITCH; // the feed repeats every 6 rows: that makes the loop exact
const slotOf = (k: number) => ((k % (ROWS * 2)) + ROWS * 2) % (ROWS * 2);
const HERO_PRODUCT: Product = { kind: 'dress', bg: '#EDE1E0', color: '#8A2F3A', price: 12.49, was: 34.99, sold: 41 };
const feedItem = (k: number): Product => (slotOf(k) === slotOf(PICK.k) ? HERO_PRODUCT : product(k, mix(31000 + slotOf(k))));

// ---------------------------------------------------------------- the scroll: periodic flicks
const R = 0.1, TAU = 0.32; // finger drag (ramp), then momentum decay
const FLICKS = [{ at: 0.45, w: 0.9, x: 230, y: 470 }, { at: 5.6, w: 1.0, x: 210, y: 500 }, { at: 6.45, w: 0.85, x: 240, y: 480 }, { at: 7.3, w: 1.1, x: 225, y: 490 }];
const K = 2; // the feed travels exactly two periods per loop
const V = (K * PERIOD) / (FLICKS.reduce((s, f) => s + f.w, 0) * (R / 2 + TAU)); // px/s per unit of strength
/** Displacement of one flick (strength 1) u seconds after it starts, and its velocity. */
const flickPos = (u: number) => (u <= 0 ? 0 : u < R ? (V * u * u) / (2 * R) : V * (R / 2 + TAU * (1 - Math.exp(-(u - R) / TAU))));
const rawScroll = (t: number) => { let s = 0; for (const f of FLICKS) for (let m = -3; m <= 0; m++) s += f.w * flickPos(t - (f.at + m * T)); return s; };
// Previous loops' flicks are included (their tails cross t = 0): rawScroll(T) − rawScroll(0) = K·PERIOD exactly.
const S0 = rawScroll(0);
/** Feed offset, shown modulo the content period (the feed repeats every PERIOD points). */
const scrollAt = (t: number) => { const s = rawScroll(t) - S0; return (((s % PERIOD) + PERIOD) % PERIOD) + PERIOD; };

// ---------------------------------------------------------------- the selection
const TAP = 2.25, OPEN = [2.38, 2.85] as const, SIZE_TAP = 3.65, BACK = [4.6, 5.0] as const;
const TAP_PT = { x: 282, y: 352 };
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const iosEase = bez(0.32, 0.72, 0, 1), outCubic = (u: number) => 1 - (1 - clamp(u)) ** 3;
/** The card under the tap point at the tap time. */
const PICK = (() => {
  const s = scrollAt(TAP), col = TAP_PT.x > UW / 2 ? 1 : 0;
  const row = Math.floor((TAP_PT.y - HEAD + s) / PITCH);
  return { k: row * 2 + col, x: SIDE + col * (CW + GAP), row };
})();
const cardY = (row: number, s: number) => HEAD + row * PITCH - s;

// ---------------------------------------------------------------- UI pieces
const Photo: React.FC<{ p: Product; w: number; h: number; r: number }> = ({ p, w, h, r }) => (
  <div style={{ position: 'absolute', inset: 0, width: w, height: h, borderRadius: r, overflow: 'hidden', background: p.bg }}>
    <svg viewBox="0 0 100 120" width={w} height={h} preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0 }}><g transform="translate(8,6) scale(0.84)"><Garment kind={p.kind} color={p.color} /></g></svg>
  </div>
);
const Heart: React.FC<{ size: number; color?: string }> = ({ size, color = '#222' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 20 C5 15 3 12 3 8.5 C3 6 5 4 7.5 4 C9.5 4 11 5.2 12 6.8 C13 5.2 14.5 4 16.5 4 C19 4 21 6 21 8.5 C21 12 19 15 12 20 Z" fill="none" stroke={color} strokeWidth={1.7} strokeLinejoin="round" /></svg>
);

const Feed: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const first = Math.floor(s / PITCH) - 1, cards: React.ReactNode[] = [];
  const press = t > TAP - 0.02 && t < OPEN[0] + 0.05 ? Math.sin(Math.PI * clamp((t - TAP + 0.02) / 0.2)) : 0;
  for (let r = first; r < first + 4; r++) for (let c = 0; c < 2; c++) {
    const k = r * 2 + c, p = feedItem(k), y = cardY(r, s), x = SIDE + c * (CW + GAP);
    const picked = k === PICK.k && t >= OPEN[0] && t < BACK[0];
    const off = Math.round((1 - p.price / p.was) * 100);
    cards.push(
      <div key={k} style={{ position: 'absolute', left: x, top: y, width: CW, height: PITCH - 8, transform: k === PICK.k ? `scale(${1 - 0.03 * press})` : undefined, filter: k === PICK.k && press > 0 ? `brightness(${1 - 0.12 * press})` : undefined }}>
        <div style={{ position: 'relative', width: CW, height: IMG, visibility: picked ? 'hidden' : 'visible' }}><Photo p={p} w={CW} h={IMG} r={4} />
          <div style={{ position: 'absolute', left: 0, top: 8, padding: '2px 5px', background: '#111', color: '#fff', fontSize: 10, fontWeight: 700 }}>-{off}%</div>
          <div style={{ position: 'absolute', right: 6, bottom: 6, width: 26, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={15} /></div>
        </div>
        <div style={{ fontSize: 11.5, color: '#666', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{NAMES[p.kind]}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 3 }}><span style={{ fontSize: 14, fontWeight: 750, color: '#E8442B' }}>{euro(p.price)}</span><span style={{ fontSize: 10.5, color: '#9a9a9a', textDecoration: 'line-through' }}>{euro(p.was)}</span></div>
      </div>,
    );
  }
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff', overflow: 'hidden' }}>
      {cards}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: HEAD, background: '#fff', borderBottom: '1px solid #eee' }}>
        <StatusBar dark />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 26, textAlign: 'center', fontWeight: 800, fontSize: 19, letterSpacing: '0.16em' }}>SHEIN</div>
        <svg style={{ position: 'absolute', left: 14, top: 28 }} width={20} height={20} viewBox="0 0 24 24"><circle cx={10.5} cy={10.5} r={6.5} fill="none" stroke="#111" strokeWidth={1.8} /><path d="M15.5 15.5 L20 20" stroke="#111" strokeWidth={1.8} strokeLinecap="round" /></svg>
        <svg style={{ position: 'absolute', right: 14, top: 27 }} width={21} height={21} viewBox="0 0 26 26"><path d="M5 9 L21 9 L19.5 23 L6.5 23 Z" fill="none" stroke="#111" strokeWidth={1.8} strokeLinejoin="round" /><path d="M9 9 Q9 3 13 3 Q17 3 17 9" fill="none" stroke="#111" strokeWidth={1.8} /></svg>
        <div style={{ position: 'absolute', left: 14, right: 0, top: 66, display: 'flex', gap: 20, fontSize: 13.5, color: '#777' }}>
          {['Tout', 'Femme', 'Curve', 'Homme', 'Enfants'].map((w, i) => <span key={w} style={{ color: i === 1 ? '#111' : undefined, fontWeight: i === 1 ? 700 : 400, borderBottom: i === 1 ? '2px solid #111' : undefined, paddingBottom: 5 }}>{w}</span>)}
        </div>
      </div>
    </div>
  );
};

const StatusBar: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const c = dark ? '#111' : '#fff';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 20, fontSize: 12, fontWeight: 600, color: c }}>
      <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', top: 3 }}>21:47</span>
      <div style={{ position: 'absolute', right: 8, top: 5, width: 22, height: 10, border: `1px solid ${c}`, borderRadius: 2.5, padding: 1, boxSizing: 'border-box' }}><div style={{ width: '64%', height: '100%', background: c, borderRadius: 1 }} /></div>
      <div style={{ position: 'absolute', left: 8, top: 4, display: 'flex', gap: 2, alignItems: 'flex-end' }}>{[4, 6, 8, 10].map((h) => <div key={h} style={{ width: 3, height: h, background: c, borderRadius: 0.5 }} />)}</div>
    </div>
  );
};

const HERO = { x: 0, y: 0, w: UW, h: 430 };
const ProductPage: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const p = feedItem(PICK.k), off = Math.round((1 - p.price / p.was) * 100);
  const o = iosEase((t - OPEN[0]) / (OPEN[1] - OPEN[0]));
  const from = { x: PICK.x, y: cardY(PICK.row, s), w: CW, h: IMG }; // the card's image, where it is now
  const box = { x: lerp(from.x, HERO.x, o), y: lerp(from.y, HERO.y, o), w: lerp(from.w, HERO.w, o), h: lerp(from.h, HERO.h, o) };
  const sizeOn = t >= SIZE_TAP, sp = outCubic((t - SIZE_TAP) / 0.18);
  const item = (d: number): React.CSSProperties => { const a = outCubic((t - OPEN[0] - 0.18 - d) / 0.35); return { opacity: a, transform: `translateY(${(1 - a) * 12}px)` }; };
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: clamp(o * 1.6) }} />
      <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h }}><Photo p={p} w={box.w} h={box.h} r={lerp(4, 0, o)} /></div>
      <StatusBar dark />
      <div style={{ position: 'absolute', left: 14, top: 30, width: 34, height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.92)', ...item(0) }}><svg width={34} height={34} viewBox="0 0 34 34"><path d="M19.5 11 L13.5 17 L19.5 23" fill="none" stroke="#111" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <div style={{ position: 'absolute', right: 14, top: 30, width: 34, height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...item(0) }}><Heart size={18} /></div>
      <div style={{ position: 'absolute', left: 16, right: 16, top: 446 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...item(0.04) }}>
          <span style={{ fontSize: 25, fontWeight: 800, color: '#E8442B', letterSpacing: '-0.02em' }}>{euro(p.price)}</span>
          <span style={{ fontSize: 13, color: '#9a9a9a', textDecoration: 'line-through' }}>{euro(p.was)}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#111', padding: '2px 6px' }}>-{off}%</span>
        </div>
        <div style={{ fontSize: 15, color: '#222', marginTop: 6, ...item(0.08) }}>{NAMES[p.kind]}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888', marginTop: 5, ...item(0.1) }}>
          <svg width={12} height={12} viewBox="0 0 24 24"><path d="M12 2.5 L14.9 8.6 L21.5 9.3 L16.5 13.8 L17.9 20.4 L12 17 L6.1 20.4 L7.5 13.8 L2.5 9.3 L9.1 8.6 Z" fill="#111" /></svg> 4,8 · 2 341 avis
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 14, ...item(0.14) }}>Taille</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, ...item(0.16) }}>
          {['XS', 'S', 'M', 'L', 'XL'].map((z) => {
            const on = z === 'M' && sizeOn;
            return <div key={z} style={{ width: 46, height: 32, borderRadius: 16, border: `1px solid ${on ? '#111' : '#ddd'}`, background: on ? `rgba(17,17,17,${sp})` : '#fff', color: on && sp > 0.5 ? '#fff' : '#222', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: on ? `scale(${1 - 0.06 * Math.sin(Math.PI * clamp((t - SIZE_TAP) / 0.18))})` : undefined }}>{z}</div>;
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 16, right: 16, top: 600, height: 48, borderRadius: 24, background: '#111', color: '#fff', fontSize: 14.5, fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'center', ...item(0.2) }}>Ajouter au panier</div>
    </div>
  );
};

/** A touch indicator: a soft disc where the thumb is (screen recordings' convention). */
const Touch: React.FC<{ x: number; y: number; a: number }> = ({ x, y, a }) => (a <= 0.01 ? null : (
  <div style={{ position: 'absolute', left: x - 19, top: y - 19, width: 38, height: 38, borderRadius: 19, background: `rgba(255,255,255,${0.42 * a})`, boxShadow: `0 0 0 1.5px rgba(0,0,0,${0.12 * a}), 0 2px 10px rgba(0,0,0,${0.15 * a})` }} />
));

const App: React.FC<{ t: number }> = ({ t }) => {
  const s = scrollAt(t);
  const opened = t >= OPEN[0] && t < BACK[1];
  const back = iosEase((t - BACK[0]) / (BACK[1] - BACK[0]));
  // Touches: the flicks (drag during the ramp, then lift), the tap, the size tap, the back swipe.
  const touches: Array<{ x: number; y: number; a: number }> = [];
  for (const f of FLICKS) for (const m of [0, -1, 1]) {
    const u = t - (f.at + m * T); if (u < -0.08 || u > R + 0.18) continue;
    const dy = flickPos(Math.min(u, R)) * f.w;
    touches.push({ x: f.x, y: f.y - dy, a: clamp((u + 0.08) / 0.06) * (1 - clamp((u - R) / 0.16)) });
  }
  const tapA = (at: number, d = 0.2) => clamp((t - at + 0.05) / 0.05) * (1 - clamp((t - at - d + 0.05) / 0.14));
  touches.push({ ...TAP_PT, a: tapA(TAP) });
  touches.push({ x: 16 + 2 * 54 + 23, y: 446 + 134, a: tapA(SIZE_TAP) });
  if (t > BACK[0] - 0.08 && t < BACK[1] + 0.2) touches.push({ x: 12 + back * 230, y: 300, a: clamp((t - BACK[0] + 0.08) / 0.06) * (1 - clamp((t - BACK[1]) / 0.16)) });
  return (
    <div style={{ position: 'absolute', inset: 0, width: UW, height: UH, overflow: 'hidden', background: '#fff', fontFamily: THEME.sans, color: '#111' }}>
      <div style={{ position: 'absolute', inset: 0, transform: opened ? `translateX(${-0.3 * UW * (1 - back)}px)` : undefined }}><Feed s={s} t={t} /></div>
      {opened && <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.12 * (1 - back)})` }} />}
      {opened && <div style={{ position: 'absolute', inset: 0, transform: `translateX(${back * UW}px)`, boxShadow: back > 0 ? '-8px 0 24px rgba(0,0,0,0.15)' : undefined }}><ProductPage t={t} s={s} /></div>}
      {touches.map((p, i) => <Touch key={i} {...p} />)}
    </div>
  );
};

// ---------------------------------------------------------------- the shot
const BOKEH = Array.from({ length: 13 }, (_, i) => {
  const r = (n: number) => ((Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  const left = r(1) < 0.5;
  return { x: left ? 120 + r(2) * 560 : 1260 + r(2) * 560, y: 120 + r(3) * 820, rad: 36 + r(4) * 90, a: 0.14 + r(5) * 0.26, warm: r(6) < 0.85 };
});

export const ShopHand: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps, u = t / T;
  // Camera: a slow push towards the screen + a periodic handheld drift (period T, so the loop holds).
  const s = 1.3 + 0.04 * u; // the only thing that does not loop: kept small, and reset during a flick (cut on action)
  const w = (k: number, ph: number) => Math.sin(2 * Math.PI * k * u + ph);
  const jx = 3.2 * w(2, 0.3) + 1.6 * w(3, 1.9) + 0.8 * w(7, 4.1), jy = 2.6 * w(2, 2.2) + 1.4 * w(5, 0.7), rot = 0.12 * w(3, 1.2) + 0.05 * w(5, 3.3);
  const focus = { x: 957, y: 632 };
  const cam = `translate(${960 + jx}px, ${540 + jy}px) rotate(${rot}deg) scale(${s}) translate(${-focus.x}px, ${-focus.y}px)`;
  // The lights are far behind: relative to the plate they scale and shake less (parallax). Expressed inside
  // the plate's frame, so that the wall mask (plate coordinates) stays exactly on the hand's outline.
  const q = (1.24 + 0.02 * u) / s, pdx = (-0.6 * jx) / s, pdy = (-0.6 * jy) / s;
  const bokehRel = `translate(${pdx}px, ${pdy}px) translate(${focus.x}px, ${focus.y}px) scale(${q}) translate(${-focus.x}px, ${-focus.y}px)`;
  const grain = Math.floor(frame / 1) % 8;
  return (
    <AbsoluteFill style={{ background: '#1a1512', overflow: 'hidden' }}>
      {/* Background lights, behind the hand (wall mask), on their own, slower plane. */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: PLATE.w, height: PLATE.h, transformOrigin: '0 0', transform: cam }}>
        {/* The plate, its wall pre-softened (shallower depth of field: hand-phone-soft.jpg, baked from the hand mask). */}
        <Img src={staticFile('shop/hand-phone-soft.jpg')} style={{ position: 'absolute', inset: 0, width: PLATE.w, height: PLATE.h, filter: 'sepia(0.5) saturate(1.05) brightness(0.6) contrast(1.08) hue-rotate(-10deg)' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: PLATE.w, height: PLATE.h, transformOrigin: '0 0', transform: cam, mixBlendMode: 'screen', WebkitMaskImage: `url(${staticFile('shop/hand-phone-wall.png')})`, WebkitMaskSize: `${PLATE.w}px ${PLATE.h}px` }}>
        <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: bokehRel }}>
        {BOKEH.map((b, i) => <div key={i} style={{ position: 'absolute', left: b.x - b.rad, top: b.y - b.rad, width: 2 * b.rad, height: 2 * b.rad, borderRadius: '50%', background: `radial-gradient(circle, ${b.warm ? `rgba(255,178,102,${b.a})` : `rgba(160,190,255,${b.a * 0.7})`} 0%, ${b.warm ? `rgba(255,170,90,${b.a * 0.75})` : `rgba(150,180,255,${b.a * 0.5})`} 62%, rgba(0,0,0,0) 72%)`, filter: 'blur(3px)' }} />)}
        </div>
      </div>
      {/* The screen: the app through the homography, then glass. */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: PLATE.w, height: PLATE.h, transformOrigin: '0 0', transform: cam }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: UW, height: UH, transformOrigin: '0 0', transform: SCREEN_MATRIX }}>
          <App t={t} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(118deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 32%, rgba(255,255,255,0) 50%)' }} />
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 18px rgba(0,0,0,0.10)' }} />
        </div>
      </div>
      {/* Light: a warm lamp off frame right, a cooler fill left; vignette; grain. */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 55% 70% at 88% 18%, rgba(255,170,90,0.32) 0%, rgba(255,170,90,0) 70%), radial-gradient(ellipse 50% 60% at 6% 70%, rgba(110,140,190,0.10) 0%, rgba(110,140,190,0) 70%)', mixBlendMode: 'soft-light' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 75% at 50% 52%, rgba(0,0,0,0) 55%, rgba(8,6,4,0.55) 100%)' }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile(`shop/grain-${grain}.png`)})`, backgroundSize: '512px 512px', mixBlendMode: 'overlay', opacity: 0.13 }} />
    </AbsoluteFill>
  );
};

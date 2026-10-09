import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';
import { Garment, type Kind } from './garments';

/**
 * ShopCart — a cart filling up, on a credible shop page.
 *
 * Each add: the « Ajouter » button gives under the press, a copy of the product photo lifts off the
 * card and flies on a short arc to its row in the cart (same 4:5 ratio, uniform scale: nothing is
 * ever distorted), the row settles in, the badge and the item count step up, the total rolls to its
 * new value (odometer, carries included). The camera follows the products (critically damped spring
 * on the flying item), pulls back to reveal the filled cart, then ends on the total.
 */
export const CART = { fps: 60, seconds: 7.8 };

// ---------------------------------------------------------------- catalogue
type Item = { name: string; kind: Kind; color: string; colorName: string; bg: string; price: number };
const GRID: Item[] = [
  { name: 'Robe midi plissée', kind: 'dress', color: '#8A2F3A', colorName: 'Bordeaux', bg: '#EDE1E0', price: 19.99 },
  { name: 'T-shirt oversize', kind: 'tee', color: '#1F1F22', colorName: 'Noir', bg: '#E4E8EB', price: 6.99 },
  { name: 'Jean large', kind: 'jeans', color: '#6B7F99', colorName: 'Bleu délavé', bg: '#E5E9E1', price: 24.99 },
  { name: 'Veste cropped', kind: 'jacket', color: '#B4876A', colorName: 'Camel', bg: '#F2EDE4', price: 29.99 },
  { name: 'Top à bretelles', kind: 'cami', color: '#C2453A', colorName: 'Rouge', bg: '#F0E5E6', price: 8.49 },
  { name: 'Pull côtelé', kind: 'sweater', color: '#3D4C40', colorName: 'Vert sapin', bg: '#ECE9E2', price: 17.99 },
  { name: 'Jupe satinée', kind: 'skirt', color: '#C9B48F', colorName: 'Sable', bg: '#E8E3ED', price: 12.99 },
  { name: 'Sac bandoulière', kind: 'bag', color: '#1F1F22', colorName: 'Noir', bg: '#EEE8E0', price: 9.99 },
];
const ADDS = [0, 4, 6, 2, 5, 7];
const AT = [0.6, 1.5, 2.35, 3.05, 3.6, 4.1]; // flight starts: a steady beat, a little tighter at the end
const FLY = 0.5, FREE = 49;
const LAND = AT.map((a) => a + FLY);
const TOTALS = ADDS.reduce((acc, g) => [...acc, acc[acc.length - 1]! + Math.round(GRID[g]!.price * 100)], [0]); // cents

// ---------------------------------------------------------------- page layout (world = 1920 × 1080)
const INK = '#111111', GREY = '#77777C', LINE = '#E7E7E9', ACCENT = '#E8442B';
const CARD = { x0: 60, y0: 150, w: 258, img: 322, gap: 24, h: 428, rowGap: 24 };
const cardPos = (i: number) => ({ x: CARD.x0 + (i % 4) * (CARD.w + CARD.gap), y: CARD.y0 + Math.floor(i / 4) * (CARD.h + CARD.rowGap) });
const PANEL = { x: 1224, y: 100, w: 636, h: 940, pad: 28 };
const ROW = { y0: PANEL.y + 88, h: 88, thumbW: 64, thumbH: 80 }; // six rows end at 716
const rowThumb = (k: number) => ({ x: PANEL.x + PANEL.pad, y: ROW.y0 + k * ROW.h + (ROW.h - ROW.thumbH) / 2 });
const TOTAL_Y = 880; // baseline of the total line
const TOTAL_C = { x: PANEL.x + PANEL.w - PANEL.pad - 110, y: TOTAL_Y - 18 };

// ---------------------------------------------------------------- easing
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const outCubic = (u: number) => 1 - (1 - clamp(u)) ** 3;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const flyEase = bez(0.55, 0, 0.15, 1), camEase = bez(0.6, 0, 0.2, 1);
const settle = (tau: number, amp: number, w = 34, k = 9) => (tau < 0 ? 0 : amp * Math.exp(-k * tau) * Math.sin(w * tau)); // a small damped physical response

/** The flying copy of add k: rect (x, y, w, h) at progress u, on a short arc. */
function flight(k: number, u: number) {
  const c = cardPos(ADDS[k]!), r = rowThumb(k), e = flyEase(u);
  const s = lerp(1, ROW.thumbW / CARD.w, e); // uniform: 4:5 → 4:5
  const x = lerp(c.x, r.x, e), y = lerp(c.y, r.y, e) - 140 * Math.sin(Math.PI * e); // the arc
  return { x, y, w: CARD.w * s, h: CARD.img * s, lift: Math.sin(Math.PI * e) };
}

// ---------------------------------------------------------------- camera (follow → pull back → total)
function camTarget(t: number) {
  for (let k = 0; k < ADDS.length; k++) if (t >= AT[k]! && t < LAND[k]!) { const f = flight(k, (t - AT[k]!) / FLY); return { x: f.x + f.w / 2, y: f.y + f.h / 2 }; }
  const cardC = (k: number) => { const c = cardPos(ADDS[k]!); return { x: c.x + CARD.w / 2, y: c.y + CARD.img / 2 }; };
  const slotC = (k: number) => { const r = rowThumb(k); return { x: r.x + 160, y: r.y + ROW.thumbH / 2 }; };
  if (t < AT[0]!) return cardC(0);
  let k = 0; while (k + 1 < ADDS.length && t >= AT[k + 1]!) k++;
  if (k + 1 >= ADDS.length) return slotC(k);
  const u = camEase((t - LAND[k]!) / (AT[k + 1]! - LAND[k]!)), a = slotC(k), b = cardC(k + 1);
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) };
}
/** Critically damped spring on the target, integrated from 0 (deterministic for any frame). */
function follow(t: number) {
  const w = 7.5, dt = 1 / 240;
  let p = camTarget(0), v = { x: 0, y: 0 };
  for (let s = 0; s < t; s += dt) {
    const g = camTarget(s);
    v = { x: v.x + (w * w * (g.x - p.x) - 2 * w * v.x) * dt, y: v.y + (w * w * (g.y - p.y) - 2 * w * v.y) * dt };
    p = { x: p.x + v.x * dt, y: p.y + v.y * dt };
  }
  return p;
}
const BACK = [2.95, 4.75] as const, CLOSE = [5.45, 6.4] as const;

// ---------------------------------------------------------------- pieces
const eur = (cents: number) => `${Math.floor(cents / 100)},${String(Math.round(cents) % 100).padStart(2, '0')} €`;

const Photo: React.FC<{ it: Item; w: number; h: number; radius: number }> = ({ it, w, h, radius }) => (
  <div style={{ position: 'absolute', inset: 0, width: w, height: h, borderRadius: radius, background: it.bg, overflow: 'hidden' }}>
    <svg viewBox="0 0 100 120" width={w} height={h} style={{ position: 'absolute', inset: 0 }} preserveAspectRatio="xMidYMid meet">
      <g transform="translate(8,8) scale(0.84)"><Garment kind={it.kind} color={it.color} /></g>
    </svg>
  </div>
);

/** Odometer: every digit rolls; a digit carries only while the one to its right goes 9 → 0. */
export const Odometer: React.FC<{ cents: number; size: number }> = ({ cents, size }) => {
  const H = size * 1.1, W = size * 0.62;
  const col = (p: number, key: string) => {
    const w = cents / 10 ** p, d = Math.floor(w) % 10;
    const f = p === 0 ? w - Math.floor(w) : clamp((cents % 10 ** p) - (10 ** p - 1));
    const lead = p === 3 ? (cents >= 1000 ? 1 : clamp(cents - 999)) : 1; // no leading zero
    return (
      <div key={key} style={{ position: 'relative', width: W, height: H, overflow: 'hidden', opacity: lead }}>
        {[d, (d + 1) % 10].map((n, i) => (
          <div key={i} style={{ position: 'absolute', left: 0, width: W, top: (i - f) * H, height: H, lineHeight: `${H}px`, textAlign: 'center' }}>{n}</div>
        ))}
      </div>
    );
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontFamily: THEME.sans, fontWeight: 700, fontSize: size, color: INK, letterSpacing: '-0.02em' }}>
      {col(3, 'a')}{col(2, 'b')}<div style={{ width: size * 0.28, textAlign: 'center' }}>,</div>{col(1, 'c')}{col(0, 'd')}
      <div style={{ marginLeft: size * 0.18 }}>€</div>
    </div>
  );
};

export const ShopCart: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const landed = LAND.filter((l) => t >= l).length;
  // The total rolls from its previous value to the new one after each landing.
  const lastLand = landed ? LAND[landed - 1]! : -1;
  const cents = landed ? lerp(TOTALS[landed - 1]!, TOTALS[landed]!, outCubic((t - lastLand) / 0.55)) : 0;

  // Camera.
  const f = follow(t);
  const b = camEase((t - BACK[0]) / (BACK[1] - BACK[0])), c = camEase((t - CLOSE[0]) / (CLOSE[1] - CLOSE[0]));
  let cs = Math.exp(lerp(Math.log(1.65), Math.log(1), b)), cx = lerp(f.x, 960, b), cy = lerp(f.y, 540, b);
  cs = Math.exp(lerp(Math.log(cs), Math.log(2.9 * (1 + 0.015 * clamp((t - CLOSE[1]) / 1.4))), c)); cx = lerp(cx, TOTAL_C.x, c); cy = lerp(cy, TOTAL_C.y, c);

  const badge = 1 + settle(t - lastLand, 0.2, 30, 10);
  const freeLeft = Math.max(0, FREE * 100 - cents);

  return (
    <AbsoluteFill style={{ background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${960 - cx * cs}px, ${540 - cy * cs}px) scale(${cs})`, background: '#FFFFFF', fontFamily: THEME.sans, color: INK }}>
        {/* Header. */}
        <div style={{ position: 'absolute', left: -2000, top: 0, width: 5920, height: 76, borderBottom: `1px solid ${LINE}` }} />
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 76 }}>
          <div style={{ position: 'absolute', left: 60, top: 22, fontWeight: 800, fontSize: 26, letterSpacing: '0.16em' }}>SHEIN</div>
          <div style={{ position: 'absolute', left: 250, top: 28, display: 'flex', gap: 30, fontSize: 16, color: GREY }}>{['Femme', 'Homme', 'Enfants', 'Maison', 'Beauté'].map((w, i) => <span key={w} style={{ color: i === 0 ? INK : undefined, fontWeight: i === 0 ? 600 : 400 }}>{w}</span>)}</div>
          <div style={{ position: 'absolute', left: 980, top: 18, width: 520, height: 40, borderRadius: 20, background: '#F3F3F4', fontSize: 15, color: '#9A9AA0', lineHeight: '40px', paddingLeft: 20, boxSizing: 'border-box' }}>Rechercher un article</div>
          {/* Cart icon + badge. */}
          <svg style={{ position: 'absolute', left: 1800, top: 22 }} width={32} height={32} viewBox="0 0 26 26"><path d="M5 9 L21 9 L19.5 23 L6.5 23 Z" fill="none" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" /><path d="M9 9 Q9 3 13 3 Q17 3 17 9" fill="none" stroke={INK} strokeWidth={1.8} /></svg>
          {landed > 0 && <div style={{ position: 'absolute', left: 1820, top: 14, width: 22, height: 22, borderRadius: 11, background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: '22px', textAlign: 'center', transform: `scale(${badge})` }}>{landed}</div>}
        </div>
        {/* Grid. */}
        <div style={{ position: 'absolute', left: 60, top: 100, fontSize: 28, fontWeight: 650, letterSpacing: '-0.01em' }}>Nouveautés</div>
        {GRID.map((it, i) => {
          const p = cardPos(i), k = ADDS.indexOf(i), press = k >= 0 ? t - AT[k]! : -9;
          const down = press > -0.1 && press < 0.12 ? 1 - Math.abs(press - 0.01) / 0.11 : 0; // the button gives, then comes back
          const added = k >= 0 && t >= LAND[k]!;
          return (
            <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: CARD.w, height: CARD.h }}>
              <div style={{ position: 'relative', width: CARD.w, height: CARD.img }}><Photo it={it} w={CARD.w} h={CARD.img} radius={8} /></div>
              <div style={{ fontSize: 15, color: '#4A4A4F', marginTop: 12 }}>{it.name}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{eur(Math.round(it.price * 100))}</div>
              <div style={{ position: 'absolute', left: 0, bottom: 0, width: CARD.w, height: 40, borderRadius: 6, background: added ? '#F1F1F2' : INK, color: added ? INK : '#fff', fontSize: 14, fontWeight: 600, lineHeight: '40px', textAlign: 'center', transform: `scale(${1 - 0.03 * clamp(down)})`, filter: `brightness(${1 - 0.25 * clamp(down)})` }}>{added ? 'Dans le panier' : 'Ajouter au panier'}</div>
            </div>
          );
        })}
        {/* Cart panel. */}
        <div style={{ position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, borderRadius: 14, border: `1px solid ${LINE}`, boxShadow: '0 20px 60px rgba(0,0,0,0.06)', background: '#fff' }}>
          <div style={{ position: 'absolute', left: PANEL.pad, top: 26, fontSize: 26, fontWeight: 650 }}>Panier <span style={{ color: GREY, fontWeight: 400, fontSize: 20 }}>({landed} article{landed > 1 ? 's' : ''})</span></div>
        </div>
        {ADDS.map((g, k) => {
          if (t < LAND[k]!) return null;
          const it = GRID[g]!, r = rowThumb(k), tau = t - LAND[k]!, a = outCubic(tau / 0.3);
          return (
            <div key={k}>
              <div style={{ position: 'absolute', left: r.x, top: r.y + settle(tau, 3), width: ROW.thumbW, height: ROW.thumbH }}><Photo it={it} w={ROW.thumbW} h={ROW.thumbH} radius={4} /></div>
              <div style={{ position: 'absolute', left: r.x + ROW.thumbW + 18 + (1 - a) * 14, top: r.y + 2, opacity: a, width: 330 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 14, color: GREY, marginTop: 4 }}>Taille M · {it.colorName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 7, fontSize: 14 }}>
                  <span style={{ width: 22, height: 22, border: `1px solid ${LINE}`, borderRadius: 4, textAlign: 'center', lineHeight: '20px', color: GREY }}>−</span>1<span style={{ width: 22, height: 22, border: `1px solid ${LINE}`, borderRadius: 4, textAlign: 'center', lineHeight: '20px', color: GREY }}>+</span>
                </div>
              </div>
              <div style={{ position: 'absolute', left: PANEL.x + PANEL.w - PANEL.pad - 120, width: 120, textAlign: 'right', top: r.y + 6, fontSize: 16, fontWeight: 700, opacity: a }}>{eur(Math.round(it.price * 100))}</div>
              {k < ADDS.length - 1 && <div style={{ position: 'absolute', left: r.x, top: ROW.y0 + (k + 1) * ROW.h - 0.5, width: PANEL.w - 2 * PANEL.pad, height: 1, background: LINE, opacity: a }} />}
            </div>
          );
        })}
        {/* Summary. */}
        <div style={{ position: 'absolute', left: PANEL.x + PANEL.pad, top: 740, width: PANEL.w - 2 * PANEL.pad }}>
          <div style={{ height: 1, background: LINE }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, fontSize: 15, color: '#4A4A4F' }}><span>Livraison</span><span style={{ color: freeLeft > 0 ? '#4A4A4F' : '#1F8A4C', fontWeight: freeLeft > 0 ? 400 : 600 }}>{freeLeft > 0 ? `Plus que ${eur(freeLeft)} pour la livraison offerte` : 'Offerte'}</span></div>
          <div style={{ height: 4, borderRadius: 2, background: '#EFEFF1', marginTop: 12 }}><div style={{ width: `${clamp(cents / (FREE * 100)) * 100}%`, height: 4, borderRadius: 2, background: freeLeft > 0 ? INK : '#1F8A4C' }} /></div>
        </div>
        <div style={{ position: 'absolute', left: PANEL.x + PANEL.pad, top: TOTAL_Y - 40, fontSize: 20, fontWeight: 600 }}>Total</div>
        <div style={{ position: 'absolute', right: 1920 - (PANEL.x + PANEL.w - PANEL.pad), top: TOTAL_Y - 58 }}><Odometer cents={cents} size={44} /></div>
        <div style={{ position: 'absolute', left: PANEL.x + PANEL.pad, top: TOTAL_Y + 8, fontSize: 13, color: GREY }}>TVA incluse</div>
        <div style={{ position: 'absolute', left: PANEL.x + PANEL.pad, top: 956, width: PANEL.w - 2 * PANEL.pad, height: 56, borderRadius: 8, background: landed ? INK : '#CFCFD3', color: '#fff', fontSize: 17, fontWeight: 600, lineHeight: '56px', textAlign: 'center' }}>Commander</div>
        {/* Flying copies (above everything): a soft shadow while airborne. */}
        {ADDS.map((g, k) => {
          const u = (t - AT[k]!) / FLY;
          if (u < 0 || u >= 1) return null;
          const fl = flight(k, u);
          return (
            <div key={`f${k}`} style={{ position: 'absolute', left: fl.x, top: fl.y, width: fl.w, height: fl.h, borderRadius: lerp(8, 4, flyEase(u)), boxShadow: `0 ${18 * fl.lift}px ${40 * fl.lift}px rgba(0,0,0,${0.22 * fl.lift})` }}>
              <Photo it={GRID[g]!} w={fl.w} h={fl.h} radius={lerp(8, 4, flyEase(u))} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

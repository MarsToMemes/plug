import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME, rng } from '../../theme';
import { GARMENTS, paints, type Kind } from './garments';
import { product, mix, euro, type Product } from './products';

/**
 * ShopOutro — the documentary's last shot: « QUI CONTRÔLE QUI ? »
 *
 * A phone floats in a dark space. Product cards and interface fragments (notifications, discount
 * tags, buttons, countdowns, badges) drift towards it and close in, layer after layer, into a dense
 * cocoon, while the camera dollies in. Then everything freezes — instantly, camera included, mid-
 * motion: no easing into the stop. A beat. Then every element falls away into depth, the phone last,
 * leaving a sober ground and one sentence that rises a few pixels and settles.
 *
 * Real perspective (pinhole camera looking down +z), drawn on a canvas, depth-sorted.
 */
export const OUTRO = { fps: 60, seconds: 10.5 };

// ---------------------------------------------------------------- timing
const FREEZE = 5.4; // everything stops here, at full speed
const RECEDE = 6.0; // then falls away into depth
const TEXT = 7.85; // once the phone is gone
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const inOut = (u: number) => { const x = clamp(u); return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2; };
const inQuad = (u: number) => clamp(u) ** 2.2;
const outExpo = (u: number) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(u)));

// ---------------------------------------------------------------- camera
const F = 1100;
type V3 = { x: number; y: number; z: number };
/** Camera depth: eases in, then travels at constant speed until it is cut dead at FREEZE. */
function camZ(t: number) {
  const tt = Math.min(t, FREEZE), a = 1.6, z0 = -2700, v = 230; // the first 1.6 s accelerate to v
  return tt < a ? z0 + (v * tt * tt) / (2 * a) : z0 + (v * a) / 2 + v * (tt - a);
}

// ---------------------------------------------------------------- elements
type Kinds = 'card' | 'notif' | 'tag' | 'button' | 'timer' | 'heart' | 'badge' | 'bar';
type El = { kind: Kinds; p0: V3; p1: V3; start: number; dur: number; rot0: number; rot1: number; spin: number; prod?: Product; label: string; recede: number; size: number };
const NOTIFS = ['Vente flash : −70 %', 'Ton panier t’attend', 'Prix en baisse', 'Plus que 3 en stock', 'Livraison offerte ce soir', 'Code −15 % : 1 h'];
const TAGS = ['−70 %', '−64 %', '−80 %', '−55 %', '−71 %'];
const ELS: El[] = (() => {
  const r = rng(mix(77001)), out: El[] = [];
  const kinds: Kinds[] = [...Array(34).fill('card'), ...Array(9).fill('notif'), ...Array(7).fill('tag'), ...Array(4).fill('button'), ...Array(4).fill('timer'), ...Array(4).fill('heart'), ...Array(3).fill('badge'), ...Array(3).fill('bar')];
  kinds.forEach((kind, i) => {
    // Start: a wide, loose shell. Target: a dense cocoon around the phone (an ellipsoid, front kept open).
    const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1);
    const R0 = 1300 + r() * 1100;
    const p0 = { x: R0 * Math.sin(ph) * Math.cos(th) * 1.25, y: R0 * Math.cos(ph) * 0.8, z: R0 * Math.sin(ph) * Math.sin(th) * 0.7 };
    const a = r() * Math.PI * 2, layer = i % 3;
    const rx = 330 + layer * 105 + r() * 50, ry = 470 + layer * 95 + r() * 50;
    const p1 = { x: Math.cos(a) * rx, y: Math.sin(a) * ry, z: -160 + (r() - 0.5) * 520 + layer * 90 };
    const prod = kind === 'card' ? product(i, mix(5300 + i)) : undefined;
    out.push({ kind, p0, p1, start: 0.1 + r() * 2.6, dur: 2.2 + r() * 1.2, rot0: (r() - 0.5) * 50, rot1: (r() - 0.5) * 16, spin: (r() - 0.5) * 6, prod, size: 0.85 + r() * 0.35,
      label: kind === 'notif' ? NOTIFS[i % NOTIFS.length]! : kind === 'tag' ? TAGS[i % TAGS.length]! : kind === 'timer' ? `00:${String(10 + Math.floor(r() * 50))}:${String(Math.floor(r() * 60)).padStart(2, '0')}` : kind === 'badge' ? String(2 + Math.floor(r() * 9)) : '',
      recede: RECEDE + r() * 0.55 });
  });
  return out;
})();
const PHONE_RECEDE = RECEDE + 0.5;

/** Where an element is at t (frozen after FREEZE, then falling away in depth). */
function placed(e: El, t: number): { p: V3; rot: number; a: number } {
  const tt = Math.min(t, FREEZE);
  const u = inOut((tt - e.start) / e.dur);
  const drift = { x: Math.sin(tt * 0.6 + e.start) * 30, y: Math.cos(tt * 0.5 + e.dur) * 24 }; // a slow float, frozen too
  let p = { x: lerp(e.p0.x, e.p1.x, u) + drift.x * (1 - u * 0.7), y: lerp(e.p0.y, e.p1.y, u) + drift.y * (1 - u * 0.7), z: lerp(e.p0.z, e.p1.z, u) };
  const rot = lerp(e.rot0, e.rot1, u) + e.spin * tt;
  const fall = inQuad((t - e.recede) / 1.1);
  p = { ...p, z: p.z + 5200 * fall };
  return { p, rot, a: 1 - clamp((fall - 0.55) / 0.45) };
}

// ---------------------------------------------------------------- drawing
const MONO = "'Geist Mono', monospace", SANS = 'Geist, sans-serif';
const PATHS = new Map<Kind, Path2D[]>();
const pathsOf = (k: Kind) => { let p = PATHS.get(k); if (!p) { p = GARMENTS[k].map((o) => new Path2D(o.d)); PATHS.set(k, p); } return p; };
function garment(ctx: CanvasRenderingContext2D, p: Product, x: number, y: number, s: number) {
  const pal = paints(p.color), ops = GARMENTS[p.kind], paths = pathsOf(p.kind), base = ctx.getTransform();
  ctx.translate(x, y); ctx.scale(s, s);
  ops.forEach((o, i) => { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * (o.op ?? 1); if (o.fill) { ctx.fillStyle = pal[o.fill]; ctx.fill(paths[i]!); } if (o.stroke) { ctx.strokeStyle = pal[o.stroke]; ctx.lineWidth = o.sw ?? 1.4; ctx.stroke(paths[i]!); } ctx.globalAlpha = ga; });
  ctx.setTransform(base);
}
const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };

function drawEl(ctx: CanvasRenderingContext2D, e: El) {
  switch (e.kind) {
    case 'card': { const p = e.prod!; rr(ctx, -75, -105, 150, 210, 6, '#F2EFE9'); rr(ctx, -70, -100, 140, 150, 3, p.bg); garment(ctx, p, -55, -95, 1.1);
      ctx.fillStyle = '#E8442B'; ctx.font = `700 17px ${SANS}`; ctx.fillText(euro(p.price), -68, 78); ctx.fillStyle = '#B9B4AC'; ctx.fillRect(-68, 86, 70, 5); break; }
    case 'notif': rr(ctx, -150, -34, 300, 68, 18, 'rgba(244,244,246,0.95)'); rr(ctx, -136, -18, 32, 32, 8, '#111'); ctx.fillStyle = '#fff'; ctx.font = `800 17px ${SANS}`; ctx.fillText('S', -126, 4);
      ctx.fillStyle = '#111'; ctx.font = `600 16px ${SANS}`; ctx.fillText(e.label, -92, -2); ctx.fillStyle = '#777'; ctx.font = `400 13px ${SANS}`; ctx.fillText('maintenant', -92, 18); break;
    case 'tag': rr(ctx, -56, -24, 112, 48, 4, '#E8442B'); ctx.fillStyle = '#fff'; ctx.font = `800 26px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText(e.label, 0, 9); ctx.textAlign = 'left'; break;
    case 'button': rr(ctx, -120, -26, 240, 52, 26, '#111'); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(-120, -26, 240, 52, 26); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = `600 18px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText('Ajouter au panier', 0, 6); ctx.textAlign = 'left'; break;
    case 'timer': rr(ctx, -92, -26, 184, 52, 8, '#1B1B1E'); ctx.fillStyle = '#F4F2EE'; ctx.font = `600 26px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText(e.label, 0, 9); ctx.textAlign = 'left'; break;
    case 'heart': { ctx.fillStyle = 'rgba(244,244,246,0.95)'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill(); const h = new Path2D('M12 20 C5 15 3 12 3 8.5 C3 6 5 4 7.5 4 C9.5 4 11 5.2 12 6.8 C13 5.2 14.5 4 16.5 4 C19 4 21 6 21 8.5 C21 12 19 15 12 20 Z'); const b = ctx.getTransform(); ctx.translate(-15, -15); ctx.scale(1.25, 1.25); ctx.fillStyle = '#E8442B'; ctx.fill(h); ctx.setTransform(b); break; }
    case 'badge': ctx.fillStyle = '#E8442B'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `700 26px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText(e.label, 0, 9); ctx.textAlign = 'left'; break;
    case 'bar': rr(ctx, -150, -22, 300, 44, 8, 'rgba(244,244,246,0.95)'); ctx.fillStyle = '#4A4A4F'; ctx.font = `500 13px ${SANS}`; ctx.fillText('Livraison offerte dès 49 €', -136, -2); rr(ctx, -136, 8, 272, 5, 2.5, '#E1E1E4'); rr(ctx, -136, 8, 240, 5, 2.5, '#111'); break;
  }
}

function drawPhone(ctx: CanvasRenderingContext2D) {
  rr(ctx, -158, -322, 316, 644, 46, '#1A1A1D');
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-158, -322, 316, 644, 46); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-146, -310, 292, 620, 36); ctx.clip();
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-146, -310, 292, 620);
  ctx.fillStyle = '#111'; ctx.font = `800 17px ${SANS}`; ctx.textAlign = 'center'; (ctx as unknown as { letterSpacing: string }).letterSpacing = '3px'; ctx.fillText('SHEIN', 0, -262); (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'; ctx.textAlign = 'left';
  for (let i = 0; i < 6; i++) { const c = i % 2, r = Math.floor(i / 2), p = product(900 + i, mix(990 + i)); const x = -138 + c * 141, y = -236 + r * 182;
    rr(ctx, x, y, 135, 140, 3, p.bg); garment(ctx, p, x + 18, y + 8, 1.0); ctx.fillStyle = '#E8442B'; ctx.font = `700 13px ${SANS}`; ctx.fillText(euro(p.price), x + 2, y + 160); }
  ctx.restore();
  rr(ctx, -50, -302, 100, 22, 11, '#000');
}

function draw(ctx: CanvasRenderingContext2D, t: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0A0A0B'; ctx.fillRect(0, 0, 1920, 1080);
  const cz = camZ(t);
  const proj = (p: V3) => { const d = p.z - cz; return d < 80 ? null : { X: 960 + (F * p.x) / d, Y: 540 + (F * p.y) / d, k: F / d, d }; };
  const fog = (d: number) => clamp((7000 - d) / 4000);
  const list: Array<{ d: number; f: () => void }> = [];
  for (const e of ELS) {
    const { p, rot, a } = placed(e, t), pr = proj(p); if (!pr || a <= 0.005) continue;
    const alpha = a * fog(pr.d) * clamp((t - e.start + 0.4) / 0.8 + 0.6); // already there at the start, a little dim
    list.push({ d: pr.d, f: () => { ctx.globalAlpha = alpha; ctx.setTransform(pr.k * e.size, 0, 0, pr.k * e.size, pr.X, pr.Y); ctx.rotate((rot * Math.PI) / 180); drawEl(ctx, e); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; } });
  }
  // The phone: a slow float (frozen too), then it goes last.
  const tt = Math.min(t, FREEZE), fall = inQuad((t - PHONE_RECEDE) / 1.0);
  const ph = { x: 0, y: Math.sin(tt * 0.9) * 14, z: 5200 * fall }, pp = proj(ph);
  if (pp) list.push({ d: pp.d, f: () => { ctx.globalAlpha = 1 - clamp((fall - 0.55) / 0.45); ctx.setTransform(pp.k, 0, 0, pp.k, pp.X, pp.Y); ctx.rotate(((Math.sin(tt * 0.7) * 2.2) * Math.PI) / 180); drawPhone(ctx); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; } });
  list.sort((a, b) => b.d - a.d).forEach((x) => x.f());
}

export const ShopOutro: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender('ShopOutro: canvas fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const ok = () => ['Geist', 'Geist Mono'].every((n) => [...document.fonts].some((f) => f.family.replace(/["']/g, '') === n && f.status === 'loaded'));
    const tick = () => { if (!alive) return; if (ok()) { setReady(true); continueRender(handle); } else setTimeout(tick, 25); };
    tick();
    return () => { alive = false; };
  }, [handle]);
  useLayoutEffect(() => { const ctx = ref.current?.getContext('2d'); if (ready && ctx) draw(ctx, t); }, [t, ready]);
  const u = (t - TEXT) / 1.1, a = outExpo(u);
  return (
    <AbsoluteFill style={{ background: '#0A0A0B' }}>
      <canvas ref={ref} width={1920} height={1080} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)' }} />
      {t >= TEXT && (
        <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: THEME.serif, fontSize: 148, letterSpacing: '0.02em', color: '#F2EFE9', opacity: clamp(a * 1.4), transform: `translateY(${(1 - a) * 26}px)`, whiteSpace: 'nowrap' }}>QUI CONTRÔLE QUI&#8239;?</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

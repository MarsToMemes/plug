import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';
import { Garment, type Kind } from './garments';
import { Odometer } from './ShopCart';

/**
 * ShopThreshold — the free-shipping threshold, and what it really costs.
 *
 * Cart at 46,47 €, free shipping from 49 €, shipping 3,99 €. The gauge fills and stops just short.
 * One more item (12,99 €) slides in: the gauge snaps to 100 %, « Livraison offerte » is confirmed —
 * and at the same instant the total rolls from 50,46 € to 59,46 €. A temporary split screen (two
 * cameras on the same interface) sets the reward against the amount: −3,99 € on one side, +9,00 €
 * on the other, two bars on ONE scale. Then the halves close back onto the cart.
 */
export const THRESHOLD = { fps: 60, seconds: 9.6 };

// ---------------------------------------------------------------- the numbers (cents)
type Line = { name: string; kind: Kind; color: string; bg: string; detail: string; cents: number };
const ITEMS: Line[] = [
  { name: 'Robe midi plissée', kind: 'dress', color: '#8A2F3A', bg: '#EDE1E0', detail: 'Taille M · Bordeaux', cents: 1999 },
  { name: 'Pull côtelé', kind: 'sweater', color: '#3D4C40', bg: '#ECE9E2', detail: 'Taille M · Vert sapin', cents: 1799 },
  { name: 'Top à bretelles', kind: 'cami', color: '#C2453A', bg: '#F0E5E6', detail: 'Taille S · Rouge', cents: 849 },
];
const EXTRA: Line = { name: 'Jupe satinée', kind: 'skirt', color: '#C9B48F', bg: '#E8E3ED', detail: 'Taille M · Sable', cents: 1299 };
const FREE = 4900, SHIP = 399;
const SUB0 = ITEMS.reduce((s, i) => s + i.cents, 0), SUB1 = SUB0 + EXTRA.cents; // 46,47 → 59,46
const TOTAL0 = SUB0 + SHIP, TOTAL1 = SUB1; // 50,46 → 59,46: +9,00
const eur = (c: number) => `${Math.floor(Math.round(c) / 100)},${String(Math.round(c) % 100).padStart(2, '0')} €`;

// ---------------------------------------------------------------- timing
const FILL = [0.25, 2.0] as const, SLIDE = [2.55, 3.05] as const, LAND = SLIDE[1];
const SPLIT = [4.0, 4.75] as const, UNSPLIT = [7.55, 8.25] as const;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const outCubic = (u: number) => 1 - (1 - clamp(u)) ** 3;
const outQuart = (u: number) => 1 - (1 - clamp(u)) ** 4;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const glide = bez(0.6, 0, 0.2, 1);
const pop = (tau: number) => (tau <= 0 ? 0 : 1 - Math.exp(-9 * tau) * Math.cos(14 * tau)); // a slight overshoot

// ---------------------------------------------------------------- the cart (world 1920 × 1080)
const INK = '#111111', GREY = '#77777C', LINE = '#E7E7E9', GREEN = '#1F8A4C', RED = '#E8442B', PAPER = '#F4F2EE';
const P = { x: 600, y: 80, w: 720, pad: 32 };
const ROW_Y = 176, ROW_H = 96;
const summaryTop = (t: number) => ROW_Y + 3 * ROW_H + 24 + ROW_H * glide((t - SLIDE[0]) / (SLIDE[1] - SLIDE[0]));
const GAUGE_DY = 104, TOTAL_DY = 232;

const Row: React.FC<{ it: Line; y: number; x?: number; a?: number }> = ({ it, y, x = 0, a = 1 }) => (
  <div style={{ position: 'absolute', left: P.x + P.pad + x, top: y, width: P.w - 2 * P.pad, height: ROW_H, opacity: a }}>
    <div style={{ position: 'absolute', left: 0, top: 8, width: 64, height: 80, borderRadius: 4, background: it.bg, overflow: 'hidden' }}>
      <svg viewBox="0 0 100 120" width={64} height={80}><g transform="translate(8,8) scale(0.84)"><Garment kind={it.kind} color={it.color} /></g></svg>
    </div>
    <div style={{ position: 'absolute', left: 84, top: 16, fontSize: 17, fontWeight: 600 }}>{it.name}</div>
    <div style={{ position: 'absolute', left: 84, top: 42, fontSize: 14, color: GREY }}>{it.detail}</div>
    <div style={{ position: 'absolute', right: 0, top: 16, fontSize: 17, fontWeight: 700 }}>{eur(it.cents)}</div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: LINE }} />
  </div>
);

const Cart: React.FC<{ t: number }> = ({ t }) => {
  const st = summaryTop(t), landed = t >= LAND, tau = t - LAND;
  const fill = landed ? lerp(SUB0 / FREE, 1, outCubic(tau / 0.16)) : (SUB0 / FREE) * outQuart((t - FILL[0]) / (FILL[1] - FILL[0])); // stops just short, then snaps
  const sub = landed ? lerp(SUB0, SUB1, outCubic(tau / 0.6)) : SUB0;
  const total = landed ? lerp(TOTAL0, TOTAL1, outCubic(tau / 0.6)) : TOTAL0;
  const slide = glide((t - SLIDE[0]) / (SLIDE[1] - SLIDE[0]));
  const ok = pop(tau - 0.08), strike = outCubic((tau - 0.05) / 0.18);
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: THEME.sans, color: INK }}>
      <div style={{ position: 'absolute', left: P.x, top: P.y, width: P.w, height: 920, borderRadius: 16, background: '#fff', boxShadow: '0 30px 80px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }} />
      <div style={{ position: 'absolute', left: P.x + P.pad, top: P.y + 34, fontSize: 30, fontWeight: 650 }}>Panier <span style={{ color: GREY, fontWeight: 400, fontSize: 22 }}>({landed ? 4 : 3} articles)</span></div>
      {ITEMS.map((it, i) => <Row key={i} it={it} y={ROW_Y + i * ROW_H} />)}
      {t >= SLIDE[0] && <Row it={EXTRA} y={ROW_Y + 3 * ROW_H} x={(1 - slide) * 90} a={clamp(slide * 2.5)} />}
      {/* Summary. */}
      <div style={{ position: 'absolute', left: P.x + P.pad, top: st, width: P.w - 2 * P.pad }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, color: '#4A4A4F' }}><span>Sous-total</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{eur(sub)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, color: '#4A4A4F', marginTop: 14 }}>
          <span>Livraison</span>
          <span style={{ position: 'relative' }}>
            <span style={{ position: 'relative', color: landed ? '#A4A4A8' : '#4A4A4F' }}>{eur(SHIP)}<span style={{ position: 'absolute', left: -2, right: -2, top: '55%', height: 1.5, background: '#A4A4A8', transformOrigin: '0 50%', transform: `scaleX(${strike})` }} /></span>
            {landed && <span style={{ marginLeft: 10, color: GREEN, fontWeight: 650, opacity: clamp((tau - 0.15) / 0.2) }}>Offerte</span>}
          </span>
        </div>
        {/* Gauge. */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: GAUGE_DY - 30, height: 22, fontSize: 15 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - clamp(tau / 0.12), color: '#4A4A4F' }}>Plus que <b style={{ color: INK }}>{eur(FREE - SUB0)}</b> pour la livraison offerte</div>
          {landed && (
            <div style={{ position: 'absolute', left: 0, top: -2, display: 'flex', alignItems: 'center', gap: 8, color: GREEN, fontWeight: 650, opacity: clamp((tau - 0.06) / 0.12) }}>
              <svg width={20} height={20} viewBox="0 0 20 20" style={{ transform: `scale(${ok})` }}><circle cx={10} cy={10} r={10} fill={GREEN} /><path d="M5.5 10.2 L8.6 13.2 L14.5 7" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              Livraison offerte
            </div>
          )}
          <div style={{ position: 'absolute', right: 0, top: 0, color: GREY, fontVariantNumeric: 'tabular-nums' }}>{eur(FREE)}</div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: GAUGE_DY, height: 8, borderRadius: 4, background: '#EEEEF0' }}>
          <div style={{ width: `${fill * 100}%`, height: 8, borderRadius: 4, background: landed ? GREEN : INK }} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: GAUGE_DY + 52, height: 1, background: LINE }} />
        {/* Total. */}
        <div style={{ position: 'absolute', left: 0, top: TOTAL_DY - 58, fontSize: 24, fontWeight: 650, lineHeight: '58px' }}>Total</div>
        <div style={{ position: 'absolute', right: 0, top: TOTAL_DY - 62 }}><Odometer cents={total} size={46} /></div>
        <div style={{ position: 'absolute', left: 0, top: TOTAL_DY + 92, width: P.w - 2 * P.pad, height: 60, borderRadius: 8, background: INK, color: '#fff', fontSize: 18, fontWeight: 600, lineHeight: '60px', textAlign: 'center' }}>Commander</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- one view of the cart through a camera
type Win = { top: number; right: number; bottom: number; left: number; r: number };
const View: React.FC<{ t: number; cam: { ax: number; ay: number; x: number; y: number; s: number }; win?: Win }> = ({ t, cam, win }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', clipPath: win ? `inset(${win.top}px ${win.right}px ${win.bottom}px ${win.left}px round ${win.r}px)` : undefined }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${cam.ax - cam.x * cam.s}px, ${cam.ay - cam.y * cam.s}px) scale(${cam.s})` }}>
      <Cart t={t} />
    </div>
  </div>
);

export const ShopThreshold: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const st = summaryTop(t);

  // The single camera: the whole cart, a slow approach, then a push onto the summary at the snap.
  const push = glide((t - 2.4) / 1.3), back = glide((t - 8.2) / 1.2);
  const open = { y: lerp(500, 520, clamp(t / 2.4)), s: lerp(1.12, 1.2, clamp(t / 2.4)) };
  const end = { y: 560, s: 1.14 };
  const single = { ax: 960, ay: 540, x: 960, y: lerp(lerp(open.y, st + 150, push), end.y, back), s: lerp(lerp(open.s, 1.5, push), end.s, back) };

  // Split: each half gets its own camera, eased from the single one (seamless) to its subject.
  const sp = glide((t - SPLIT[0]) / (SPLIT[1] - SPLIT[0])) * (1 - glide((t - UNSPLIT[0]) / (UNSPLIT[1] - UNSPLIT[0])));
  const camOf = (ax: number, x: number, y: number) => ({ ax: lerp(single.ax, ax, sp), ay: lerp(single.ay, 320, sp), x: lerp(single.x, x, sp), y: lerp(single.y, y, sp), s: lerp(single.s, 1.3, sp) });
  const left = camOf(490, 960, st + 75), right = camOf(1430, 960, st + 218);

  // Annotations (screen space), on one shared scale: 1 € = 58 px.
  const K = 58, ann = (d: number) => outCubic((t - SPLIT[1] - d) / 0.5) * (1 - glide((t - UNSPLIT[0]) / 0.4));
  const Side: React.FC<{ x: number; label: string; value: string; note: string; euros: number; color: string; d: number }> = ({ x, label, value, note, euros, color, d }) => {
    const a = ann(d), bar = outCubic((t - SPLIT[1] - d - 0.25) / 0.7) * (1 - glide((t - UNSPLIT[0]) / 0.4));
    return (
      <div style={{ position: 'absolute', left: x, top: 530, opacity: a, transform: `translateY(${(1 - a) * 14}px)`, fontFamily: THEME.sans }}>
        <div style={{ fontFamily: THEME.mono, fontSize: 15, letterSpacing: '0.26em', color: GREY }}>{label}</div>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: '-0.03em', color, marginTop: 10, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 17, color: '#55555A', marginTop: 12 }}>{note}</div>
        <div style={{ width: euros * K * bar, height: 10, borderRadius: 5, background: color, marginTop: 26 }} />
      </div>
    );
  };
  const concl = ann(1.35);

  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {sp <= 0.0005 ? <View t={t} cam={single} /> : (
        <>
          {/* Each half becomes a window on its subject; the paper below takes the figures. */}
          <View t={t} cam={left} win={{ top: 190 * sp, right: 960 + 40 * sp, bottom: (1080 - 450) * sp, left: 60 * sp, r: 14 * sp }} />
          <View t={t} cam={right} win={{ top: 190 * sp, right: 60 * sp, bottom: (1080 - 450) * sp, left: 960 + 40 * sp, r: 14 * sp }} />
          {[[60, 860], [1000, 860]].map(([x, w], i) => <div key={i} style={{ position: 'absolute', left: x, top: 190, width: w, height: 260, borderRadius: 14, boxShadow: `0 0 0 1px rgba(17,17,17,${0.08 * sp})`, pointerEvents: 'none' }} />)}
          <div style={{ position: 'absolute', left: 959.5, top: 555 - 385 * sp, width: 1, height: 770 * sp, background: 'rgba(17,17,17,0.16)' }} />
          <Side x={120} label="RÉCOMPENSE PERÇUE" value={`−${eur(SHIP)}`} note="de frais de livraison évités" euros={SHIP / 100} color={GREEN} d={0} />
          <Side x={1080} label="DÉPENSE SUPPLÉMENTAIRE" value={`+${eur(TOTAL1 - TOTAL0)}`} note={`sur le total : un article à ${eur(EXTRA.cents)}, moins le port`} euros={(TOTAL1 - TOTAL0) / 100} color={RED} d={0.3} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 968, textAlign: 'center', fontFamily: THEME.serif, fontSize: 44, color: INK, opacity: concl, transform: `translateY(${(1 - concl) * 10}px)` }}>
            Pour économiser {eur(SHIP)}, la commande a augmenté de {eur(TOTAL1 - TOTAL0)}.
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

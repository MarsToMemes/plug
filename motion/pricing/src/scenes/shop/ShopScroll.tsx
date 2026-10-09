import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME, rng } from '../../theme';
import { Garment, KINDS, type Kind } from './garments';

/**
 * ShopScroll — a fast-fashion app scrolled faster and faster, then a camera dive into one product.
 *
 * One velocity curve drives everything. The scroll accelerates by steps; each step is triggered by
 * a flash price appearing (it lifts out of the screen) and answered by a camera micro-zoom. The
 * phone leans slightly with the speed (inertia), which makes the UI layers (header, grid, nav,
 * floating price) parallax against each other. The brake is solved to land exactly on the target
 * card; the phone straightens, the camera dives into the card, and its image becomes the frame.
 *
 * Interface inspired by a fast-fashion app, drawn for this piece: the garments are flat
 * illustrations, no product photography, no logo artwork.
 */
export const SHOP = { fps: 60, seconds: 9 };
const BRAND = 'SHEIN';

// ---------------------------------------------------------------- screen layout (screen px)
const SW = 400, SH = 866, BEZEL = 14;
const STATUS = 44, HEADER = 52, SEARCH = 46, TABS = 40, NAV = 74;
const CARD = { w: 186, img: 248, text: 60, gap: 8, side: 10 };
const PITCH = CARD.img + CARD.text + CARD.gap;
const gridTop = (collapse: number) => STATUS + HEADER + SEARCH * (1 - collapse) + TABS;
const GRID_BOTTOM = SH - NAV;

// ---------------------------------------------------------------- products (deterministic)
const NAMES: Record<Kind, string> = { tee: 'T-shirt oversize', dress: 'Robe midi plissée', hoodie: 'Sweat à capuche', jeans: 'Jean large taille haute', skirt: 'Jupe satinée', jacket: 'Veste cropped', cami: 'Top à fines bretelles', shorts: 'Short en lin', sweater: 'Pull maille côtelée', bag: 'Sac bandoulière' };
const BG = ['#EEE8E0', '#E4E8EB', '#F0E5E6', '#E5E9E1', '#F2EDE4', '#E8E3ED', '#ECE9E2'];
const INK = ['#1F1F22', '#C2453A', '#D9C8B0', '#6B7F99', '#B4876A', '#3D4C40', '#D7A3AD', '#8A2F3A', '#2F4B7C', '#F4F1EA', '#E4B33E'];
type Product = { kind: Kind; bg: string; color: string; price: number; was: number; sold: number };
function product(k: number): Product {
  const r = rng(9100 + k * 31);
  const kind = KINDS[Math.floor(r() * KINDS.length)]!, price = [3.49, 4.99, 5.49, 6.99, 7.99, 8.49, 9.99, 11.99, 12.49, 14.99][Math.floor(r() * 10)]!;
  return { kind, bg: BG[Math.floor(r() * BG.length)]!, color: INK[Math.floor(r() * INK.length)]!, price, was: Math.round(price * (2 + r() * 1.6)) - 0.01, sold: 1 + Math.floor(r() * 99) };
}
const euro = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;

// ---------------------------------------------------------------- the velocity curve
const STEPS = [{ t: 0.45, v: 230 }, { t: 1.3, v: 520 }, { t: 2.05, v: 980 }, { t: 2.7, v: 1750 }, { t: 3.25, v: 2900 }, { t: 3.7, v: 4300 }, { t: 4.1, v: 6200 }];
const RAMP = 0.17; // each acceleration: short and firm
const TB = 4.62; // brake
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

function speedAt(t: number) {
  let v = 0;
  for (const s of STEPS) { if (t < s.t) break; v = lerp(v, s.v, ease(clamp((t - s.t) / RAMP))); }
  return v;
}
// Integrated once, at 1/600 s (deterministic, cheap enough).
const DT = 1 / 600, N = Math.ceil(TB / DT) + 1;
const S_TABLE = (() => { const a = new Float64Array(N + 1); for (let i = 1; i <= N; i++) a[i] = a[i - 1]! + speedAt((i - 0.5) * DT) * DT; return a; })();
const S0 = S_TABLE[Math.round(TB / DT)]!, V0 = speedAt(TB);
// Brake: land a card's image exactly in the middle of the visible grid (header collapsed).
const YC = (gridTop(1) + GRID_BOTTOM) / 2;
const TARGET_ROW = (() => { let r = 0; while (gridTop(1) + r * PITCH + CARD.img / 2 - YC < S0 + V0 * 0.17) r++; return r; })();
const S_END = gridTop(1) + TARGET_ROW * PITCH + CARD.img / 2 - YC;
const D = S_END - S0, TBR = (2.4 * D) / V0; // Hermite with v(1) = 0, monotonic for v0·T ≤ 3D
const STOP = TB + TBR;
export const TARGET = { row: TARGET_ROW, col: 1 };

function scrollAt(t: number) {
  if (t <= 0) return 0;
  if (t < TB) { const x = t / DT, i = Math.floor(x); return lerp(S_TABLE[i]!, S_TABLE[Math.min(N, i + 1)]!, x - i); }
  if (t < STOP) { const u = (t - TB) / TBR; return S0 + (-2 * u ** 3 + 3 * u ** 2) * D + (u ** 3 - 2 * u ** 2 + u) * V0 * TBR; }
  const tau = t - STOP;
  return S_END + 7 * Math.exp(-9 * tau) * Math.sin(20 * tau); // a short, firm settle
}

// ---------------------------------------------------------------- the camera & the end
const FLAT = [STOP - 0.12, STOP + 0.42] as const; // the phone straightens
const ZOOM = [STOP + 0.4, STOP + 0.95] as const; // dive into the card
const FILL = [ZOOM[1] - 0.12, ZOOM[1] + 0.3] as const; // the card image becomes the frame
const HERO = ZOOM[1] + 0.25; // product typography
const pulse = (tau: number) => (tau < 0 ? 0 : (1 - Math.exp(-tau / 0.035)) * Math.exp(-tau / 0.24));
const diveEase = (u: number) => { const a = 0.72, b = 0.18; // slow start, very fast middle, soft landing
  // cubic-bezier(a, 0, b, 1) solved for x = u
  let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2, x = 3 * a * m * (1 - m) ** 2 + 3 * b * m * m * (1 - m) + m ** 3; if (x < u) lo = m; else hi = m; }
  const s = (lo + hi) / 2; return 3 * s * s * (1 - s) + s ** 3; };

// ---------------------------------------------------------------- components
const Card: React.FC<{ k: number; x: number; y: number; scroll: number; featured: number }> = ({ k, x, y, scroll, featured }) => {
  const p = product(k);
  // The price appears as the card enters (in scroll distance: instant at speed, smooth when slow).
  const enter = gridTop(1) + Math.floor(k / 2) * PITCH - GRID_BOTTOM + 140;
  const u = clamp((scroll - enter) / 90), pop = u <= 0 ? 0 : 1 - Math.exp(-6 * u) * Math.cos(9 * u);
  const off = Math.round((1 - p.price / p.was) * 100);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: CARD.w, height: CARD.img + CARD.text }}>
      <div style={{ position: 'relative', width: CARD.w, height: CARD.img, borderRadius: 6, background: p.bg, overflow: 'hidden' }}>
        <svg viewBox="0 0 100 120" width={CARD.w} height={CARD.img} style={{ position: 'absolute', inset: 0 }} preserveAspectRatio="xMidYMid meet">
          <ellipse cx={50} cy={112} rx={30} ry={3} fill="#000" opacity={0.06} />
          <g transform="translate(5,4) scale(0.9)"><Garment kind={p.kind} color={p.color} /></g>
        </svg>
        <div style={{ position: 'absolute', left: 0, top: 10, padding: '3px 6px', background: '#111', color: '#fff', fontFamily: THEME.sans, fontWeight: 700, fontSize: 11 }}>-{off}%</div>
      </div>
      <div style={{ fontFamily: THEME.sans, fontSize: 12, color: '#6b6b6b', marginTop: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{NAMES[p.kind]}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4, transformOrigin: '0% 100%', transform: `scale(${lerp(0.6, 1, pop)})`, opacity: clamp(u * 4) * (1 - featured) }}>
        <span style={{ fontFamily: THEME.sans, fontWeight: 800, fontSize: 17, color: '#E8442B' }}>{euro(p.price)}</span>
        <span style={{ fontFamily: THEME.sans, fontSize: 11, color: '#9a9a9a', textDecoration: 'line-through' }}>{euro(p.was)}</span>
      </div>
    </div>
  );
};

const NavIcon: React.FC<{ i: number }> = ({ i }) => {
  const s = { fill: 'none', stroke: i === 0 ? '#111' : '#8a8a8a', strokeWidth: 1.8, strokeLinejoin: 'round' as const };
  return (
    <svg width={26} height={26} viewBox="0 0 26 26">
      {i === 0 && <path d="M4 12 L13 4 L22 12 L22 22 L4 22 Z" {...s} />}
      {i === 1 && <><rect x={4} y={4} width={7} height={7} {...s} /><rect x={15} y={4} width={7} height={7} {...s} /><rect x={4} y={15} width={7} height={7} {...s} /><rect x={15} y={15} width={7} height={7} {...s} /></>}
      {i === 2 && <path d="M13 3 L16 10 L23 10.5 L17.5 15 L19.5 22 L13 18 L6.5 22 L8.5 15 L3 10.5 L10 10 Z" {...s} />}
      {i === 3 && <><path d="M5 9 L21 9 L19.5 23 L6.5 23 Z" {...s} /><path d="M9 9 Q9 3 13 3 Q17 3 17 9" {...s} /></>}
      {i === 4 && <><circle cx={13} cy={9} r={5} {...s} /><path d="M4 23 Q4 15 13 15 Q22 15 22 23" {...s} /></>}
    </svg>
  );
};

export const ShopScroll: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const scroll = scrollAt(t), v = (scrollAt(t) - scrollAt(t - 1 / fps)) * fps; // px / s
  const vn = clamp(v / 6200);
  const collapse = clamp(scroll / 150), top = gridTop(collapse);

  // Featured flash prices: one per acceleration step (steps 2…), on the card crossing the upper middle.
  const events = STEPS.slice(1).map((s, i) => {
    const sc = scrollAt(s.t), y = 330 + (i % 2) * 40;
    const row = Math.max(0, Math.round((sc + y - gridTop(1) - CARD.img / 2) / PITCH));
    return { t: s.t, k: row * 2 + (i % 2), amp: 0.014 + i * 0.004 };
  });
  const featuredOf = (k: number) => Math.max(0, ...events.filter((e) => e.k === k).map((e) => { const tau = t - e.t; return tau < 0 ? 0 : Math.min(1, tau / 0.05) * (1 - clamp((tau - 0.45) / 0.15)); }));

  // Camera: slow dolly in during the scroll, micro-zoom on each flash price.
  const dolly = 1 + 0.06 * ease(clamp(t / TB));
  const micro = events.reduce((a, e) => a + e.amp * pulse(t - e.t), 0);
  // Phone pose: leans with the speed (inertia), straightens before the dive.
  const flat = ease(clamp((t - FLAT[0]) / (FLAT[1] - FLAT[0])));
  const rx = lerp(10 + 4 * vn, 0, flat), ry = lerp(-18 + 5 * vn, 0, flat), rz = lerp(2.2 - 0.8 * vn, 0, flat);
  const lift = lerp(-6 * vn, 0, flat);

  // The dive: card image centre (comp px, phone flat & centred) → frame centre, then scaled.
  const tr = TARGET.row, tc = TARGET.col;
  const cardX = CARD.side + tc * (CARD.w + CARD.gap), cardY = gridTop(1) + tr * PITCH - S_END; // screen px
  const P = { x: 960 - SW / 2 + cardX + CARD.w / 2, y: 540 - SH / 2 + cardY + CARD.img / 2 };
  const zu = diveEase(clamp((t - ZOOM[0]) / (ZOOM[1] - ZOOM[0])));
  const ZT = (1080 * 0.82) / CARD.img;
  const camZ = (dolly + micro) * lerp(1, ZT / (dolly + micro), zu);
  const F = { x: lerp(960, P.x, zu), y: lerp(540, P.y, zu) }; // focus: frame centre → card centre (no jump)
  const zoomBlur = (() => { const a = diveEase(clamp((t - 1 / fps - ZOOM[0]) / (ZOOM[1] - ZOOM[0]))); return Math.min(6, Math.abs(zu - a) * 60); })();

  // Full frame: the card image rect (as seen through the camera) grows to the whole frame.
  const fu = ease(clamp((t - FILL[0]) / (FILL[1] - FILL[0])));
  const tp = product(tr * 2 + tc);
  const imgW = CARD.w * ZT, imgH = CARD.img * ZT;
  const box = { x: lerp(960 - imgW / 2, 0, fu), y: lerp(540 - imgH / 2, 0, fu), w: lerp(imgW, 1920, fu), h: lerp(imgH, 1080, fu), r: lerp(6 * ZT, 0, fu) };
  const hu = (d: number, len = 0.45) => ease(clamp((t - HERO - d) / len));
  const gx = lerp(960, 1340, hu(0, 0.6)); // the garment makes room for the type

  const rows = Math.ceil(SH / PITCH) + 2, first = Math.max(0, Math.floor((scroll - (top - STATUS)) / PITCH) - 1);
  const cards: React.ReactNode[] = [];
  for (let r = first; r < first + rows; r++) for (let c = 0; c < 2; c++) {
    const k = r * 2 + c;
    cards.push(<Card key={k} k={k} x={CARD.side + c * (CARD.w + CARD.gap)} y={r * PITCH - scroll} scroll={scroll} featured={featuredOf(k)} />);
  }
  const vblur = Math.min(26, (Math.abs(v) / fps) * 0.45);

  return (
    <AbsoluteFill style={{ background: '#0B0B0D' }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}><filter id="vblur" x="0" y="-10%" width="100%" height="120%"><feGaussianBlur stdDeviation={`0 ${vblur.toFixed(2)}`} /></filter></svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 55%, #1B1B1F 0%, #0B0B0D 70%)' }} />
      {/* Camera. */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${960 - F.x * camZ}px, ${540 - F.y * camZ}px) scale(${camZ})`, filter: zoomBlur > 0.3 ? `blur(${zoomBlur.toFixed(2)}px)` : undefined }}>
        {/* Floor shadow: anchors the phone in space, follows its lean. */}
        <div style={{ position: 'absolute', left: 960 - 240, top: 540 + SH / 2 - 10, width: 480, height: 60, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.55), rgba(0,0,0,0))', transform: `translateX(${ry * 2}px) scaleX(${1 - flat * 0.2})`, opacity: 1 - flat }} />
        <div style={{ position: 'absolute', left: 960 - (SW + 2 * BEZEL) / 2, top: 540 - (SH + 2 * BEZEL) / 2, width: SW + 2 * BEZEL, height: SH + 2 * BEZEL, perspective: 2400 }}>
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateY(${lift}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
            {/* Body. */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 62, background: 'linear-gradient(145deg, #3A3A3F, #18181B 40%, #2A2A2E)', boxShadow: '0 0 0 1.5px #4A4A50 inset, 0 30px 80px rgba(0,0,0,0.5)' }} />
            {/* Screen (layers at different depths: they parallax as the phone leans). */}
            <div style={{ position: 'absolute', left: BEZEL, top: BEZEL, width: SW, height: SH, borderRadius: 48, overflow: 'hidden', background: '#fff' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top, bottom: NAV, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 4000, filter: vblur > 0.4 ? 'url(#vblur)' : undefined }}>{cards}</div>
              </div>
              {/* Header: status, brand, search (collapses with the scroll), tabs. */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top, background: '#fff', boxShadow: collapse > 0.5 ? '0 1px 0 #eee' : undefined }}>
                <div style={{ position: 'absolute', left: 28, top: 14, fontFamily: THEME.sans, fontWeight: 600, fontSize: 15, color: '#111' }}>9:41</div>
                <div style={{ position: 'absolute', left: SW / 2 - 60, top: 10, width: 120, height: 32, borderRadius: 18, background: '#000' }} />
                <div style={{ position: 'absolute', right: 26, top: 16, display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[6, 9, 12].map((h) => <div key={h} style={{ width: 3, height: h, background: '#111', borderRadius: 1 }} />)}
                  <div style={{ width: 24, height: 11, border: '1.5px solid #111', borderRadius: 3, marginLeft: 4, padding: 1, boxSizing: 'border-box' }}><div style={{ width: '80%', height: '100%', background: '#111', borderRadius: 1 }} /></div>
                </div>
                <div style={{ position: 'absolute', left: 0, right: 0, top: STATUS, height: HEADER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: THEME.sans, fontWeight: 800, fontSize: 24, letterSpacing: '0.16em', color: '#111' }}>{BRAND}</div>
                <div style={{ position: 'absolute', left: 14, right: 14, top: STATUS + HEADER + 2 - collapse * 30, height: SEARCH - 10, borderRadius: 20, background: '#F2F2F2', opacity: 1 - collapse, display: 'flex', alignItems: 'center', paddingLeft: 16, fontFamily: THEME.sans, fontSize: 13, color: '#9a9a9a' }}>Robe d'été</div>
                <div style={{ position: 'absolute', left: 14, right: 0, top: top - TABS, height: TABS, display: 'flex', gap: 22, alignItems: 'center', fontFamily: THEME.sans, fontSize: 14, color: '#777', whiteSpace: 'nowrap' }}>
                  {['Tout', 'Femme', 'Curve', 'Homme', 'Enfants', 'Maison'].map((w, i) => <span key={w} style={{ color: i === 1 ? '#111' : undefined, fontWeight: i === 1 ? 700 : 400, borderBottom: i === 1 ? '2px solid #111' : undefined, paddingBottom: 4 }}>{w}</span>)}
                </div>
              </div>
              {/* Bottom navigation. */}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: NAV, background: '#fff', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 12 }}>
                {[0, 1, 2, 3, 4].map((i) => <NavIcon key={i} i={i} />)}
              </div>
              <div style={{ position: 'absolute', left: SW / 2 - 66, bottom: 8, width: 132, height: 5, borderRadius: 3, background: '#111' }} />
            </div>
            {/* Flash prices lift out of the screen (front layer). */}
            {events.map((e, i) => {
              const f = featuredOf(e.k);
              if (f <= 0) return null;
              const p = product(e.k), r = Math.floor(e.k / 2), c = e.k % 2;
              const y = BEZEL + gridTop(1) + r * PITCH - scrollAt(e.t) + CARD.img + 30, x = BEZEL + CARD.side + c * (CARD.w + CARD.gap);
              const pop = 1 - Math.exp(-7 * f) * Math.cos(10 * f);
              return (
                <div key={i} style={{ position: 'absolute', left: x - 4, top: y - 4, padding: '6px 10px', borderRadius: 4, background: '#E8442B', color: '#fff', fontFamily: THEME.sans, fontWeight: 800, fontSize: 19, boxShadow: '0 10px 24px rgba(0,0,0,0.35)', transformOrigin: '0% 100%', transform: `translateZ(${46 * f}px) scale(${lerp(0.7, 1.12, pop)})`, opacity: Math.min(1, f * 3), whiteSpace: 'nowrap' }}>
                  {euro(p.price)} <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>FLASH</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full frame: the card image takes the whole frame, then the product is set like an editorial page. */}
      {fu > 0 && (
        <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.r, background: tp.bg, overflow: 'hidden' }}>
          <svg width={1920} height={1080} style={{ position: 'absolute', left: -box.x, top: -box.y }}>
            <g transform={`translate(${gx - imgW / 2}, ${540 - imgH / 2 + (imgH - 120 * (imgW / 100)) / 2}) scale(${imgW / 100})`}>
              <ellipse cx={50} cy={112} rx={30} ry={3} fill="#000" opacity={0.06} />
              <g transform="translate(5,4) scale(0.9)"><Garment kind={tp.kind} color={tp.color} /></g>
            </g>
          </svg>
        </div>
      )}
      {t >= HERO && (() => {
        const off = Math.round((1 - tp.price / tp.was) * 100);
        const L = 200;
        const mask = (d: number): React.CSSProperties => ({ transform: `translateY(${(1 - hu(d)) * 110}%)` });
        const badge = hu(0.62, 0.4), bp = 1 - Math.exp(-7 * badge) * Math.cos(10 * badge);
        return (
          <div style={{ position: 'absolute', left: L, top: 250, color: '#111' }}>
            <div style={{ overflow: 'hidden' }}><div style={{ ...mask(0.05), fontFamily: THEME.mono, fontSize: 20, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#6a6a6a' }}>Vente flash · Femme</div></div>
            <div style={{ overflow: 'hidden', marginTop: 18 }}><div style={{ ...mask(0.12), fontFamily: THEME.serif, fontSize: 104, lineHeight: 1.02, letterSpacing: '-0.01em' }}>{NAMES[tp.kind]}</div></div>
            <div style={{ overflow: 'hidden', marginTop: 6 }}><div style={{ ...mask(0.22), fontFamily: THEME.sans, fontWeight: 800, fontSize: 196, letterSpacing: '-0.045em', lineHeight: 1.05, color: '#E8442B' }}>{euro(tp.price)}</div></div>
            <div style={{ overflow: 'hidden', marginTop: 18, paddingBottom: 4 }}>
              <div style={{ ...mask(0.34), display: 'flex', alignItems: 'center', gap: 22 }}>
                <span style={{ position: 'relative', fontFamily: THEME.sans, fontSize: 44, color: '#8a8a8a' }}>{euro(tp.was)}<span style={{ position: 'absolute', left: -4, right: -4, top: '52%', height: 3, background: '#8a8a8a', transformOrigin: '0 50%', transform: `scaleX(${hu(0.48, 0.25)})` }} /></span>
                <span style={{ padding: '8px 14px', background: '#111', color: '#fff', fontFamily: THEME.sans, fontWeight: 800, fontSize: 34, transform: `scale(${lerp(0.6, 1, bp)})`, transformOrigin: '0 50%', opacity: clamp(badge * 8) }}>-{off}%</span>
              </div>
            </div>
            <div style={{ width: 640, height: 1.5, background: '#111', opacity: 0.18, marginTop: 44, transformOrigin: '0 50%', transform: `scaleX(${hu(0.7, 0.5)})` }} />
            <div style={{ overflow: 'hidden', marginTop: 22 }}><div style={{ ...mask(0.8), fontFamily: THEME.mono, fontSize: 20, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6a6a6a' }}>{tp.sold} 000 vendus cette semaine</div></div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

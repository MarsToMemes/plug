import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';

/**
 * ShopNotif — a lock screen saturated by notifications.
 *
 * Each notification drops in from just above its slot (a short move, expo deceleration) and pushes
 * the others down. The list is laid out from a CONTINUOUS rank (the sum of the eased arrivals above
 * a card), so overlapping arrivals never jump. When the screen is full, the older cards compress
 * under the newer ones: they recede (slightly smaller, darker) and show only their lower edge — the
 * depth of the pile. Arrivals come faster and faster (0.8 s → 0.045 s). The camera approaches the
 * screen, accelerating, and stops dead when the last card lands. Then nothing moves.
 */
const N = 38;
const INTERVALS = Array.from({ length: N - 1 }, (_, k) => Math.max(0.045, 0.8 * Math.exp(-k / 9)));
const ARRIVE = INTERVALS.reduce((a, d) => [...a, a[a.length - 1]! + d], [0.6]);
const DUR = ARRIVE.map((_, k) => Math.min(0.5, Math.max(0.16, 0.5 * Math.sqrt((INTERVALS[k] ?? 0.045) / 0.8))));
const STOP = ARRIVE[N - 1]! + DUR[N - 1]!;
export const NOTIF = { fps: 60, seconds: Math.ceil((STOP + 1.7) * 10) / 10 };

// ---------------------------------------------------------------- content
type App = { name: string; letter: string; bg: string; fg: string };
const APPS: Record<string, App> = {
  shop: { name: 'SHEIN', letter: 'S', bg: '#111111', fg: '#FFFFFF' },
  bank: { name: 'Banque', letter: '€', bg: '#2F5BD3', fg: '#FFFFFF' },
  parcel: { name: 'Colis', letter: 'C', bg: '#C9772E', fg: '#FFFFFF' },
  msg: { name: 'Messages', letter: 'M', bg: '#34B35A', fg: '#FFFFFF' },
};
const MESSAGES: Array<[keyof typeof APPS, string, string]> = [
  ['shop', 'Vente flash', '−70 % sur les robes, jusqu’à 23 h.'],
  ['shop', 'Ton panier t’attend', '4 articles réservés pendant 20 minutes.'],
  ['shop', 'Prix en baisse', 'Un article de tes favoris passe à 4,99 €.'],
  ['bank', 'Paiement accepté', '34,97 € — achat en ligne.'],
  ['shop', 'Plus que 3 en stock', 'La veste que tu as regardée part vite.'],
  ['parcel', 'Commande expédiée', 'Livraison prévue jeudi.'],
  ['shop', 'Nouveautés', '1 284 articles ajoutés aujourd’hui.'],
  ['shop', 'Code exclusif', '−15 % sur ta commande, expire dans 1 h.'],
  ['msg', 'Léa', '« T’as vu les soldes ? »'],
  ['shop', 'Quelqu’un vient d’acheter', 'ce top. Il en reste 2.'],
  ['bank', 'Paiement accepté', '18,45 € — achat en ligne.'],
  ['shop', 'Livraison gratuite', 'Ce soir seulement, dès 1 article.'],
  ['shop', 'Encore 2 h', 'pour profiter de −80 % sur la maille.'],
  ['parcel', 'Colis en point relais', 'À retirer avant samedi.'],
  ['shop', 'Tu pourrais aimer', '12 nouveaux articles dans ton style.'],
  ['bank', 'Paiement accepté', '52,10 € — achat en ligne.'],
  ['shop', 'Dernière chance', 'Ton code −20 % expire à minuit.'],
  ['shop', 'Prix en baisse', '3 articles de ton panier baissent.'],
  ['bank', 'Paiement accepté', '9,98 € — achat en ligne.'],
];
const message = (k: number) => MESSAGES[k % MESSAGES.length]!;

// ---------------------------------------------------------------- phone & layout (world = screen px at camera 1)
const SW = 500, SH = 1082, BEZEL = 14, PX = 960 - SW / 2, PY = 64; // screen origin in the frame
const CARD_W = SW - 24, CARD_H = 100, P = CARD_H + 8, LIST_TOP = 300, AVAIL = 700, FULL = 3, MIN_PITCH = 15;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const outExpo = (u: number) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(u)));
const arrived = (k: number, t: number) => outExpo((t - ARRIVE[k]!) / DUR[k]!);

/** Offset of a card at continuous rank ρ when m cards (continuous) are on screen. */
function offset(rho: number, m: number) {
  const pitch = m - FULL > 0 ? clamp((AVAIL - FULL * P) / (m - FULL), MIN_PITCH, P) : P;
  return P * Math.min(rho, FULL) + pitch * Math.max(0, rho - FULL);
}

const Notification: React.FC<{ k: number }> = ({ k }) => {
  const [app, title, body] = message(k), a = APPS[app]!;
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '14px 16px', boxSizing: 'border-box', fontFamily: THEME.sans, color: '#111' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: a.bg, color: a.fg, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.letter}</div>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.04em', color: '#55565B', textTransform: 'uppercase', flex: 1 }}>{a.name}</div>
        <div style={{ fontSize: 14, color: '#7A7B80' }}>maintenant</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 650, marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      <div style={{ fontSize: 17, fontWeight: 400, color: '#2B2C30', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{body}</div>
    </div>
  );
};

export const ShopNotif: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = Math.min(frame / fps, STOP); // after the stop, nothing moves at all
  const e = ARRIVE.map((_, k) => arrived(k, t));
  const m = e.reduce((s, v) => s + v, 0);

  // Camera: an accelerating approach towards the list, cut dead at STOP (velocity → 0 in one frame).
  // It starts on the whole lock screen (clock included) and ends framed on the pile.
  const u = clamp(t / STOP) ** 1.8, cs = 1.12 + 0.3 * u;
  const focus = { x: 960, y: 560 + 150 * u };

  const cards: React.ReactNode[] = [];
  let above = 0; // sum of the eased arrivals newer than k (its continuous rank)
  for (let k = N - 1; k >= 0; k--) {
    if (e[k]! <= 0) continue;
    const rho = above, ek = e[k]!;
    above += ek;
    const y = LIST_TOP + offset(rho, m) - 46 * (1 - ek);
    if (y > SH + 40) continue;
    const depth = Math.min(rho, 10);
    cards.push(
      <div key={k} style={{ position: 'absolute', left: 12, top: y, width: CARD_W, height: CARD_H, zIndex: 1000 - Math.round(rho * 10), transformOrigin: '50% 0%', transform: `scale(${(1 - 0.012 * depth) * (0.97 + 0.03 * ek)})`, opacity: clamp(ek * 1.6) }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: 'rgba(246,246,248,0.94)', boxShadow: `0 ${4 + depth}px ${14 + depth * 2}px rgba(0,0,0,${0.18 + 0.02 * depth})`, overflow: 'hidden' }}>
          <Notification k={k} />
          <div style={{ position: 'absolute', inset: 0, background: `rgba(10,12,18,${0.045 * depth})` }} />
        </div>
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: '#0A0A0C' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 50% 70% at 50% 45%, #18181C 0%, #0A0A0C 75%)' }} />
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${960 - focus.x * cs}px, ${540 - focus.y * cs}px) scale(${cs})` }}>
        {/* Phone. */}
        <div style={{ position: 'absolute', left: PX - BEZEL, top: PY - BEZEL, width: SW + 2 * BEZEL, height: SH + 2 * BEZEL, borderRadius: 68, background: 'linear-gradient(145deg, #3A3A3F, #18181B 40%, #2A2A2E)', boxShadow: '0 0 0 1.5px #4A4A50 inset, 0 40px 100px rgba(0,0,0,0.6)' }} />
        <div style={{ position: 'absolute', left: PX, top: PY, width: SW, height: SH, borderRadius: 54, overflow: 'hidden', background: 'linear-gradient(180deg, #2A3140 0%, #161A23 45%, #0E1016 100%)' }}>
          {/* Status bar. */}
          <div style={{ position: 'absolute', left: SW / 2 - 64, top: 12, width: 128, height: 36, borderRadius: 20, background: '#000' }} />
          <div style={{ position: 'absolute', right: 30, top: 22, display: 'flex', gap: 5, alignItems: 'flex-end' }}>
            {[6, 9, 12].map((h) => <div key={h} style={{ width: 3, height: h, background: '#fff', borderRadius: 1 }} />)}
            <div style={{ width: 25, height: 12, border: '1.5px solid #fff', borderRadius: 3, marginLeft: 5, padding: 1, boxSizing: 'border-box' }}><div style={{ width: '62%', height: '100%', background: '#fff', borderRadius: 1 }} /></div>
          </div>
          {/* Lock screen. */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: THEME.sans, color: 'rgba(255,255,255,0.86)', fontSize: 20, fontWeight: 500 }}>jeudi 9 octobre</div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 118, textAlign: 'center', fontFamily: THEME.sans, color: '#fff', fontSize: 112, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>21:47</div>
          {cards}
          <div style={{ position: 'absolute', left: SW / 2 - 70, bottom: 10, width: 140, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.85)', zIndex: 2000 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

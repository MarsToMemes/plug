import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Caps, Statement } from '../components/ui';
import { S07 } from '../data/scene07';
import { EASE, THEME, lerp, seg } from '../theme';

const L = S07.layers, P = S07.pair;
const ROW = (k: number) => 800 - k * 125; // cheapest at the bottom
const X0 = 420, W = 840, H = 78;
export const PAIR = [{ x: 665, y: 375, w: 170, h: 170 }, { x: 1085, y: 375, w: 170, h: 170 }]; // read by the bridge 07 → 08

/** A seat seen from above, large: the cushion and its backrest. */
const BigSeat: React.FC<{ u: (typeof PAIR)[number]; o: number; hot?: boolean }> = ({ u, o, hot }) => (
  <g opacity={o}>
    <rect x={u.x} y={u.y} width={u.w} height={u.h} rx={30} fill="none" stroke={hot ? THEME.accent : THEME.ink} strokeWidth={2.4} />
    <rect x={u.x + 18} y={u.y - 30} width={u.w - 36} height={20} rx={8} fill={hot ? THEME.accent : THEME.ink} />
  </g>
);

/**
 * Scene 07, second half (on the voice): the aircraft as layers of price. The same seat can be sold
 * at five prices; the cheapest layers close first; two neighbours paid very different prices.
 */
export const FareLayers: React.FC = () => {
  const f = useCurrentFrame();
  if (f < L.at - 10) return null;
  const ghost = EASE.out(seg(f, L.at, L.at + 20)) * (1 - seg(f, L.show[0]!, L.show[0]! + 24));
  const out = EASE.inOut(seg(f, P.at - 12, P.at + 6));
  const state = (k: number) => (k === 0 ? seg(f, L.soldOut, L.soldOut + 10) : k === 1 ? seg(f, L.closed, L.closed + 10) : 0);
  const next = EASE.out(seg(f, L.next, L.next + 12));
  const seat = EASE.out(seg(f, L.oneSeat, L.oneSeat + 14));
  const pair = EASE.out(seg(f, P.at, P.at + 16));
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {/* The aircraft we were looking at, as an outline, before it splits into layers. */}
        <rect x={X0 - 40} y={480} width={W + 80} height={120} rx={60} fill={THEME.ink} fillOpacity={0.05} stroke={THEME.ink} strokeWidth={2} opacity={ghost} />
        <g opacity={1 - out}>
          {S07.fares.map((fare, k) => {
            const t = EASE.out(seg(f, L.show[k]! - 6, L.show[k]! + 12));
            if (t <= 0) return null;
            const y = ROW(k) - H / 2 - (1 - t) * 40, closed = state(k), open = k === 2 ? next : 0;
            const strike = EASE.inOut(seg(f, (k === 0 ? L.soldOut : L.closed) + 2, (k === 0 ? L.soldOut : L.closed) + 14));
            return (
              <g key={k} opacity={t * (1 - 0.65 * closed)}>
                <rect x={X0} y={y} width={W} height={H} rx={H / 2} fill={THEME.ink} fillOpacity={0.04 + 0.03 * k} stroke={open > 0 ? THEME.accent : THEME.line} strokeWidth={1.6 + 1.4 * open} />
                {Array.from({ length: 16 }, (_, j) => <rect key={j} x={X0 + 300 + j * 30} y={y + H / 2 - 9} width={18} height={18} rx={4} fill="none" stroke={THEME.ink} strokeOpacity={0.35} strokeWidth={1.2} />)}
                <text x={X0 + W + 40} y={y + H / 2 + 15} fontFamily={THEME.sans} fontWeight={300} fontSize={44} fill={open > 0 ? THEME.accent : THEME.ink} style={{ fontVariantNumeric: 'tabular-nums' }}>{fare.price} €</text>
                <text x={X0 + 44} y={y + H / 2 + 7} fontFamily={THEME.sans} fontSize={22} letterSpacing="0.18em" fill={THEME.ink} opacity={seg(f, L.avail + k * 4, L.avail + k * 4 + 10)}>{fare.seats} PLACES</text>
                <text x={X0 + W + 190} y={y + H / 2 + 7} fontFamily={THEME.sans} fontSize={22} letterSpacing="0.1em" fill={THEME.ink} opacity={seg(f, L.rules + k * 5, L.rules + k * 5 + 10) * (1 - closed)}>{L.conditions[k]!.toUpperCase()}</text>
                {k < 2 && strike > 0 && <line x1={X0 - 10} y1={y + H / 2} x2={X0 - 10 + (W + 20) * strike} y2={y + H / 2} stroke={THEME.accent} strokeWidth={2.4} />}
              </g>
            );
          })}
          {/* The labels of what happened to each layer, at full strength over the dimmed layers. */}
          {[['Épuisé', 0, L.soldOut], ['Fermé', 1, L.closed], ['Ouvert', 2, L.next]].map(([label, k, at]) => (
            <text key={label as string} x={X0 + W + 190} y={ROW(k as number) + 7} fontFamily={THEME.sans} fontSize={20} fontWeight={500} letterSpacing="0.24em" fill={THEME.accent} opacity={seg(f, at as number, (at as number) + 10)}>{(label as string).toUpperCase()}</text>
          ))}
          {/* One seat, linked to every layer: the five prices are not five different seats. */}
          <g opacity={seat}>
            <rect x={150} y={505} width={90} height={90} rx={18} fill="none" stroke={THEME.ink} strokeWidth={2.4} />
            <rect x={162} y={487} width={66} height={12} rx={5} fill={THEME.ink} />
            {S07.fares.map((_, k) => {
              const d = EASE.inOut(seg(f, L.links + k * 2, L.links + k * 2 + 14));
              return <line key={k} x1={240} y1={550} x2={lerp(240, X0, d)} y2={lerp(550, ROW(k), d)} stroke={THEME.accent} strokeWidth={1.4} opacity={0.8} />;
            })}
            <text x={195} y={650} textAnchor="middle" fontFamily={THEME.sans} fontSize={18} letterSpacing="0.24em" fill={THEME.ink} opacity={seg(f, L.links + 10, L.links + 20)}>1 SIÈGE</text>
          </g>
        </g>

        {/* Two neighbours, same trip, very different prices. */}
        {pair > 0 && (
          <g>
            <BigSeat u={PAIR[0]!} o={pair} />
            <BigSeat u={PAIR[1]!} o={pair} hot={f >= P.paid[1]!} />
          </g>
        )}
      </svg>
      {pair > 0 && P.prices.map((v, k) => {
        const t = EASE.out(seg(f, P.paid[k]!, P.paid[k]! + 12));
        return <div key={k} style={{ position: 'absolute', left: PAIR[k]!.x + PAIR[k]!.w / 2 - 200, width: 400, top: 590, textAlign: 'center', opacity: t, transform: `translateY(${(1 - t) * 16}px)`, fontFamily: THEME.sans, fontWeight: 300, fontSize: 88, color: k ? THEME.accent : THEME.ink, fontVariantNumeric: 'tabular-nums' }}>{v} €</div>;
      })}
      {pair > 0 && <div style={{ position: 'absolute', left: 0, width: 1920, top: 250, textAlign: 'center', opacity: seg(f, P.trip, P.trip + 12) }}><Caps size={24} color={THEME.ink}>{P.text.trip}</Caps></div>}
      <Statement family="TITLE_MASK" text={S07.text.message} at={L.soldOut} out={P.at - 12} top={960} size={50} fade={12} />
      <Statement family="TITLE_IMPACT" text={P.text.same} at={P.same} top={860} size={64} fade={10} />
    </>
  );
};

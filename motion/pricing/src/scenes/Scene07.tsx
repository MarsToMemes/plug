import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PriceCounter, type PriceStep } from '../components/price';
import { Caps, Statement } from '../components/ui';
import { flight } from '../data/entities';
import { S07 } from '../data/scene07';
import { EASE, THEME, clamp01, lerp, rng, seg } from '../theme';
import { aircraftLayout, place } from './layout02';

const B = S07.beats;
const AC = aircraftLayout(S07.seats, flight.layout, 760, 420);
const SEATS = AC.units.map((u) => place(u, 1.18, 0, 0, 760, 420));
const CAB = place(AC.body, 1.18, 0, 0, 760, 420);

/** Which fare class each seat belongs to, and when it is sold (deterministic). */
const PLAN = (() => {
  const r = rng(707);
  const order = SEATS.map((_, i) => i).sort(() => r() - 0.5);
  const cls = new Array<number>(SEATS.length), soldAt = new Array<number | undefined>(SEATS.length);
  let p = 0;
  S07.fares.forEach((fare, k) => {
    const mine = order.slice(p, p + fare.seats);
    p += fare.seats;
    mine.forEach((s) => (cls[s] = k));
    if (fare.sell) {
      const n = fare.sold ?? fare.seats;
      mine.slice(0, n).forEach((s, j) => (soldAt[s] = Math.round(fare.sell![0] + (j / Math.max(1, n - 1)) * (fare.sell![1] - fare.sell![0]))));
    }
  });
  return { cls, soldAt };
})();
const closesAt = S07.fares.map((fare) => (fare.sell && (fare.sold ?? fare.seats) === fare.seats ? fare.sell[1] + 8 : Infinity));
const steps: PriceStep[] = S07.fares.filter((_, k) => k === 0 || closesAt[k - 1]! < Infinity).map((fare, k) => ({ at: k === 0 ? 0 : closesAt[k - 1]! + 6, value: fare.price }));

// The capacity column: one level per fare class, height ∝ seats still on sale in it.
const COL = { x: 1500, bottom: 900, w: 120, perSeat: 3.4 };

export const Scene07: React.FC = () => {
  const f = useCurrentFrame();
  const soldIn = (k: number) => PLAN.cls.filter((c, s) => c === k && PLAN.soldAt[s] !== undefined && PLAN.soldAt[s]! <= f).length;
  const open = closesAt.findIndex((t) => f < t); // the cheapest class not yet sold out
  const appear = EASE.out(seg(f, B.fares, B.fares + 30));

  // Levels from the bottom (cheapest) up; a sold-out level closes smoothly to zero height.
  let y = COL.bottom;
  const levels = S07.fares.map((fare, k) => {
    const left = fare.seats - soldIn(k);
    const closing = EASE.inOut(seg(f, closesAt[k]!, closesAt[k]! + S07.close));
    const h = left * COL.perSeat * (1 - closing) + (left === 0 ? 0 : 0);
    const shell = fare.seats * COL.perSeat * (1 - closing); // the level's frame closes too
    const top = y - shell;
    const lv = { k, fare, left, h, shell, top, closing, y0: y };
    y = top;
    return lv;
  });

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {/* The cabin: a quiet tube, seats coloured by their fare class. */}
        <rect x={CAB.x} y={CAB.y} width={CAB.w} height={CAB.h} rx={CAB.h / 2} fill="none" stroke={THEME.line} strokeWidth={2} opacity={EASE.out(seg(f, 0, 24))} />
        {SEATS.map((u, i) => {
          const k = PLAN.cls[i]!, sold = PLAN.soldAt[i] !== undefined && f >= PLAN.soldAt[i]!;
          const o = clamp01((f - (i / SEATS.length) * 30) / 8);
          const isOpen = k === open;
          const tone = 0.25 + 0.15 * k; // dearer classes read a little brighter
          const pop = sold ? clamp01(1 - (f - PLAN.soldAt[i]!) / 12) : 0;
          return (
            <g key={i} opacity={o}>
              <rect x={u.x} y={u.y} width={u.w} height={u.h} rx={5} fill={THEME.ink} fillOpacity={sold ? 0.85 : 0} stroke={isOpen && !sold ? THEME.accent : THEME.ink} strokeOpacity={sold ? 0.85 : isOpen ? 1 : tone * appear + (1 - appear) * 0.5} strokeWidth={isOpen && !sold ? 2 : 1.4} />
              {pop > 0 && <rect x={u.x - 5 * pop} y={u.y - 5 * pop} width={u.w + 10 * pop} height={u.h + 10 * pop} rx={7} fill="none" stroke={THEME.accent} opacity={pop} />}
            </g>
          );
        })}

        {/* The capacity column. */}
        <g opacity={appear}>
          {levels.map((lv) => {
            if (lv.shell < 0.5) return null;
            const isOpen = lv.k === open && lv.closing === 0;
            return (
              <g key={lv.k}>
                <rect x={COL.x} y={lv.top} width={COL.w} height={lv.shell} fill="none" stroke={THEME.line} strokeWidth={1.4} />
                <rect x={COL.x} y={lv.y0 - Math.min(lv.h, lv.shell)} width={COL.w} height={Math.min(lv.h, lv.shell)} fill={isOpen ? THEME.accent : THEME.ink} fillOpacity={isOpen ? 0.8 : 0.16 + 0.1 * lv.k} />
                <g opacity={1 - lv.closing}>
                  <text x={COL.x + COL.w + 26} y={lv.top + lv.shell / 2 + 10} fontFamily={THEME.sans} fontSize={30} fontWeight={isOpen ? 500 : 300} fill={isOpen ? THEME.accent : THEME.ink} style={{ fontVariantNumeric: 'tabular-nums' }}>{lv.fare.price} €</text>
                  <text x={COL.x - 22} y={lv.top + lv.shell / 2 + 7} textAnchor="end" fontFamily={THEME.sans} fontSize={16} fill={THEME.muted} letterSpacing="0.12em">{lv.left}</text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      <div style={{ position: 'absolute', left: 240, top: 690, opacity: appear }}>
        <Caps>{S07.text.open}</Caps>
        <PriceCounter steps={steps} size={120} color={THEME.ink} style={{ marginTop: 10 }} />
      </div>
      <Statement text={S07.text.message} at={B.message} top={960} size={50} />
    </AbsoluteFill>
  );
};

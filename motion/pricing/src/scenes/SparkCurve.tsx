import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, clamp } from '../motion/time';
import { at, pathOf, smooth, type Curve, type P } from '../synced/curve';
import { KaraokeLine } from '../synced/Karaoke';
import { PathText, Spark } from '../synced/Spark';
import { THEME, clamp01, lerp } from '../theme';

/**
 * Trial (skill word-synced-motion, W1-W3): the "j'attends" passage (voice 464.4-489.8 s) told by
 * a spark that writes the price curve and the words on it, at the moment they are said.
 *
 * "Vous pouvez réserver un billet à 129 €" the spark lands on 129 · "attendre, et le voir passer
 * à 214 €" it draws the rising curve, "attendre" written on it · "mais… attendre et voir le prix
 * baisser" it rewinds and draws the falling one · "Pourquoi ? … la demande qu'il anticipait" the
 * line lights word by word · "réévaluer la situation… une prévision qui évolue" forecasts fan out
 * from today and are redrawn, the last one carries the words.
 */
export const SPARK_FROM = 464.4, SPARK_TO = 489.8;
const V = (f: number) => SPARK_FROM + f / 30;

// Chart frame (inside the safe area) and price scale.
const X0 = 300, X1 = 1620;
const Y = (v: number) => 880 - ((v - 100) / 130) * 500;
const X = (u: number) => lerp(X0, X1, u);
const pts = (list: Array<[number, number]>): P[] => list.map(([u, v]) => ({ x: X(u), y: Y(v) }));

// The two futures of the same 129 € ticket, and the forecasts redrawn from "today".
const A = smooth(pts([[0, 129], [0.15, 131], [0.3, 139], [0.45, 147], [0.62, 169], [0.8, 190], [0.95, 214]]));
const B = smooth(pts([[0, 129], [0.2, 128], [0.38, 125], [0.52, 121], [0.62, 119]]));
const NOW = { u: 0.62, v: 119 };
const FORECASTS = [180, 140, 108, 128].map((v, k) => smooth(pts([[NOW.u, NOW.v], [NOW.u + 0.12, NOW.v + (v - NOW.v) * 0.35 + (k % 2 ? 4 : -4)], [0.84, NOW.v + (v - NOW.v) * 0.75], [1, v]])));

// Timeline (voice seconds, from voice/transcript.json).
const T = {
  axes: 464.5, land: 465.2, p129: 466.48,
  wait: 468.0, p214: 470.08, rewind: 471.1, rewindEnd: 471.9,
  waitB: 473.92, down: 475.8, why: 476.7, because: 477.56, becauseEnd: 481.4,
  reval: 482.02, forecast: [482.25, 483.0, 483.8], last: 487.4, lastEnd: 489.0,
};

/** Distance of the spark along a curve: from 0 at `a` to the end at `b`, eased. */
const run = (c: Curve, v: number, a: number, b: number, ease = C.inOut) => c.total * ease(clamp((v - a) / (b - a)));

const label: React.CSSProperties = { fontFamily: THEME.mono, letterSpacing: '0.16em', textTransform: 'uppercase' };

export const SparkCurve: React.FC = () => {
  const f = useCurrentFrame();
  const v = V(f);
  const axes = C.settle(clamp((v - T.axes) / 0.8));

  // Where the spark is at voice time vt (null = not on screen).
  const spark = (vt: number): P | null => {
    if (vt < T.land) return null;
    if (vt < T.wait) { const p = at(A, 0); const drop = C.expoOut(clamp((vt - T.land) / 0.5)); return { x: p.x, y: lerp(p.y - 260, p.y, drop) }; }
    if (vt < T.rewind) return at(A, run(A, vt, T.wait, T.p214));
    if (vt < T.waitB) return at(A, A.total * (1 - C.inOut(clamp((vt - T.rewind) / (T.rewindEnd - T.rewind)))));
    if (vt < T.why) return at(B, run(B, vt, T.waitB, T.down));
    if (vt < T.reval) return at(B, B.total);
    // Forecasts: a quick run on each, then the last one carries the words.
    for (let k = 0; k < 3; k++) if (vt < (T.forecast[k + 1] ?? T.last)) return at(FORECASTS[k]!, run(FORECASTS[k]!, vt, T.forecast[k]!, T.forecast[k]! + 0.55));
    return at(FORECASTS[3]!, run(FORECASTS[3]!, vt, T.last, T.lastEnd));
  };

  const headA = v < T.wait ? 0 : v < T.rewind ? run(A, v, T.wait, T.p214) : A.total;
  const headB = v < T.waitB ? 0 : run(B, v, T.waitB, T.down);
  const aDim = 1 - 0.7 * clamp01((v - T.rewind) / 0.4);
  const fHead = (k: number) => (k < 3 ? run(FORECASTS[k]!, v, T.forecast[k]!, T.forecast[k]! + 0.55) : run(FORECASTS[3]!, v, T.last, T.lastEnd));
  const fAlpha = (k: number) => (k < 3 ? (v < T.forecast[k]! ? 0 : 1 - 0.75 * clamp01((v - (T.forecast[k + 1] ?? T.last)) / 0.4)) : v < T.last ? 0 : 1);
  const today = C.settle(clamp((v - T.reval) / 0.5));
  const sp = spark(v);
  // Camera: a slow push that leans towards the spark.
  const zoom = 1 + 0.05 * clamp01((v - SPARK_FROM) / (SPARK_TO - SPARK_FROM));
  const pan = sp ? (sp.x - 960) * 0.04 : 0;

  const priceTag = (p: P, text: string, color: string, appear: number, sub?: string, below = false, anchor: 'start' | 'middle' | 'end' = 'middle', dx = 0) => {
    const k = C.settle(clamp((v - appear) / 0.35));
    if (k <= 0) return null;
    const n = Math.ceil([...text].length * clamp01((v - appear) / 0.25));
    return (
      <g opacity={k}>
        <text x={p.x + dx} y={p.y + (below ? 74 : -34)} textAnchor={anchor} fontFamily={THEME.sans} fontWeight={300} fontSize={64} fill={color}>{[...text].slice(0, n).join('')}</text>
        {sub && <text x={p.x + dx} y={p.y + (below ? 108 : -110)} textAnchor={anchor} style={label} fontSize={18} fill={color} opacity={0.8}>{sub}</text>}
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(960,540) scale(${zoom}) translate(${-960 - pan},-540)`}>
          {/* Axes: the wait (J-30 → departure) and the price. */}
          <g opacity={axes}>
            {[0, 0.25, 0.5, 0.75, 1].map((u, i) => (
              <g key={u}>
                <line x1={X(u)} y1={Y(100)} x2={X(u)} y2={Y(230)} stroke={THEME.faint} strokeWidth={1} opacity={0.5} />
                <text x={X(u)} y={Y(100) + 40} textAnchor="middle" style={label} fontSize={16} fill={THEME.muted}>{['J-30', 'J-21', 'J-14', 'J-7', 'Départ'][i]}</text>
              </g>
            ))}
            <line x1={X0} y1={Y(100)} x2={X1} y2={Y(100)} stroke={THEME.line} strokeWidth={1.4} />
            <line x1={X0 - 30} y1={Y(129)} x2={X1} y2={Y(129)} stroke={THEME.faint} strokeDasharray="4 8" />
                        <text x={X0 - 40} y={Y(230) + 6} textAnchor="end" style={label} fontSize={16} fill={THEME.muted}>Prix</text>
          </g>

          {/* Future A: the price rises while you wait. */}
          <g opacity={aDim}>
            <path d={pathOf(A, 0, headA)} fill="none" stroke={THEME.accent} strokeWidth={3} style={{ filter: `drop-shadow(0 0 6px ${THEME.accent})` }} />
            <PathText curve={A} text="attendre," s0={150} head={headA} style={{ size: 40, font: 'sans', weight: 600, upper: false }} color={THEME.ink} />
            {priceTag(at(A, A.total), '214 €', THEME.accent, T.p214, '+85 €')}
          </g>
          {priceTag(at(A, 0), '129 €', THEME.ink, T.p129, undefined, false, 'end', -10)}

          {/* Future B: you wait, and the price drops. */}
          <path d={pathOf(B, 0, headB)} fill="none" stroke={THEME.cool} strokeWidth={3} style={{ filter: `drop-shadow(0 0 6px ${THEME.cool})` }} />
          <PathText curve={B} text="attendre…" s0={70} head={headB} style={{ size: 40, font: 'sans', weight: 600, upper: false }} color={THEME.ink} offset={-50} />
          <PathText curve={B} text="baisser" s0={B.total - 200} head={headB} style={{ size: 40, font: 'sans', weight: 600, upper: false }} color={THEME.cool} offset={26} />
          {priceTag(at(B, B.total), '119 €', THEME.cool, T.down + 0.05, '−10 €', true)}

          {/* Today, and the forecasts redrawn from it. */}
          {today > 0 && (
            <g opacity={today}>
              <line x1={X(NOW.u)} y1={Y(100)} x2={X(NOW.u)} y2={Y(230)} stroke={THEME.ink} strokeOpacity={0.5} strokeDasharray="3 6" />
              <text x={X(NOW.u)} y={Y(230) - 14} textAnchor="middle" style={label} fontSize={16} fill={THEME.ink}>Aujourd’hui</text>
            </g>
          )}
          {FORECASTS.map((c, k) => fAlpha(k) > 0 && (
            <g key={k} opacity={fAlpha(k)}>
              <path d={pathOf(c, 0, fHead(k))} fill="none" stroke={THEME.ink} strokeWidth={2} strokeDasharray="8 8" />
              {k === 3 && <PathText curve={c} text="une prévision qui évolue" s0={30} head={fHead(3)} style={{ size: 42, font: 'serif', italic: true, weight: 400, upper: false }} color={THEME.ink} offset={30} />}
            </g>
          ))}

          <Spark t={v} pos={spark} />
        </g>

        {/* "Pourquoi ? Parce que… la demande qu'il anticipait": the line lights word by word. */}
        <KaraokeLine t={v} from={T.why - 0.05} to={T.why + 0.6} cx={960} baseline={170} style={{ size: 64, font: 'serif', italic: true }} fade={[T.why - 0.1, T.reval - 0.2]} />
        <KaraokeLine t={v} from={T.because - 0.05} to={T.becauseEnd} cx={960} baseline={236} style={{ size: 34, font: 'sans', weight: 400 }} accent={['demande', 'anticipait']} fade={[T.why, T.reval - 0.2]} />
        <KaraokeLine t={v} from={T.reval - 0.05} to={484.9} cx={960} baseline={170} style={{ size: 34, font: 'sans', weight: 400 }} accent={['réévaluer']} fade={[T.reval - 0.1, 486.6]} />
      </svg>
    </AbsoluteFill>
  );
};

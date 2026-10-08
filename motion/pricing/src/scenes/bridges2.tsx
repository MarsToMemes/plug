import React from 'react';
import { ShapeEl, UnitsMorph, capsule, ellipse, mixShape, pointsOnEllipse, pointsOnLine, type U } from '../components/morph';
import { flight, hotel } from '../data/entities';
import { EASE, THEME, clamp01, lerp, seg } from '../theme';
import { aircraftLayout, gridLayout } from './layout02';
import { BRIDGES } from './bridges';
import { CITY } from './Scene13';
import { CAB19, Y19 } from './Scene19';
import { PAIR } from './Scene07Layers';
import { X0 as SX0, X1 as SX1, Y as SY } from './SparkCurve';
import { CLOCK } from './Scene15';

/** Bridges for the narration order (the pairs of neighbours that the voice-over creates). */
type Bridge = React.FC<{ t: number; u?: number }>;
const svg = (c: React.ReactNode) => <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>{c}</svg>;
const scr = (u: U, s: number, cx: number, cy: number): U => ({ x: 960 + (u.x - cx) * s, y: 540 + (u.y - cy) * s, w: u.w * s, h: u.h * s });
const fade = (v: string, x: number, y: number, size: number, o: number) => <div style={{ position: 'absolute', left: x - 600, width: 1200, top: y - size * 0.62, textAlign: 'center', fontFamily: THEME.sans, fontWeight: 300, fontSize: size, color: THEME.ink, opacity: o }}>{v}</div>;

const AC = aircraftLayout(flight.seats, flight.layout);
const G2A = gridLayout(flight.seats, 18, 520, 500).map((u) => ({ ...u, y: u.y + 10 })), G2H = gridLayout(hotel.rooms, 20, 1400, 500).map((u) => ({ ...u, y: u.y + 10 }));
const lane = (n: number, y: number) => { const cols = Math.ceil(n / 10), gy = y - 34 - 150; return Array.from({ length: n }, (_, i) => ({ x: 430 + (i % cols) * 15, y: gy + (9 - Math.floor(i / cols)) * 15, w: 11, h: 11 })); };
const S09GRID = Array.from({ length: 120 }, (_, i) => ({ x: 760 + (i % 12) * 34, y: 264 + Math.floor(i / 12) * 34, w: 26, h: 26 }));
const MATRIX = Array.from({ length: 26 * 14 }, (_, k) => ({ x: 700 + (k % 26) * 20, y: 400 + Math.floor(k / 26) * 20, w: 14, h: 14 }));
const BLOCKS = CITY.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h }));
const DAYS = Array.from({ length: 7 }, (_, i) => ({ x: 300 + i * 220 - 2, y: 790, w: 4, h: 20 }));
const A19 = CAB19(Y19.a), B19 = CAB19(Y19.b);
const SYS = Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + (i / 6) * Math.PI * 2; return { x: 960 + Math.cos(a) * 544 - 4, y: 540 + Math.sin(a) * 357 - 4, w: 8, h: 8 }; });

// 02 → 04 : the seat grid goes back into the cabin; the room grid leaves.
const N0204: Bridge = ({ t }) => svg(<><g opacity={EASE.inOut(seg(t, 0.4, 1))}><rect {...scr(AC.body, 0.84, 960, 540)} width={AC.body.w * 0.84} height={AC.body.h * 0.84} fill="none" stroke={THEME.ink} strokeWidth={2} /></g><UnitsMorph a={G2A} b={AC.units.map((u) => scr(u, 0.84, 960, 540))} t={t} fillA={0.9} /><g opacity={1 - EASE.inOut(seg(t, 0, 0.5))}>{G2H.map((u, i) => <rect key={i} x={u.x} y={u.y} width={u.w} height={u.h} fill={THEME.ink} fillOpacity={0.9} />)}</g></>);
// 07 → 08 : the two neighbours' seats join into the bed of the hotel room.
const N0708: Bridge = ({ t }) => {
  const e = EASE.inOut(t), bed = { x: 656, y: 430, w: 400, h: 80, rx: 10, ry: 10, color: THEME.ink };
  return svg(<>{PAIR.map((u, k) => <ShapeEl key={k} s={mixShape({ ...u, rx: 30, ry: 30, color: k ? THEME.accent : THEME.ink, stroke: 2.4 }, bed, e)} />)}</>);
};
// 08 → 10 : the room's window becomes the engine's core.
const N0810: Bridge = ({ t }) => {
  // The window of scene 08 becomes the core of scene 10, landing exactly on it: scene 10 opens
  // with the machine stepped back for its question (scale 0.87 around 960,660), so the core is
  // there, not at its nominal place. A superellipse morph (square -> circle) instead of a
  // rectangle whose corners round off: the sides bulge evenly, the outline stays one smooth line.
  const k = 0.87, core = { cx: 960, cy: 660 + (540 - 660) * k, r: 170 * k };
  const win = { cx: 960 + (1056 - 960) * 1.1 + 104 * 1.1, cy: 540 + (210 - 470) * 1.1 + 90 * 1.1, rx: 104 * 1.1, ry: 90 * 1.1 };
  const e = EASE.inOut(t), shape = EASE.inOut(seg(t, 0.1, 0.9));
  const cx = lerp(win.cx, core.cx, e), cy = lerp(win.cy, core.cy, e), rx = lerp(win.rx, core.r, e), ry = lerp(win.ry, core.r, e);
  const n = Math.exp(lerp(Math.log(14), Math.log(2), shape)); // superellipse exponent: ~square -> circle
  const pts = Array.from({ length: 160 }, (_, i) => {
    const a = (i / 160) * Math.PI * 2, c = Math.cos(a), s2 = Math.sin(a);
    return `${(cx + rx * Math.sign(c) * Math.abs(c) ** (2 / n)).toFixed(1)},${(cy + ry * Math.sign(s2) * Math.abs(s2) ** (2 / n)).toFixed(1)}`;
  });
  return svg(<polygon points={pts.join(' ')} fill="none" stroke={THEME.ink} strokeWidth={2} strokeLinejoin="round" />);
};
// 10 → 19 : the engine's core opens into two identical aircraft.
const N1019: Bridge = ({ t }) => {
  const e = EASE.inOut(t), r = ellipse(960, 540, 170, 170, { color: THEME.ink, stroke: 2 });
  return svg(<><ShapeEl s={mixShape(r, capsule(A19.body.x, A19.body.y, A19.body.w, A19.body.h, { color: THEME.line }), e)} /><ShapeEl s={mixShape(r, capsule(B19.body.x, B19.body.y, B19.body.w, B19.body.h, { color: THEME.line }), e)} /></>);
};
// 19 → 09 : the seats of both aircraft gather into the grid of available rooms.
const N1909: Bridge = ({ t }) => svg(<UnitsMorph a={[...A19.units, ...B19.units]} b={S09GRID} t={t} fillA={0.6} fillB={0.88} />);
// 09 → 03 : the rooms split into the two lanes of the timeline.
const N0903: Bridge = ({ t }) => svg(<><UnitsMorph a={S09GRID.slice(0, 60)} b={lane(flight.seats, 430)} t={t} fillA={0.88} fillB={0.92} /><UnitsMorph a={S09GRID.slice(60)} b={lane(hotel.rooms, 850)} t={t} fillA={0.88} fillB={0.92} /></>);
// 03 → 11 : the last units at the deadline become the cells of the analytical engine.
const S03END = [...Array.from({ length: 180 }, (_, i) => ({ x: 3470 + (i % 18) * 15, y: 246 + (9 - Math.floor(i / 18)) * 15, w: 11, h: 11 })), ...Array.from({ length: 200 }, (_, i) => ({ x: 3470 + (i % 20) * 15, y: 666 + (9 - Math.floor(i / 20)) * 15, w: 11, h: 11 }))].map((u) => scr(u, 0.78, 2980, 640));
const N0311: Bridge = ({ t }) => svg(<UnitsMorph a={S03END} b={MATRIX} t={t} colorA={THEME.line} fillB={0.35} />);
// 11 → 13 : the engine's cells spread into a city.
const N1113: Bridge = ({ t }) => svg(<UnitsMorph a={MATRIX} b={BLOCKS} t={t} fillA={0.35} colorB={THEME.line} fillB={0.07} />);
// 13 → 12 : the city flattens onto the days of the week.
const N1312: Bridge = ({ t }) => { const e = EASE.inOut(t); return svg(<><UnitsMorph a={BLOCKS.map((b) => scr(b, 1.12, 960, 560))} b={DAYS} t={t} colorA={THEME.line} fillA={0.07} fillB={1} /><line x1={lerp(960, 260, e)} y1={800} x2={lerp(960, 1660, e)} y2={800} stroke={THEME.line} strokeWidth={1.6} opacity={e} /></>); };
// 12 → 14 : the room becomes the booking card.
const N1214: Bridge = ({ t }) => svg(<ShapeEl s={mixShape({ x: 748.8, y: 216.8, w: 422.4, h: 264, color: THEME.ink }, { x: 660, y: 70, w: 600, h: 330, rx: 18, ry: 18, color: THEME.line, stroke: 1.5 }, EASE.inOut(t))} />);
// 14 → 20 : the two possible futures fold into the ticket.
const N1420: Bridge = ({ t }) => {
  const e = EASE.inOut(t), card = { x: 610, y: 300, w: 700, h: 400, rx: 24, ry: 24, color: THEME.line, stroke: 1.6 };
  return svg(<><ShapeEl s={mixShape({ x: 520, y: 700, w: 880, h: 3, color: THEME.accent, fill: 1 }, card, e)} /><UnitsMorph a={[...pointsOnLine(520, 815, 1400, 567, 24, 5), ...pointsOnLine(520, 815, 1400, 844, 24, 5)]} b={pointsOnLine(640, 500, 1280, 500, 48, 2)} t={t} colorA={THEME.accent} fillA={1} fillB={0} /></>);
};
// 14 → spark curve : the booking card folds into the 129 € line, where the spark will land.
const N14SC: Bridge = ({ t }) => {
  const e = EASE.inOut(t);
  return svg(<><ShapeEl s={mixShape({ x: 660, y: 70, w: 600, h: 330, rx: 18, ry: 18, color: THEME.line, stroke: 1.5 }, { x: SX0, y: SY(129), w: SX1 - SX0, h: 1, color: THEME.faint, stroke: 1.2 }, e)} /><circle cx={SX0} cy={SY(129)} r={6 * seg(t, 0.75, 1)} fill={THEME.accent} /></>);
};
// 14 → 17 : both possible futures fold back into one point: the price at the centre of the machine.
const N1417: Bridge = ({ t }) => svg(<><UnitsMorph a={[...pointsOnLine(520, 815, 1400, 567, 24, 5), ...pointsOnLine(520, 815, 1400, 844, 24, 5)]} b={pointsOnEllipse(960, 450, 63, 63, 48, 3)} t={t} colorA={THEME.accent} fillA={1} fillB={1} /><circle cx={960} cy={450} r={63} fill="none" stroke={THEME.ink} strokeWidth={2} opacity={seg(t, 0.8, 1)} /></>);
// 17 → 15 : the loop's two legs straighten into the two columns (aircraft | hotel).
const N1715: Bridge = ({ t }) => {
  // The loop's two legs fold into two points: where the aircraft and the hotel of scene 15 appear.
  const e = EASE.inOut(t);
  const L = (a: number[], b: number[]) => <line x1={lerp(a[0]!, b[0]!, e)} y1={lerp(a[1]!, b[1]!, e)} x2={lerp(a[2]!, b[2]!, e)} y2={lerp(a[3]!, b[3]!, e)} stroke={THEME.accent} strokeWidth={2.2} opacity={1 - seg(t, 0.7, 1)} />;
  return svg(<>{L([960, 450, 690, 720], [440, 400, 440, 400])}{L([960, 450, 1230, 720], [1480, 400, 1480, 400])}</>);
};
// 15 → 18 : the clock opens and lets go of the price, which comes closer and closer.
const N1518: Bridge = ({ t }) => {
  const e = EASE.in(t);
  return svg(<>
    <circle cx={CLOCK.cx} cy={CLOCK.cy} r={lerp(CLOCK.rTight, 1400, EASE.in(seg(t, 0, 0.6)))} fill="none" stroke={THEME.accent} strokeWidth={3.5} opacity={1 - seg(t, 0.2, 0.6)} />
    <text x={960} y={lerp(CLOCK.cy + CLOCK.priceSize * 0.35, 738, e)} textAnchor="middle" fontFamily={THEME.sans} fontWeight={300} fontSize={lerp(CLOCK.priceSize, 576, e)} fill={THEME.accent} fillOpacity={(1 - seg(t, 0.5, 1)) * (1 - seg(t, 0.8, 0.98))} style={{ fontVariantNumeric: 'tabular-nums' }}>219 €</text>
    <text x={960} y={lerp(CLOCK.cy + CLOCK.priceSize * 0.35, 738, e)} textAnchor="middle" fontFamily={THEME.sans} fontWeight={300} fontSize={lerp(CLOCK.priceSize, 576, e)} fill={THEME.ink} fillOpacity={seg(t, 0.5, 1) * (1 - seg(t, 0.8, 0.98))} style={{ fontVariantNumeric: 'tabular-nums' }}>219 €</text>
    <text x={960} y={144} textAnchor="middle" fontFamily={THEME.sans} fontSize={117} letterSpacing="0.3em" fill={THEME.muted} opacity={seg(t, 0.8, 1)}>PRIX</text>
  </>);
};
// 18 → 16 : the whole system folds into a single line, where the question is written.
const N1816: Bridge = ({ t }) => svg(<UnitsMorph a={SYS} b={pointsOnLine(560, 540, 1360, 540, 40, 2)} t={t} fillA={0} fillB={1} />);
// 16 → 18 : the statement opens back into the whole system.
const N1618: Bridge = ({ t }) => {
  const c = EASE.in(seg(t, 0, 0.45));
  return (<>
    <div style={{ position: 'absolute', left: 0, width: 1920, top: 470, textAlign: 'center', fontFamily: THEME.serif, fontWeight: 300, fontSize: 92 * (1 - c * 0.9), textTransform: 'uppercase', color: THEME.ink, opacity: 1 - c, filter: `blur(${c * 6}px)` }}>Capacité limitée</div>
    {svg(<><UnitsMorph a={pointsOnEllipse(960, 520, 4, 4, 6, 4)} b={SYS} t={seg(t, 0.35, 1)} fillB={0} /><ellipse cx={960} cy={540} rx={161} ry={161} fill="none" stroke={THEME.accent} strokeDasharray="6 8" opacity={seg(t, 0.6, 1)} /></>)}
  </>);
};

/** Bridge for a pair of neighbours in the narration order. */
// sc>20 is a straight cut: the last words ("une prévision qui évolue") stay readable up to the cut.
export const BRIDGE_FOR: Record<string, Bridge | null> = {
  '01>02': BRIDGES[0]!, '02>04': N0204, '04>05': BRIDGES[3]!, '05>06': BRIDGES[4]!, '06>07': BRIDGES[5]!, '07>08': N0708,
  '08>10': N0810, '10>19': N1019, '19>09': N1909, '09>03': N0903, '03>11': N0311, '11>13': N1113, '13>12': N1312, '12>14': N1214,
  '14>20': N1420, '14>sc': N14SC, 'sc>20': null, '20>17': null, '14>17': N1417, '17>15': N1715, '15>18': N1518, '18>16': N1816, '16>18': N1618,
};

import React from 'react';
import { AircraftPlan } from '../components/aircraft';
import { HotelFacade } from '../components/hotel';
import { ShapeEl, UnitsMorph, WordMorph, capsule, ellipse, mixShape, pointsInRect, pointsOnEllipse, pointsOnLine, type Shape, type U } from '../components/morph';
import { flight, hotel } from '../data/entities';
import { EASE, THEME, clamp01, lerp, seg } from '../theme';
import { aircraftLayout, gridLayout, hotelLayout, place } from './layout02';
import { CITY } from './Scene13';
import { cameraPose } from '../camera/CameraRig';
import { S02 } from '../data/scene02';
import { VOICE } from '../data/voice';

/**
 * The bridges: each one starts from the last key element of a scene (where that scene left it on
 * screen) and becomes the first key element of the next scene. t = 0..1 across the morph.
 */
type Bridge = React.FC<{ t: number; u?: number }>; // u: raw progress through the overlay (0 → 1)
const svg = (children: React.ReactNode) => <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>{children}</svg>;
const scr = (u: U, s: number, cx: number, cy: number): U => ({ x: 960 + (u.x - cx) * s, y: 540 + (u.y - cy) * s, w: u.w * s, h: u.h * s });
const priceText = (v: string, x: number, y: number, size: number, o = 1, color: string = THEME.ink) => <div style={{ position: 'absolute', left: x - 600, width: 1200, top: y - size * 0.62, textAlign: 'center', fontFamily: THEME.sans, fontWeight: 300, fontSize: size, color, opacity: o, fontVariantNumeric: 'tabular-nums' }}>{v}</div>;

const AC = aircraftLayout(flight.seats, flight.layout);
const HO = hotelLayout(hotel.rooms, hotel.perFloor);

// 01 → 02 : the question's ring closes into the fuselage, seen nose first (scene 02 starts very close).
const B01: Bridge = ({ t, u = t }) => {
  // The question's ring opens into a window through which the real aircraft of scene 02 appears
  // (same scale, same place as scene 02's first frame): one silhouette only, never two.
  const e = EASE.inOut(t);
  // After the cut, follow scene 02's own camera (same frame, same pose): the two planes coincide.
  const p02 = VOICE.passages[1]!, a02 = p02.anchors![0]!;
  const sceneFrame = Math.max(0, u * 60 - 30) * (a02[0] / ((a02[1] - p02.start) * 30));
  const cam = cameraPose(sceneFrame, S02.camera, S02.cameraStart);
  const ring = ellipse(960, 540, 215, 133);
  const win = { x: -40, y: -40, w: 2000, h: 1160, rx: 0, ry: 0 };
  const w = mixShape(ring, win, e);
  const rx = Math.min(w.w / 2, (ring.rx ?? 0) * (1 - e) + 0.001), ry = Math.min(w.h / 2, (ring.ry ?? 0) * (1 - e) + 0.001);
  return svg(<>
    <defs><clipPath id="b01win"><rect x={w.x} y={w.y} width={w.w} height={w.h} rx={Math.max(rx, w.w / 2 * (1 - e))} ry={Math.max(ry, w.h / 2 * (1 - e))} /></clipPath></defs>
    {/* The aircraft in the window follows scene 02's own camera frame by frame, so when the ground
        fades the two aircraft coincide exactly: one silhouette, never two. */}
    <g clipPath="url(#b01win)" opacity={seg(t, 0.05, 0.3)}><g transform={`translate(960,540) scale(${cam.scale}) translate(${-cam.x},${-cam.y})`}><AircraftPlan body={AC.body} fill={1} /></g></g>
    <rect x={w.x} y={w.y} width={w.w} height={w.h} rx={Math.max(rx, w.w / 2 * (1 - e))} ry={Math.max(ry, w.h / 2 * (1 - e))} fill="none" stroke={THEME.line} strokeWidth={1.6} opacity={1 - seg(t, 0.45, 0.7)} />
  </>);
};
// 02 → 03 : the two capacity grids become the two lanes' grids at the start of the timeline.
const lane = (n: number, y: number) => { const cols = Math.ceil(n / 10), gy = y - 34 - 150; return Array.from({ length: n }, (_, i) => ({ x: 430 + (i % cols) * 15, y: gy + (9 - Math.floor(i / cols)) * 15, w: 11, h: 11 })); };
const G2A = gridLayout(flight.seats, 18, 520, 500).map((u) => ({ ...u, y: u.y + 10 })), G2H = gridLayout(hotel.rooms, 20, 1400, 500).map((u) => ({ ...u, y: u.y + 10 }));
const B02: Bridge = ({ t }) => svg(<><UnitsMorph a={G2A} b={lane(flight.seats, 430)} t={t} fillA={0.9} fillB={0.92} /><UnitsMorph a={G2H} b={lane(hotel.rooms, 850)} t={t} fillA={0.9} fillB={0.92} /></>);
// 03 → 04 : the timeline becomes the cabin. The flight's time axis turns into the fuselage, its points into seats.
const S04 = (u: U) => scr(u, 0.84, 960, 540);
const B03: Bridge = ({ t }) => {
  const axis: Shape = { x: -100, y: 374, w: 1390, h: 4, rx: 2, fill: 0.6, stroke: 1, color: THEME.line };
  const body = S04(AC.body);
  const e = EASE.inOut(t);
  return svg(<><ShapeEl s={mixShape(axis, { ...body, rx: 0, fill: 0, stroke: 2, color: THEME.ink }, e)} /><line x1={-100} y1={704} x2={1290} y2={704} stroke={THEME.line} strokeWidth={2} opacity={1 - e} /><UnitsMorph a={pointsOnLine(0, 376, 1288, 376, 30, 6)} b={AC.units.map(S04)} t={t} /></>);
};
// 04 → 05 : the nine seats left on the runway rise and multiply into the hotel's rooms.
const LOST = (() => { const out: U[] = []; for (let i = 0; i < 9; i++) out.push(scr({ x: 260 + i * 44 + (i % 3) * 20, y: 470 + (i % 2) * 48, w: 22, h: 22 }, 1, 960, 540)); return out; })();
const B04: Bridge = ({ t }) => svg(<><g opacity={EASE.inOut(seg(t, 0.4, 1))}><HotelFacade body={HO.body} /></g><UnitsMorph a={LOST} b={HO.units} t={t} colorA={THEME.accent} colorB={THEME.ink} fillB={0.85} /></>);
// 05 → 06 : the one lost room splits into a hundred rooms, all at the same price.
const CELL6 = Array.from({ length: 100 }, (_, i) => ({ x: 960 - (10 * 122 - 10) / 2 + (i % 10) * 122, y: 560 - (10 * 62 - 10) / 2 + Math.floor(i / 10) * 62, w: 112, h: 52 }));
const B05: Bridge = ({ t }) => svg(<UnitsMorph a={[{ x: 538, y: 442, w: 44, h: 56 }]} b={CELL6} t={t} colorA={THEME.accent} colorB={THEME.line} />);
// 06 → 07 : the hundred rooms rearrange into the cabin's seats, the fuselage closes around them.
const S07SEATS = aircraftLayout(flight.seats, flight.layout, 760, 420).units.map((u) => place(u, 1.18, 0, 0, 760, 420));
const S07CAB = place(aircraftLayout(flight.seats, flight.layout, 760, 420).body, 1.18, 0, 0, 760, 420);
const B06: Bridge = ({ t }) => svg(<><g opacity={EASE.inOut(seg(t, 0.5, 1))}><rect x={S07CAB.x} y={S07CAB.y} width={S07CAB.w} height={S07CAB.h} rx={S07CAB.h / 2} fill="none" stroke={THEME.line} strokeWidth={2} /></g><UnitsMorph a={CELL6} b={S07SEATS} t={t} fillA={0.85} fillB={0} /></>);
// 07 → 08 : the cabin tube becomes the bed; the open fare travels to the room's price.
const B07: Bridge = ({ t }) => {
  const e = EASE.inOut(t);
  return (<>{svg(<ShapeEl s={mixShape(capsule(S07CAB.x, S07CAB.y, S07CAB.w, S07CAB.h, { color: THEME.line }), { x: 656, y: 430, w: 400, h: 80, rx: 10, color: THEME.ink }, e)} />)}{priceText('219 €', lerp(352, 935, e), lerp(788, 772, e), lerp(120, 104, e), 1 - seg(t, 0.75, 1))}</>);
};
// 08 → 09 : the room's window opens into the grid of available rooms; the price moves to its column.
const S09GRID = Array.from({ length: 120 }, (_, i) => ({ x: 760 + (i % 12) * 34, y: 264 + Math.floor(i / 12) * 34, w: 26, h: 26 }));
const B08: Bridge = ({ t }) => {
  const win = { x: 960 + (1056 - 960) * 1.1, y: 540 + (210 - 470) * 1.1, w: 208 * 1.1, h: 180 * 1.1 };
  const e = EASE.inOut(t);
  return (<>{svg(<><ShapeEl s={mixShape({ ...win, color: THEME.ink, stroke: 2 }, { x: 750, y: 254, w: 420, h: 352, color: THEME.line, stroke: 1, o: 0 }, e)} /><UnitsMorph a={pointsInRect(win.x, win.y, win.w, win.h, 120, 8)} b={S09GRID} t={t} fillB={0.88} /></>)}{priceText('249 €', lerp(935, 1620, e), lerp(772, 330, e), lerp(104, 110, e), 1 - seg(t, 0.8, 1))}</>);
};
// 09 → 10 : the rooms and the three indicators gather on a ring: the core of the engine.
const B09: Bridge = ({ t }) => svg(<><UnitsMorph a={S09GRID} b={pointsOnEllipse(960, 540, 170, 170, 120, 4)} t={t} fillA={0.88} fillB={1} /><g opacity={seg(t, 0.75, 1)}><circle cx={960} cy={540} r={170} fill="none" stroke={THEME.ink} strokeWidth={2} /></g></>);
// 10 → 11 : the price's ring (seen close) breaks into the cells of the analytical matrix.
const MATRIX = Array.from({ length: 26 * 14 }, (_, k) => ({ x: 700 + (k % 26) * 20, y: 400 + Math.floor(k / 26) * 20, w: 14, h: 14 }));
const B10: Bridge = ({ t }) => (<>{svg(<UnitsMorph a={pointsOnEllipse(960, 396, 82, 82, 120, 5)} b={MATRIX} t={t} colorA={THEME.accent} fillA={1} fillB={0.35} />)}{priceText('219 €', 960, 560, 154, 1 - seg(t, 0, 0.4))}</>);
// 11 → 12 : the price distribution settles onto the days of the week.
const DIST = Array.from({ length: 15 }, (_, i) => { const d = (149 + i * 10 - 219) / 30, h = 300 * Math.exp(-d * d * 4); return { x: 1330 + i * (460 / 15) + 3, y: 850 - h, w: 460 / 15 - 6, h: Math.max(2, h) }; });
const DAYS = Array.from({ length: 7 }, (_, i) => ({ x: 300 + i * 220 - 2, y: 790, w: 4, h: 20 }));
const B11: Bridge = ({ t }) => svg(<><UnitsMorph a={DIST} b={DAYS} t={t} fillA={0.9} fillB={1} /><line x1={lerp(1330, 260, EASE.inOut(t))} y1={lerp(850, 800, EASE.inOut(t))} x2={lerp(1790, 1660, EASE.inOut(t))} y2={lerp(850, 800, EASE.inOut(t))} stroke={THEME.line} strokeWidth={1.6} /></>);
// 12 → 13 : the room becomes one block of a city that spreads around it.
const BLOCKS = CITY.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h }));
const B12: Bridge = ({ t }) => svg(<UnitsMorph a={[{ x: 720, y: 110, w: 480, h: 300 }]} b={BLOCKS} t={t} colorA={THEME.ink} colorB={THEME.line} fillB={0.07} stagger={0.5} />);
// 13 → 14 : the venue (seen close) becomes the booking card; the city folds into it.
const B13: Bridge = ({ t }) => {
  const e = EASE.inOut(t);
  return svg(<><ShapeEl s={mixShape(ellipse(960, 540, 63, 45, { color: THEME.accent, stroke: 2.4 }), { x: 660, y: 70, w: 600, h: 330, rx: 18, ry: 18, color: THEME.line, stroke: 1.5 }, e)} /><UnitsMorph a={BLOCKS.map((b) => scr(b, 1.12, 960, 560))} b={pointsOnEllipse(960, 235, 300, 165, 60, 3)} t={t} colorB={THEME.line} stagger={0.1} /></>);
};
// 14 → 15 : the two possible futures straighten into the two columns: aircraft and hotel.
const B14: Bridge = ({ t }) => {
  const e = EASE.inOut(t);
  const L = (a: number[], b: number[], c: string) => <line x1={lerp(a[0]!, b[0]!, e)} y1={lerp(a[1]!, b[1]!, e)} x2={lerp(a[2]!, b[2]!, e)} y2={lerp(a[3]!, b[3]!, e)} stroke={c} strokeWidth={lerp(3, 1.4, e)} />;
  return svg(<>{L([520, 815, 1400, 567], [560, 470, 560, 820], e < 0.6 ? THEME.accent : THEME.faint)}{L([520, 815, 1400, 844], [1360, 470, 1360, 820], e < 0.6 ? THEME.cool : THEME.faint)}<line x1={960} y1={lerp(540, 140, e)} x2={960} y2={lerp(540, 940, e)} stroke={THEME.line} strokeWidth={1.4} opacity={e} /></>);
};
// 15 → 16 : one statement becomes the question.
const B15: Bridge = ({ t }) => <WordMorph a="Gestion des revenus" b="Que vendent-ils vraiment ?" t={EASE.inOut(t)} ax={960} ay={538} bx={960} by={540} aSize={96} bSize={73} />;
// 16 → 17 : the statement condenses into a point, which opens into the price at the centre of the machine.
const B16: Bridge = ({ t }) => {
  const c = EASE.in(seg(t, 0, 0.5)), o = EASE.out(seg(t, 0.45, 1));
  return (<>
    <div style={{ position: 'absolute', left: 0, width: 1920, top: 470, textAlign: 'center', fontFamily: THEME.serif, fontWeight: 300, fontSize: 92 * (1 - c), letterSpacing: `${0.03 - c * 0.2}em`, textTransform: 'uppercase', color: THEME.ink, opacity: 1 - c, filter: `blur(${c * 6}px)` }}>Capacité limitée</div>
    {svg(<><circle cx={960} cy={lerp(520, 450, o)} r={lerp(3, 63, o)} fill={THEME.bg} stroke={THEME.ink} strokeWidth={2} opacity={seg(t, 0.35, 0.5)} /><text x={960} y={458} textAnchor="middle" fontFamily={THEME.serif} fontSize={30} letterSpacing="0.08em" fill={THEME.ink} opacity={o}>PRIX</text></>)}
  </>);
};
// 17 → 18 : a rapid push into the price: the ring opens past the frame, the number becomes the first image.
const B17: Bridge = ({ t }) => {
  const e = EASE.in(t);
  return (<>{svg(<circle cx={960} cy={lerp(450, 540, e)} r={lerp(63, 1400, e)} fill="none" stroke={THEME.ink} strokeWidth={2} opacity={1 - seg(t, 0.7, 1)} />)}{svg(<text x={960} y={lerp(380, 738, e)} textAnchor="middle" fontFamily={THEME.sans} fontWeight={300} fontSize={lerp(41, 576, e)} fill={t < 0.5 ? THEME.accent : THEME.ink}>{t < 0.5 ? '213 €' : '219 €'}</text>)}</>);
};

export const BRIDGES: Bridge[] = [B01, B02, B03, B04, B05, B06, B07, B08, B09, B10, B11, B12, B13, B14, B15, B16, B17];

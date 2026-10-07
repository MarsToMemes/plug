import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { AircraftPlan } from '../components/aircraft';
import { HotelFacade } from '../components/hotel';
import { flight, hotel } from '../data/entities';
import { S02 } from '../data/scene02';
import { EASE, THEME, clamp01, lerp, seg } from '../theme';
import { Title } from '../type/Title';
import { aircraftLayout, gridLayout, hotelLayout, matchByShape, mixBox, place, type Unit } from './layout02';

const B = S02.beats;
const AC = aircraftLayout(flight.seats, flight.layout);
const HO = hotelLayout(hotel.rooms, hotel.perFloor);
// Symmetry: aircraft on the left, hotel on the right, at a common scale.
const PAIR = { a: { s: 0.5, dx: -470, dy: -40 }, h: { s: 0.58, dx: 470, dy: -30 } };
// Abstract grids: same rows for both, so the two capacities read as the same kind of thing.
const ROWS = 10;
const GRID_A = gridLayout(flight.seats, Math.ceil(flight.seats / ROWS), 520, 500);
const GRID_H = gridLayout(hotel.rooms, Math.ceil(hotel.rooms / ROWS), 1400, 500);
// Morph targets paired by position: seats → rooms, seats → their grid, rooms → their grid.
const SEAT_TO_ROOM = matchByShape(AC.units, HO.units);
const SEAT_TO_GRID = matchByShape(AC.units.map((u) => place(u, 0.5, -470, -40)), GRID_A);
const ROOM_TO_GRID = matchByShape(HO.units, GRID_H);

const UnitRect: React.FC<{ u: Unit; o: number; filled?: number; r?: number }> = ({ u, o, filled = 0, r = 4 }) =>
  o <= 0.01 ? null : <rect x={u.x} y={u.y} width={u.w} height={u.h} rx={Math.min(r, u.w * 0.2)} fill={THEME.ink} fillOpacity={filled * 0.9} stroke={THEME.ink} strokeOpacity={0.85} strokeWidth={1.5} opacity={o} />;

/** A count that follows what is revealed, with its unit: "180 SIÈGES". */
const Count: React.FC<{ value: number; unit: string; x: number; y: number; o: number; size?: number; kicker?: string }> = ({ value, unit, x, y, o, size = 84, kicker }) =>
  o <= 0.01 ? null : (
    <div style={{ position: 'absolute', left: x - 400, top: y, width: 800, textAlign: 'center', opacity: o, fontFamily: THEME.sans, color: THEME.ink }}>
      {kicker && <div style={{ fontSize: 18, letterSpacing: '0.34em', textTransform: 'uppercase', color: THEME.muted, marginBottom: 10 }}>{kicker}</div>}
      <span style={{ fontSize: size, fontWeight: 300, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{Math.round(value)}</span>
      <span style={{ fontSize: size * 0.3, letterSpacing: '0.34em', textTransform: 'uppercase', marginLeft: size * 0.22 }}>{unit}</span>
    </div>
  );

export const Scene02: React.FC = () => {
  const f = useCurrentFrame();

  // Aircraft: solid, then transparent; seats revealed row by row from the nose.
  const clearA = EASE.inOut(seg(f, B.clear, B.clear + 30));
  const rowAt = (r: number) => B.seats + (r / AC.rows) * (B.seatsEnd - B.seats);
  // Morph: the fuselage box becomes the facade box; seats travel to the rooms and are absorbed.
  const m = EASE.inOut(seg(f, B.morph, B.morphEnd));
  // The building only closes up (solid) in the last part of the morph, once the seats are in place.
  const fillM = EASE.inOut(seg(f, B.morph + (B.morphEnd - B.morph) * 0.55, B.morphEnd));
  const fillH = f < B.clearHotel ? fillM : 1 - EASE.inOut(seg(f, B.clearHotel, B.clearHotel + 30));
  const floorAt = (fl: number) => B.rooms + (fl / HO.floors) * (B.roomsEnd - B.rooms);
  // Symmetry, then abstraction, then the limit.
  const p = EASE.inOut(seg(f, B.pair, B.pair + 50));
  const a = EASE.inOut(seg(f, B.abstract, B.abstract + 50));
  const lim = EASE.out(seg(f, B.limit, B.limit + 36));

  const inAircraft = f < B.morph;
  const body = inAircraft ? AC.body : mixBox(AC.body, HO.body, m);

  // Units of the first act (seats that become rooms).
  const seatsShown = AC.units.filter((_, i) => f >= rowAt(Math.floor(i / AC.per))).length;
  const roomsShown = HO.units.filter((_, i) => f >= floorAt(Math.floor(i / hotel.perFloor))).length;

  // Hotel and (returning) aircraft placements during the pair/abstract phases.
  const hs = lerp(1, PAIR.h.s, p), hdx = PAIR.h.dx * p, hdy = PAIR.h.dy * p;
  const back = EASE.out(seg(f, B.pair + 36, B.pair + 70)); // the aircraft comes back on the left, once the hotel has moved

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S02.camera} start={S02.cameraStart}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* Act 1 — aircraft, then morph into the hotel. */}
          {f < B.morphEnd + 1 && (
            <>
              {inAircraft ? <AircraftPlan body={body} fill={1 - clearA} /> : <AircraftPlan body={body} fill={fillM} parts={1 - seg(f, B.morph, B.morph + 26)} />}
              {!inAircraft && <HotelFacade body={body} fill={fillM} parts={seg(f, B.morphEnd - 24, B.morphEnd)} />}
              {AC.units.map((u, i) => {
                const t = f - rowAt(Math.floor(i / AC.per));
                if (t < 0) return null;
                const o = clamp01(t / 6) * (1 - fillM);
                return <UnitRect key={i} u={inAircraft ? u : mixBox(u, HO.units[SEAT_TO_ROOM[i]!]!, m)} o={o} />;
              })}
            </>
          )}

          {/* Act 2 — the hotel: solid, then transparent; rooms revealed floor by floor. */}
          {f >= B.morphEnd + 1 && f < B.abstract + 50 && (
            <g opacity={1 - a}>
              <HotelFacade body={place(HO.body, hs, hdx, hdy)} fill={fillH} />
            </g>
          )}
          {f >= B.morphEnd + 1 && HO.units.map((u, i) => {
            const t = f - floorAt(Math.floor(i / hotel.perFloor));
            if (t < 0) return null;
            const at = place(u, hs, hdx, hdy);
            return <UnitRect key={`h${i}`} u={a > 0 ? mixBox(at, GRID_H[ROOM_TO_GRID[i]!]!, a) : at} o={clamp01(t / 6)} filled={a} r={4 * (1 - a)} />;
          })}

          {/* Act 3 — the aircraft returns on the left: same grammar, seats for rooms. */}
          {f >= B.pair + 36 && (
            <>
              <g opacity={back * (1 - a)}><AircraftPlan body={place(AC.body, PAIR.a.s, PAIR.a.dx, PAIR.a.dy)} /></g>
              {AC.units.map((u, i) => {
                const at = place(u, PAIR.a.s, PAIR.a.dx, PAIR.a.dy);
                const o = clamp01((f - B.pair - 44 - (Math.floor(i / AC.per) / AC.rows) * 26) / 6);
                return <UnitRect key={`a${i}`} u={a > 0 ? mixBox(at, GRID_A[SEAT_TO_GRID[i]!]!, a) : at} o={o} filled={a} r={3 * (1 - a)} />;
              })}
            </>
          )}

          {/* The limit: each grid is closed by a frame. */}
          {lim > 0 && [GRID_A, GRID_H].map((g, k) => {
            const x0 = Math.min(...g.map((u) => u.x)) - 16, x1 = Math.max(...g.map((u) => u.x + u.w)) + 16;
            const y0 = Math.min(...g.map((u) => u.y)) - 16, y1 = Math.max(...g.map((u) => u.y + u.h)) + 16;
            return <rect key={k} x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke={THEME.accent} strokeWidth={2.4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lim} />;
          })}
        </svg>

        {/* Counts and labels (they live in the filmed world, so the camera carries them). */}
        <Count value={seatsShown} unit={S02.text.seats} x={960} y={860} o={seg(f, B.seatsLabel, B.seatsLabel + 16) * (1 - seg(f, B.morph, B.morph + 16))} />
        <Count value={roomsShown} unit={S02.text.rooms} x={960} y={880} o={seg(f, B.roomsLabel, B.roomsLabel + 16) * (1 - seg(f, B.pair, B.pair + 16))} />
        <Count value={flight.seats} unit={S02.text.seats} kicker={`${S02.text.aircraft} =`} x={520} y={770} size={60} o={seg(f, B.pair + 40, B.pair + 60)} />
        <Count value={hotel.rooms} unit={S02.text.rooms} kicker={`${S02.text.hotel} =`} x={1400} y={770} size={60} o={seg(f, B.pair + 46, B.pair + 66)} />
        <Title text={S02.text.message} at={B.limit + 14} top={930} size={76} family="TITLE_SCALE" layout="inline" focus={[1]} tracking={0.04} camera={false} />
      </CameraRig>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AircraftPlan } from '../components/aircraft';
import { HotelFacade } from '../components/hotel';
import { S15, S15_FROM } from '../data/scene15';
import { KaraokeLine } from '../synced/Karaoke';
import { EASE, THEME, clamp01, lerp, seg } from '../theme';

/**
 * Scene 15 — L'horloge. What the voice says, shown as it is said:
 * airlines and hotels side by side → a limited capacity, at a precise moment, that vanishes →
 * a seat left behind by the take-off, worth nothing → a room whose light goes out at midnight,
 * the revenue it could have made → every departure, night and booking moves a clock forward →
 * the clock presses on the price (129 → 219 €, handed to scene 18).
 */
const T = S15.t;
const CLOCK_L = { cx: 960, cy: 415, r: 200, rTight: 170 };
// The whole picture is drawn at G around (960, OY) so it fills the frame; the subtitle is not.
const G = 1.35, OY = 430;
/** The clock and its price as they appear on screen (handed to the 15 → 18 bridge). */
export const CLOCK = { cx: 960, cy: OY + (CLOCK_L.cy - OY) * G, rTight: CLOCK_L.rTight * G, priceSize: 96 * G };
const PLANE = { w: 300, h: 60 }, HOTEL = { w: 240, h: 200 };
const SEATS = Array.from({ length: 20 }, (_, i) => ({ c: i % 10, r: Math.floor(i / 10) }));
const ROOMS = Array.from({ length: 15 }, (_, i) => ({ c: i % 5, r: Math.floor(i / 5) }));
const HL_SEAT = 16, HL_ROOM = 7; // the seat and the room the voice talks about

const mono: React.CSSProperties = { fontFamily: THEME.mono, letterSpacing: '0.16em', textTransform: 'uppercase' };
const caps: React.CSSProperties = { fontFamily: THEME.sans, letterSpacing: '0.24em', textTransform: 'uppercase' };

export const Scene15: React.FC = () => {
  const f = useCurrentFrame();
  const v = S15_FROM + f / 30;
  const k = (a: number, d = 0.4) => EASE.out(seg(v, a, a + d));
  const io = (a: number, b: number, d = 0.35) => EASE.inOut(seg(v, a, a + d)) * (1 - EASE.inOut(seg(v, b, b + d)));

  // --- Act A/B: the aircraft. Comes in, moves to the centre for "un siège", then takes off.
  const together = EASE.inOut(seg(v, T.together, T.together + 1.0));
  const toCentre = EASE.inOut(seg(v, T.seat - 0.1, T.seat + 0.6));
  const takeoff = EASE.in(seg(v, T.takeoff, T.takeoff + 1.1));
  const px = lerp(lerp(440, 600, together), 960, toCentre) + 1100 * takeoff;
  const py = 400 - 260 * takeoff;
  const ps = 1 - 0.45 * takeoff;
  const planeO = k(T.plane, 0.5) * (1 - seg(v, T.takeoff + 0.7, T.takeoff + 1.1));
  const pb = { x: px - (PLANE.w * ps) / 2, y: py - (PLANE.h * ps) / 2, w: PLANE.w * ps, h: PLANE.h * ps };
  const seatAt = (s: { c: number; r: number }, b = pb, sc = ps) => ({ x: b.x + (40 + s.c * 22) * sc, y: b.y + (8 + s.r * 28) * sc, s: 16 * sc });
  // The seat stays where it was when the aircraft left (scene centre, before take-off).
  const leftSeat = seatAt(SEATS[HL_SEAT]!, { x: 960 - PLANE.w / 2, y: 400 - PLANE.h / 2, w: PLANE.w, h: PLANE.h }, 1);

  // --- Act A/C: the hotel. Side by side, leaves for the aircraft's act, comes back to the centre.
  const hotelOut = EASE.inOut(seg(v, T.seat - 0.1, T.seat + 0.5));
  const hotelBack = EASE.inOut(seg(v, T.room, T.room + 0.6));
  const hx = hotelBack > 0 ? lerp(1500, 960, hotelBack) : lerp(1480, 1320, together);
  const hotelO = hotelBack > 0 ? hotelBack * (1 - seg(v, T.clock - 0.2, T.clock + 0.2)) : k(T.hotels - 0.3, 0.5) * (1 - hotelOut);
  const hb = { x: hx - HOTEL.w / 2, y: 300, w: HOTEL.w, h: HOTEL.h };
  const roomAt = (r: { c: number; r: number }) => ({ x: hb.x + 22 + r.c * 44, y: hb.y + 22 + r.r * 44, w: 28, h: 22 });

  // Capacity: units appear on "capacité limitée", vanish (right to left) on "disparaissent".
  const unitIn = (i: number, n: number) => seg(v, T.capacity + (i / n) * 0.6, T.capacity + (i / n) * 0.6 + 0.12);
  const unitOut = (i: number, n: number) => seg(v, T.vanish + ((n - 1 - i) / n) * 0.7, T.vanish + ((n - 1 - i) / n) * 0.7 + 0.15);
  const unitFill = (i: number, n: number) => unitIn(i, n) * (1 - 0.85 * unitOut(i, n));
  const backFill = seg(v, T.seat, T.seat + 0.4); // the cabin and the hotel fill again for their own act

  // Act B: the seat's price, then worth nothing.
  const seatTag = k(T.seat + 0.3) * (1 - seg(v, T.room - 0.4, T.room));
  const seatVal = Math.round(lerp(S15.prices.seat, 0, EASE.inOut(seg(v, T.nothing, T.nothing + 0.5))));
  const worthless = seg(v, T.nothing, T.nothing + 0.5);
  // Act C: the room's light, midnight, the lost revenue.
  const lit = v >= T.room + 0.4 && v < T.midnight;
  const roomTag = k(T.room + 0.5) * (1 - seg(v, T.clock - 0.3, T.clock));
  const lost = seg(v, T.revenue, T.revenue + 0.4);

  // --- Act D/E: the clock. The hand jumps on each "chaque…", then spins; the price is pressed.
  const dial = EASE.inOut(seg(v, T.clock, T.clock + 0.6));
  const spring = (a: number) => { const u = clamp01((v - a) / 0.45); return u <= 0 ? 0 : 1 - Math.exp(-6 * u) * Math.cos(9 * u); };
  let angle = -90 + T.words.reduce((acc, a) => acc + 90 * spring(a), 0);
  if (v > T.advance) { const u = v - T.advance; angle += 120 * u * u + 90 * u; } // "fait avancer l'horloge": faster and faster
  const press = EASE.inOut(seg(v, T.pressure, T.pressure + 0.5));
  const r = lerp(CLOCK_L.r, CLOCK_L.rTight, press);
  const handO = dial * (1 - seg(v, T.price - 0.25, T.price + 0.1)); // the hand gives way to the price
  const priceO = k(T.price, 0.5);
  // The count ends before the 15 → 18 bridge starts (553.9 - 1 s), so the bridge picks up 219 € exactly.
  const price = Math.round(lerp(S15.prices.from, S15.prices.to, EASE.inOut(seg(v, T.pressure, T.pressure + 0.38))));
  const rad = (a: number) => (a * Math.PI) / 180;

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: `960px ${OY}px`, transform: `scale(${G})` }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {/* The aircraft and its seats. */}
        <g opacity={planeO}>
          <AircraftPlan body={pb} />
          {SEATS.map((s, i) => {
            if (i === HL_SEAT && v >= T.takeoff) return null; // that one stays on the ground
            const u = seatAt(s), fl = Math.max(unitFill(i, SEATS.length), backFill);
            return <rect key={i} x={u.x} y={u.y} width={u.s} height={u.s} rx={3 * ps} fill={THEME.ink} fillOpacity={0.85 * fl} stroke={THEME.ink} strokeOpacity={0.25 + 0.6 * fl} strokeWidth={1.2} />;
          })}
        </g>
        {/* Act B: the highlighted seat, left behind by the take-off. */}
        {seatTag > 0 && (() => {
          const u = v >= T.takeoff ? leftSeat : seatAt(SEATS[HL_SEAT]!);
          return (
            <g opacity={seatTag}>
              <rect x={u.x} y={u.y} width={u.s} height={u.s} rx={3} fill={worthless > 0.5 ? 'none' : THEME.accent} stroke={worthless > 0.5 ? THEME.line : THEME.accent} strokeWidth={1.6} strokeDasharray={worthless > 0.5 ? '3 3' : undefined} />
              <line x1={u.x + u.s / 2} y1={u.y - 8} x2={u.x + u.s / 2} y2={u.y - 118} stroke={THEME.line} strokeWidth={1.2} />
            </g>
          );
        })()}
        {/* The hotel and its rooms. */}
        <g opacity={hotelO}>
          <HotelFacade body={hb} />
          {ROOMS.map((rm, i) => {
            const u = roomAt(rm), fl = Math.max(unitFill(i, ROOMS.length), hotelBack > 0 ? 1 : 0);
            const on = i === HL_ROOM && hotelBack > 0;
            return <rect key={i} x={u.x} y={u.y} width={u.w} height={u.h} fill={on && lit ? THEME.accent : THEME.ink} fillOpacity={on ? (lit ? 0.95 : 0) : 0.8 * fl} stroke={on ? THEME.accent : THEME.ink} strokeOpacity={on ? 1 : 0.25 + 0.6 * fl} strokeWidth={1.2} />;
          })}
          {hotelBack > 0 && (() => { const u = roomAt(ROOMS[HL_ROOM]!); return <line x1={u.x + u.w} y1={u.y + u.h / 2} x2={hb.x + hb.w + 70} y2={u.y + u.h / 2} stroke={THEME.line} strokeWidth={1.2} opacity={roomTag} />; })()}
        </g>
        {/* The clock. */}
        {dial > 0 && (
          <g opacity={dial}>
            <circle cx={CLOCK_L.cx} cy={CLOCK_L.cy} r={r} fill="none" stroke={press > 0 ? THEME.accent : THEME.ink} strokeOpacity={0.9} strokeWidth={2 + 1.5 * press} strokeDasharray={`${2 * Math.PI * r * dial} ${2 * Math.PI * r}`} transform={`rotate(-90 ${CLOCK_L.cx} ${CLOCK_L.cy})`} />
            {Array.from({ length: 60 }, (_, i) => {
              const a = rad(i * 6 - 90), major = i % 5 === 0, L = major ? 18 : 8;
              return <line key={i} x1={CLOCK_L.cx + Math.cos(a) * (r - 6)} y1={CLOCK_L.cy + Math.sin(a) * (r - 6)} x2={CLOCK_L.cx + Math.cos(a) * (r - 6 - L)} y2={CLOCK_L.cy + Math.sin(a) * (r - 6 - L)} stroke={THEME.ink} strokeOpacity={(major ? 0.7 : 0.3) * seg(dial, i / 60, i / 60 + 0.1)} strokeWidth={major ? 2 : 1.2} />;
            })}
            <g opacity={handO}>
              <line x1={CLOCK_L.cx} y1={CLOCK_L.cy} x2={CLOCK_L.cx + Math.cos(rad(angle)) * (r - 40)} y2={CLOCK_L.cy + Math.sin(rad(angle)) * (r - 40)} stroke={THEME.accent} strokeWidth={3} strokeLinecap="round" />
              <circle cx={CLOCK_L.cx} cy={CLOCK_L.cy} r={6} fill={THEME.accent} />
            </g>
          </g>
        )}
      </svg>

      {/* Labels of act A, lit on their words. */}
      <div style={{ ...caps, position: 'absolute', left: px - 300, width: 600, top: 560, textAlign: 'center', fontSize: 22, color: THEME.ink, opacity: k(T.airlines) * (1 - toCentre) }}>{S15.text.airlines}</div>
      <div style={{ ...caps, position: 'absolute', left: hx - 300, width: 600, top: 560, textAlign: 'center', fontSize: 22, color: THEME.ink, opacity: k(T.hotels) * (1 - hotelOut) * (hotelBack > 0 ? 0 : 1) }}>{S15.text.hotels}</div>
      {/* "à un moment précis": each capacity has its own moment. */}
      <div style={{ ...mono, position: 'absolute', left: px - 300, width: 600, top: 608, textAlign: 'center', fontSize: 20, color: THEME.accent, opacity: io(T.moment, T.seat - 0.3) }}>{S15.text.departure}</div>
      <div style={{ ...mono, position: 'absolute', left: hx - 300, width: 600, top: 608, textAlign: 'center', fontSize: 20, color: THEME.accent, opacity: io(T.moment, T.seat - 0.3) * (hotelBack > 0 ? 0 : 1) }}>{S15.text.night}</div>

      {/* Act B: the seat's price, worth nothing after the take-off. */}
      <div style={{ position: 'absolute', left: leftSeat.x + 8 - 200, width: 400, top: leftSeat.y - 210, textAlign: 'center', opacity: seatTag, fontFamily: THEME.sans, fontWeight: 300, fontSize: 72, color: worthless > 0.5 ? THEME.muted : THEME.ink, fontVariantNumeric: 'tabular-nums' }}>{seatVal} €</div>
      {/* Act C: midnight, and the revenue the room could have made. */}
      <div style={{ ...mono, position: 'absolute', left: hb.x - 360, width: 300, top: 382, textAlign: 'right', fontSize: 34, color: v >= T.midnight ? THEME.accent : THEME.ink, opacity: roomTag }}>{v >= T.midnight ? '00:00' : '23:59'}</div>
      <div style={{ position: 'absolute', left: hb.x + hb.w + 84, top: 350, opacity: roomTag, fontFamily: THEME.sans, fontWeight: 300, fontSize: 64, color: lost > 0.5 ? THEME.muted : THEME.ink, fontVariantNumeric: 'tabular-nums' }}>
        {S15.prices.room} €
        <div style={{ ...mono, fontSize: 18, color: THEME.accent, marginTop: 6, opacity: lost }}>Revenu perdu</div>
      </div>

      {/* Act D: the words that move the clock forward, where the hand lands. */}
      {S15.text.words.map((w, i) => {
        const a = rad(i * 90), o = k(T.words[i]!, 0.25) * (1 - seg(v, T.pressure - 0.4, T.pressure));
        const x = CLOCK_L.cx + Math.cos(a) * (CLOCK_L.r + 44), y = CLOCK_L.cy + Math.sin(a) * (CLOCK_L.r + 44);
        const align = i === 0 ? 'left' : i === 2 ? 'right' : 'center';
        return <div key={w} style={{ ...caps, position: 'absolute', left: align === 'left' ? x : align === 'right' ? x - 500 : x - 250, width: align === 'center' ? 500 : 500, top: y - 14 + (i === 1 ? 6 : 0), textAlign: align, fontSize: 24, color: v < T.words[i]! + 0.5 ? THEME.accent : THEME.ink, opacity: o }}>{w}</div>;
      })}
      {/* Act E: the price at the centre of the clock, pressed upwards. */}
      <div style={{ position: 'absolute', left: CLOCK_L.cx - 300, width: 600, top: CLOCK_L.cy - 58, textAlign: 'center', opacity: priceO, transform: `scale(${0.9 + 0.1 * priceO})`, fontFamily: THEME.sans, fontWeight: 300, fontSize: 96, lineHeight: '116px', color: press > 0.5 ? THEME.accent : THEME.ink }}>{price} €</div>
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {/* Karaoke subtitle: each word lights when it is said. */}
        {S15.lines.map(([a, b, end], i) => (
          <React.Fragment key={i}>
            <KaraokeLine t={v} from={a - 0.05} to={b || end} cx={960} baseline={b ? 872 : 902} style={{ size: 52, font: 'serif', italic: true, weight: 400, upper: false }} accent={S15.accent} fade={[a - 0.2, end - 0.3]} />
            {b > 0 && <KaraokeLine t={v} from={b - 0.05} to={end} cx={960} baseline={936} style={{ size: 52, font: 'serif', italic: true, weight: 400, upper: false }} accent={S15.accent} fade={[a - 0.2, end - 0.3]} />}
          </React.Fragment>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

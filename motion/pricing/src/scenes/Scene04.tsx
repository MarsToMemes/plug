import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { AircraftPlan } from '../components/aircraft';
import { flight } from '../data/entities';
import { S04 } from '../data/scene04';
import { EASE, THEME, clamp01, lerp, rng, seg } from '../theme';
import { Title } from '../type/Title';
import { aircraftLayout } from './layout02';

const B = S04.beats;
const AC = aircraftLayout(S04.seats, flight.layout);
const BLOCK = flight.layout[0]!; // seats side by side between aisle and window

/** Bookings: parties of adjacent seats, assigned once (deterministic), with an arrival frame. */
type Booking = { seats: number[]; at: number };
const BOOKINGS: Booking[] = (() => {
  const r = rng(S04.seed);
  const free = new Set(Array.from({ length: S04.seats }, (_, i) => i));
  const order = Array.from({ length: S04.seats }, (_, i) => i).sort(() => r() - 0.5);
  const total = S04.parties.reduce((a, p) => a + p[1], 0);
  const pickSize = () => { let x = r() * total; for (const [s, w] of S04.parties) { if ((x -= w) < 0) return s; } return 1; };
  const out: Booking[] = [];
  let toSell = S04.seats - S04.unsold;
  for (const seed of order) {
    if (toSell <= 0) break;
    if (!free.has(seed)) continue;
    const want = out.length < B.firstBookings.length ? 1 : Math.min(pickSize(), toSell);
    // Grow the party along the seat block (same row, same side of the aisle).
    const block = Math.floor(seed / BLOCK);
    const group = [seed];
    for (let k = 1; group.length < want && k < BLOCK; k++) for (const c of [seed + k, seed - k]) if (group.length < want && Math.floor(c / BLOCK) === block && free.has(c)) group.push(c);
    group.forEach((g) => free.delete(g));
    toSell -= group.length;
    out.push({ seats: group, at: 0 });
  }
  // Arrival times: the first ones slow and readable, then denser and denser towards departure.
  const rest = out.length - B.firstBookings.length;
  out.forEach((b, k) => {
    b.at = k < B.firstBookings.length ? B.firstBookings[k]! : Math.round(B.rushFrom + (B.rushTo - B.rushFrom) * Math.pow((k - B.firstBookings.length) / Math.max(1, rest - 1), 0.6));
  });
  return out;
})();
const FLY = 14;
const bookedAt = new Map<number, number>();
BOOKINGS.forEach((b) => b.seats.forEach((s) => bookedAt.set(s, b.at + FLY)));
const UNSOLD = Array.from({ length: S04.seats }, (_, i) => i).filter((i) => !bookedAt.has(i));

/** Runway centre line: dashes that stream backwards as the plane rolls. */
const Runway: React.FC<{ offset: number; o: number; y: number }> = ({ offset, o, y }) => (
  <g opacity={o}>
    <rect x={-2000} y={y - 230} width={6000} height={460} fill={THEME.ink} fillOpacity={0.025} />
    {Array.from({ length: 60 }, (_, i) => {
      const x = ((i * 140 - offset) % 8400 + 8400) % 8400 - 2000;
      return <rect key={i} x={x} y={y - 3} width={70} height={6} fill={THEME.line} />;
    })}
  </g>
);

export const Scene04: React.FC = () => {
  const f = useCurrentFrame();
  const appear = (i: number) => clamp01((f - B.seats - (Math.floor(i / (BLOCK * 2)) / AC.rows) * 30) / 8);
  const available = S04.seats - [...bookedAt.values()].filter((t) => t <= f).length;

  // Take-off: the ground streams backwards (we ride with the plane), then the plane climbs.
  const roll = (t: number) => Math.max(0, t - B.roll);
  // Accelerating; once the camera pulls out it stays with the ground, so the ground stops moving.
  const ground = (t: number) => 0.022 * roll(Math.min(t, B.pullOut)) ** 2;
  const climb = EASE.inOut(seg(f, B.liftOff, B.liftOff + 90));
  const away = EASE.in(seg(f, B.away, B.away + 70));
  const planeDx = 2700 * away, planeS = 1 + 0.12 * climb + 0.2 * away;
  const cy = AC.body.y + AC.body.h / 2, cx = AC.body.x + AC.body.w / 2;
  const T = (x: number, y: number) => ({ x: cx + (x - cx) * planeS + planeDx, y: cy + (y - cy) * planeS });
  // The unsold seats do not leave with the flight: from lift-off they stay on the ground.
  const leftAt = ground(B.left);
  const lostFade = 1 - EASE.inOut(seg(f, B.lost + 40, B.lost + 120));

  const title = EASE.out(seg(f, B.takeoffTitle, B.takeoffTitle + 10));
  const lostT = EASE.out(seg(f, B.lost, B.lost + 24));
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S04.camera} impacts={S04.impacts} start={S04.cameraStart}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <Runway offset={ground(f)} o={(1 - climb * 0.85) * EASE.out(seg(f, 0, 30))} y={cy} />

          {/* Seats left behind on the ground: transparent, then gone. */}
          {f >= B.left && UNSOLD.map((i) => {
            const u = AC.units[i]!;
            const dx = -(ground(f) - leftAt); // they stay where the plane left them
            const fade = EASE.inOut(seg(f, B.left, B.left + 60));
            const o = lerp(1, 0.75, fade) * lostFade;
            if (o <= 0.01) return null;
            return <rect key={`l${i}`} x={u.x + dx} y={u.y} width={u.w} height={u.h} rx={4} fill="none" stroke={THEME.accent} strokeWidth={2.6} opacity={o} />;
          })}

          <g>
            {(() => {
              const b = AC.body, p0 = T(b.x, b.y);
              return <AircraftPlan body={{ x: p0.x, y: p0.y, w: b.w * planeS, h: b.h * planeS }} />;
            })()}
            {AC.units.map((u, i) => {
              const o = appear(i);
              if (o <= 0) return null;
              const t = bookedAt.get(i);
              const taken = t !== undefined && f >= t;
              if (t === undefined && f >= B.left) return null; // the empty seat stayed on the ground
              const p = T(u.x, u.y), w = u.w * planeS;
              const flash = taken ? clamp01(1 - (f - t!) / 10) : 0;
              return <rect key={i} x={p.x} y={p.y} width={w} height={w} rx={4 * planeS} fill={taken ? THEME.ink : 'none'} fillOpacity={taken ? 0.82 : 0} stroke={flash > 0 ? THEME.accent : THEME.ink} strokeOpacity={taken ? 0.9 : 0.85} strokeWidth={1.5} opacity={o} />;
            })}
          </g>

          {/* Bookings arriving: one mark per party, flying in from the right. */}
          {BOOKINGS.map((bk, k) => {
            const t = (f - bk.at) / FLY;
            if (t < 0 || t > 1) return null;
            const s = AC.units[bk.seats[0]!]!;
            const e = EASE.inOut(t);
            const x = lerp(2000, s.x + s.w / 2, e), y = lerp(s.y + (k % 2 ? -260 : 260), s.y + s.h / 2, e);
            return <circle key={k} cx={x} cy={y} r={5 + bk.seats.length} fill={THEME.accent} opacity={0.9} />;
          })}
        </svg>
      </CameraRig>

      {/* Quiet zones: the runway lines fade out behind the title and the counter (text never sits on a line). */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 340, background: `linear-gradient(to bottom, ${THEME.bg} 0%, ${THEME.bg} 62%, transparent 100%)`, opacity: EASE.inOut(seg(f, B.takeoffTitle - 12, B.takeoffTitle + 8)) * (1 - EASE.inOut(seg(f, B.pullOut, B.pullOut + 30))) }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 330, background: `linear-gradient(to top, ${THEME.bg} 0%, ${THEME.bg} 58%, transparent 100%)`, opacity: Math.max(EASE.out(seg(f, B.counter, B.counter + 20)), lostT) * lostFade }} />
      {/* Screen space: the counter, then the verdict. */}
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 840, textAlign: 'center', fontFamily: THEME.sans, color: THEME.ink, textShadow: `0 0 18px ${THEME.bg}, 0 0 8px ${THEME.bg}`, opacity: EASE.out(seg(f, B.counter, B.counter + 20)) * (1 - lostT) }}>
        <span style={{ fontSize: 96, fontWeight: 300, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{available}</span>
        <span style={{ fontSize: 26, letterSpacing: '0.34em', textTransform: 'uppercase', marginLeft: 22, color: THEME.muted }}>{S04.text.available}</span>
      </div>
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 800, textAlign: 'center', fontFamily: THEME.sans, textShadow: `0 0 18px ${THEME.bg}, 0 0 8px ${THEME.bg}`, opacity: lostT, transform: `translateY(${(1 - lostT) * 10}px)` }}>
        <div style={{ fontSize: 22, letterSpacing: '0.4em', textTransform: 'uppercase', color: THEME.accent, marginBottom: 6 }}>{S04.text.lost}</div>
        <span style={{ fontSize: 96, fontWeight: 300, color: THEME.ink, fontVariantNumeric: 'tabular-nums' }}>{S04.unsold}</span>
        <span style={{ fontSize: 26, letterSpacing: '0.34em', textTransform: 'uppercase', marginLeft: 22, color: THEME.muted }}>{S04.text.seats}</span>
      </div>
      <Title text={S04.text.takeoff} at={B.takeoffTitle} out={B.pullOut} top={96} size={110} family="TITLE_PUSH" tracking={0.04} />
    </AbsoluteFill>
  );
};

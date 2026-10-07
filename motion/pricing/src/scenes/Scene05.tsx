import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { AircraftPlan, bookedSet } from '../components/aircraft';
import { HotelFacade } from '../components/hotel';
import { RoomPlan } from '../components/rooms';
import { Caps, Figure, Statement } from '../components/ui';
import { flight } from '../data/entities';
import { S05 } from '../data/scene05';
import { EASE, THEME, clamp01, lerp, seg } from '../theme';
import { aircraftLayout, hotelLayout, place } from './layout02';

const B = S05.beats;
const HO = hotelLayout(S05.rooms, S05.perFloor);
const ROOM = S05.room.floor * S05.perFloor + (S05.room.index - 1);
const FREE = (() => { const t = bookedSet(S05.rooms, S05.available, 23); t.delete(ROOM); return t; })(); // taken rooms; 417 stays free
const R = HO.units[ROOM]!;
const RC = { x: R.x + R.w / 2, y: R.y + R.h / 2 };
const PLAN = { x: 960 - 470, y: 300, w: 940, h: 500 };
const SMALL_AC = aircraftLayout(flight.seats, flight.layout);

const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m) % 60).padStart(2, '0')}`;

export const Scene05: React.FC = () => {
  const f = useCurrentFrame();
  const shots = S05.camera.map((s) => (s.move === 'PUSH_IN' || s.move === 'SLOW_PUSH' ? { ...s, to: { ...s.to, x: RC.x, y: RC.y } } : s));
  const hi = seg(f, B.highlight, B.highlight + 16);
  const morph = EASE.inOut(seg(f, B.morph, B.morph + 30)); // the window opens into the room
  // Clock: fast through the evening, slowing down as midnight approaches.
  const ck = EASE.out(seg(f, B.clock, B.last));
  const minutes = f >= B.midnight ? 24 * 60 : lerp(S05.clock.from, S05.clock.to, ck);
  const midnight = f >= B.midnight;
  const vanish = EASE.inOut(seg(f, B.vanish, B.vanish + 50)); // transparent, then gone
  const par = EASE.inOut(seg(f, B.parallel, B.parallel + 40));

  // The room frame, in screen space: from the window seen at push-in scale, to the plan.
  const win = { x: 960 - R.w * 3.5, y: 540 - R.h * 3.5, w: R.w * 7, h: R.h * 7 };
  const frame = { x: lerp(win.x, PLAN.x, morph), y: lerp(win.y, PLAN.y, morph), w: lerp(win.w, PLAN.w, morph), h: lerp(win.h, PLAN.h, morph) };
  // In the parallel, the lost room becomes one small unit on the left, facing a lost seat on the right.
  const unitL = { x: 560 - 22, y: 470 - 28, w: 44, h: 56 };
  const fr = par > 0 ? { x: lerp(frame.x, unitL.x, par), y: lerp(frame.y, unitL.y, par), w: lerp(frame.w, unitL.w, par), h: lerp(frame.h, unitL.h, par) } : frame;
  const showPlan = f >= B.morph;

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={shots} impacts={S05.impacts}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: 1 - morph }}>
          <HotelFacade body={HO.body} />
          {HO.units.map((u, i) => (
            <rect key={i} x={u.x} y={u.y} width={u.w} height={u.h} fill={FREE.has(i) ? THEME.ink : 'none'} fillOpacity={0.85} stroke={i === ROOM && hi > 0 ? THEME.accent : THEME.ink} strokeWidth={i === ROOM ? 1.4 + hi : 1.3} strokeOpacity={0.8} />
          ))}
          <text x={R.x + R.w / 2} y={R.y - 10} textAnchor="middle" fill={THEME.accent} fontFamily={THEME.sans} fontSize={12} opacity={hi * (1 - seg(f, B.push, B.push + 10))}>{S05.room.number}</text>
        </svg>
      </CameraRig>

      {/* The room, then the parallel with the aircraft: screen space, after the camera went through the window. */}
      {showPlan && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          {par === 0 && <RoomPlan x={frame.x} y={frame.y} w={frame.w} h={frame.h} draw={seg(f, B.plan, B.plan + 50)} o={(1 - vanish) * seg(f, B.morph, B.morph + 6)} line={midnight ? THEME.accent : THEME.ink} />}
          <rect x={fr.x} y={fr.y} width={fr.w} height={fr.h} fill="none" stroke={midnight ? THEME.accent : THEME.ink} strokeWidth={3} opacity={midnight ? lerp(1, 0.55, vanish) : 1} strokeDasharray={midnight && vanish > 0.3 ? '6 8' : undefined} />
          {par > 0 && (
            <g opacity={par}>
              {/* Left: the hotel, one room-night lost at midnight. Right: the aircraft, one seat lost at take-off. */}
              <g opacity={0.8}><HotelFacade body={place(HO.body, 0.42, 560 - 960, 470 - 540)} parts={0.6} /></g>
              <g opacity={0.8}><AircraftPlan body={place(SMALL_AC.body, 0.42, 1360 - 960, 470 - 540)} /></g>
              <rect x={1360 - 20} y={470 - 20} width={40} height={40} rx={6} fill="none" stroke={THEME.accent} strokeWidth={3} strokeDasharray="6 8" />
            </g>
          )}
        </svg>
      )}

      {/* Clock. */}
      {f >= B.clock && par < 1 && (
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 832, textAlign: 'center', opacity: EASE.out(seg(f, B.clock, B.clock + 16)) * (1 - par) * (1 - seg(f, B.lost, B.lost + 14)) }}>
          <span style={{ fontFamily: THEME.sans, fontWeight: 300, fontSize: 118, fontVariantNumeric: 'tabular-nums', color: midnight ? THEME.accent : THEME.ink, letterSpacing: '0.02em' }}>{hhmm(minutes)}</span>
        </div>
      )}
      {f >= B.lost && par < 1 && (
        <div style={{ position: 'absolute', left: 0, width: 1920, top: 846, display: 'flex', justifyContent: 'center', opacity: EASE.out(seg(f, B.lost + 10, B.lost + 30)) * (1 - par) }}>
          <Figure value="1" unit={S05.text.lost} color={THEME.accent} />
        </div>
      )}

      <Statement text={S05.text.room} at={B.title} out={B.parallel - 20} top={150} size={84} />
      <Statement text={S05.text.tonight} at={B.tonight} out={B.parallel - 20} top={236} size={34} color={THEME.muted} style={{ fontFamily: THEME.sans, letterSpacing: '0.34em' }} />

      {/* The parallel. */}
      {par > 0 && (
        <>
          {[[560, S05.text.hotel, S05.text.midnight], [1360, S05.text.plane, S05.text.takeoff]].map(([x, a, b], k) => (
            <div key={k} style={{ position: 'absolute', left: (x as number) - 300, width: 600, top: 700, textAlign: 'center', opacity: EASE.out(seg(f, B.parallel + 30 + k * 8, B.parallel + 50 + k * 8)) }}>
              <Caps size={24} color={THEME.ink}>{a}</Caps>
              <Caps size={24} color={THEME.muted} style={{ margin: '0 18px' }}>→</Caps>
              <Caps size={24} color={THEME.accent}>{b}</Caps>
            </div>
          ))}
          <Statement text={S05.text.same} at={B.same} top={860} size={60} />
        </>
      )}
    </AbsoluteFill>
  );
};

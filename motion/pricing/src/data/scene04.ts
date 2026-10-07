import type { CameraImpact, CameraShot } from '../camera/CameraRig';
import { flight } from './entities';

/** Scene 04 — Le siège qui disparaît. Seats and the unsold count come from entities.ts. */
export const S04 = {
  duration: 900,
  beats: {
    seats: 0, counter: 24,
    firstBookings: [60, 86, 108], // single seats, slow enough to read 179, 178, 177
    rushFrom: 130, rushTo: 400, // then parties, faster and faster as departure nears
    takeoffTitle: 424, cabin: 452, roll: 508, liftOff: 572, left: 580, pullOut: 690, away: 700, lost: 760,
  },
  seats: flight.seats,
  unsold: flight.unsoldAtDeparture,
  // Party sizes and how often they occur (weights): mostly 1–2, some families.
  parties: [[1, 4], [2, 5], [3, 2], [4, 1]] as Array<[number, number]>,
  seed: 404,
  text: { available: 'disponibles', takeoff: 'Décollage', lost: 'Capacité perdue', seats: 'sièges' },
  camera: [
    { at: 452, move: 'PUSH_IN', to: { scale: 1.85, x: 930 } }, // into the cabin: the mechanism, seat by seat
    { at: 690, move: 'PULL_OUT', to: { scale: 0.8, x: 880, y: 540 } }, // the plane leaves, the empty seats stay behind
  ] as CameraShot[],
  cameraStart: { x: 960, y: 540, scale: 0.84, rotY: 0 },
  impacts: [{ at: 424, strength: 0.7 }] as CameraImpact[],
};

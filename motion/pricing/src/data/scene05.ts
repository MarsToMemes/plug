import type { CameraImpact, CameraShot } from '../camera/CameraRig';
import { hotel } from './entities';

/** Scene 05 — La chambre qui disparaît. Same principle as the seat, with a room-night. */
export const S05 = {
  duration: 860,
  room: { number: '417', floor: 4, index: 17 }, // 4th floor (ground floor = 0), 17th room
  beats: { exterior: 0, highlight: 96, push: 132, morph: 172, plan: 188, title: 214, tonight: 254, clock: 300, clockSlow: 430, last: 474, midnight: 540, vanish: 556, lost: 610, parallel: 690, same: 760 },
  clock: { from: 21 * 60, to: 23 * 60 + 59 },
  rooms: hotel.rooms, perFloor: hotel.perFloor, available: hotel.availableRooms,
  text: { room: 'Chambre 417', tonight: 'Pour ce soir', lost: 'chambre perdue', hotel: 'Hôtel', plane: 'Avion', midnight: 'Minuit', takeoff: 'Décollage', same: 'Même mécanisme économique' },
  camera: [
    { at: 132, move: 'PUSH_IN', to: { scale: 7 } }, // into one room: the mechanism at the scale of a single unit
    { at: 474, move: 'SLOW_PUSH', to: { scale: 7.25 }, duration: 66 }, // 23:59, the analytical wait
  ] as CameraShot[],
  impacts: [{ at: 540, strength: 1 }] as CameraImpact[],
};

import type { CameraShot } from '../camera/CameraRig';
import { flight, hotel } from './entities';

/**
 * Scene 03 — Le temps. Time runs from 0 (sales open) to 1 (the deadline). Availability is
 * given at a few moments and interpolated; the value at the last milestone before the
 * deadline is the one in entities.ts (42 seats, 17 rooms). Illustrative curves.
 */
export type Lane = {
  key: 'flight' | 'hotel';
  title: string;
  unit: string;
  total: number;
  milestones: Array<{ label: string; tau: number }>;
  availability: Array<{ tau: number; value: number }>;
};

export const S03 = {
  duration: 860,
  beats: { lanes: 6, units: 24, pan: 96, panEnd: 576, perish: 584, pullOut: 640, message: 690, push: 700 },
  world: { x0: 360, x1: 3400, laneY: { flight: 430, hotel: 850 }, ribbonH: 210 },
  lanes: [
    {
      key: 'flight', title: 'Avion', unit: 'sièges', total: flight.seats,
      milestones: [{ label: 'Ouverture des réservations', tau: 0 }, { label: 'Embarquement', tau: 0.9 }, { label: 'Décollage', tau: 1 }],
      availability: [{ tau: 0, value: flight.seats }, { tau: 0.25, value: 171 }, { tau: 0.5, value: 146 }, { tau: 0.72, value: 108 }, { tau: 0.9, value: flight.availableSeats }, { tau: 1, value: flight.availableSeats }],
    },
    {
      key: 'hotel', title: 'Hôtel', unit: 'chambres', total: hotel.rooms,
      milestones: [{ label: 'Réservation', tau: 0 }, { label: 'Arrivée', tau: 0.9 }, { label: 'Minuit', tau: 1 }],
      availability: [{ tau: 0, value: hotel.rooms }, { tau: 0.3, value: 188 }, { tau: 0.55, value: 154 }, { tau: 0.76, value: 92 }, { tau: 0.9, value: hotel.availableRooms }, { tau: 1, value: 12 }],
    },
  ] as Lane[],
  message: 'Le temps fait disparaître l’inventaire',
  camera: [
    { at: 96, move: 'PAN', to: { x: 3400 }, duration: 480 }, // follow time, one fluid move
    { at: 640, move: 'PULL_OUT', to: { x: 2040, y: 600, scale: 0.52 } }, // the whole relation: time against inventory
    { at: 700, move: 'SLOW_PUSH', to: { x: 2980, y: 640, scale: 0.78 }, duration: 160 }, // slowly into the relation
  ] as CameraShot[],
};

/** Available units at time tau (linear between the given points). */
export function availableAt(lane: Lane, tau: number) {
  const a = lane.availability;
  if (tau <= a[0]!.tau) return a[0]!.value;
  for (let i = 1; i < a.length; i++) {
    if (tau <= a[i]!.tau) {
      const p = a[i - 1]!, q = a[i]!;
      return p.value + (q.value - p.value) * ((tau - p.tau) / (q.tau - p.tau));
    }
  }
  return a[a.length - 1]!.value;
}

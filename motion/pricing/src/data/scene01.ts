import type { PriceStep } from '../components/price';
import type { CameraImpact, CameraShot } from '../camera/CameraRig';

/** Scene 01 — Le prix qui change. Every beat and every price of the scene lives here. */
export const S01 = {
  duration: 700,
  beats: { route: 24, price: 54, cut: 270, split: 272, out: 452, why: 488, morph: 548, end: 700 },
  route: { from: 'Paris', to: 'New York' },
  // The flight alone (immobile first, then rising), then both series moving independently.
  flight: [
    { at: 0, value: 287 }, { at: 116, value: 341 }, { at: 216, value: 476 }, // the three prices the narration says
    { at: 334, value: 498 }, { at: 404, value: 523 },
  ] as PriceStep[],
  hotel: { title: 'Hotel — New York', steps: [{ at: 0, value: 119 }, { at: 306, value: 167 }, { at: 366, value: 213 }] as PriceStep[] },
  why: 'Pourquoi ?',
  camera: [
    { at: 116, move: 'SLOW_PUSH', to: { scale: 1.07 }, duration: 150 }, // analytical: the price is moving
    { at: 270, move: 'SNAP', to: { scale: 1, x: 960, y: 540 } }, // cut to the split screen
    { at: 548, move: 'PULL_OUT', to: { scale: 0.86 }, duration: 60 }, // reveal the system around the question
  ] as CameraShot[],
  impacts: [{ at: 488, strength: 1 }] as CameraImpact[],
};

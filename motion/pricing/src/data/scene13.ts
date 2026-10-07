import type { CameraShot } from '../camera/CameraRig';

/** Scene 13 — L'événement. No figures on screen on purpose: only the mechanism. */
export const S13 = {
  duration: 820,
  visitors: 1600, hotels: 26,
  beats: { city: 0, event: 90, arrive: 170, arriveEnd: 500, bars: 200, chain: [560, 600, 640] },
  text: { event: 'Grand événement', demand: 'Demande', avail: 'Disponibilité', price: 'Prix', chain: ['Plus de demande', 'Moins de disponibilité', 'Pression sur le prix'] },
  camera: [
    { at: 150, move: 'PULL_OUT', to: { scale: 0.6 } }, // see where they come from
    { at: 420, move: 'PUSH_IN', to: { scale: 1.12, x: 960, y: 560 } }, // into the city: hotels filling up
  ] as CameraShot[],
};

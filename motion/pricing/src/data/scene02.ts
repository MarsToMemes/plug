import type { CameraShot } from '../camera/CameraRig';

/** Scene 02 — Le produit est déjà là. Beats (frames, 30 fps) and camera. Capacities come from entities.ts. */
export const S02 = {
  duration: 800,
  beats: {
    pullBack: 12, // camera leaves the nose
    clear: 110, // the fuselage becomes transparent
    seats: 132, // seats revealed, nose to tail
    seatsEnd: 236,
    seatsLabel: 150,
    morph: 300, // aircraft → hotel
    morphEnd: 362,
    clearHotel: 384,
    rooms: 404, // rooms revealed, ground floor up
    roomsEnd: 492,
    roomsLabel: 418,
    pair: 540, // symmetry: aircraft | hotel
    abstract: 640, // both become grids
    limit: 700, // CAPACITÉ LIMITÉE
  },
  camera: [
    { at: 12, move: 'PULL_OUT', to: { scale: 1, x: 960, y: 540 }, duration: 80 }, // from the nose to the whole aircraft
    { at: 540, move: 'PULL_OUT', to: { scale: 0.94, y: 530 } }, // reveal both systems side by side
    { at: 700, move: 'SLOW_PUSH', to: { scale: 1.0 }, duration: 100 }, // the conclusion is held, analytically
  ] as CameraShot[],
  cameraStart: { x: 1480, y: 540, scale: 2.6, rotY: 0 },
  text: { seats: 'sièges', rooms: 'chambres', aircraft: 'Avion', hotel: 'Hôtel', message: 'Capacité|limitée' },
};

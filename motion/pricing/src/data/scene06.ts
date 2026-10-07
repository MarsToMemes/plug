import type { CameraShot } from '../camera/CameraRig';

/**
 * Scene 06 — Pourquoi ne pas mettre un prix fixe ? Each client has a maximum price they would
 * pay (illustrative). With a fixed 100 €, everyone wants a room; as the price rises, only the
 * clients who would pay that much remain, until demand fits the 100 rooms.
 */
export const S06 = {
  duration: 920,
  rooms: 100, cols: 10,
  fixedPrice: 100,
  // How many clients would still buy at each price (illustrative demand): 340 at 100 €, 100 at 220 €.
  demandAt: [{ price: 100, clients: 340 }, { price: 130, clients: 236 }, { price: 170, clients: 158 }, { price: 220, clients: 100 }],
  // Clients counted on screen: 10 first, then 30, 31, 32, 33 one by one, then the crowd.
  arrivals: [{ at: 64, n: 10 }, { at: 150, n: 30 }, { at: 196, n: 31 }, { at: 214, n: 32 }, { at: 230, n: 33 }, { at: 420, n: 340 }],
  beats: { grid: 0, header: 20, counter: 60, saturate: 246, verdict: 440, prices: [536, 604, 672], seat: 740, message: 800 },
  text: { price: 'Prix', clients: 'clients', verdict: 'Demande >|capacité disponible', message: 'Un prix fixe ne sait pas répartir|une capacité limitée', rooms: 'chambres' },
  camera: [
    { at: 246, move: 'SLOW_PUSH', to: { scale: 1.05 }, duration: 190 }, // the pressure builds, nothing moves on the price
    { at: 740, move: 'PULL_OUT', to: { scale: 1 } }, // demand now fits: the whole picture again
  ] as CameraShot[],
};

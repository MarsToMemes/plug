import type { CameraShot } from '../camera/CameraRig';

/** Scene 08 — Même chambre, prix différent. Only the moment of booking changes. */
export const S08 = {
  duration: 740,
  // Milestones on the booking timeline (x on screen) and the price at each one (illustrative).
  milestones: [
    { label: '30 jours avant', x: 300, price: 89, at: 84 },
    { label: '7 jours avant', x: 900, price: 129, at: 262 },
    { label: '1 jour avant', x: 1300, price: 179, at: 404 },
    { label: 'Le jour même', x: 1620, price: 249, at: 520 },
  ],
  beats: { room: 0, timeline: 30, message: 600 },
  text: { message: 'Même chambre. Prix différent.', price: 'Prix de la nuit' },
  camera: [{ at: 40, move: 'SLOW_PUSH', to: { scale: 1.1, x: 960, y: 470 }, duration: 660 }] as CameraShot[], // one very slow approach: we look harder, nothing changes
};

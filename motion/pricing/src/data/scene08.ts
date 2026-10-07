import type { CameraShot } from '../camera/CameraRig';

/** Scene 08 — Même chambre, prix différent. Only the moment of booking changes. */
// From frame 600 (voice 3:42.7) the scene runs on the narration's own timing: v(second) -> frame.
const v = (sec: number) => Math.round(600 + (sec - 222.7) * 30);
export const S08 = {
  duration: v(238.3) + 1,
  // Milestones on the booking timeline (x on screen) and the price at each one (illustrative).
  milestones: [
    { label: '30 jours avant', x: 300, price: 89, at: 84 },
    { label: '7 jours avant', x: 900, price: 129, at: 262 },
    { label: '1 jour avant', x: 1300, price: 179, at: 404 },
    { label: 'Le jour même', x: 1620, price: 249, at: 520 },
  ],
  beats: { room: 0, timeline: 30, message: 600 },
  text: { message: 'Même chambre.|Prix différent.', price: 'Prix de la nuit' },
  // On the voice: the bed, the view are the same; what changed is the context, in three gauges.
  same: [{ at: v(224.5), label: 'Même lit' }, { at: v(226.4), label: 'Même vue' }],
  context: { at: v(228.9), text: 'Ce qui a changé :|le contexte' },
  gauges: [
    { at: v(231.0), label: 'Chambres restantes', from: 40, to: 6, unit: '' }, // "la quantité de chambres restantes"
    { at: v(233.2), label: 'Avant l’arrivée', from: 30, to: 1, unit: ' j' }, // "le temps avant l'arrivée"
    { at: v(236.0), label: 'Demande anticipée', from: 0.3, to: 0.92, unit: 'level' }, // "la demande que l'hôtel anticipe"
  ],
  camera: [{ at: 40, move: 'SLOW_PUSH', to: { scale: 1.1, x: 960, y: 470 }, duration: 660 }] as CameraShot[], // one very slow approach: we look harder, nothing changes
};

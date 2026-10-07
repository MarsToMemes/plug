import type { CameraImpact, CameraShot } from '../camera/CameraRig';

/** Scene 14 — Le piège du « J'attends ». Two possible futures from the same starting price. */
export const S14 = {
  duration: 820,
  offer: { title: 'Hôtel — New York', detail: '1 nuit · chambre double', cta: 'Réserver', waiting: 'Vous attendez…' },
  ticks: ['J-30', 'J-21', 'J-14', 'J-7'],
  // Scenario A (prices rise while you wait), scenario B (it drops). x in 0..1 along the wait.
  a: [{ x: 0, v: 129 }, { x: 0.3, v: 139 }, { x: 0.62, v: 169 }, { x: 0.95, v: 214 }],
  b: [{ x: 0, v: 129 }, { x: 0.62, v: 119 }],
  beats: { card: 0, wait: 70, waitEnd: 360, stop: 366, rewind: 392, rewindEnd: 436, b: 452, bEnd: 560, works: 586, fork: 650, bet: 690 },
  text: { works: 'Attendre peut fonctionner.', bet: 'Mais c’est un pari.' },
  camera: [] as CameraShot[],
  impacts: [{ at: 366, strength: 1.2 }] as CameraImpact[],
};

import type { CameraShot } from '../camera/CameraRig';

/** Scene 16 — Le vrai produit. */
export const S16 = {
  duration: 760,
  question: 'Que vendent-ils vraiment ?',
  words: [
    { from: 'Billet', to: 'Capacité' },
    { from: 'Chambre', to: 'Temps' },
    { from: 'Siège', to: 'Échéance' },
    { from: 'Nuit', to: '' }, // the night has no new name: it is already time
  ],
  final: ['Capacité limitée', 'À un moment précis'],
  beats: { question: 20, qOut: 150, words: 170, morph: 300, converge: 460, final1: 500, final2: 590 },
  camera: [{ at: 440, move: 'SLOW_PUSH', to: { scale: 1 }, duration: 300 }] as CameraShot[],
  cameraStart: { x: 960, y: 540, scale: 1.14, rotY: 0 }, // the camera slowly moves back to the whole statement
};

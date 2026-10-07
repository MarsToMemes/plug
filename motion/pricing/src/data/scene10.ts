import type { CameraShot } from '../camera/CameraRig';

/** Scene 10 — Le moteur de gestion des revenus. */
export const S10 = {
  duration: 640,
  centre: 'Gestion des revenus',
  inputs: ['Demande', 'Disponibilité', 'Temps', 'Saison', 'Événements', 'Prix des concurrents', 'Données historiques'],
  output: { label: 'Prix', value: 219 },
  beats: { core: 0, inputs: 36, stagger: 22, output: 300, pull: 360, push: 486, value: 500 },
  camera: [
    { at: 360, move: 'PULL_OUT', to: { scale: 0.19 }, duration: 80 }, // the system is one of many: it becomes immense
    { at: 486, move: 'RAPID_PUSH', to: { scale: 2.4, x: 1640, y: 600 }, duration: 14 }, // the revelation: one number comes out
  ] as CameraShot[],
};

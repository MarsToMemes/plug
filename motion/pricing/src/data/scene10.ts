import type { CameraShot } from '../camera/CameraRig';

/**
 * Scene 10 — Le moteur de gestion des revenus. Built on the narration's own timing (3:58.3–4:35.3):
 * each signal reaches the engine when the voice names it.
 */
const v = (sec: number) => Math.round((sec - 238.3) * 30);
export const S10 = {
  duration: v(275.3),
  centre: 'Gestion des revenus',
  question: { at: v(238.5), out: v(242.4), text: 'La demande va-t-elle être forte ?' }, // "comment un système peut-il savoir…"
  inputs: [
    { label: 'Réservations actuelles', at: v(243.6) }, // "il ne regarde pas seulement les réservations actuelles"
    { label: 'Demande observée', at: v(248.0) },
    { label: 'Disponibilité', at: v(250.0) },
    { label: 'Temps avant le départ', at: v(252.7) },
    { label: 'Vacances', at: v(255.6) },
    { label: 'Jours de la semaine', at: v(257.0) },
    { label: 'Événements', at: v(258.4) },
    { label: 'Tendances historiques', at: v(259.4) },
    { label: 'Prix des concurrents', at: v(263.6) },
  ],
  signals: v(246.0), // "énormément de signaux": a field of small signals drifting in
  output: { label: 'Prévision', at: v(267.0) }, // "alimenter des systèmes de prévision"
  goal: { at: v(269.6), text: 'Objectif : pas seulement remplir' }, // "leur objectif n'est pas simplement de remplir…"
  subtle: { at: v(273.2), text: 'C’est plus subtil' },
  beats: { core: v(238.6), pull: v(261.2) }, // "selon les entreprises et les marchés": one engine among many
  camera: [
    { at: v(261.2), move: 'PULL_OUT', to: { scale: 0.19 }, duration: 70 }, // many companies, many markets
    { at: v(265.6), move: 'PUSH_IN', to: { scale: 1 }, duration: 40 }, // back to one engine
  ] as CameraShot[],
};

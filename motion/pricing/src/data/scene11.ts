/** Scene 11 — L'algorithme. Inputs, an analytical engine, a recommended price (illustrative). */
export const S11 = {
  duration: 660,
  inputs: ['1 000 recherches', '120 chambres disponibles', '7 jours restants', 'Demande forte', 'Week-end'],
  // Candidate prices the engine weighs, and where it lands.
  candidates: { from: 149, to: 289, step: 10 },
  recommended: 219,
  beats: { inputs: 10, feed: 100, compute: 130, computeEnd: 360, dist: 230, sharpen: 360, label: 430, price: 456 },
  text: { label: 'Prix recommandé' },
};

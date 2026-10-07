/** Scene 18 — Révélation finale. One continuous pull-back through nested worlds, then the conclusion. */
export const S18 = {
  duration: 980,
  price: 219,
  // Camera scale keys (log-interpolated): price → split → hotel → city → demand → system.
  zoom: [
    { at: 0, s: 9 }, { at: 40, s: 9 }, { at: 110, s: 1.55 }, { at: 170, s: 1.55 }, { at: 250, s: 0.095 }, { at: 300, s: 0.095 },
    { at: 380, s: 0.0042 }, { at: 430, s: 0.0042 }, { at: 510, s: 0.00085 }, { at: 560, s: 0.00085 }, { at: 650, s: 0.00017 },
  ],
  levels: [{ at: 112, label: 'Avion · Hôtel' }, { at: 252, label: 'L’hôtel' }, { at: 382, label: 'La ville' }, { at: 512, label: 'La demande' }, { at: 652, label: 'Le système économique' }],
  system: ['Demande', 'Capacité', 'Temps', 'Concurrence', 'Événements', 'Données historiques'],
  text: { never: 'Le prix n’était jamais|fixe.', time: 'Il réagissait|au temps.', chain: ['Demande', 'Capacité', 'Temps', 'Prix'], plane: 'Avion', hotel: 'Hôtel', price: 'Prix' },
  beats: { never: 680, time: 780, chainAt: 870, hold: 900, black: 930 },
};

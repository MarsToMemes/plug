/** Scene 17 — La machine économique. A 3D system seen in a slow orbit; a loop that keeps running. */
export const S17 = {
  duration: 920,
  inputs: ['Demande', 'Capacité', 'Temps', 'Concurrence', 'Événements', 'Données historiques'],
  loop: { bookings: 'Réservations', availability: 'Disponibilité ↓', price: 'Prix' },
  legend: ['Prix → réservations', 'Réservations → disponibilité ↓', 'Disponibilité ↓ → prix ↑'],
  start: { price: 219, available: 42 }, perLoop: { price: 5, available: -4 }, loopFrames: 120,
  orbit: { from: 0.35, speed: 0.0024, tilt: 0.62, distance: 1900 },
  beats: { core: 0, inputs: 40, stagger: 24, loop: [250, 310, 370], run: 410 },
};

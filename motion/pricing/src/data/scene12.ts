/** Scene 12 — Le week-end. Demand per day (0..1) and the price that follows it (illustrative). */
export const S12 = {
  duration: 780,
  days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  demand: [0.24, 0.21, 0.26, 0.3, 0.62, 0.96, 0.42],
  price: [119, 115, 119, 125, 169, 239, 145],
  beats: { axis: 0, sweep: 54, sweepEnd: 354, reveal: 386, sweep2: 450, sweep2End: 640, message: 664 },
  text: { demand: 'Demande', price: 'Prix', message: 'La demande change. Le prix s’adapte.', room: 'Même chambre' },
};

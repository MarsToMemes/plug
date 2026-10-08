/**
 * Scene 15 — L'horloge (narration 8:45.5–9:13.9). Built on the narration's own timing:
 * scene frame = (voice second - 525.5) * 30. Every visual beat is the word that says it.
 */
export const S15_FROM = 525.5, S15_TO = 553.9;
export const S15 = {
  duration: Math.round((S15_TO - S15_FROM) * 30),
  // Karaoke subtitle, two lines per idea: [line 1 from, line 2 from, idea end] (voice seconds).
  lines: [[525.5, 527.2, 529.45], [529.5, 532.5, 535.75], [535.8, 537.95, 540.0], [540.05, 542.35, 545.5], [545.6, 548.7, 550.8], [550.85, 0, S15_TO]] as Array<[number, number, number]>,
  accent: ['capacité', 'limitée', 'disparaissent', 'rien', 'revenu', 'horloge', 'pression', 'prix'],
  t: {
    plane: 525.6, together: 526.3, airlines: 527.48, hotels: 528.86,
    capacity: 530.94, moment: 532.88, vanish: 534.9,
    seat: 535.9, takeoff: 537.3, nothing: 538.72,
    room: 540.05, midnight: 541.78, revenue: 543.8,
    clock: 545.3, words: [545.96, 547.16, 548.0], advance: 549.64,
    pressure: 552.48, price: 551.9,
  },
  text: { airlines: 'Compagnies aériennes', hotels: 'Hôtels', departure: 'Départ 18:40', night: 'Nuit du 14', words: ['Départ', 'Nuit', 'Réservation'] },
  prices: { seat: 79, room: 129, from: 129, to: 219 },
};

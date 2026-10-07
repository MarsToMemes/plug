/**
 * Scene 19 — Deux avions (narration 4:35–5:10). Same aircraft, same 180 seats: one full of cheap
 * fares, one 85 % full with many dear ones. Revenue bars without figures: only the comparison.
 * Beats are in frames from the start of the passage.
 */
export const S19 = {
  duration: 1065,
  seats: 180, fullA: 180, fullB: 153, dearShareB: 0.45,
  fares: { low: 89, high: 259 }, // relative revenue only (bars), never shown as numbers
  beats: { cabins: 17, fillA: 72, fillAEnd: 114, cheap: 141, fillB: 243, fillBEnd: 291, dear: 330, dearEnd: 435, question: 455, bars: 470, verdict: 560, any: 714, value: 843, flow: 860, rm: 970 },
  text: { a: 'Avion A', b: 'Avion B', fullA: 'Rempli à 100 %', fullB: 'Rempli à 85 %', low: 'Tarif bas', high: 'Tarif élevé', revenue: 'Revenus', question: 'Lequel a généré|le plus de revenus ?', verdict: 'Le taux de remplissage|ne suffit pas', value: 'Optimiser la valeur|de tous les sièges', any: 'Chaque siège occupé, à n’importe quel prix', rm: 'La logique du|Revenue Management' },
};

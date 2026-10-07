import { flight } from './entities';

/** Scene 07 — Les catégories tarifaires. Seats per fare class (sum = capacity) and sales windows. */
// From frame 540 (voice 2:34.4) the scene runs on the narration's own timing: v(second) -> frame.
const v = (sec: number) => Math.round(540 + (sec - 154.4) * 30);
export const S07 = {
  duration: v(203.9) + 1,
  seats: flight.seats,
  fares: [
    { price: 79, seats: 24, sell: [110, 200] },
    { price: 109, seats: 36, sell: [232, 330] },
    { price: 149, seats: 42, sell: [362, 470] },
    { price: 219, seats: 42, sell: [502, 620], sold: 18 }, // still open at the end
    { price: 349, seats: 36 },
  ] as Array<{ price: number; seats: number; sell?: [number, number]; sold?: number }>,
  beats: { cabin: 0, fares: 48, message: 640 },
  close: 34, // frames for a sold-out level to close
  text: { open: 'Tarif ouvert', message: 'Les tarifs les moins chers disparaissent en premier', seats: 'sièges' },
  // The second half, on the voice: the seat does not change, only the price of access to it.
  more: v(155.3), // "puis éventuellement beaucoup plus" -> the 349 level
  seat: { at: v(158.3), index: 64, text: 'Le siège ne change pas' }, // "la compagnie ne change pas le siège"
  rest: { at: v(162.5), text: 'Le prix des sièges restants change' }, // "elle change le prix… des sièges restants"
  layers: {
    at: v(169.3), // "imaginer l'avion comme plusieurs couches de prix"
    show: [v(172.5), v(173.9), v(175.3), v(176.6), v(178.1)], // 79, 109, 149, 219, 349 on their words
    oneSeat: v(180.3), links: v(181.2), // "pas forcément 5 sièges différents"
    rules: v(184.5), avail: v(187.5), // "conditions tarifaires", "niveaux de disponibilité"
    conditions: ['Sans bagage · non remboursable', 'Bagage cabine', 'Bagage en soute', 'Modifiable', 'Flexible · remboursable'],
    soldOut: v(190.8), closed: v(191.7), next: v(193.2), // "épuisées ou fermées, le système propose les suivantes"
  },
  pair: {
    at: v(195.6), // "deux personnes assises l'une à côté de l'autre"
    paid: [v(198.8), v(199.5)], prices: [79, 349], // "peuvent avoir payé des prix très différents"
    trip: v(201.6), same: v(202.6), // "le même trajet"
    text: { trip: 'Paris → New York', same: 'Même trajet' },
  },
};

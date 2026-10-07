import { flight } from './entities';

/** Scene 07 — Les catégories tarifaires. Seats per fare class (sum = capacity) and sales windows. */
export const S07 = {
  duration: 780,
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
};

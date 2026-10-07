/**
 * Reference data for the film. Illustrative figures, not observed fares: they show the mechanism.
 * Components never contain numbers: scenes read them from here.
 */
export const flight = {
  route: { from: 'Paris', to: 'New York' },
  seats: 180,
  availableSeats: 42,
  unsoldAtDeparture: 9, // seats still empty when the doors close
  price: 219,
  layout: [3, 3],
  fareBuckets: [
    { code: 'Q', price: 219, open: false },
    { code: 'V', price: 287, open: false },
    { code: 'L', price: 341, open: false },
    { code: 'M', price: 412, open: true },
    { code: 'H', price: 476, open: true },
    { code: 'Y', price: 612, open: true },
  ],
};

export const hotel = {
  name: 'Hotel — New York',
  rooms: 200,
  availableRooms: 17,
  price: 249,
  perFloor: 20,
};

/** Inputs of the pricing system, in the order they appear around the centre. */
export const pricingInputs = ['Demande', 'Places restantes', 'Date de départ', 'Concurrence', 'Historique', 'Événements', 'Saison', 'Canal de vente'];

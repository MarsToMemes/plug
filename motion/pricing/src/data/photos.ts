import type { Shot } from '../photo/Photos';

/**
 * Real photographs cut into the episode on the words (voice seconds, voice/transcript.json).
 * Sources and licences: public/photos/CREDITS.md. focus = the point the slow push keeps fixed (%).
 */
export const PHOTO_SHOTS: Shot[] = [
  { src: 'smartphone-in-hand-02.jpg', from: 0.0, to: 2.4, focus: [42, 55] }, // "Vous l'avez probablement déjà vécu"
  { src: 'airplane-cabin-seats-01.jpg', from: 35.05, to: 35.9, focus: [45, 50] }, // "des sièges"
  { src: 'hotel-corridor-01.jpg', from: 37.4, to: 38.25, focus: [70, 50] }, // "des chambres"
  { src: 'airbus-a320-takeoff-02.jpg', from: 52.7, to: 53.6, focus: [55, 55], push: 0.1 }, // "décollé"
  { src: 'hotel-corridor-02.jpg', from: 75.8, to: 77.3, focus: [50, 45] }, // "la nuit est définitivement perdue"
  // "Vacances scolaires, week-end, fêtes, événements sportifs, congrès": one image per word.
  { src: 'train-station-crowd-01.jpg', from: 442.8, to: 443.68, focus: [60, 70] },
  { src: 'crowded-beach-summer-03.jpg', from: 443.68, to: 444.7, focus: [50, 40] },
  { src: 'airport-check-in-queue-01.jpg', from: 444.7, to: 445.72, focus: [40, 70] },
  { src: 'christmas-market-02.jpg', from: 445.72, to: 446.46, focus: [55, 55] },
  { src: 'stadium-crowd-01.jpg', from: 446.46, to: 447.86, focus: [40, 60] },
  { src: 'conference-hall-audience-02.jpg', from: 447.86, to: 448.45, focus: [50, 50] },
  { src: 'airport-check-in-queue-04.jpg', from: 590.2, to: 591.45, focus: [50, 20] }, // "à un moment précis"
];

import type { CameraShot } from '../camera/CameraRig';

/**
 * Scene 09 — La demande. One driver, the pressure on the inventory (0..1); demand, availability
 * and price are all read from it, so the three indicators can only move together.
 */
export const S09 = {
  duration: 760,
  rooms: 120, cols: 12,
  // Strong demand first (low fares close), then the opposite: weak demand, more attractive prices.
  pressure: [{ at: 0, p: 0.08 }, { at: 280, p: 0.1 }, { at: 560, p: 0.92 }, { at: 640, p: 0.92 }, { at: 760, p: 0.3 }],
  demand: { min: 6, max: 280 }, // client points on screen
  availability: { keepAtMax: 0.12 }, // share of rooms left at full pressure
  price: { low: 129, high: 279 },
  beats: { layout: 0, calm: 70, calmOut: 270, gauges: 300 },
  text: { demand: 'Demande', rooms: 'Chambres disponibles', price: 'Prix', calm1: 'Demande faible', calm2: 'Prix stable', avail: 'Disponibilité' },
  camera: [{ at: 290, move: 'SLOW_PUSH', to: { scale: 1.04 }, duration: 270 }] as CameraShot[], // pressure builds
};

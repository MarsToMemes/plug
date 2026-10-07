import type { PriceStep } from '../components/price';
import type { CameraShot } from '../camera/CameraRig';

/**
 * Scene 01 — Le prix qui change. Built on the narration's own timing (0:00–0:27.3): every beat is
 * the second where the voice says it (voice/transcript.json), as a frame at 30 fps.
 */
const s = (sec: number) => Math.round(sec * 30);
export const S01 = {
  duration: s(27.3),
  beats: {
    route: s(1.0), price: s(4.4), // "vous cherchez un billet d'avion, 287 euros"
    close: s(6.3), later: s(7.9), back: s(9.2), // "vous fermez l'application… quelques heures plus tard, vous revenez"
    nextDay: s(12.0), // "le lendemain"
    same: s(14.8), plane: s(16.0), seat: s(17.7), trip: s(19.7), // "l'avion… le siège… le trajet"
    out: s(21.0), why: s(21.6), who: s(24.4), // "pourquoi le prix, lui, change-t-il ? … qui décide de ce prix ?"
    ring: s(26.7), // the question closes into the ring that becomes the aircraft (bridge 01 → 02)
  },
  route: { from: 'Paris', to: 'New York' },
  flight: [{ at: 0, value: 287 }, { at: s(10.22), value: 341 }, { at: s(13.34), value: 476 }] as PriceStep[],
  text: { later: 'Quelques heures plus tard', nextDay: 'Le lendemain', plane: 'Même avion', seat: 'Même siège', trip: 'Même trajet', why: 'Pourquoi le prix|change-t-il ?', who: 'Qui décide|de ce prix ?' },
  camera: [
    { at: s(10.22), move: 'SLOW_PUSH', to: { scale: 1.06 }, duration: s(4) }, // analytical: the price is moving
    { at: s(14.8), move: 'PULL_OUT', to: { scale: 1 } }, // step back: everything else around the price
  ] as CameraShot[],
};

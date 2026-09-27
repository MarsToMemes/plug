import type { PhotoKey } from '../../media/catalog';

// Demo footage for the hero. Swap `photo` (a key of media/catalog.ts) to change the assets.
export interface DemoClip { id: string; label: string; dur: string; score: string; photo: PhotoKey }

export const DEMO_CLIPS: DemoClip[] = [
  { id: 'tokyo', label: 'TOKYO', dur: '00:42', score: '0.97', photo: 'tokyo' },
  { id: 'walk', label: 'SHIBUYA WALK', dur: '00:27', score: '0.91', photo: 'walk' },
  { id: 'food', label: 'RAMEN', dur: '00:15', score: '0.88', photo: 'food' },
  { id: 'city', label: 'CITY NIGHT', dur: '01:18', score: '0.93', photo: 'city' },
  { id: 'temple', label: 'TEMPLE', dur: '00:33', score: '0.62', photo: 'temple' }
];

/** Card order (tokyo, walk, food, city, temple) → timeline slot; -1 = rejected shot. */
export const HERO_SLOT = [0, 2, 1, 3, -1];
/** Timeline slots [left %, width %]: tokyo, food, walk, city. */
export const HERO_CL: [number, number][] = [[0, 24], [24, 18], [42, 22], [64, 36]];
/** Clip ids in timeline order. */
export const HERO_TIMELINE = ['tokyo', 'food', 'walk', 'city'];

/** Deterministic waveform heights shared by both home demos. */
export const WAVE_BARS = (() => {
  let sd = 11;
  return Array.from({ length: 80 }, (_, i) => {
    sd = (sd * 9301 + 49297) % 233280;
    return Math.round(22 + (sd % 70) * (0.6 + 0.4 * Math.sin(i / 5))) + '%';
  });
})();

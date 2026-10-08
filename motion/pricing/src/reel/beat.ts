/**
 * Tempo grid of the reel language (skill motion-reel-techniques): every cut and accent lands on
 * the music. "Subtle Shifts" measured at 120 BPM (beat = 0.5 s), first beat at 0.42 s of the mix.
 * Times are seconds of the voice/mix (the episode starts the music at 0).
 */
export const TEMPO = { bpm: 120, first: 0.42 };
export const BEAT = 60 / TEMPO.bpm;

/** Time of beat n (n can be fractional: 0.5 = half beat). */
export const beat = (n: number) => TEMPO.first + n * BEAT;

/**
 * The grid time for a word said at `sec`: the nearest half beat if it is within `tol` of the word
 * (the eye reads the hit as "on the word"), otherwise the word itself (the voice always wins).
 */
export function hit(sec: number, tol = 0.13) {
  const n = Math.round((sec - TEMPO.first) / (BEAT / 2));
  const g = TEMPO.first + n * (BEAT / 2);
  return Math.abs(g - sec) <= tol ? g : sec;
}

/** Beat index (0-based) and bar (4 beats) at time t. */
export const beatAt = (t: number) => Math.floor((t - TEMPO.first) / BEAT);
export const barAt = (t: number) => Math.floor(beatAt(t) / 4);

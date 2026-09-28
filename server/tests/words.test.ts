import { describe, expect, it } from 'vitest';
import { alignKnownText, wordsFromAlignment, wordsFromStt } from '../src/words.ts';

describe('wordsFromAlignment', () => {
  it('groups characters into words and shifts them', () => {
    const chars = [...'Il a dit.'];
    const starts = chars.map((_, i) => i * 0.1);
    const ends = chars.map((_, i) => i * 0.1 + 0.1);
    expect(wordsFromAlignment({ characters: chars, character_start_times_seconds: starts, character_end_times_seconds: ends }, 1000)).toEqual([
      { text: 'Il', startMs: 1000, endMs: 1200 },
      { text: 'a', startMs: 1300, endMs: 1400 },
      { text: 'dit.', startMs: 1500, endMs: 1900 },
    ]);
  });
});

describe('wordsFromStt', () => {
  it('keeps words only, in milliseconds', () => {
    expect(
      wordsFromStt([
        { text: 'Bonjour', start: 0.1, end: 0.5, type: 'word' },
        { text: ' ', start: 0.5, end: 0.6, type: 'spacing' },
        { text: '(rires)', start: 0.6, end: 1, type: 'audio_event' },
        { text: 'monde', start: 1.02, end: 1.4 },
      ]),
    ).toEqual([
      { text: 'Bonjour', startMs: 100, endMs: 500 },
      { text: 'monde', startMs: 1020, endMs: 1400 },
    ]);
  });
});

describe('alignKnownText', () => {
  /** Synthetic voice: bursts of noise (speech) separated by silences. */
  function voice(segments: Array<[number, number]>, totalMs: number): Int16Array {
    const pcm = new Int16Array(Math.round((totalMs / 1000) * 16000));
    let seed = 1;
    for (const [a, b] of segments) {
      for (let i = Math.round((a / 1000) * 16000); i < Math.round((b / 1000) * 16000); i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        pcm[i] = ((seed % 20000) - 10000) | 0;
      }
    }
    return pcm;
  }

  it('puts each sentence on its stretch of speech', () => {
    const pcm = voice([[200, 1200], [1700, 2900]], 3200);
    const words = alignKnownText(pcm, 'Première phrase ici. Deuxième phrase un peu plus longue.');
    expect(words).toHaveLength(9);
    expect(words[0]!.startMs).toBeGreaterThanOrEqual(190);
    expect(words[0]!.startMs).toBeLessThanOrEqual(220);
    // The first sentence ends in the pause, the second starts after it.
    expect(words[2]!.endMs).toBeLessThanOrEqual(1250);
    expect(words[3]!.startMs).toBeGreaterThanOrEqual(1650);
    expect(words[8]!.endMs).toBeLessThanOrEqual(2950);
    for (let i = 1; i < words.length; i++) expect(words[i]!.startMs).toBeGreaterThanOrEqual(words[i - 1]!.startMs);
  });

  it('returns nothing for silence or an empty text', () => {
    expect(alignKnownText(new Int16Array(16000), 'Bonjour.')).toEqual([]);
    expect(alignKnownText(voice([[0, 500]], 600), '  ')).toEqual([]);
  });
});

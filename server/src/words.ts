/**
 * Word timings of the narration (`[{ text, startMs, endMs }]`, milliseconds of
 * the voice file), from three sources:
 * - ElevenLabs text-to-speech with timestamps (character alignment);
 * - ElevenLabs speech-to-text (word timestamps);
 * - a local alignment of the known script on the voice, without speech
 *   recognition (±100–150 ms per word), when no key is configured.
 */
import type { TranscriptWord } from './engine.ts';

export interface CharAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

/** Characters with their times → words (split on whitespace), shifted by `offsetMs`. */
export function wordsFromAlignment(alignment: CharAlignment, offsetMs = 0): TranscriptWord[] {
  const words: TranscriptWord[] = [];
  let text = '';
  let start = 0;
  let end = 0;
  const flush = () => {
    if (text) words.push({ text, startMs: Math.round(offsetMs + start * 1000), endMs: Math.round(offsetMs + end * 1000) });
    text = '';
  };
  alignment.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) return flush();
    if (!text) start = alignment.character_start_times_seconds[i] ?? end;
    text += ch;
    end = alignment.character_end_times_seconds[i] ?? start;
  });
  flush();
  return words;
}

export interface SttWord {
  text: string;
  start: number;
  end: number;
  type?: string;
}

/** ElevenLabs speech-to-text words (seconds) → transcript words; spacing and audio events are dropped. */
export function wordsFromStt(words: readonly SttWord[]): TranscriptWord[] {
  return words
    .filter((w) => (w.type ?? 'word') === 'word' && w.text.trim())
    .map((w) => ({ text: w.text.trim(), startMs: Math.round(w.start * 1000), endMs: Math.round(w.end * 1000) }));
}

const syllables = (w: string) =>
  Math.max(1, (w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '').match(/[aeiouy]+/g) ?? []).length) + 0.3;

/**
 * Aligns a KNOWN text on a clean voice recording (mono 16 kHz, 16-bit PCM
 * samples), without speech recognition. Pauses in the audio are matched to
 * the punctuation of the text by dynamic programming, then the words of each
 * phrase are spread over its speech by syllable count.
 *
 * Adapted from studio-engine `episodes/mcdonalds-30s/align.mjs`.
 */
export function alignKnownText(pcm: Int16Array, text: string, sampleRate = 16000): TranscriptWord[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length || !pcm.length) return [];
  const hop = Math.round(sampleRate / 100); // 10 ms frames
  const db: number[] = [];
  for (let f = 0; f * hop < pcm.length; f++) {
    let s = 0;
    const end = Math.min(pcm.length, (f + 1) * hop);
    for (let i = f * hop; i < end; i++) {
      const v = pcm[i]! / 32768;
      s += v * v;
    }
    db.push(10 * Math.log10(s / (end - f * hop) + 1e-12));
  }
  const peak = Math.max(...db);
  const thr = Math.max(-50, peak - 38);
  // Speech runs, merging holes under 60 ms (stops inside words).
  const merged: Array<[number, number]> = [];
  let start = -1;
  const pushRun = (a: number, b: number) => {
    const last = merged[merged.length - 1];
    if (last && a - last[1] < 6) last[1] = b;
    else merged.push([a, b]);
  };
  db.forEach((v, i) => {
    if (v > thr && start < 0) start = i;
    if (v <= thr && start >= 0) {
      pushRun(start, i);
      start = -1;
    }
  });
  if (start >= 0) pushRun(start, db.length);
  if (!merged.length) return [];
  // Pauses between speech runs (at least 90 ms).
  const gaps: Array<{ from: number; to: number }> = [];
  for (let i = 1; i < merged.length; i++) if (merged[i]![0] - merged[i - 1]![1] >= 9) gaps.push({ from: merged[i - 1]![1], to: merged[i]![0] });
  const speechStart = merged[0]![0];
  const speechEnd = merged[merged.length - 1]![1];

  // Phrases end at . , : ; ! ? …
  const phrases: number[][] = [];
  let cur: number[] = [];
  words.forEach((w, i) => {
    cur.push(i);
    if (/[.,:;!?…]["»”)]*$/.test(w)) {
      phrases.push(cur);
      cur = [];
    }
  });
  if (cur.length) phrases.push(cur);
  const weight = phrases.map((p) => p.reduce((s, i) => s + syllables(words[i]!), 0));
  const total = weight.reduce((a, b) => a + b, 0);
  const voiced = merged.reduce((s, r) => s + r[1] - r[0], 0);
  const expected: number[] = [];
  let acc = 0;
  for (let k = 0; k < phrases.length - 1; k++) {
    acc += weight[k]!;
    expected.push(acc / total);
  }
  const atFraction = (x: number) => {
    let need = x * voiced;
    for (const r of merged) {
      const len = r[1] - r[0];
      if (need <= len) return r[0] + need;
      need -= len;
    }
    return speechEnd;
  };

  // Each phrase boundary takes a distinct pause, in order, or none.
  const m = expected.length;
  const G = gaps.length;
  const cost = (k: number, g: number) => Math.abs((gaps[g]!.from + gaps[g]!.to) / 2 - atFraction(expected[k]!)) / 100 - (gaps[g]!.to - gaps[g]!.from) / 300;
  const strong = /[.:;!?…]["»”)]*$/;
  const best = Array.from({ length: m + 1 }, () => new Array<number>(G + 1).fill(Infinity));
  const back = Array.from({ length: m + 1 }, () => new Array<{ g: number; used: number } | null>(G + 1).fill(null));
  best[0]!.fill(0);
  for (let k = 1; k <= m; k++) {
    const phrase = phrases[k - 1]!;
    const lastWord = words[phrase[phrase.length - 1]!]!;
    for (let g = 0; g <= G; g++) {
      const skip = best[k - 1]![g]! + (strong.test(lastWord) ? 1.5 : 0.25);
      if (skip < best[k]![g]!) {
        best[k]![g] = skip;
        back[k]![g] = { g, used: -1 };
      }
      for (let h = 0; h < g; h++) {
        const c = best[k - 1]![h]! + cost(k - 1, g - 1) + (g - 1 - h) * 0.15;
        if (c < best[k]![g]!) {
          best[k]![g] = c;
          back[k]![g] = { g: h, used: g - 1 };
        }
      }
    }
  }
  let g = best[m]!.indexOf(Math.min(...best[m]!));
  const bound: Array<{ from: number; to: number } | null> = new Array(m).fill(null);
  for (let k = m; k > 0; k--) {
    const b = back[k]![g]!;
    bound[k - 1] = b.used >= 0 ? gaps[b.used]! : null;
    g = b.g;
  }

  const out: TranscriptWord[] = [];
  let spanStart = speechStart;
  phrases.forEach((p, k) => {
    const gap = k < m ? bound[k] : null;
    const spanEnd = k < m ? (gap ? gap.from : Math.round(atFraction(expected[k]!))) : speechEnd;
    const next = gap ? gap.to : spanEnd;
    const w = p.map((i) => syllables(words[i]!));
    const sum = w.reduce((a, b) => a + b, 0);
    let t = spanStart;
    p.forEach((i, j) => {
      const len = ((spanEnd - spanStart) * w[j]!) / sum;
      out.push({ text: words[i]!, startMs: Math.round(t * 10), endMs: Math.round((t + len) * 10) });
      t += len;
    });
    spanStart = next;
  });
  return out;
}

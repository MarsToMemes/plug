import React from 'react';
import transcript from '../../voice/transcript.json';
import { measure, type TextStyle } from '../layout/measure';
import { THEME, clamp01 } from '../theme';

/**
 * Word timings of the voice (Whisper), and the ghost-then-lit line (skill word-synced-motion, W1).
 */
export type W = { w: string; s: number; e: number };
const WORDS: W[] = (transcript as { segments: Array<{ words: W[] }> }).segments.flatMap((x) => x.words);

/** The words said between two voice seconds, apostrophes and hyphens glued back to their word. */
export function wordsBetween(a: number, b: number): W[] {
  const out: W[] = [];
  for (const w of WORDS) {
    if (w.s < a || w.s >= b) continue;
    const text = w.w.trim();
    if (out.length && /^['’-]/.test(text)) { const last = out[out.length - 1]!; last.w += text; last.e = w.e; }
    else if (out.length && /^[?!:;]$/.test(text)) out[out.length - 1]!.w += ` ${text}`;
    else out.push({ w: text, s: w.s, e: w.e });
  }
  return out;
}

/**
 * The line is laid out at once in a ghost tone; each word lights at the moment it is said,
 * letter by letter over its duration. Accent words light in orange. Centred on (cx, baseline).
 */
export const KaraokeLine: React.FC<{ t: number; from: number; to: number; cx: number; baseline: number; style: TextStyle; accent?: string[]; ink?: string; ghost?: number; fade?: [number, number] }> = ({ t, from, to, cx, baseline, style, accent = [], ink = THEME.ink, ghost = 0.16, fade }) => {
  const words = wordsBetween(from, to);
  const line = words.map((w) => w.w).join(' ');
  const m = measure(line, style);
  const space = measure(' ', style).advance;
  let x = cx - (m.inkLeft + m.inkRight) / 2;
  const o = fade ? clamp01((t - fade[0]) / 0.3) * (1 - clamp01((t - fade[1]) / 0.3)) : 1;
  return (
    <g opacity={o}>
      {words.map((w, i) => {
        const adv = measure(w.w, style).advance;
        const x0 = x; x += adv + space;
        const lit = clamp01((t - w.s) / Math.max(0.08, w.e - w.s));
        const isAccent = accent.some((a) => w.w.toLowerCase().includes(a));
        const n = Math.round([...w.w].length * lit);
        const font = { fontFamily: style.font === 'serif' ? THEME.serif : style.font === 'mono' ? THEME.mono : THEME.sans, fontStyle: style.italic ? 'italic' : 'normal', fontWeight: style.weight ?? 400, fontSize: style.size } as const;
        return (
          <g key={i}>
            <text x={x0} y={baseline} {...font} fill={ink} opacity={ghost}>{w.w}</text>
            {n > 0 && <text x={x0} y={baseline} {...font} fill={isAccent ? THEME.accent : ink}>{[...w.w].slice(0, n).join('')}</text>}
          </g>
        );
      })}
    </g>
  );
};

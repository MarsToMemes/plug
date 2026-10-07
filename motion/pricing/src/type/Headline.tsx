import React from 'react';
import { SAFE, SPACE } from '../layout/grid';
import { measure, type TextStyle } from '../layout/measure';
import { chooseMotion } from '../motion/choose';
import type { PresetName } from '../motion/presets';
import { Typo } from '../motion/Typo';
import { C, ClockContext, phases } from '../motion/time';
import { THEME } from '../theme';
import { useElapsed } from './clock';

/**
 * Headline — the episode's big editorial titles.
 *
 * 1. COMPOSITION first: the text is measured (real ink), its lines chosen by meaning ("|" marks
 *    the acceptable breaks), fitted to the safe width (reflow before shrinking), stacked on a
 *    strict rhythm and kept inside the safe area.
 * 2. Then MOTION: the focal line(s) take the preset that fits their meaning (chooseMotion) and
 *    arrive last, the other lines take a quieter entrance first. Exit: faster than the entry.
 * 3. REAL TIME: a title runs in milliseconds of the film, even when its scene is stretched on
 *    the voice.
 *
 * Typography: roman lines in Instrument Serif capitals; focal lines in Instrument Serif italic,
 * sentence case (the editorial accent), in the accent colour when given.
 */
export type HeadlineProps = {
  text: string;
  at: number; // scene frame
  out?: number; // scene frame
  top?: number; // top of the block (px)
  size?: number;
  color?: string;
  accent?: string;
  focus?: number[];
  layout?: 'inline' | 'stack';
  align?: 'center' | 'left';
  motion?: PresetName; // force the focal preset
  quiet?: PresetName; // preset of the non-focal lines
  upper?: boolean;
  font?: 'serif' | 'sans' | 'mono';
  tracking?: number;
  speed?: number;
};

type Line = { text: string; focus: boolean; style: TextStyle };

/**
 * Lines by meaning. Inline: consecutive blocks of the same kind (roman / focal) form runs shown
 * side by side on ONE row, if the row fits the safe width. Otherwise one block per line.
 * Only if no arrangement fits is the size reduced (last resort).
 */
function compose(blocks: string[], focus: Set<number>, layout: 'inline' | 'stack', base: TextStyle): { lines: Line[]; row: boolean } {
  const styleOf = (f: boolean, s: TextStyle): TextStyle => (f ? { ...s, italic: s.font === 'serif', upper: s.font === 'serif' ? false : s.upper } : s);
  const lineOf = (idx: number[], s: TextStyle): Line => { const f = focus.has(idx[0]!); return { text: idx.map((i) => blocks[i]).join(' '), focus: f, style: styleOf(f, s) }; };
  const w = (l: Line) => measure(l.text, l.style).inkWidth;
  let size = base.size;
  for (let k = 0; k < 8; k++) {
    const s = { ...base, size };
    if (layout === 'inline') {
      const runs: number[][] = [];
      blocks.forEach((_, i) => { const last = runs[runs.length - 1]; if (last && focus.has(last[0]!) === focus.has(i)) last.push(i); else runs.push([i]); });
      const row = runs.map((r) => lineOf(r, s));
      if (row.reduce((a, l) => a + w(l), 0) + SPACE.xl * (row.length - 1) <= SAFE.width) return { lines: row, row: true };
    }
    const stack = blocks.map((_, i) => lineOf([i], s));
    if (stack.every((l) => w(l) <= SAFE.width)) return { lines: stack, row: false };
    size = Math.round(size * 0.92);
  }
  return { lines: blocks.map((_, i) => lineOf([i], { ...base, size })), row: false };
}

export const Headline: React.FC<HeadlineProps> = ({ text, at, out, top = 900, size = 68, color = THEME.ink, accent, focus = [], layout = 'inline', align = 'center', motion, quiet, upper = true, font = 'serif', tracking = 0.02, speed = 1 }) => {
  const since = useElapsed();
  const e = since(at);
  const eo = out === undefined ? -1 : since(out);
  if (e < -50 || eo > 700) return null;

  const blocks = text.split('|').map((b) => b.trim());
  const fset = new Set(focus);
  const base: TextStyle = { size, font, weight: font === 'serif' ? 400 : 400, tracking, upper };
  const { lines, row: inlineRow } = compose(blocks, fset, layout, base);
  const placed: Array<{ line: Line; x: number; baseline: number }> = [];
  if (inlineRow) {
    const ws = lines.map((l) => measure(l.text, l.style));
    const total = ws.reduce((a, m) => a + m.inkWidth, 0) + SPACE.xl * (lines.length - 1);
    let x = align === 'center' ? 960 - total / 2 : SAFE.left;
    const cap = Math.max(...ws.map((m) => m.capAscent));
    const baseline = top + cap * 1.12;
    lines.forEach((l, k) => { placed.push({ line: l, x: x - ws[k]!.inkLeft, baseline }); x += ws[k]!.inkWidth + SPACE.xl; });
  } else {
    let baseline = top;
    lines.forEach((l, k) => {
      const m = measure(l.text, l.style);
      baseline += (k === 0 ? m.capAscent * 1.12 : SPACE.m + m.capAscent + measure(lines[k - 1]!.text, lines[k - 1]!.style).descent * 0.5);
      const x = align === 'center' ? 960 - (m.inkLeft + m.inkRight) / 2 : SAFE.left - m.inkLeft;
      placed.push({ line: l, x, baseline });
    });
  }
  // Keep the block inside the safe area (move it, never shrink it here).
  // Clamp on the line boxes (ink + the font's ascent/descent space), with a small optical tolerance.
  const topBox = Math.min(...placed.map((p) => p.baseline - measure(p.line.text, p.line.style).fontAscent));
  const bottomBox = Math.max(...placed.map((p) => p.baseline + measure(p.line.text, p.line.style).fontDescent));
  const dy = bottomBox > SAFE.bottom + 12 ? SAFE.bottom + 12 - bottomBox : topBox < SAFE.top - 12 ? SAFE.top - 12 - topBox : 0;

  // Motion: focal lines get the contextual preset, the others a quiet entrance; focal lines last.
  const hero = motion ?? chooseMotion(lines.filter((l) => l.focus).map((l) => l.text).join(' ') || text.replace(/\|/g, ' ')).preset;
  const calm: PresetName = quiet ?? (/\?$/.test(text) ? 'TYPO_FOCUS' : 'TYPO_MASK');
  const order = [...placed.keys()].sort((a, b) => Number(placed[a]!.line.focus) - Number(placed[b]!.line.focus));
  const hasFocus = placed.some((p) => p.line.focus);

  return (
    <ClockContext.Provider value={e}>
      {placed.map((p, k) => {
        const rank = order.indexOf(k);
        const preset = !hasFocus ? hero : p.line.focus ? hero : calm;
        const start = rank * 140 * speed + (p.line.focus && hasFocus ? 60 : 0);
        const exitK = eo < 0 ? 0 : phases(eo, rank * 40, 0, [[300, 1, C.exit]]);
        return (
          <Typo key={k} text={p.line.text} preset={preset} params={{ at: start, speed, mode: inlineRow && placed.length > 1 ? 'fixed' : '' }}
            pen={{ x: p.x, baseline: p.baseline + dy }} size={p.line.style.size} font={p.line.style.font} weight={p.line.style.weight}
            tracking={p.line.style.tracking} italic={p.line.style.italic} upper={p.line.style.upper !== false}
            color={p.line.focus && accent ? accent : color}
            over={{ o: 1 - exitK, y: -0.14 * exitK, blur: 8 * exitK }} />
        );
      })}
    </ClockContext.Provider>
  );
};

/** The former title families, mapped onto the motion library (the intent of each title is kept). */
export const FAMILY_PRESET: Record<string, PresetName> = {
  TITLE_REVEAL: 'TYPO_REVEAL', TITLE_SLIDE: 'TYPO_PUSH', TITLE_SCALE: 'TYPO_STRETCH', TITLE_MASK: 'TYPO_MASK',
  TITLE_SPLIT: 'TYPO_SLAM', TITLE_COLLISION: 'TYPO_COLLISION', TITLE_PUSH: 'TYPO_WHIP', TITLE_FOCUS: 'TYPO_FOCUS',
  TITLE_MORPH: 'TYPO_MORPH', TITLE_REVEAL_SLOW: 'TYPO_PULL', TITLE_IMPACT: 'TYPO_IMPACT',
};

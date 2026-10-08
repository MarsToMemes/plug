import React from 'react';
import { SAFE } from '../layout/grid';
import { measure, type TextStyle } from '../layout/measure';
import { C, clamp, mix } from '../motion/time';
import { THEME } from '../theme';

/**
 * A big word of the reel language, letter by letter (skill motion-reel-techniques, T3/T4/T10).
 *
 * Composition first: the word is measured on the real font (letter pens from the advances of
 * its prefixes, so kerning is kept), fitted to the safe width, centred on its ink and on the cap
 * height (optical centre). Then motion: each letter has its own entry, staggered, and a motion
 * blur that follows its real velocity (directional: a horizontal slam smears horizontally only),
 * gone the instant the letter stops.
 */
export type Entry = 'slamR' | 'slamL' | 'drop' | 'rise' | 'linear' | 'type' | 'pop';
export type WordProps = {
  text: string;
  t: number; // now (s)
  at: number; // entry start (s)
  size: number;
  font?: 'wide' | 'serif' | 'mono' | 'sans';
  italic?: boolean;
  weight?: number;
  color?: string;
  outline?: boolean;
  cx?: number;
  cy?: number; // optical centre (cap height) of the line
  align?: 'center' | 'left';
  left?: number;
  entry?: Entry;
  stagger?: number; // s between letters
  dur?: number; // s of one letter's entry
  breathe?: [number, number]; // [start, end] s: a width wave runs along the letters
  collapse?: number; // s: letters turn into dots, left to right
  exit?: { at: number; to: 'left' | 'right' | 'up' | 'down' | 'fade'; dur?: number };
  tracking?: number;
  upper?: boolean;
};

export type Glyph = { ch: string; x: number; w: number; cx: number };
export type WordLayout = { glyphs: Glyph[]; size: number; baseline: number; cap: number; ascent: number; descent: number; style: TextStyle; left: number; width: number };

/** The validated layout of a word (also used by the next shot to pick up its letters or dots). */
export function layoutWord(p: Pick<WordProps, 'text' | 'size' | 'font' | 'italic' | 'weight' | 'cx' | 'cy' | 'align' | 'left' | 'tracking' | 'upper'>): WordLayout {
  const font = p.font ?? 'wide';
  const base: TextStyle = { size: p.size, font, italic: p.italic, weight: p.weight ?? (font === 'wide' ? 900 : 400), tracking: p.tracking ?? 0, upper: p.upper ?? font !== 'serif' };
  const text = base.upper === false ? p.text : p.text.toUpperCase();
  let m = measure(text, base);
  const style = m.inkWidth > SAFE.width ? { ...base, size: Math.floor(base.size * SAFE.width / m.inkWidth) } : base;
  if (style !== base) m = measure(text, style);
  const chars = [...text];
  const glyphs = chars.map((ch, i) => {
    const x = i ? measure(chars.slice(0, i).join(''), style).advance : 0;
    const w = measure(ch, style).advance;
    return { ch, x, w, cx: x + w / 2 };
  });
  const left = p.align === 'left' ? (p.left ?? SAFE.left) - m.inkLeft : (p.cx ?? 960) - (m.inkLeft + m.inkRight) / 2;
  const baseline = (p.cy ?? 540) + m.capAscent / 2;
  return { glyphs, size: style.size, baseline, cap: m.capAscent, ascent: m.fontAscent, descent: m.fontDescent, style, left, width: m.inkWidth };
}

const fam = (f: WordProps['font']) => (f === 'serif' ? THEME.serif : f === 'mono' ? THEME.mono : f === 'sans' ? THEME.sans : THEME.wide);

/** Width wave (T3): the letters condense and extend in turn; the word keeps its total width. */
function breathe(p: WordProps, i: number, t: number) {
  if (!p.breathe) return 1;
  const [a, b] = p.breathe;
  const env = Math.sin(Math.PI * clamp((t - a) / (b - a)));
  return 1 + 0.3 * env * Math.sin((t - a) * 9 - i * 0.9);
}

/** Pose of one letter at time t: offset (px), scale, rotation, opacity. */
type Pose = { x: number; y: number; sx: number; sy: number; r: number; o: number };
function pose(p: WordProps, i: number, n: number, t: number, size: number): Pose {
  const st = p.at + i * (p.stagger ?? 0.035);
  const d = p.dur ?? 0.22;
  const u = clamp((t - st) / d);
  let x = 0, y = 0, sx = 1, sy = 1, r = 0, o = t >= st ? 1 : 0;
  switch (p.entry ?? 'slamR') {
    case 'slamR': case 'slamL': {
      const s = p.entry === 'slamR' ? 1 : -1;
      x = s * mix(1100, 0, C.impact(C.expoOut(u) * 0.9 + u * 0.1));
      sx = mix(1.25, 1, C.settle(u));
      break;
    }
    case 'drop': {
      const e = C.expoOut(u);
      x = mix(-160 + i * 30, 0, e); y = mix(-760, 0, e); r = mix(-28 + i * 6, 0, C.settle(u));
      const land = clamp((t - st - d) / 0.12); // squash on landing, then back
      sy = 1 - 0.14 * Math.sin(Math.PI * land) * (u >= 1 ? 1 : 0); sx = 1 + 0.08 * Math.sin(Math.PI * land) * (u >= 1 ? 1 : 0);
      break;
    }
    case 'rise': {
      y = mix(620, 0, C.impact(C.expoOut(u))); sy = mix(1.35, 1, C.settle(u));
      break;
    }
    case 'linear': { // the whole word at constant speed, then a hard stop
      const ul = clamp((t - p.at) / (p.dur ?? 0.5));
      x = mix(-1500, 0, ul); o = t >= p.at ? 1 : 0;
      break;
    }
    case 'type': { o = t >= st ? 1 : 0; break; }
    case 'pop': { const e = clamp((t - st) / 0.16); sx = sy = e <= 0 ? 0 : C.impact(e); o = e > 0 ? 1 : 0; break; }
  }
  if (p.exit && t > p.exit.at) {
    const ue = C.exit(clamp((t - p.exit.at - i * 0.012) / (p.exit.dur ?? 0.22)));
    const far = 1500;
    if (p.exit.to === 'left') x -= far * ue; else if (p.exit.to === 'right') x += far * ue;
    else if (p.exit.to === 'up') y -= 900 * ue; else if (p.exit.to === 'down') y += 900 * ue;
    else o *= 1 - ue;
  }
  void n; void size;
  return { x, y, sx, sy, r, o };
}

export const Word: React.FC<WordProps> = (p) => {
  const id = React.useId().replace(/:/g, '');
  const L = layoutWord(p);
  const n = L.glyphs.length;
  const dt = 1 / 60;
  const lh = L.ascent + L.descent;
  // Breathing: re-pack the letters with their new widths, centred on the same middle.
  const bf = L.glyphs.map((_, i) => breathe(p, i, p.t));
  const packed: number[] = [];
  let acc = 0;
  L.glyphs.forEach((g, i) => { packed.push(acc + (g.w * bf[i]!) / 2); acc += g.w * bf[i]!; });
  const wSum = L.glyphs.reduce((a, g) => a + g.w, 0);
  const shift = (i: number) => (p.breathe ? packed[i]! + (wSum - acc) / 2 - L.glyphs[i]!.cx : 0);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs>
          {L.glyphs.map((_, i) => {
            const a = pose(p, i, n, p.t, L.size), b = pose(p, i, n, p.t - dt, L.size);
            const bx = Math.min(80, Math.abs(a.x - b.x) * 0.45), by = Math.min(80, Math.abs(a.y - b.y) * 0.45);
            return <filter key={i} id={`${id}b${i}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={`${bx.toFixed(1)} ${by.toFixed(1)}`} /></filter>;
          })}
        </defs>
      </svg>
      {L.glyphs.map((g, i) => {
        if (g.ch === ' ') return null;
        const a = pose(p, i, n, p.t, L.size);
        if (a.o <= 0) return null;
        const b = pose(p, i, n, p.t - dt, L.size);
        const moving = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 0.5;
        // Collapse: the letter shrinks into a dot on its optical centre (left to right).
        let dot = 0;
        if (p.collapse !== undefined) dot = C.settle(clamp((p.t - p.collapse - i * 0.05) / 0.12));
        const s = mix(1, 0.12, dot);
        return (
          <React.Fragment key={i}>
            {dot < 1 && (
              <span style={{
                position: 'absolute', left: L.left + g.x, top: L.baseline - L.ascent, height: lh, lineHeight: `${lh}px`,
                fontFamily: fam(p.font), fontSize: L.size, fontWeight: L.style.weight, fontStretch: p.font === undefined || p.font === 'wide' ? '125%' : undefined,
                fontStyle: p.italic ? 'italic' : 'normal', letterSpacing: `${p.tracking ?? 0}em`, whiteSpace: 'pre',
                color: p.outline ? 'transparent' : p.color ?? THEME.ink, WebkitTextStroke: p.outline ? `2px ${p.color ?? THEME.ink}` : undefined,
                opacity: a.o * (1 - dot * 0.6), transformOrigin: `${g.w / 2}px ${L.ascent - L.cap / 2}px`,
                transform: `translate(${a.x + shift(i)}px, ${a.y}px) rotate(${a.r}deg) scale(${a.sx * s * bf[i]!}, ${a.sy * s})`,
                filter: moving || dot > 0 ? `url(#${id}b${i})${dot > 0 && dot < 1 ? ` blur(${(6 * (1 - dot)).toFixed(1)}px)` : ''}` : undefined,
              }}>{g.ch}</span>
            )}
            {dot > 0 && <div style={{ position: 'absolute', left: L.left + g.cx - L.size * 0.07, top: L.baseline - L.cap / 2 - L.size * 0.07, width: L.size * 0.14, height: L.size * 0.14, borderRadius: '50%', background: p.color ?? THEME.ink, opacity: dot, transform: `translate(${a.x}px, ${a.y}px)` }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

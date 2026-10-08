import { measure, type TextStyle } from '../layout/measure';

/**
 * Character layout for kinetic typography: every character becomes an independent element,
 * placed from the REAL metrics of the font (canvas measure, kerning kept through prefix advances),
 * never from hard-coded positions.
 *
 *  - x      : centre of the character's ink, relative to the centre of the word's ink (px)
 *  - inkL/R : the character's ink edges relative to its own pen (to centre the glyph on its pose)
 *  - width  : ink width of the whole word, cap: cap height (optical centring of capitals)
 * All values are for the style's size; scale linearly for any other size.
 */
export type CharBox = { ch: string; x: number; inkL: number; inkR: number; advance: number };
export type CharLayout = { text: string; chars: CharBox[]; width: number; cap: number; style: TextStyle };

export function layoutChars(text: string, style: TextStyle): CharLayout {
  const t = style.upper === false ? text : text.toUpperCase();
  const chars = [...t];
  const word = measure(t, style);
  const centre = (word.inkLeft + word.inkRight) / 2;
  const boxes = chars.map((ch, i) => {
    const pen = i ? measure(chars.slice(0, i).join(''), style).advance : 0; // includes the tracking before it
    const g = measure(ch, { ...style, tracking: 0 });
    return { ch, x: pen + (g.inkLeft + g.inkRight) / 2 - centre, inkL: g.inkLeft, inkR: g.inkRight, advance: g.advance };
  });
  return { text: t, chars: boxes, width: word.inkWidth, cap: word.capAscent, style };
}

/** The tracking (em) that gives a word a target ink width (to justify two lines on the same edges). */
export function trackingForWidth(text: string, style: TextStyle, width: number): number {
  const n = [...text].length;
  const w0 = measure(style.upper === false ? text : text.toUpperCase(), { ...style, tracking: 0 }).inkWidth;
  return (width - w0) / (style.size * Math.max(1, n - 1));
}

/** Scale a layout to another size (positions and edges are linear in the size). */
export const scaleLayout = (l: CharLayout, size: number): CharLayout => {
  const k = size / l.style.size;
  return { ...l, width: l.width * k, cap: l.cap * k, style: { ...l.style, size }, chars: l.chars.map((c) => ({ ...c, x: c.x * k, inkL: c.inkL * k, inkR: c.inkR * k, advance: c.advance * k })) };
};

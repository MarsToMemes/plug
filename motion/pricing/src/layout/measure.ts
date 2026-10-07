import { THEME } from '../theme';

/**
 * Real text metrics, measured on the rendered font (canvas, same fonts as the page, loaded before
 * any frame renders). Never estimated from the number of characters.
 *
 *  advance  : layout width (what the text occupies on its line, tracking included)
 *  inkLeft  : distance from the pen position to the first inked pixel (can be negative)
 *  inkRight : distance from the pen position to the last inked pixel
 *  ascent / descent : inked height above / below the baseline
 *  capAscent: height of a capital without accents — used for OPTICAL centring of caps text
 *  fontAscent / fontDescent : the font's line box, to place a DOM line on its baseline exactly
 */
export type TextStyle = { size: number; font?: 'serif' | 'sans'; weight?: number; tracking?: number; italic?: boolean; upper?: boolean };
export type Metrics = { text: string; advance: number; inkLeft: number; inkRight: number; inkWidth: number; ascent: number; descent: number; capAscent: number; fontAscent: number; fontDescent: number };

const cache = new Map<string, Metrics>();
let ctx: CanvasRenderingContext2D | null = null;

export const family = (s: TextStyle) => (s.font === 'sans' ? THEME.sans : THEME.serif);
export const cssFont = (s: TextStyle) => `${s.italic ? 'italic ' : ''}${s.weight ?? 300} ${s.size}px ${family(s)}`;

export function measure(raw: string, s: TextStyle): Metrics {
  const text = s.upper === false ? raw : raw.toUpperCase();
  const key = `${text}|${cssFont(s)}|${s.tracking ?? 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  ctx ??= document.createElement('canvas').getContext('2d')!;
  ctx.font = cssFont(s);
  const track = (s.tracking ?? 0) * s.size;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${track}px`;
  const m = ctx.measureText(text);
  const cap = ctx.measureText('H');
  // Canvas adds the tracking after the last glyph too; the ink does not include it.
  const out: Metrics = {
    text,
    advance: m.width,
    inkLeft: -m.actualBoundingBoxLeft,
    inkRight: m.actualBoundingBoxRight,
    inkWidth: m.actualBoundingBoxRight + m.actualBoundingBoxLeft,
    ascent: m.actualBoundingBoxAscent,
    descent: m.actualBoundingBoxDescent,
    capAscent: cap.actualBoundingBoxAscent,
    fontAscent: m.fontBoundingBoxAscent,
    fontDescent: m.fontBoundingBoxDescent,
  };
  // Only trust (and keep) a measure made with the real font, never with a fallback.
  if (document.fonts.check(cssFont(s), text)) cache.set(key, out);
  return out;
}

/** The largest size (≤ max) at which the text's ink fits a width. Last resort only (see layout). */
export function fitSize(text: string, s: TextStyle, width: number, max: number) {
  const m = measure(text, { ...s, size: 100 });
  return Math.min(max, Math.floor((100 * width) / m.inkWidth));
}

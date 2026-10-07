import { ANCHOR, SAFE, SPACE, col, span } from '../../layout/grid';
import { chooseBreaks, dataEditorial, placeBox, placeText, stack, type Placed } from '../../layout/layout';
import { measure, type TextStyle } from '../../layout/measure';
import { THEME } from '../../theme';

/**
 * The benchmark's static compositions, one per shot (the frame where the shot HOLDS).
 * Everything is placed from the grid, by measured ink edges; the animation only travels to
 * these positions and away from them.
 */
const SERIF = (size: number, weight = 300): TextStyle => ({ size, font: 'serif', weight });
const SANS = (size: number, weight = 300, tracking = 0): TextStyle => ({ size, font: 'sans', weight, tracking });
const LABEL = SANS(26, 400, 0.32);
const EDGE = { left: col(1) };

/** Largest serif size (≤ max) whose ink fits the width: the monumental word fills its measure. */
const fill = (text: string, width: number, max: number, weight = 300) => chooseBreaks([[text]], SERIF(max, weight), width).size;

export function shot1(): Placed[] {
  // FULL_BLEED: one monumental word across the whole safe width, on the optical centre.
  const size = fill('Pourquoi', SAFE.width, 640);
  return stack([{ id: 'pourquoi', role: 'hero', text: 'Pourquoi', style: SERIF(size) }], { center: ANCHOR.CENTER_X });
}

export function shot2(): Placed[] {
  // STACKED_EDITORIAL on the left edge: label → hero; meta at the bottom on the same edge;
  // the perforation crosses the hero at its optical middle, from the edge to the safe right.
  const size = fill('Billet', span(9), 420);
  const items = stack([
    { id: 'votre', role: 'support', text: 'Votre', style: LABEL, gapAfter: SPACE.xl },
    { id: 'billet', role: 'hero', text: 'Billet', style: SERIF(size) },
  ], EDGE);
  const billet = items[1]!;
  const mid = billet.pen!.baseline - billet.m!.capAscent / 2;
  return [...items, meta(), placeBox('perforation', 'decor', { x: col(1), y: mid - 1.5, w: SAFE.right - col(1), h: 3 }, THEME.line)];
}

/** The tear line of shot 2 → 3 (y in the frame). */
export const tearY = () => { const b = shot2()[1]!; return b.pen!.baseline - b.m!.capAscent / 2; };

export function shot3(): Placed[] {
  // COÛTE alone, born in the tear: same edge, centred on the tear line.
  const size = fill('Coûte', span(7), 300);
  return [...stack([{ id: 'coute', role: 'hero', text: 'Coûte', style: SERIF(size) }], EDGE, tearY()), meta()];
}

export function shot4(): Placed[] {
  // STACKED_EDITORIAL: COÛTE becomes secondary above the hero PLUS CHER (accent, full measure).
  const hero = fill('Plus cher', SAFE.width, 300, 420);
  return [...stack([
    { id: 'coute', role: 'secondary', text: 'Coûte', style: SERIF(Math.round(hero * 0.42)), gapAfter: SPACE.l },
    { id: 'pluscher', role: 'hero', text: 'Plus cher', style: SERIF(hero, 420), color: THEME.accent },
  ], EDGE), meta()];
}

export const PRICE: TextStyle = SANS(340, 300, -0.02);
export function shot5(value = '349 €', label = 'Prix du billet', secondary?: string): Placed[] {
  // DATA_EDITORIAL: label → hero number → bar (the data), all on the left edge.
  const heroW = measure('349 €', PRICE).inkWidth;
  const items = dataEditorial({
    label: { id: 'label', role: 'support', text: label, style: LABEL },
    hero: { id: 'price', role: 'hero', text: value, style: PRICE, color: THEME.accent },
    secondary: secondary ? { id: 'secondary', role: 'secondary', text: secondary, style: SANS(64, 400, 0.04) } : undefined,
    left: col(1), barRatio: 1, barMax: heroW, barH: 14,
  });
  return items;
}

export const TWO: TextStyle = SANS(560, 300, -0.02);
export function shot6(): Placed[] {
  // HERO_LEFT: the 2 dominates; HEURES on the same baseline, one SPACE.xl after the 2's ink;
  // the clock above HEURES on its left edge; the time line under everything, edge to edge.
  const base = ANCHOR.OPTICAL_Y + measure('2', TWO).capAscent / 2;
  const two = placeText('two', 'hero', '2', TWO, EDGE, base);
  const heuresStyle = SERIF(140);
  const heures = placeText('heures', 'primary', 'Heures', heuresStyle, { left: two.box.x + two.box.w + SPACE.xl }, base);
  const clock = placeText('clock', 'meta', '00:00', SANS(44, 300, 0.12), { left: heures.box.x }, heures.box.y - SPACE.l, THEME.muted, false);
  const line = placeBox('timeline', 'graphic', { x: col(1), y: base + SPACE.xl, w: SAFE.right - col(1), h: 3 }, THEME.accent);
  return [two, heures, clock, line];
}

export const shot7 = () => shot5('349 €', 'Votre billet', '+2 heures');

const meta = () => placeText('route', 'meta', 'Paris — New York', SANS(22, 400, 0.5), EDGE, SAFE.bottom, THEME.muted);

export const SHOTS: Array<{ name: string; items: () => Placed[]; allow?: Array<[string, string]> }> = [
  { name: '1 · Pourquoi', items: shot1 },
  { name: '2 · Votre billet', items: shot2 },
  { name: '3 · Coûte', items: shot3 },
  { name: '4 · Coûte / Plus cher', items: shot4 },
  { name: '5 · 349 €', items: () => shot5() },
  { name: '6 · 2 heures', items: shot6 },
  { name: '7 · Résumé', items: shot7 },
];

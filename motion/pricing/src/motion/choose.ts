import type { PresetName } from './presets';

/**
 * Contextual motion: the preset follows what the text MEANS, not how important it is.
 * Rules are read in order; the first that matches wins. Each one says why.
 */
type Rule = { test: RegExp; preset: PresetName; why: string; dir?: 1 | -1 };
export const RULES: Rule[] = [
  { test: /\d+\s*€.*(→|->).*\d+\s*€/, preset: 'TYPO_COUNT', why: 'a figure that becomes another: digital transformation' },
  { test: /\d+\s*(heures?|h|jours?|minutes?|semaines?)\b/i, preset: 'TYPO_WHIP', why: 'a duration: time accelerates' },
  { test: /jamais fixe|varie|change|bouge|évolue/i, preset: 'TYPO_TRANSFORM', why: 'a changing state: it oscillates before it settles' },
  { test: /algorithme|système|données|calcul/i, preset: 'TYPO_EXPLODE', why: 'a machine: multiplication, data flowing to its place' },
  { test: /plus cher|hausse|explose|flambe|augmente.*prix|prix.*augmente/i, preset: 'TYPO_SLAM', why: 'the price hits: impact, compression, overshoot' },
  { test: /demande.*(↑|augmente|monte)|(↑)/i, preset: 'TYPO_STRETCH', why: 'it grows: vertical expansion from the baseline' },
  { test: /(disponibilit|place|stock|capacit).*(↓|baisse|diminue|disparai)|(↓)/i, preset: 'TYPO_COMPRESS', why: 'it shrinks: compression, loss of presence' },
  { test: /\bvs\b|>|<|contre|mais\b/i, preset: 'TYPO_COLLISION', why: 'two ideas against each other: they collide' },
  { test: /\?$/, preset: 'TYPO_FOCUS', why: 'a question: it comes into focus, nothing moves' },
  { test: /^(le|la|les)?\s?(prix|revenus?|capacité)\b.{0,20}$/i, preset: 'TYPO_IMPACT', why: 'a key word, alone: a blow' },
  { test: /\.$/, preset: 'TYPO_MASK', why: 'a statement: cut into the frame' },
];

export function chooseMotion(text: string): { preset: PresetName; why: string } {
  for (const r of RULES) if (r.test.test(text)) return { preset: r.preset, why: r.why };
  return { preset: 'TYPO_REVEAL', why: 'default: written into place' };
}

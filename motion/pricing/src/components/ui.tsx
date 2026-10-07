import React from 'react';
import { THEME } from '../theme';
import { FAMILY_PRESET, Headline } from '../type/Headline';
import type { Family } from '../type/presets';

/**
 * Screen-space statement in the documentary's voice: a big editorial title, animated by the
 * kinetic typography system (src/type). `family` says how it moves, for what it means; the text
 * can carry its hierarchy with "|" and name its focal block(s) with `focus`.
 */
export const Statement: React.FC<{ text: string; at: number; out?: number; top?: number; size?: number; color?: string; fade?: number; family?: Family; focus?: number[]; layout?: 'stack' | 'inline'; accent?: string; speed?: number; style?: React.CSSProperties }> = ({ text, at, out, top = 900, size = 68, color = THEME.ink, family, focus, layout = 'inline', accent, speed }) => (
  <Headline text={text} at={at} out={out} top={top} size={size} color={color} focus={focus} layout={layout} accent={accent ?? (focus?.length ? THEME.accent : undefined)} speed={speed} motion={family ? FAMILY_PRESET[family] : undefined} />
);

/** Small spaced capitals (labels, kickers). */
export const Caps: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 18, color = THEME.muted, style }) => (
  <span style={{ fontFamily: THEME.sans, fontSize: size, letterSpacing: '0.32em', textTransform: 'uppercase', color, ...style }}>{children}</span>
);

/** A big figure with its unit: "1  CHAMBRE PERDUE". */
export const Figure: React.FC<{ value: string | number; unit?: string; size?: number; color?: string; style?: React.CSSProperties }> = ({ value, unit, size = 96, color = THEME.ink, style }) => (
  <div style={{ fontFamily: THEME.sans, color, whiteSpace: 'nowrap', ...style }}>
    <span style={{ fontSize: size, fontWeight: 300, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    {unit && <Caps size={size * 0.27} color={THEME.muted} style={{ marginLeft: size * 0.22 }}>{unit}</Caps>}
  </div>
);

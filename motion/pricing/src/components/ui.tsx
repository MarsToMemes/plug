import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, THEME, seg } from '../theme';

/** Screen-space statement in the documentary's voice: serif capitals, rises 10 px and unblurs. */
export const Statement: React.FC<{ text: string; at: number; out?: number; top?: number; size?: number; color?: string; fade?: number; style?: React.CSSProperties }> = ({ text, at, out, top = 900, size = 68, color = THEME.ink, fade = 26, style }) => {
  const f = useCurrentFrame();
  // `fade` in frames: scenes whose time is stretched on the voice pass a shorter one.
  const t = EASE.out(seg(f, at, at + fade));
  const o = t * (out === undefined ? 1 : 1 - seg(f, out, out + fade * 0.6));
  if (o <= 0.005) return null;
  return (
    <div style={{ position: 'absolute', left: 0, width: 1920, top, textAlign: 'center', opacity: o, transform: `translateY(${(1 - t) * 10}px)`, filter: t < 1 ? `blur(${(1 - t) * 5}px)` : undefined, fontFamily: THEME.serif, fontWeight: 300, fontSize: size, color, letterSpacing: '0.03em', textTransform: 'uppercase', textShadow: `0 0 24px ${THEME.bg}, 0 0 8px ${THEME.bg}`, ...style }}>
      {text}
    </div>
  );
};

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

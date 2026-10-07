import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE, THEME, seg } from '../theme';

/** EditorialTitle — kicker (small caps sans) + title (serif). Rises 12 px and unblurs. */
export const EditorialTitle: React.FC<{ kicker?: string; title: string; appear?: number; size?: number; align?: 'left' | 'center'; style?: React.CSSProperties }> = ({ kicker, title, appear = 0, size = 96, align = 'center', style }) => {
  const frame = useCurrentFrame();
  const t = EASE.out(seg(frame, appear, appear + 24));
  return (
    <div style={{ textAlign: align, opacity: t, transform: `translateY(${(1 - t) * 12}px)`, filter: `blur(${(1 - t) * 6}px)`, ...style }}>
      {kicker && <div style={{ fontFamily: THEME.sans, fontSize: 18, letterSpacing: '0.3em', textTransform: 'uppercase', color: THEME.muted, marginBottom: 18 }}>{kicker}</div>}
      <div style={{ fontFamily: THEME.serif, fontWeight: 300, fontSize: size, color: THEME.ink, letterSpacing: '-0.01em', lineHeight: 1.02 }}>{title}</div>
    </div>
  );
};

/** DataLabel — small uppercase label and its value, for annotating a visual. */
export const DataLabel: React.FC<{ label: string; value?: string; color?: string; style?: React.CSSProperties }> = ({ label, value, color = THEME.ink, style }) => (
  <div style={{ fontFamily: THEME.sans, ...style }}>
    <div style={{ fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.muted }}>{label}</div>
    {value && <div style={{ fontSize: 34, fontWeight: 400, color, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{value}</div>}
  </div>
);

/** ScientificCallout — a dot on the subject, a leader and a short note set in italic serif. */
export const ScientificCallout: React.FC<{ x: number; y: number; dx: number; dy: number; text: string; appear?: number }> = ({ x, y, dx, dy, text, appear = 0 }) => {
  const frame = useCurrentFrame();
  const t = EASE.out(seg(frame, appear, appear + 20));
  const tx = seg(frame, appear + 12, appear + 30);
  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        <circle cx={x} cy={y} r={5 * t} fill={THEME.accent} />
        <path d={`M${x},${y} L${x + dx * t},${y + dy * t} L${x + dx * t + (dx > 0 ? 40 : -40) * tx},${y + dy * t}`} stroke={THEME.muted} strokeWidth={1.4} fill="none" />
      </svg>
      <div style={{ position: 'absolute', left: dx > 0 ? x + dx + 50 : undefined, right: dx > 0 ? undefined : 1920 - (x + dx - 50), top: y + dy - 16, opacity: tx, fontFamily: THEME.serif, fontStyle: 'italic', fontSize: 28, color: THEME.ink, maxWidth: 420 }}>{text}</div>
    </>
  );
};

/** SplitScreen — two panes separated by a hairline that draws itself; `split` 0..1 opens it. */
export const SplitScreen: React.FC<{ left: React.ReactNode; right: React.ReactNode; split?: number; ratio?: number }> = ({ left, right, split = 1, ratio = 0.5 }) => {
  const x = 1920 * ratio;
  const e = EASE.inOut(split);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: x, height: 1080, overflow: 'hidden' }}>{left}</div>
      <div style={{ position: 'absolute', left: x, top: 0, width: 1920 - x, height: 1080, overflow: 'hidden', clipPath: `inset(0 ${(1 - e) * 100}% 0 0)` }}>{right}</div>
      <div style={{ position: 'absolute', left: x, top: 540 - 380 * e, width: 1, height: 760 * e, background: THEME.line }} />
    </div>
  );
};

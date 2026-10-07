import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { QAOverlay } from '../../layout/QA';
import type { Placed } from '../../layout/layout';
import { cssFont } from '../../layout/measure';
import { THEME } from '../../theme';
import { SHOTS } from './layouts';

/** Draws a placed item exactly: text on its baseline (line box = the font's ascent + descent). */
export const Static: React.FC<{ p: Placed }> = ({ p }) => {
  if (!p.text) return <div style={{ position: 'absolute', left: p.box.x, top: p.box.y, width: p.box.w, height: p.box.h, background: p.color }} />;
  const m = p.m!, s = p.style!;
  return (
    <div style={{ position: 'absolute', left: p.pen!.x, top: p.pen!.baseline - m.fontAscent, height: m.fontAscent + m.fontDescent, lineHeight: `${m.fontAscent + m.fontDescent}px`, whiteSpace: 'pre', font: cssFont(s), letterSpacing: `${s.tracking ?? 0}em`, color: p.color }}>
      {m.text}
    </div>
  );
};

/** One still per shot: the composition alone, then with the diagnostic overlay (?qa). */
export const BenchmarkLayouts: React.FC<{ qa: boolean }> = ({ qa }) => (
  <AbsoluteFill style={{ background: THEME.bg }}>
    {SHOTS.map((s, k) => (
      <Sequence key={s.name} from={k} durationInFrames={1}>
        <Shot items={s.items()} title={s.name} qa={qa} allow={s.allow} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
const Shot: React.FC<{ items: Placed[]; title: string; qa: boolean; allow?: Array<[string, string]> }> = ({ items, title, qa, allow }) => (
  <AbsoluteFill>
    {items.map((p) => <Static key={p.id} p={p} />)}
    {qa && <QAOverlay items={items} title={title} allow={allow} />}
  </AbsoluteFill>
);

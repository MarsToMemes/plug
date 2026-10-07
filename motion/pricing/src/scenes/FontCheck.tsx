import React from 'react';
import { AbsoluteFill } from 'remotion';
import { registerFont } from '../fonts';
import { THEME } from '../theme';

/** Check: a family copied from github.com/google/fonts (scripts/google_font.py), used offline. */
registerFont('Space Grotesk', 'fonts/spacegrotesk/SpaceGrotesk[wght].ttf', { weight: '300 700' });

export const FontCheck: React.FC = () => (
  <AbsoluteFill style={{ background: THEME.bg, color: THEME.ink, justifyContent: 'center', paddingLeft: 112, gap: 24 }}>
    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 300, fontSize: 96 }}>Space Grotesk 300</div>
    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 96 }}>Space Grotesk 700 — 349 €</div>
  </AbsoluteFill>
);

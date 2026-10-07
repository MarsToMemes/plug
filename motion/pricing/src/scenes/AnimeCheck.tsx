import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useAnime } from '../motion/anime';
import { THEME } from '../theme';

/** Check that anime.js is driven by the frame (deterministic): a word slides in with outExpo. */
export const AnimeCheck: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  useAnime((tl) => { tl.add(ref.current!, { translateX: [-900, 0], opacity: [0, 1], ease: 'outExpo', duration: 900 }, 0); });
  return (
    <AbsoluteFill style={{ background: THEME.bg, alignItems: 'center', justifyContent: 'center' }}>
      <div ref={ref} style={{ fontFamily: THEME.serif, fontSize: 160, color: THEME.ink }}>ANIME.JS</div>
    </AbsoluteFill>
  );
};

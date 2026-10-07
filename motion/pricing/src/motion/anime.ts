import { createTimeline, type Timeline } from 'animejs';
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * anime.js inside Remotion. anime.js runs on its own clock (requestAnimationFrame): in a render
 * that would give a different result on every run. Here the timeline is created PAUSED and seeked
 * to the current frame before each screenshot, so every frame is deterministic.
 *
 *   const ref = React.useRef<HTMLDivElement>(null);
 *   useAnime((tl) => tl.add(ref.current!, { x: [0, 400], ease: 'outExpo', duration: 600 }, 0));
 *
 * anime.js' easings and utils can also be used as pure functions (no timeline needed).
 */
export function useAnime(build: (tl: Timeline) => void, deps: React.DependencyList = []) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tl = React.useRef<Timeline | null>(null);
  React.useLayoutEffect(() => {
    const t = createTimeline({ autoplay: false });
    build(t);
    tl.current = t;
    return () => { t.revert(); tl.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  React.useLayoutEffect(() => { tl.current?.seek((frame / fps) * 1000); }, [frame, fps]);
}

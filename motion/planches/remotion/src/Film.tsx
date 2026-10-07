import React from 'react';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import { Easing, useVideoConfig } from 'remotion';
import { InFilm } from './film';
import { P7_DURATION, Plate07 } from './P7';
import { CHARCOAL_DURATION, CharcoalPlate } from './CharcoalPlate';
import { P2_DURATION, Plate02 } from './P2';
import { P3_DURATION, Plate03 } from './P3';
import { CUT_DURATION, Cut060504 } from './Cut';
import { P8_DURATION, Plate08 } from './P8';

/**
 * The full film: opening, then plates 01 → 08. Between plates the drawing is rubbed out
 * like charcoal under a putty eraser: a smoky, grainy edge sweeps across and uncovers the
 * next plate. Each plate keeps its own last drawn frame (no fade to blank) until it is erased.
 */
export const ERASE = 34;

type EraseProps = { seed: number; dir: 1 | -1 };
const EraseComponent: React.FC<TransitionPresentationComponentProps<EraseProps>> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const id = `erase-${passedProps.seed}`;
  if (presentationDirection === 'exiting') return <>{children}</>;
  // The incoming plate shows where (rub gradient + smoke noise + grain) exceeds a moving threshold.
  const S = 16;
  const T = 1.16 - presentationProgress * 1.05;
  const ltr = passedProps.dir === 1;
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id={`${id}-f`} x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.0045 0.018" numOctaves={4} seed={passedProps.seed} result="smoke" />
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={passedProps.seed + 7} result="grain" />
            <feComposite in="SourceGraphic" in2="smoke" operator="arithmetic" k2={1} k3={0.3} result="a" />
            <feComposite in="a" in2="grain" operator="arithmetic" k2={1} k3={0.1} />
            <feComponentTransfer><feFuncA type="linear" slope={S} intercept={-S * T} /></feComponentTransfer>
          </filter>
          <linearGradient id={`${id}-g`} x1={ltr ? 0 : 1} x2={ltr ? 1 : 0} y1={0.1} y2={0}>
            <stop offset="0" stopColor="#fff" stopOpacity={1} /><stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={`${id}-m`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
            <rect width={1920} height={1080} fill={`url(#${id}-g)`} filter={`url(#${id}-f)`} />
          </mask>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, maskImage: `url(#${id}-m)`, WebkitMaskImage: `url(#${id}-m)` }}>{children}</div>
    </>
  );
};
const erase = (seed: number, dir: 1 | -1 = 1): TransitionPresentation<EraseProps> => ({ component: EraseComponent, props: { seed, dir } });
const eraseTiming = linearTiming({ durationInFrames: ERASE, easing: Easing.bezier(0.33, 0, 0.67, 1) });

export const FILM_DURATION = P7_DURATION + CHARCOAL_DURATION + P2_DURATION + P3_DURATION + CUT_DURATION + P8_DURATION - 5 * ERASE;

export const Film: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <InFilm.Provider value>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Ouverture" durationInFrames={P7_DURATION} premountFor={fps}><Plate07 /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={erase(11)} timing={eraseTiming} />
        <TransitionSeries.Sequence name="01 — Combinaison" durationInFrames={CHARCOAL_DURATION} premountFor={fps}><CharcoalPlate /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={erase(23, -1)} timing={eraseTiming} />
        <TransitionSeries.Sequence name="02 — Chaîne biologique" durationInFrames={P2_DURATION} premountFor={fps}><Plate02 /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={erase(37)} timing={eraseTiming} />
        <TransitionSeries.Sequence name="03 — Combinatoire" durationInFrames={P3_DURATION} premountFor={fps}><Plate03 /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={erase(41, -1)} timing={eraseTiming} />
        <TransitionSeries.Sequence name="06 → 05 → 04" durationInFrames={CUT_DURATION} premountFor={fps}><Cut060504 /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={erase(53)} timing={eraseTiming} />
        <TransitionSeries.Sequence name="08 — Ressemblance" durationInFrames={P8_DURATION} premountFor={fps}><Plate08 /></TransitionSeries.Sequence>
      </TransitionSeries>
    </InFilm.Provider>
  );
};

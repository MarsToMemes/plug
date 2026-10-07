import React from 'react';
import { TransitionSeries } from '@remotion/transitions';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME, clamp01, seg } from '../theme';
import { BRIDGES } from './bridges';
import { Scene01 } from './Scene01';
import { Scene02 } from './Scene02';
import { Scene03 } from './Scene03';
import { Scene04 } from './Scene04';
import { Scene05 } from './Scene05';
import { Scene06 } from './Scene06';
import { Scene07 } from './Scene07';
import { Scene08 } from './Scene08';
import { Scene09 } from './Scene09';
import { Scene10 } from './Scene10';
import { Scene11 } from './Scene11';
import { Scene12 } from './Scene12';
import { Scene13 } from './Scene13';
import { Scene14 } from './Scene14';
import { Scene15 } from './Scene15';
import { Scene16 } from './Scene16';
import { Scene17 } from './Scene17';
import { Scene18 } from './Scene18';
import { S01 } from '../data/scene01';
import { S02 } from '../data/scene02';
import { S03 } from '../data/scene03';
import { S04 } from '../data/scene04';
import { S05 } from '../data/scene05';
import { S06 } from '../data/scene06';
import { S07 } from '../data/scene07';
import { S08 } from '../data/scene08';
import { S09 } from '../data/scene09';
import { S10 } from '../data/scene10';
import { S11 } from '../data/scene11';
import { S12 } from '../data/scene12';
import { S13 } from '../data/scene13';
import { S14 } from '../data/scene14';
import { S15 } from '../data/scene15';
import { S16 } from '../data/scene16';
import { S17 } from '../data/scene17';
import { S18 } from '../data/scene18';

/** The whole episode. Between two scenes, a bridge: the last key element of one becomes the first of the next. */
export const BRIDGE = 60; // frames; the bridge straddles the cut (it does not shorten the episode)
export const SCENES = [
  { name: '01 Le prix qui change', C: Scene01, d: S01.duration }, { name: '02 Le produit est déjà là', C: Scene02, d: S02.duration },
  { name: '03 Le temps', C: Scene03, d: S03.duration }, { name: '04 Le siège qui disparaît', C: Scene04, d: S04.duration },
  { name: '05 La chambre qui disparaît', C: Scene05, d: S05.duration }, { name: '06 Pourquoi pas un prix fixe', C: Scene06, d: S06.duration },
  { name: '07 Les catégories tarifaires', C: Scene07, d: S07.duration }, { name: '08 Même chambre, prix différent', C: Scene08, d: S08.duration },
  { name: '09 La demande', C: Scene09, d: S09.duration }, { name: '10 Le moteur', C: Scene10, d: S10.duration },
  { name: '11 L’algorithme', C: Scene11, d: S11.duration }, { name: '12 Le week-end', C: Scene12, d: S12.duration },
  { name: '13 L’événement', C: Scene13, d: S13.duration }, { name: '14 Le piège du j’attends', C: Scene14, d: S14.duration },
  { name: '15 Avion contre hôtel', C: Scene15, d: S15.duration }, { name: '16 Le vrai produit', C: Scene16, d: S16.duration },
  { name: '17 La machine économique', C: Scene17, d: S17.duration }, { name: '18 Révélation finale', C: Scene18, d: S18.duration },
];
export const EPISODE_DURATION = SCENES.reduce((a, s) => a + s.d, 0);

/** A bridge over the cut: the scene behind steps back into the ground, the element morphs, the next scene comes up. */
const BridgeOverlay: React.FC<{ k: number }> = ({ k }) => {
  const f = useCurrentFrame();
  const Bridge = BRIDGES[k]!;
  const ground = seg(f, 0, BRIDGE * 0.28) * (1 - seg(f, BRIDGE * 0.74, BRIDGE));
  const el = seg(f, 0, BRIDGE * 0.22) * (1 - seg(f, BRIDGE * 0.8, BRIDGE));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: k === 14 ? '#060607' : THEME.bg, opacity: ground }} />
      <AbsoluteFill style={{ opacity: el }}><Bridge t={clamp01(seg(f, BRIDGE * 0.2, BRIDGE * 0.72))} /></AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Episode: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      {SCENES.flatMap(({ name, C, d }, i) => [
        <TransitionSeries.Sequence key={name} name={name} durationInFrames={d} premountFor={fps}><C /></TransitionSeries.Sequence>,
        ...(i < SCENES.length - 1 ? [<TransitionSeries.Overlay key={`b${i}`} durationInFrames={BRIDGE} premountFor={fps}><BridgeOverlay k={i} /></TransitionSeries.Overlay>] : []),
      ])}
    </TransitionSeries>
  );
};

import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { THEME } from '../theme';
import { Title, TitleCount } from '../type/Title';

/** The six test titles of the kinetic typography system, one after the other (3.4 s each). */
export const TITLE_LAB_STEP = 102;
const tests: React.ReactNode[] = [
  // 1. A question with a hierarchy: blocks from alternate sides, "PLUS CHER ?" lands last, faster, heavier.
  <Title key={1} text="Pourquoi|votre billet|coûte|plus cher ?" family="TITLE_SPLIT" focus={[3]} accent={THEME.accent} at={0} out={84} size={104} top={250} />,
  // 2. A figure becoming another: each digit rolls, the new price lands heavier.
  <TitleCount key={2} from={129} to={349} at={0} change={30} out={88} label="Prix du billet" />,
  // 3. A quantity that grows: each word rises, the last one larger.
  <Title key={3} text="La demande|augmente" layout="inline" family="TITLE_SCALE" focus={[1]} at={0} out={84} size={110} top={450} />,
  // 4. The conclusion: slowly out of the blur, "FIXE" settles last; the camera slows into it.
  <Title key={4} text="Le prix|n’est jamais|fixe" family="TITLE_REVEAL_SLOW" focus={[2]} accent={THEME.accent} at={0} out={86} size={112} top={290} />,
  // 5. A blow: "L'ALGORITHME" falls into place, "DÉCIDE" strikes and the frame takes it.
  <Title key={5} text="L’algorithme|décide" family="TITLE_IMPACT" focus={[1]} accent={THEME.accent} at={0} out={86} size={128} top={330} />,
  // 6. Scarcity: two short lines cut into the frame; the second, tighter, comes later.
  <Title key={6} text="Une chambre.|Un seul soir." family="TITLE_MASK" focus={[1]} accent={THEME.accent} at={0} out={86} size={116} top={340} />,
];

export const TitleLab: React.FC = () => (
  <AbsoluteFill style={{ background: THEME.bg }}>
    {tests.map((t, k) => <Sequence key={k} from={k * TITLE_LAB_STEP} durationInFrames={TITLE_LAB_STEP}>{t}</Sequence>)}
  </AbsoluteFill>
);

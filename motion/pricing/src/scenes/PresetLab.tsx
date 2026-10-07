import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { chooseMotion } from '../motion/choose';
import { PRESETS, type PresetName } from '../motion/presets';
import { Typo } from '../motion/Typo';
import { THEME } from '../theme';

/** Every TYPO_* preset on a word that suits it (1.2 s each), with the preset's name. */
const WORDS: Record<string, string> = {
  TYPO_REVEAL: 'Chambre', TYPO_IMPACT: 'Prix', TYPO_SLAM: 'Plus cher', TYPO_PUSH: 'Réservez', TYPO_PULL: 'Revenus', TYPO_SPLIT: 'Écart',
  TYPO_COLLISION: 'Demande Offre', TYPO_STRETCH: 'Demande', TYPO_COMPRESS: 'Disponibilité', TYPO_MASK: 'Un seul soir.', TYPO_MORPH: 'Capacité',
  TYPO_SCALE: 'Gestion', TYPO_FOCUS: 'Pourquoi ?', TYPO_CAMERA: 'Billet', TYPO_PARALLAX: 'Saison', TYPO_WHIP: '2 heures', TYPO_COUNT: '349 €',
  TYPO_TRANSFORM: 'Jamais fixe', TYPO_STACK: 'Temps', TYPO_EXPLODE: 'Algorithme',
};
export const PRESET_STEP = 36;
export const PRESET_NAMES = Object.keys(PRESETS) as PresetName[];
export const PresetLab: React.FC = () => (
  <AbsoluteFill style={{ background: THEME.bg }}>
    {PRESET_NAMES.map((name, k) => (
      <Sequence key={name} from={k * PRESET_STEP} durationInFrames={PRESET_STEP}>
        <div style={{ position: 'absolute', left: 60, top: 50, fontFamily: THEME.sans, fontSize: 22, letterSpacing: '0.3em', color: THEME.muted }}>{name} · choix auto : {chooseMotion(WORDS[name]!).preset}</div>
        <Typo text={WORDS[name]!} preset={name} params={{ at: 100, dir: 1 }} size={200} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

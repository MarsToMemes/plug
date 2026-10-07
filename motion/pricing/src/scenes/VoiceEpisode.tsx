import React from 'react';
import { TransitionSeries } from '@remotion/transitions';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Freeze, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME, clamp01, seg } from '../theme';
import { BRIDGES } from './bridges';
import { BRIDGE, SCENES } from './Episode';
import { VOICE } from '../data/voice';

/**
 * The episode timed on the voice-over. Scene i plays during its passage of the narration
 * [VOICE.scenes[i].start, next start). Inside, its own timeline is remapped piecewise-linearly so
 * that chosen beats of the scene land on chosen words (anchors: [scene frame, voice second]).
 */
const FPS = 30;
const starts = VOICE.scenes.map((s) => Math.round(s.start * FPS));
const ends = starts.map((s, i) => (i + 1 < starts.length ? starts[i + 1]! : Math.round(VOICE.end * FPS)));
export const VOICE_DURATION = ends[ends.length - 1]!;

function remap(i: number, local: number) {
  const s = VOICE.scenes[i]!, d = SCENES[i]!.d, len = ends[i]! - starts[i]!;
  // Anchors in this scene's own frames → episode frames relative to the scene start.
  const pts: Array<[number, number]> = [[0, 0], ...(s.anchors ?? []).map(([sf, sec]) => [sf, sec * FPS - starts[i]!] as [number, number]), [d - 1, len - 1]];
  pts.sort((a, b) => a[1] - b[1]);
  for (let k = 1; k < pts.length; k++) {
    const [a0, b0] = pts[k - 1]!, [a1, b1] = pts[k]!;
    if (local <= b1) return a0 + (a1 - a0) * clamp01((local - b0) / Math.max(1, b1 - b0));
  }
  return d - 1;
}

const Remapped: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const C = SCENES[i]!.C;
  return <Freeze frame={remap(i, f)}><C /></Freeze>;
};

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

export const VoiceEpisode: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <TransitionSeries>
        {SCENES.flatMap(({ name }, i) => [
          <TransitionSeries.Sequence key={name} name={name} durationInFrames={ends[i]! - starts[i]!} premountFor={fps}><Remapped i={i} /></TransitionSeries.Sequence>,
          ...(i < SCENES.length - 1 ? [<TransitionSeries.Overlay key={`b${i}`} durationInFrames={BRIDGE} premountFor={fps}><BridgeOverlay k={i} /></TransitionSeries.Overlay>] : []),
        ])}
      </TransitionSeries>
      <Audio src={staticFile('voice/voix-off.mp3')} />
    </AbsoluteFill>
  );
};

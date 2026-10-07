import React from 'react';
import { TransitionSeries } from '@remotion/transitions';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Freeze, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME, clamp01, seg } from '../theme';
import { BRIDGE, SCENES } from './Episode';
import { BRIDGE_FOR } from './bridges2';
import { Scene19 } from './Scene19';
import { S19 } from '../data/scene19';
import { Scene20 } from './Scene20';
import { S20 } from '../data/scene20';
import { VOICE } from '../data/voice';
import { TimeMapContext } from '../type/clock';
import { TextQA } from '../layout/TextQA';

/**
 * The episode cut on the voice-over: scenes in the order of the narration, each playing during
 * its passage. Inside a passage the scene's own time is remapped piecewise-linearly so that its
 * beats land on the words (anchors). Bridges morph one scene's last element into the next one's.
 */
const FPS = 30;
const P = VOICE.passages;
const comp = (key: string) => (key === '19' ? { C: Scene19, d: S19.duration } : key === '20' ? { C: Scene20, d: S20.duration } : SCENES[Number(key) - 1]!);
const starts = P.map((p) => Math.round(p.start * FPS));
const ends = starts.map((s, i) => (i + 1 < starts.length ? starts[i + 1]! : Math.round(VOICE.end * FPS)));
export const VOICE_DURATION = ends[ends.length - 1]!;

function remap(i: number, local: number) {
  const p = P[i]!, d = comp(p.scene).d, from = p.from ?? 0, to = p.to ?? d - 1, len = ends[i]! - starts[i]!;
  // No anchors: the scene was built on the narration's timing (frame = time).
  if (!p.anchors) return Math.min(to, from + local);
  const pts: Array<[number, number]> = [[from, 0], ...p.anchors.map(([sf, sec]) => [sf, sec * FPS - starts[i]!] as [number, number]), [to, len - 1]];
  pts.sort((a, b) => a[1] - b[1]);
  for (let k = 1; k < pts.length; k++) {
    const [a0, b0] = pts[k - 1]!, [a1, b1] = pts[k]!;
    if (local <= b1) return a0 + (a1 - a0) * clamp01((local - b0) / Math.max(1, b1 - b0));
  }
  return to;
}

/** Inverse of remap: the passage frame where a scene frame is shown (titles animate in real time). */
function unmap(i: number, sf: number) {
  const p = P[i]!, d = comp(p.scene).d, from = p.from ?? 0, to = p.to ?? d - 1, len = ends[i]! - starts[i]!;
  if (!p.anchors) return sf - from;
  const pts: Array<[number, number]> = [[from, 0], ...p.anchors.map(([a, sec]) => [a, sec * FPS - starts[i]!] as [number, number]), [to, len - 1]];
  pts.sort((a, b) => a[0] - b[0]);
  if (sf <= pts[0]![0]) return pts[0]![1] + (sf - pts[0]![0]);
  for (let k = 1; k < pts.length; k++) {
    const [a0, b0] = pts[k - 1]!, [a1, b1] = pts[k]!;
    if (sf <= a1) return b0 + (b1 - b0) * ((sf - a0) / Math.max(1, a1 - a0));
  }
  return pts[pts.length - 1]![1] + (sf - pts[pts.length - 1]![0]);
}

const Remapped: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const { C } = comp(P[i]!.scene);
  const map = React.useMemo(() => ({ now: f, toReal: (sf: number) => unmap(i, sf) }), [f, i]);
  // Freeze adds the enclosing sequence's offset and clamps to the composition length: a sequence
  // starting at 0 keeps the frozen frame equal to the scene's own frame, even near the end.
  return <TimeMapContext.Provider value={map}><Sequence from={0} layout="none"><Freeze frame={remap(i, f)}><C /></Freeze></Sequence></TimeMapContext.Provider>;
};

const BridgeOverlay: React.FC<{ k: number }> = ({ k }) => {
  const f = useCurrentFrame();
  const key = `${P[k]!.scene}>${P[k + 1]!.scene}`;
  const Bridge = BRIDGE_FOR[key];
  if (Bridge === null) return null; // the next scene starts exactly where this one ends: no bridge
  if (!Bridge) throw new Error(`No bridge for ${key}`);
  // Exact handoff (the bridge ends on the next scene's own image): the ground goes first, then the
  // bridge, so the image never dips while both are half transparent.
  const exact = key === '01>02';
  const ground = seg(f, 0, BRIDGE * 0.28) * (1 - seg(f, BRIDGE * 0.74, BRIDGE * (exact ? 0.86 : 1)));
  const el = seg(f, 0, BRIDGE * 0.22) * (1 - seg(f, BRIDGE * (exact ? 0.88 : 0.8), BRIDGE));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: P[k + 1]!.scene === '16' ? '#060607' : THEME.bg, opacity: ground }} />
      <AbsoluteFill style={{ opacity: el }}><Bridge t={clamp01(seg(f, BRIDGE * 0.2, BRIDGE * 0.72))} u={f / BRIDGE} /></AbsoluteFill>
    </AbsoluteFill>
  );
};

export const VoiceEpisode: React.FC<{ qa?: boolean }> = ({ qa }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <TransitionSeries>
        {P.flatMap((p, i) => [
          <TransitionSeries.Sequence key={`s${i}`} name={`${p.scene}${p.from !== undefined ? ` (${p.from}-${p.to})` : ''}`} durationInFrames={ends[i]! - starts[i]!} premountFor={fps}><Remapped i={i} /></TransitionSeries.Sequence>,
          ...(i < P.length - 1 ? [<TransitionSeries.Overlay key={`b${i}`} durationInFrames={BRIDGE} premountFor={fps}><BridgeOverlay k={i} /></TransitionSeries.Overlay>] : []),
        ])}
      </TransitionSeries>
      {/* voice + music + sound effects, built by audio/mix.py */}
      <Audio src={staticFile('audio/mix.m4a')} />
      {qa && <TextQA />}
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { S16 } from '../data/scene16';
import { EASE, THEME, lerp, seg } from '../theme';

const B = S16.beats;
const WX = (i: number) => 960 + (i - (S16.words.length - 1) / 2) * 400;
const word: React.CSSProperties = { position: 'absolute', width: 600, textAlign: 'center', fontFamily: THEME.serif, fontWeight: 300, textTransform: 'uppercase', color: THEME.ink };

export const Scene16: React.FC = () => {
  const f = useCurrentFrame();
  const q = EASE.out(seg(f, B.question, B.question + 30)) * (1 - seg(f, B.qOut, B.qOut + 20));
  const conv = EASE.inOut(seg(f, B.converge, B.converge + 40));
  return (
    <AbsoluteFill style={{ background: '#060607' }}>
      <CameraRig shots={S16.camera} start={S16.cameraStart}>
        <div style={{ ...word, left: 160, width: 1600, top: 500, fontSize: 64, opacity: q, filter: `blur(${(1 - q) * 6}px)` }}>{S16.question}</div>
        {S16.words.map((w, i) => {
          const app = EASE.out(seg(f, B.words + i * 22, B.words + i * 22 + 24));
          const mt = EASE.inOut(seg(f, B.morph + i * 40, B.morph + i * 40 + 36)); // one concept becomes another
          const x = lerp(WX(i), 960, conv), o = app * Math.pow(1 - conv, 3);
          const style = { ...word, left: x - 300, top: 500, fontSize: 56, filter: undefined as string | undefined };
          return (
            <React.Fragment key={w.from}>
              <div style={{ ...style, opacity: o * (1 - mt), letterSpacing: `${0.04 + mt * 0.4}em`, filter: `blur(${mt * 8 + conv * 10}px)`, color: THEME.muted }}>{w.from}</div>
              {w.to && <div style={{ ...style, opacity: o * mt, letterSpacing: `${0.44 - mt * 0.4}em`, filter: `blur(${(1 - mt) * 8 + conv * 10}px)`, color: i === 0 ? THEME.accent : THEME.ink }}>{w.to}</div>}
            </React.Fragment>
          );
        })}
        {S16.final.map((t, k) => {
          const a = EASE.out(seg(f, k ? B.final2 : B.final1, (k ? B.final2 : B.final1) + 30));
          return <div key={t} style={{ ...word, left: 260, width: 1400, top: k ? 590 : 470, fontSize: k ? 48 : 92, color: k ? THEME.muted : THEME.ink, letterSpacing: k ? '0.2em' : '0.03em', fontFamily: k ? THEME.sans : THEME.serif, opacity: a, filter: `blur(${(1 - a) * 8}px)` }}>{t}</div>;
        })}
      </CameraRig>
    </AbsoluteFill>
  );
};

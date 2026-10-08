import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { S16 } from '../data/scene16';
import { EASE, THEME, lerp, seg } from '../theme';
import { Title } from '../type/Title';

const B = S16.beats;
const WX = (i: number) => 960 + (i - (S16.words.length - 1) / 2) * 400;
const word: React.CSSProperties = { position: 'absolute', width: 600, textAlign: 'center', fontFamily: THEME.serif, fontWeight: 300, textTransform: 'uppercase', color: THEME.ink };

export const Scene16: React.FC = () => {
  const f = useCurrentFrame();
  const q = EASE.out(seg(f, B.question, B.question + 30)) * (1 - seg(f, B.qOut, B.qOut + 20));
  const conv = EASE.inOut(seg(f, B.converge, B.converge + 20)); // converge fast: CAPACITÉ emerges from this point
  return (
    <AbsoluteFill style={{ background: '#060607' }}>
      <CameraRig shots={S16.camera} start={S16.cameraStart}>
        {/* The question comes into focus; "vraiment" is what it asks. */}
        <Title text={S16.question} at={B.question} out={B.qOut} top={500} size={64} family="TITLE_FOCUS" layout="inline" focus={[1]} tracking={0.03} camera={false} />
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
        {/* The answer (« une capacité limitée, à un moment précis ») is told letter by letter by the
            kinetic layer CapacityLimit (src/kinetic), drawn over the episode on the voice's time. */}
      </CameraRig>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { PriceCounter } from '../components/price';
import { SplitScreen } from '../components/editorial';
import { RevenueManager } from '../components/system';
import { pricingInputs } from '../data/entities';
import { S01 } from '../data/scene01';
import { EASE, THEME, seg } from '../theme';

const B = S01.beats;

const Route: React.FC<{ from: string; to: string; appear: number; size?: number; draw?: boolean }> = ({ from, to, appear, size = 30, draw = true }) => {
  const frame = useCurrentFrame();
  const t = EASE.out(seg(frame, appear, appear + 22));
  const line = draw ? EASE.inOut(seg(frame, appear + 6, appear + 34)) : 1;
  const label: React.CSSProperties = { fontFamily: THEME.sans, fontSize: size, letterSpacing: '0.32em', textTransform: 'uppercase', color: THEME.ink, fontWeight: 400 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.9, opacity: t }}>
      <span style={label}>{from}</span>
      <svg width={size * 4} height={size} viewBox={`0 0 ${size * 4} ${size}`}>
        <line x1={0} y1={size / 2} x2={size * 4 * line} y2={size / 2} stroke={THEME.muted} strokeWidth={1.5} />
        {line > 0.98 && <path d={`M${size * 4 - 9},${size / 2 - 6} L${size * 4},${size / 2} L${size * 4 - 9},${size / 2 + 6}`} stroke={THEME.muted} strokeWidth={1.5} fill="none" />}
      </svg>
      <span style={label}>{to}</span>
    </div>
  );
};

/** One pane of the split screen: a title and its price, centred in its half. */
const Pane: React.FC<{ kicker: string; children: React.ReactNode; steps: typeof S01.flight; appear: number; color?: string }> = ({ kicker, children, steps, appear, color }) => {
  const frame = useCurrentFrame();
  const t = EASE.out(seg(frame, appear, appear + 18));
  return (
    <AbsoluteFill style={{ width: 960, alignItems: 'center', justifyContent: 'center', opacity: t }}>
      <div style={{ fontFamily: THEME.sans, fontSize: 18, letterSpacing: '0.34em', color: THEME.muted, textTransform: 'uppercase', marginBottom: 26 }}>{kicker}</div>
      {children}
      <PriceCounter steps={steps} size={132} color={color} style={{ marginTop: 44 }} />
    </AbsoluteFill>
  );
};

export const Scene01: React.FC = () => {
  const frame = useCurrentFrame();
  const alone = frame < B.cut;
  const split = seg(frame, B.split, B.split + 26);
  const out = EASE.in(seg(frame, B.out, B.out + 14));
  // POURQUOI ? lands, holds, then shrinks into the centre of the system (MORPH).
  const why = seg(frame, B.why, B.why + 8);
  const shrink = EASE.inOut(seg(frame, B.morph, B.morph + 40));
  const ring = EASE.out(seg(frame, B.morph + 10, B.morph + 40));

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S01.camera} impacts={S01.impacts}>
        {/* Act 1 — the flight alone. */}
        {alone && (
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Route from={S01.route.from} to={S01.route.to} appear={B.route} />
            <div style={{ marginTop: 54, opacity: EASE.out(seg(frame, B.price, B.price + 20)), filter: `blur(${(1 - seg(frame, B.price, B.price + 16)) * 8}px)` }}>
              <PriceCounter steps={S01.flight} size={190} />
            </div>
          </AbsoluteFill>
        )}

        {/* Act 2 — CUT: flight | hotel, two prices living their own lives. */}
        {!alone && frame < B.out + 16 && (
          <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined }}>
            <SplitScreen
              split={split}
              left={<Pane kicker="Vol" steps={S01.flight} appear={B.cut}><Route from={S01.route.from} to={S01.route.to} appear={-100} size={22} draw={false} /></Pane>}
              right={
                <Pane kicker="Hôtel" steps={S01.hotel.steps} appear={B.split + 8} color={THEME.ink}>
                  <div style={{ fontFamily: THEME.sans, fontSize: 22, letterSpacing: '0.32em', textTransform: 'uppercase', color: THEME.ink }}>{S01.hotel.title}</div>
                </Pane>
              }
            />
          </AbsoluteFill>
        )}

        {/* Act 3 — the question, which becomes the centre of a system. */}
        {frame >= B.why && (
          <>
            <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              {ring > 0 && <ellipse cx={960} cy={540} rx={250 * ring} ry={250 * 0.62 * ring} fill="none" stroke={THEME.line} strokeWidth={1.5} />}
              <RevenueManager cx={960} cy={540} radius={640} centreR={250} inputs={pricingInputs} appear={B.morph + 24} stagger={6} />
            </svg>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: THEME.serif, fontWeight: 300, fontSize: 168 - 88 * shrink, color: THEME.ink, letterSpacing: '-0.01em', opacity: why, transform: `scale(${1 + (1 - why) * 0.08})` }}>{S01.why}</div>
            </AbsoluteFill>
          </>
        )}
      </CameraRig>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { Aircraft } from '../components/aircraft';
import { PriceCounter } from '../components/price';
import { Caps } from '../components/ui';
import { S01 } from '../data/scene01';
import { EASE, THEME, clamp01, lerp, seg } from '../theme';

const B = S01.beats;

const Route: React.FC<{ from: string; to: string; appear: number; size?: number }> = ({ from, to, appear, size = 30 }) => {
  const frame = useCurrentFrame();
  const t = EASE.out(seg(frame, appear, appear + 22));
  const line = EASE.inOut(seg(frame, appear + 6, appear + 34));
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

/** One of the three things that do not change: an icon and its caption, landing on its word. */
const Same: React.FC<{ x: number; at: number; label: string; children: React.ReactNode }> = ({ x, at, label, children }) => {
  const f = useCurrentFrame();
  const t = EASE.out(seg(f, at - 4, at + 16));
  return (
    <div style={{ position: 'absolute', left: x - 200, width: 400, top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: t, transform: `translateY(${(1 - t) * 14}px)` }}>
      <svg width={240} height={170} viewBox="0 0 240 170" style={{ overflow: 'visible' }}>{children}</svg>
      <Caps size={24} color={THEME.ink} style={{ marginTop: 26 }}>{label}</Caps>
    </div>
  );
};

/** The question in the documentary's serif, readable for as long as the voice asks it. */
const Question: React.FC<{ text: string; at: number; y: number; dim?: number; size?: number }> = ({ text, at, y, dim = 0, size = 92 }) => {
  const f = useCurrentFrame();
  const t = EASE.out(seg(f, at - 3, at + 14));
  return <div style={{ position: 'absolute', left: 0, width: 1920, top: y, textAlign: 'center', fontFamily: THEME.serif, fontWeight: 300, fontSize: size, color: THEME.ink, opacity: t * (1 - 0.6 * dim), transform: `translateY(${(1 - t) * 12}px)`, filter: t < 1 ? `blur(${(1 - t) * 6}px)` : undefined }}>{text}</div>;
};

export const Scene01: React.FC = () => {
  const f = useCurrentFrame();
  // The booking app: open, closed ("vous fermez l'application"), opened again hours later.
  const closed = EASE.inOut(seg(f, B.close, B.close + 10)) * (1 - EASE.out(seg(f, B.back, B.back + 12)));
  const appear = EASE.out(seg(f, B.price, B.price + 16));
  const up = EASE.inOut(seg(f, B.same, B.same + 24)); // the price steps aside for what stays the same
  const gone = EASE.in(seg(f, B.out, B.out + 12));
  const card = { scale: lerp(1, 0.62, up) * lerp(1, 0.9, closed), y: lerp(0, -250, up), o: (1 - closed) * (1 - gone) };
  const caption = (text: string, at: number, out: number) => {
    const o = EASE.out(seg(f, at, at + 10)) * (1 - seg(f, out, out + 10));
    return o > 0 ? <div style={{ position: 'absolute', left: 0, width: 1920, top: 300, textAlign: 'center', opacity: o }}><Caps size={30} color={THEME.ink}>{text}</Caps></div> : null;
  };
  const why = f >= B.why - 4;
  const ring = EASE.inOut(seg(f, B.ring, S01.duration));

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S01.camera}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: card.o, transform: `translateY(${card.y}px) scale(${card.scale})` }}>
          <Route from={S01.route.from} to={S01.route.to} appear={B.route} />
          <div style={{ marginTop: 54, opacity: appear, filter: `blur(${(1 - seg(f, B.price, B.price + 14)) * 8}px)` }}>
            <PriceCounter steps={S01.flight} size={190} />
          </div>
        </AbsoluteFill>
        {/* The app closing leaves a thin line, like a phone screen going to sleep. */}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: closed }}>
          <div style={{ width: lerp(520, 80, closed), height: 2, background: THEME.line }} />
        </AbsoluteFill>
        {caption(S01.text.later, B.later, B.back + 6)}
        {caption(S01.text.nextDay, B.nextDay, B.nextDay + 40)}
      </CameraRig>

      {/* What does not change: the aircraft, the seat, the route. */}
      {f < B.out + 14 && (
        <div style={{ opacity: 1 - gone }}>
          <Same x={500} at={B.plane} label={S01.text.plane}><g transform="translate(120,85) rotate(90) scale(0.8) translate(-100,-95)"><Aircraft length={200} color={THEME.ink} /></g></Same>
          <Same x={960} at={B.seat} label={S01.text.seat}>
            <rect x={70} y={40} width={100} height={100} rx={20} fill="none" stroke={THEME.ink} strokeWidth={2.4} />
            <rect x={82} y={20} width={76} height={14} rx={5} fill={THEME.ink} />
          </Same>
          <Same x={1420} at={B.trip} label={S01.text.trip}>
            <circle cx={30} cy={90} r={8} fill={THEME.ink} /><circle cx={210} cy={90} r={8} fill={THEME.ink} />
            <path d="M30,90 Q120,10 210,90" fill="none" stroke={THEME.ink} strokeWidth={2} strokeDasharray="6 8" />
            <text x={30} y={135} textAnchor="middle" fontFamily={THEME.sans} fontSize={16} letterSpacing="0.2em" fill={THEME.muted}>PAR</text>
            <text x={210} y={135} textAnchor="middle" fontFamily={THEME.sans} fontSize={16} letterSpacing="0.2em" fill={THEME.muted}>NYC</text>
          </Same>
        </div>
      )}

      {/* The two questions, each held while the voice asks it; then they close into a ring. */}
      {why && (
        <AbsoluteFill style={{ opacity: 1 - ring, transform: `scale(${lerp(1, 0.4, ring)})`, filter: ring > 0 ? `blur(${ring * 6}px)` : undefined }}>
          <Question text={S01.text.why} at={B.why} y={360} dim={seg(f, B.who, B.who + 12)} />
          <Question text={S01.text.who} at={B.who} y={520} size={104} />
        </AbsoluteFill>
      )}
      {ring > 0 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <ellipse cx={960} cy={540} rx={215 * clamp01(ring * 1.2)} ry={133 * clamp01(ring * 1.2)} fill="none" stroke={THEME.line} strokeWidth={1.6} opacity={ring} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

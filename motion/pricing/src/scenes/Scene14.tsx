import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig } from '../camera/CameraRig';
import { Caps, Statement } from '../components/ui';
import { S14 } from '../data/scene14';
import { EASE, THEME, clamp01, lerp, seg } from '../theme';

const B = S14.beats;
const X0 = 520, X1 = 1400, Y = (v: number) => 900 - ((v - 100) / 130) * 380;
type Pt = { x: number; v: number };
/** Price of a scenario at a position along the wait (steps: the price holds until the next change). */
const priceAt = (s: Pt[], x: number) => { let v = s[0]!.v; for (const p of s) if (x >= p.x) v = p.v; return v; };
const stepPath = (s: Pt[], upTo: number) => {
  let d = `M${X0},${Y(s[0]!.v)}`, v = s[0]!.v;
  for (const p of s.slice(1)) { if (p.x > upTo) break; d += ` L${lerp(X0, X1, p.x)},${Y(v)} L${lerp(X0, X1, p.x)},${Y(p.v)}`; v = p.v; }
  return d + ` L${lerp(X0, X1, upTo)},${Y(v)}`;
};

export const Scene14: React.FC = () => {
  const f = useCurrentFrame();
  const card = EASE.out(seg(f, B.card, B.card + 30));
  // Scenario A runs, stops dead, rewinds; then scenario B.
  const aRun = EASE.inOut(seg(f, B.wait, B.waitEnd));
  const rew = EASE.inOut(seg(f, B.rewind, B.rewindEnd));
  const aPos = f < B.rewind ? aRun : 1 - rew;
  const bPos = EASE.inOut(seg(f, B.b, B.bEnd)) * 0.95;
  const inB = f >= B.b;
  const pos = inB ? bPos : aPos;
  const scen = inB ? S14.b : S14.a;
  const price = priceAt(scen, pos);
  const frozen = f >= B.stop && f < B.rewind;
  const rewinding = f >= B.rewind && f < B.rewindEnd;
  const fork = EASE.inOut(seg(f, B.fork, B.fork + 40));
  const up = price > 129, down = price < 129;

  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S14.camera} impacts={S14.impacts}>
        <AbsoluteFill style={{ filter: rewinding ? `blur(${2 * Math.sin(Math.PI * rew)}px)` : frozen ? 'grayscale(1) brightness(0.8)' : undefined }}>
          {/* The booking card: never booked. */}
          <div style={{ position: 'absolute', left: 660, top: 70, width: 600, height: 330, border: `1.5px solid ${THEME.line}`, borderRadius: 18, padding: '34px 40px', boxSizing: 'border-box', opacity: card, transform: `translateY(${(1 - card) * 14}px)`, fontFamily: THEME.sans, color: THEME.ink }}>
            <Caps size={16} color={THEME.ink}>{S14.offer.title}</Caps>
            <div style={{ fontSize: 18, color: THEME.muted, marginTop: 10 }}>{S14.offer.detail}</div>
            <div style={{ fontSize: 96, fontWeight: 300, marginTop: 18, fontVariantNumeric: 'tabular-nums', color: up ? THEME.accent : down ? THEME.cool : THEME.ink }}>{price}<span style={{ fontSize: 34, color: THEME.muted, marginLeft: 10 }}>€</span></div>
            <div style={{ position: 'absolute', right: 40, bottom: 36, padding: '12px 26px', border: `1.5px solid ${THEME.ink}`, borderRadius: 999, fontSize: 18, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.6 }}>{S14.offer.cta}</div>
            <div style={{ position: 'absolute', left: 40, bottom: 44, fontSize: 18, color: THEME.muted, opacity: seg(f, B.wait - 10, B.wait + 10) * (f < B.fork ? 0.6 + 0.4 * Math.sin(f * 0.15) ** 2 : 0) }}>{S14.offer.waiting}</div>
          </div>

          <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} opacity={card}>
            <line x1={X0} y1={930} x2={X1} y2={930} stroke={THEME.line} strokeWidth={1.4} />
            {S14.ticks.map((t, i) => { const x = lerp(X0, X1, i / (S14.ticks.length - 1)); return <g key={t}><line x1={x} y1={922} x2={x} y2={938} stroke={THEME.line} strokeWidth={1.4} /><text x={x} y={968} textAnchor="middle" fontFamily={THEME.sans} fontSize={16} letterSpacing="0.14em" fill={THEME.muted}>{t}</text></g>; })}
            <line x1={X0 - 20} y1={Y(129)} x2={X1 + 20} y2={Y(129)} stroke={THEME.faint} strokeDasharray="4 8" />
            {/* The uncertainty between both futures. */}
            {fork > 0 && <path d={`M${X0},${Y(129)} L${X1},${Y(214 + 20)} L${X1},${Y(119 - 20)} Z`} fill={THEME.ink} fillOpacity={0.06 * fork} />}
            {/* Scenario A (rising) — drawn, frozen, rewound; it returns faint for the fork. */}
            {(!inB || fork > 0) && <path d={stepPath(S14.a, inB ? 0.95 : Math.max(0.0001, aPos))} fill="none" stroke={THEME.accent} strokeWidth={3} opacity={inB ? 0.45 * fork : 1} />}
            {inB && <path d={stepPath(S14.b, Math.max(0.0001, bPos))} fill="none" stroke={THEME.cool} strokeWidth={3} />}
            <circle cx={lerp(X0, X1, pos)} cy={Y(price)} r={7} fill={inB ? THEME.cool : THEME.accent} />
          </svg>
        </AbsoluteFill>
        {frozen && <div style={{ position: 'absolute', left: 0, width: 1920, top: 470, textAlign: 'center' }}><Caps size={22} color={THEME.ink}>■ ■</Caps></div>}
        {rewinding && <div style={{ position: 'absolute', left: 0, width: 1920, top: 470, textAlign: 'center' }}><Caps size={26} color={THEME.ink}>◀◀</Caps></div>}
      </CameraRig>
      <Statement text={S14.text.works} at={B.works} out={B.fork} top={432} size={56} />
      <Statement text={S14.text.bet} at={B.bet} top={424} size={72} color={THEME.ink} />
    </AbsoluteFill>
  );
};

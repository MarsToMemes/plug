import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Caps } from '../components/ui';
import { S20 } from '../data/scene20';
import { EASE, THEME, lerp, seg } from '../theme';

const B = S20.beats, K = S20.card;
// Where scene 17 starts: the PRICE node of the machine (frame 24 of scene 17).
export const PRICE_NODE = { x: 960, y: 450.5, r: 63.2 };

export const Scene20: React.FC = () => {
  const f = useCurrentFrame();
  const draw = EASE.inOut(seg(f, B.draw, B.draw + 36));
  const become = EASE.inOut(seg(f, B.become, S20.duration));
  const card = 1 - seg(f, B.become, B.become + 12);
  const price = EASE.out(seg(f, B.price, B.price + 12));
  const quote = EASE.out(seg(f, B.quote, B.quote + 12)) * (1 - seg(f, B.strike + 18, B.strike + 30));
  const strike = EASE.inOut(seg(f, B.strike, B.strike + 12));
  const per = 2 * (K.w + K.h);
  // The price leaves the ticket and takes the place of the machine's centre.
  const px = lerp(960, PRICE_NODE.x, become), py = lerp(K.y + 230, PRICE_NODE.y, become);
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <g opacity={card}>
          <rect x={K.x} y={K.y} width={K.w} height={K.h} rx={24} fill="none" stroke={THEME.line} strokeWidth={1.6} strokeDasharray={`${per * draw} ${per}`} />
          {/* The stub of the ticket: a perforation and a barcode, drawn after the outline. */}
          <line x1={K.x + K.w - 170} y1={K.y + 20} x2={K.x + K.w - 170} y2={K.y + K.h - 20} stroke={THEME.line} strokeDasharray="4 8" opacity={seg(f, B.details, B.details + 12)} />
          {Array.from({ length: 22 }, (_, j) => <rect key={j} x={K.x + K.w - 140 + j * 5} y={K.y + 250} width={j % 3 ? 2 : 3} height={110} fill={THEME.muted} opacity={seg(f, B.details + j, B.details + j + 6)} />)}
        </g>
        {become > 0 && <circle cx={PRICE_NODE.x} cy={PRICE_NODE.y} r={PRICE_NODE.r * become} fill={THEME.bg} stroke={THEME.ink} strokeWidth={2} opacity={become} />}
        {become > 0.3 && <text x={PRICE_NODE.x} y={PRICE_NODE.y + 8.2} textAnchor="middle" fontFamily={THEME.serif} fontSize={30.6} letterSpacing="0.08em" fill={THEME.ink} opacity={seg(become, 0.5, 1)}>{S20.text.centre.toUpperCase()}</text>}
      </svg>
      <div style={{ position: 'absolute', left: K.x + 50, top: K.y + 46, opacity: card * seg(f, B.kicker, B.kicker + 12) }}><Caps size={18}>{S20.text.kicker}</Caps></div>
      <div style={{ position: 'absolute', left: K.x + 50, top: K.y + 96, opacity: card * seg(f, B.route, B.route + 12) }}><Caps size={26} color={THEME.ink}>{S20.text.route}</Caps></div>
      <div style={{ position: 'absolute', left: K.x + 50, top: K.y + K.h - 70, opacity: card * seg(f, B.details + 10, B.details + 22) }}><Caps size={16}>{S20.text.seat}</Caps></div>
      {/* The price: on the ticket first, then flying to the centre of the machine and fading into it. */}
      <div style={{ position: 'absolute', left: px - 400, width: 800, top: py - lerp(70, 20, become), textAlign: 'center', fontFamily: THEME.sans, fontWeight: 300, fontSize: lerp(140, 36, become), color: THEME.ink, opacity: price * (1 - seg(become, 0.45, 0.85)), fontVariantNumeric: 'tabular-nums' }}>{S20.price} €</div>
      {/* What it seems to say: a label. Struck through when the voice says it is not that. */}
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 150, textAlign: 'center', opacity: quote }}>
        <span style={{ position: 'relative', fontFamily: THEME.serif, fontWeight: 300, fontSize: 64, color: THEME.ink }}>
          {S20.text.quote}
          <span style={{ position: 'absolute', left: -12, top: '54%', height: 3, width: `calc(${strike * 100}% + 24px)`, background: THEME.accent }} />
        </span>
      </div>
    </AbsoluteFill>
  );
};

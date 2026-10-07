import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Caps, Statement } from '../components/ui';
import { flight } from '../data/entities';
import { S19 } from '../data/scene19';
import { EASE, THEME, clamp01, lerp, rng, seg } from '../theme';
import { aircraftLayout, place } from './layout02';

const B = S19.beats;
export const CAB19 = (cy: number) => { const l = aircraftLayout(S19.seats, flight.layout, 820, cy); return { body: place(l.body, 0.92, 0, 0, 820, cy), units: l.units.map((u) => place(u, 0.92, 0, 0, 820, cy)) }; };
export const Y19 = { a: 372, b: 728 };
const A = CAB19(Y19.a), Bc = CAB19(Y19.b);
const ORDER = (() => { const r = rng(1919); return Array.from({ length: S19.seats }, (_, i) => i).sort(() => r() - 0.5); })();
const rankOf = new Array<number>(S19.seats); ORDER.forEach((s, k) => (rankOf[s] = k));
const revA = S19.fullA * S19.fares.low;
const revB = S19.fullB * ((1 - S19.dearShareB) * S19.fares.low + S19.dearShareB * S19.fares.high);
const BAR = { x: 1430, w: 380 };

export const Scene19: React.FC = () => {
  const f = useCurrentFrame();
  const cab = EASE.out(seg(f, B.cabins, B.cabins + 24));
  const fa = seg(f, B.fillA, B.fillAEnd), fb = seg(f, B.fillB, B.fillBEnd);
  const cheap = EASE.inOut(seg(f, B.cheap, B.cheap + 30)), dear = seg(f, B.dear, B.dearEnd);
  const bars = EASE.out(seg(f, B.bars, B.bars + 60));
  // "Chaque siège occupé à n'importe quel prix": a wave runs through aircraft A's cheap seats.
  const wave = seg(f, B.any, B.any + 90), anyOn = seg(f, B.any, B.any + 12) * (1 - seg(f, B.value - 8, B.value + 4));
  const cabin = (c: typeof A, fill: number, full: number, plane: 'a' | 'b') => (
    <g opacity={cab}>
      <rect x={c.body.x} y={c.body.y} width={c.body.w} height={c.body.h} rx={c.body.h / 2} fill="none" stroke={THEME.line} strokeWidth={2} />
      {c.units.map((u, i) => {
        const r = rankOf[i]!, sold = r < full * fill;
        const isDear = plane === 'b' && r < full * S19.dearShareB * dear;
        const lift = plane === 'a' && wave > 0 && wave < 1 ? Math.max(0, 1 - Math.abs((u.x - c.body.x) / c.body.w - wave) * 8) : 0;
        return <rect key={i} x={u.x} y={u.y} width={u.w} height={u.h} rx={4} fill={isDear ? THEME.accent : THEME.ink} fillOpacity={sold ? (isDear ? 0.95 : lerp(0.85, 0.4, cheap) + 0.5 * lift) : 0} stroke={isDear ? THEME.accent : THEME.ink} strokeOpacity={sold ? 0.6 : 0.5} strokeWidth={1.2} />;
      })}
    </g>
  );
  const bar = (y: number, v: number, hot: boolean) => (
    <g opacity={bars}>
      <rect x={BAR.x} y={y - 16} width={BAR.w} height={32} fill="none" stroke={THEME.faint} strokeWidth={1.2} />
      <rect x={BAR.x} y={y - 16} width={BAR.w * (v / Math.max(revA, revB)) * bars} height={32} fill={hot ? THEME.accent : THEME.ink} opacity={0.85} />
    </g>
  );
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {cabin(A, fa, S19.fullA, 'a')}
        {cabin(Bc, fb, S19.fullB, 'b')}
        {bar(Y19.a, revA, false)}
        {bar(Y19.b, revB, f > B.verdict)}
        {/* "Optimiser la valeur de l'ensemble des sièges": value flows from the seats to the revenue. */}
        {f >= B.flow && [[A, S19.fullA, Y19.a, 14, false], [Bc, S19.fullB, Y19.b, 22, true]].map(([c, full, y, n, hot], p) =>
          Array.from({ length: n as number }, (_, j) => {
            const seat = ORDER[(j * 7) % (full as number)]!, u = (c as typeof A).units[seat]!;
            const k = ((f - B.flow) / 45 + j / (n as number)) % 1;
            return <circle key={`${p}-${j}`} cx={lerp(u.x + u.w / 2, BAR.x, EASE.inOut(k))} cy={lerp(u.y + u.h / 2, y as number, EASE.inOut(k))} r={3.5} fill={hot && j % 2 ? THEME.accent : THEME.ink} opacity={Math.sin(Math.PI * k) * seg(f, B.flow, B.flow + 15)} />;
          }))}
      </svg>
      {[[A, S19.text.a, S19.text.fullA, fa], [Bc, S19.text.b, S19.text.fullB, fb]].map(([c, name, full, t]) => (
        <div key={name as string} style={{ position: 'absolute', left: 112, top: (c as typeof A).body.y - 48 - 22, height: 22, opacity: cab, display: 'flex', gap: 48, alignItems: 'center', whiteSpace: 'nowrap' }}>
          <Caps size={18} color={THEME.ink}>{name}</Caps>
          <Caps size={18} color={THEME.muted} style={{ opacity: clamp01((t as number) * 3) }}>{full}</Caps>
        </div>
      ))}
      <div style={{ position: 'absolute', left: BAR.x, top: A.body.y - 48 - 22, height: 22, display: 'flex', alignItems: 'center', opacity: bars }}><Caps size={18} color={THEME.ink}>{S19.text.revenue}</Caps></div>
      <div style={{ position: 'absolute', left: 112, top: 948, opacity: seg(f, B.cheap, B.cheap + 20), display: 'flex', gap: 40, alignItems: 'center' }}>
        <span style={{ display: 'inline-block', width: 18, height: 18, background: THEME.ink, opacity: 0.4 }} /><Caps size={16}>{S19.text.low}</Caps>
        <span style={{ display: 'inline-block', width: 18, height: 18, background: THEME.accent, opacity: seg(f, B.dear, B.dear + 20) }} /><span style={{ opacity: seg(f, B.dear, B.dear + 20) }}><Caps size={16}>{S19.text.high}</Caps></span>
      </div>
      <div style={{ position: 'absolute', left: 112, top: Bc.body.y + Bc.body.h + 24, opacity: anyOn }}><Caps size={24} color={THEME.accent}>{S19.text.any}</Caps></div>
      <Statement family="TITLE_FOCUS" text={S19.text.question} at={B.question} out={B.verdict - 10} top={60} size={52} fade={12} />
      <Statement family="TITLE_MORPH" focus={[1]} text={S19.text.verdict} at={B.verdict} out={B.value - 10} top={60} size={56} fade={12} />
      <Statement family="TITLE_SLIDE" text={S19.text.value} at={B.value} out={B.rm - 10} top={60} size={56} fade={12} />
      <Statement family="TITLE_SCALE" focus={[1]} text={S19.text.rm} at={B.rm} top={60} size={56} fade={12} />
    </AbsoluteFill>
  );
};

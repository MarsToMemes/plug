import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';

/**
 * ShopGoal — a purchase goal, and what reaching it costs.
 *
 * A horizontal gauge runs towards a clearly marked threshold; the camera tracks the fill sideways.
 * The fill slows right before the threshold, then one last block slides in and completes it — that
 * block is the extra spend. The layout then reorganises: the gauge goes up, and two panels set the
 * potential reward against the extra spend, in a fixed final view built for comparison.
 *
 * ILLUSTRATION, NOT EVIDENCE: amounts, threshold, conditions and source are props, to be filled in
 * post-production from a real offer. Empty props show dashed « à compléter » slots, empty bars (no
 * proportion is implied) and an « ILLUSTRATION » note. Filled values make the bars to scale and
 * show the source.
 */
export type GoalProps = {
  threshold: string | null; // e.g. "49,00 €"
  reward: string | null; // e.g. "Livraison offerte (3,99 €)"
  rewardValue: number | null; // in €, for the bar
  extra: string | null; // e.g. "+12,99 €"
  extraValue: number | null; // in €, for the bar
  condition: string | null; // e.g. "dès 49 € d'achat, hors promotions"
  source: string | null; // e.g. "Offre relevée le 12/10/2026 sur …"
};
export const GOAL_DEFAULTS: GoalProps = { threshold: null, reward: null, rewardValue: null, extra: null, extraValue: null, condition: null, source: null };
export const GOAL = { fps: 60, seconds: 10 };

// ---------------------------------------------------------------- palette & layout
const PAPER = '#F3F1EC', INK = '#121212', MUTED = '#8A877F', LINE = '#DAD6CE', GREEN = '#1F8A4C', RED = '#D9442B';
const X0 = 200, L = 2600, TH = X0 + L, Y = 540, H = 26; // gauge (world)
const PRE = 0.93, CRAWL = 0.965; // the fill reaches PRE fast, crawls to CRAWL, the last block does the rest

// ---------------------------------------------------------------- timing
const FILL = [0.35, 3.6] as const, SLOW = [3.6, 4.5] as const, BLOCK = [4.55, 5.05] as const, VALID = 5.1;
const REORG = [5.6, 6.7] as const, PANELS = 6.3;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const fillEase = bez(0.45, 0, 0.35, 1), crawl = bez(0.1, 0.6, 0.3, 1), dock = bez(0.2, 0.9, 0.25, 1), move = bez(0.65, 0, 0.2, 1), settle = bez(0.16, 1, 0.3, 1);

/** Fill fraction before the last block. */
const fillAt = (t: number) => (t < SLOW[0] ? PRE * fillEase((t - FILL[0]) / (FILL[1] - FILL[0])) : lerp(PRE, CRAWL, crawl((t - SLOW[0]) / (SLOW[1] - SLOW[0]))));
function follow(t: number) {
  const w = 5.5, dt = 1 / 240; let x = X0 + 560, v = 0;
  for (let s = 0; s < t; s += dt) { const g = clamp(X0 + L * fillAt(s) + 120, X0 + 560, TH + 200); v += (w * w * (g - x) - 2 * w * v) * dt; x += v * dt; }
  return x;
}

// ---------------------------------------------------------------- pieces
const Slot: React.FC<{ value: string | null; size: number; color?: string; minW?: number }> = ({ value, size, color = INK, minW = 260 }) =>
  value ? <span style={{ fontSize: size, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{value}</span> : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, minWidth: minW, height: size * 1.15, padding: '0 18px', border: `2px dashed #CFCAC0`, borderRadius: 10, fontFamily: THEME.mono, fontSize: Math.max(14, size * 0.24), letterSpacing: '0.2em', color: MUTED, boxSizing: 'border-box' }}>À COMPLÉTER</span>
  );

export const ShopGoal: React.FC<Partial<GoalProps>> = (props) => {
  const p = { ...GOAL_DEFAULTS, ...props };
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const f = fillAt(t), block = dock((t - BLOCK[0]) / (BLOCK[1] - BLOCK[0])), done = t >= BLOCK[1];
  const valid = settle((t - VALID) / 0.3);

  // Camera: lateral tracking at scale 1, then the reorganisation (whole gauge, moved up).
  const r = move((t - REORG[0]) / (REORG[1] - REORG[0]));
  const s1 = (1920 * 0.8) / (L + 240);
  const cs = Math.exp(lerp(Math.log(1.3), Math.log(s1), r));
  const cx = lerp(follow(t), X0 + L / 2, r), cy = lerp(Y - 30, Y + (540 - 230) / s1, r);

  const blockW = L * (1 - CRAWL), blockX = TH - blockW + (1 - block) * 520; // slides in from the right, docks
  const hasValues = p.rewardValue != null && p.extraValue != null && p.rewardValue > 0 && p.extraValue > 0;
  const maxV = hasValues ? Math.max(p.rewardValue!, p.extraValue!) : 1;
  const panelA = (d: number) => settle((t - PANELS - d) / 0.55);
  const barA = (d: number) => settle((t - PANELS - 0.5 - d) / 0.8);

  const Panel: React.FC<{ x: number; d: number; label: string; value: string | null; value2: string | null; v: number | null; color: string; note: string }> = ({ x, d, label, value, value2, v, color, note }) => {
    const a = panelA(d), b = barA(d);
    return (
      <div style={{ position: 'absolute', left: x, top: 450, width: 780, opacity: a, transform: `translateY(${(1 - a) * 18}px)`, fontFamily: THEME.sans, color: INK }}>
        <div style={{ fontFamily: THEME.mono, fontSize: 16, letterSpacing: '0.26em', color: MUTED }}>{label}</div>
        <div style={{ marginTop: 18, minHeight: 100, display: 'flex', alignItems: 'center' }}><Slot value={value} size={92} color={color} minW={420} /></div>
        <div style={{ marginTop: 16, fontSize: 21, color: '#55534E', minHeight: 28 }}>{value2 ?? note}</div>
        <div style={{ position: 'relative', marginTop: 40, width: 640, height: 18, borderRadius: 9, border: hasValues ? 'none' : `2px dashed ${LINE}`, boxSizing: 'border-box' }}>
          {hasValues && v != null && <div style={{ position: 'absolute', left: 0, top: 0, height: 18, borderRadius: 9, width: 640 * (v / maxV) * b, background: color }} />}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: THEME.sans }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(960,540) scale(${cs}) translate(${-cx},${-cy})`}>
          {/* Track, graduations, fill. */}
          <rect x={X0} y={Y - H / 2} width={L} height={H} rx={H / 2} fill="#E4E0D8" />
          {Array.from({ length: 11 }, (_, i) => <rect key={i} x={X0 + (L * i) / 10 - 1} y={Y + H / 2 + 14} width={2} height={i % 5 === 0 ? 16 : 9} fill={LINE} />)}
          <rect x={X0} y={Y - H / 2} width={L * f} height={H} rx={H / 2} fill={INK} />
          {/* The last block: the extra spend. It docks, then takes the spend colour. */}
          {t >= BLOCK[0] && <rect x={blockX} y={Y - H / 2} width={blockW + 2} height={H} rx={H / 2} fill={done ? `rgb(${lerp(18, 217, valid)},${lerp(18, 68, valid)},${lerp(18, 43, valid)})` : INK} />}
          {/* The threshold: a clear marker, a label, its amount slot. */}
          <rect x={TH - 2} y={Y - 64} width={4} height={128} rx={2} fill={done ? GREEN : INK} />
          <circle cx={TH} cy={Y - 92} r={22 + 4 * Math.sin(Math.PI * clamp((t - VALID) / 0.3))} fill={done ? GREEN : PAPER} stroke={done ? GREEN : INK} strokeWidth={3} />
          {done && <path d={`M ${TH - 9} ${Y - 92} L ${TH - 2} ${Y - 85} L ${TH + 10} ${Y - 99}`} fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={34} strokeDashoffset={34 * (1 - valid)} />}
          <text x={TH} y={Y - 136} textAnchor="middle" fontFamily={THEME.mono} fontSize={22} letterSpacing="0.24em" fill={MUTED}>SEUIL</text>
          {/* « Panier » rides with the fill head: the eye follows it, the camera follows the eye. */}
          {(() => { const hx = X0 + L * (done ? 1 : f); return (<g opacity={1 - r}>
            <rect x={hx - 1} y={Y + H / 2 + 6} width={2} height={26} fill={INK} />
            <text x={hx} y={Y + H / 2 + 60} textAnchor="middle" fontFamily={THEME.mono} fontSize={20} letterSpacing="0.24em" fill={INK}>PANIER</text>
          </g>); })()}
        </g>
      </svg>
      {/* The threshold amount: screen-space, attached to the marker (stays readable at every scale). */}
      {(() => { const X = 960 + (TH - cx) * cs, Yy = 540 + (Y + 60 - cy) * cs; return (
        <div style={{ position: 'absolute', left: X, top: Yy, transform: 'translateX(-50%)', textAlign: 'center' }}><Slot value={p.threshold} size={lerp(44, 34, r)} minW={lerp(220, 180, r)} /></div>
      ); })()}
      {/* The comparison: reward on one side, extra spend on the other, one scale. */}
      {t >= PANELS && <>
        <Panel x={130} d={0} label="RÉCOMPENSE POTENTIELLE" value={p.reward} value2={p.condition} v={p.rewardValue} color={GREEN} note="Conditions de l’offre : à compléter" />
        <Panel x={1030} d={0.25} label="DÉPENSE SUPPLÉMENTAIRE" value={p.extra} value2={null} v={p.extraValue} color={RED} note="Pour atteindre le seuil" />
        <div style={{ position: 'absolute', left: 959.5, top: 450, width: 1, height: 360 * panelA(0.1), background: LINE }} />
      </>}
      {/* What this picture is. */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 60, textAlign: 'center', fontFamily: THEME.mono, fontSize: 16, letterSpacing: '0.2em', color: MUTED, opacity: settle((t - PANELS - 0.8) / 0.6) }}>
        {p.source ? `SOURCE : ${p.source.toUpperCase()}` : 'ILLUSTRATION — MONTANTS ET CONDITIONS À COMPLÉTER À PARTIR D’UNE OFFRE RÉELLE'}
      </div>
    </AbsoluteFill>
  );
};

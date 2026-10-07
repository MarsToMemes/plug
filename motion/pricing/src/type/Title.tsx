import React from 'react';
import { THEME, clamp01, lerp } from '../theme';
import { useElapsed } from './clock';
import { FAMILY_PRESET, Headline } from './Headline';
import { E } from './ease';
import { COUNT, PRESETS, ROLE_FAMILY, type CameraMove, type Family, type Pose, type Preset, type Role } from './presets';

/**
 * Title — the film's big editorial titles, animated by family (see presets.ts).
 *
 * The text carries its own hierarchy: blocks are separated by "|" ("POURQUOI|VOTRE BILLET|COÛTE|
 * PLUS CHER ?"). `focus` names the focal block(s): they arrive on their own timing and rest a
 * little heavier. `layout="stack"` puts each block on its own line, "inline" keeps one line.
 */
export type TitleProps = {
  text: string;
  at: number; // scene frame where the title starts
  out?: number; // scene frame where it leaves
  family?: Family;
  role?: Role;
  focus?: number[];
  layout?: 'stack' | 'inline';
  size?: number;
  weight?: number;
  font?: 'serif' | 'sans';
  uppercase?: boolean;
  tracking?: number; // em, at rest
  lineHeight?: number;
  top?: number;
  left?: number;
  width?: number;
  align?: 'center' | 'left';
  color?: string;
  accent?: string; // colour of the focal blocks
  intensity?: number; // multiplies the distances of the family
  speed?: number; // multiplies the durations of the family (2 = twice as long)
  camera?: CameraMove | false;
  style?: React.CSSProperties;
};

type Unit = { text: string; block: number; k: number; space: boolean };

const ADD = (a: number | undefined, b: number | undefined) => (a ?? 0) + (b ?? 0);

function units(blocks: string[], split: Preset['split']): Unit[] {
  const out: Unit[] = [];
  blocks.forEach((b, bi) => {
    const parts = split === 'block' ? [b] : split === 'word' ? b.split(' ') : Array.from(b);
    parts.forEach((p, j) => out.push({ text: p === ' ' ? ' ' : p, block: bi, k: out.length, space: split === 'word' && j < parts.length - 1 }));
  });
  return out;
}

/** Camera of a title: a push, a pull, a drift or a kick, measured from the title's start (ms). */
function cameraOf(cam: CameraMove | false | undefined, e: number, landAt: number) {
  if (!cam || cam.move === 'none' || e < 0) return { s: 1, x: 0 };
  const t = clamp01(e / cam.dur);
  if (cam.move === 'push') return { s: 1 + cam.amount * E.settle(t), x: 0 };
  if (cam.move === 'pull') return { s: 1 + cam.amount * (1 - E.settle(t)), x: 0 };
  if (cam.move === 'drift') return { s: 1, x: cam.amount * t };
  const d = e - landAt; // kick: the frame takes the impact when the title lands
  return { s: d < 0 ? 1 : 1 + cam.amount * Math.exp(-d / 150), x: 0 };
}

/** One SVG filter per blur level and axis: velocity blur along the movement only. */
const MotionBlurDefs: React.FC<{ id: string }> = ({ id }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <defs>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <React.Fragment key={n}>
          <filter id={`${id}x${n}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`${n * 1.1} 0`} /></filter>
          <filter id={`${id}y${n}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`0 ${n * 1.1}`} /></filter>
        </React.Fragment>
      ))}
    </defs>
  </svg>
);

const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `t${h.toString(36)}`; };

export const Title: React.FC<TitleProps> = (p) => (
  <Headline text={p.text} at={p.at} out={p.out} top={p.top} size={p.size} color={p.color} accent={p.accent ?? (p.focus?.length ? THEME.accent : undefined)}
    focus={p.focus} layout={p.layout ?? 'inline'} align={p.align} upper={p.uppercase !== false} font={p.font === 'sans' ? 'mono' : 'serif'} tracking={p.font === 'sans' ? p.tracking ?? 0.2 : 0.02}
    speed={p.speed} motion={p.family ? FAMILY_PRESET[p.family] : undefined} />
);

/**
 * TitleCount — a figure that becomes another: "129 €" -> "349 €". Each digit rolls on its own
 * (right to left, vertical motion blur), then the new value lands heavier (scale, tighter
 * tracking, accent colour) and the frame takes a small impact.
 */
export const TitleCount: React.FC<{
  from: number; to: number; at: number; change: number; out?: number; size?: number; top?: number; currency?: string; color?: string; accent?: string; label?: string;
}> = ({ from, to, at, change, out, size = 200, top = 380, currency = '€', color = THEME.ink, accent = THEME.accent, label }) => {
  const elapsedSince = useElapsed();
  const e = elapsedSince(at), ec = elapsedSince(change), eo = out === undefined ? -1 : elapsedSince(out);
  if (e < 0 || (eo > 500)) return null;
  const n = Math.max(String(from).length, String(to).length);
  const a = String(from).padStart(n, ' '), b = String(to).padStart(n, ' ');
  const appear = E.power4Out(clamp01(e / COUNT.appear));
  const lastLand = (n - 1) * COUNT.stagger + COUNT.roll;
  const land = COUNT.land(clamp01((ec - lastLand + 120) / 520)); // the new value takes its weight
  const leave = eo < 0 ? 0 : E.exit(clamp01(eo / 420));
  const kick = cameraOf(COUNT.camera, ec, lastLand);
  const h = size * 1.0;
  return (
    <div style={{ position: 'absolute', left: 0, width: 1920, top, textAlign: 'center' }}>
      {label && <div style={{ fontFamily: THEME.sans, fontSize: size * 0.11, letterSpacing: '0.32em', textTransform: 'uppercase', color: THEME.muted, marginBottom: size * 0.12, opacity: appear * (1 - leave) }}>{label}</div>}
      <div style={{
        display: 'inline-flex', alignItems: 'baseline', fontFamily: THEME.sans, fontWeight: 300, fontSize: size, lineHeight: 1,
        color: land > 0 ? mixHex(color, accent, clamp01(land)) : color, fontVariantNumeric: 'tabular-nums',
        letterSpacing: `${lerp(-0.01, -0.035, clamp01(land))}em`, opacity: appear * (1 - leave),
        transform: `translateY(${(1 - appear) * 0.25 * size - leave * 0.2 * size}px) scale(${kick.s * lerp(1, COUNT.weight, land)})`,
        filter: leave > 0 ? `blur(${leave * 6}px)` : undefined,
      }}>
        {b.split('').map((ch, k) => {
          const fromD = a[k] === ' ' ? 0 : Number(a[k]), toD = ch === ' ' ? 0 : Number(ch);
          const start = (n - 1 - k) * COUNT.stagger; // right-most digit leads
          const t = COUNT.ease(clamp01((ec - start) / COUNT.roll));
          const tp = COUNT.ease(clamp01((ec - start - 1000 / 30) / COUNT.roll));
          const target = toD >= fromD ? toD + 10 : toD + 20; // always roll forward at least one full turn: it reads as a count
          const pos = lerp(fromD, target, t), v = Math.abs(pos - lerp(fromD, target, tp)) * h;
          const blur = Math.min(6, v * 0.06);
          return (
            <span key={k} style={{ display: 'inline-block', width: '0.6em', height: h, overflow: 'hidden', position: 'relative', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)', opacity: a[k] === ' ' && ch !== ' ' ? t : 1 }}>
              <span style={{ position: 'absolute', left: 0, top: 0, display: 'flex', flexDirection: 'column', transform: `translateY(${-pos * h}px)`, filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
                {Array.from({ length: 30 }, (_, d) => <span key={d} style={{ height: h, lineHeight: `${h}px`, textAlign: 'center', width: '0.6em' }}>{d % 10}</span>)}
              </span>
            </span>
          );
        })}
        <span style={{ fontSize: size * 0.4, marginLeft: size * 0.1, color: THEME.muted }}>{currency}</span>
      </div>
    </div>
  );
};

function mixHex(a: string, b: string, t: number) {
  const q = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = q(a), B = q(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i]!, t))).join(',')})`;
}

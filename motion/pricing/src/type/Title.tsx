import React from 'react';
import { THEME, clamp01, lerp } from '../theme';
import { useElapsed } from './clock';
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

export const Title: React.FC<TitleProps> = (p) => {
  const elapsedSince = useElapsed();
  const family = p.family ?? ROLE_FAMILY[p.role ?? 'main'];
  if (family === 'TITLE_COUNT') throw new Error('TITLE_COUNT: use <TitleCount>');
  const P = PRESETS[family];
  const e = elapsedSince(p.at);
  const eo = p.out === undefined ? -1 : elapsedSince(p.out);
  const speed = p.speed ?? 1, I = p.intensity ?? 1, size = p.size ?? 72;
  const blocks = p.text.split('|').map((b) => b.trim());
  const U = units(blocks, P.split);
  const focus = new Set(p.focus ?? []);
  if (e < 0) return null;
  // When does the unit start, how long does it take?
  const timing = (u: Unit) => {
    const f = focus.has(u.block) && P.focus;
    const delay = u.k * P.stagger * speed + (f ? P.focus!.delay * speed : 0);
    return { delay, dur: (f ? P.focus!.dur : P.dur) * speed, ease: f ? P.focus!.ease : P.ease, rest: f ? { scale: P.focus!.scale, tracking: P.focus!.tracking } : { scale: 1, tracking: 0 } };
  };
  const last = Math.max(...U.map((u) => { const t = timing(u); return t.delay + t.dur; }));
  if (p.out !== undefined && eo > P.exit.dur + P.exit.stagger * U.length + 100) return null;

  const pose = (u: Unit, ms: number): Required<Pose> => {
    const t = timing(u);
    const k = t.ease(clamp01((ms - t.delay) / t.dur));
    const side = P.alternate ? (u.block % 2 ? -1 : 1) : 1;
    const f = P.from;
    let ps: Required<Pose> = {
      x: (f.x ?? 0) * (1 - k) * side * I, y: (f.y ?? 0) * (1 - k) * (P.mask ? 1 : I),
      scale: lerp(f.scale ?? 1, 1, k), scaleX: lerp(f.scaleX ?? 1, 1, k),
      tracking: lerp(ADD(p.tracking, f.tracking), ADD(p.tracking, t.rest.tracking), k),
      blur: Math.max(0, (f.blur ?? 0) * (1 - k)), rotate: (f.rotate ?? 0) * (1 - k) * side,
      opacity: f.opacity === 0 ? clamp01(k * 1.8) : 1,
    };
    if (eo >= 0) {
      const q = (P.exit.ease ?? E.power3Out)(clamp01((eo - u.k * P.exit.stagger) / P.exit.dur));
      const x = P.exit.to;
      ps = { ...ps, x: ps.x + (x.x ?? 0) * q * side, y: ps.y + (x.y ?? 0) * q, scale: ps.scale * lerp(1, x.scale ?? 1, q), scaleX: ps.scaleX * lerp(1, x.scaleX ?? 1, q), tracking: ps.tracking + (x.tracking ?? 0) * q, blur: ps.blur + (x.blur ?? 0) * q, opacity: ps.opacity * (x.opacity === 0 ? 1 - q : 1) };
    }
    return ps;
  };

  const id = hash(p.text + p.at);
  const cam = cameraOf(p.camera === undefined ? P.camera : p.camera, e, last * 0.85);
  const color = p.color ?? THEME.ink;
  const lines = p.layout === 'inline' ? [U] : blocks.map((_, bi) => U.filter((u) => u.block === bi));

  const renderUnit = (u: Unit) => {
    const now = pose(u, e), prev = pose(u, e - 1000 / 30);
    let mb = '';
    if (P.motionBlur) {
      const dx = Math.abs(now.x - prev.x) * size, dy = Math.abs(now.y - prev.y) * size;
      const lv = Math.min(6, Math.round(Math.max(dx, dy) * 0.18 * P.motionBlur));
      if (lv > 0) mb = ` url(#${id}${dx >= dy ? 'x' : 'y'}${lv})`;
    }
    const inner = (
      <span style={{
        display: 'inline-block', whiteSpace: 'pre', transformOrigin: '50% 60%',
        transform: `translate(${now.x}em, ${now.y}em) rotate(${now.rotate}deg) scale(${now.scale}) scaleX(${now.scaleX})`,
        letterSpacing: `${now.tracking}em`, opacity: now.opacity,
        filter: `${now.blur > 0.05 ? `blur(${now.blur.toFixed(2)}px)` : ''}${mb}` || undefined,
        color: focus.has(u.block) && p.accent ? p.accent : color,
      }}>{u.text}</span>
    );
    // The space after a word (or after a block on an inline title) is a margin: it never collapses.
    const gap = u.space ? '0.26em' : 0;
    return P.mask
      ? <span key={u.k} style={{ display: 'inline-block', overflow: 'hidden', padding: '0.1em 0.04em 0.16em', margin: '-0.1em -0.04em -0.16em', marginRight: gap ? `calc(${gap} - 0.04em)` : '-0.04em', verticalAlign: 'top' }}>{inner}</span>
      : <span key={u.k} style={{ display: 'inline-block', marginRight: gap }}>{inner}</span>;
  };

  return (
    <div style={{ position: 'absolute', left: p.left ?? 0, width: p.width ?? 1920, top: p.top ?? 480, textAlign: p.align ?? 'center', ...p.style }}>
      {P.motionBlur ? <MotionBlurDefs id={id} /> : null}
      <div style={{
        transform: `translateX(${cam.x}px) scale(${cam.s})`, transformOrigin: '50% 50%',
        fontFamily: p.font === 'sans' ? THEME.sans : THEME.serif, fontWeight: p.weight ?? 300, fontSize: size,
        lineHeight: p.lineHeight ?? 1.08, textTransform: p.uppercase === false ? 'none' : 'uppercase', color,
        textShadow: `0 0 24px ${THEME.bg}, 0 0 8px ${THEME.bg}`,
      }}>
        {lines.map((line, li) => (
          <div key={li}>
            {blocks.map((_, bi) => {
              const us = line.filter((u) => u.block === bi);
              if (!us.length) return null;
              // A focal block takes its extra weight as a whole, growing away from its neighbours.
              const t = timing(us[0]!), k = t.ease(clamp01((e - t.delay) / t.dur));
              const sc = lerp(1, t.rest.scale, k);
              const inline = p.layout === 'inline' && blocks.length > 1;
              const origin = !inline ? '50% 60%' : bi === 0 ? '100% 60%' : bi === blocks.length - 1 ? '0% 60%' : '50% 60%';
              const grow = `${inline && sc > 1 ? (sc - 1) * 0.5 : 0}em`; // room for the growth, so nothing overlaps
              return (
                <span key={bi} style={{ display: 'inline-block', transform: sc !== 1 ? `scale(${sc})` : undefined, transformOrigin: origin, marginRight: inline && bi < blocks.length - 1 ? `calc(0.26em + ${grow})` : 0, marginLeft: bi > 0 ? grow : 0 }}>
                  {us.map(renderUnit)}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

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

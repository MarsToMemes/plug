import React from 'react';
import { THEME } from '../theme';
import { PRESETS, REST, accel, gaps, type Params, type Pose, type PresetName } from './presets';
import { Smear } from './Smear';
import { mix, useT } from './time';
import { measure } from '../layout/measure';

/**
 * <Typo> — one piece of type moved by a TYPO_* preset. Units (letters / words / lines) are
 * objects: each gets its own pose, its own start (irregular gaps), and fast presets render with
 * a sampled motion blur. Position is the centre of the text (x, y in px of the frame).
 */
export type TypoProps = {
  text: string;
  preset: PresetName;
  params: Params;
  x?: number; y?: number; size: number;
  font?: 'serif' | 'sans' | 'mono'; weight?: number; tracking?: number; italic?: boolean;
  color?: string; upper?: boolean;
  /** extra pose applied to the whole piece (a later phase driven by the choreography). */
  over?: Partial<Pose>;
  origin?: string;
  /** Exact placement from the layout engine: pen x and baseline y (frame px). */
  pen?: { x: number; baseline: number };
};

const Units: React.FC<TypoProps & { lineHeight?: string }> = ({ text, preset, params, size, font = 'serif', weight = 300, tracking = 0, italic, color = THEME.ink, upper = true, over, origin = '50% 62%', lineHeight = '1' }) => {
  const t = useT();
  const R = PRESETS[preset]!;
  const p = { speed: 1, intensity: 1, dir: 1 as 1 | -1, stagger: 50, mode: '', ...params };
  const str = upper ? text.toUpperCase() : text;
  const parts = R.split === 'line' ? [str] : R.split === 'word' ? str.split(' ') : Array.from(str);
  const o = { ...REST, ...over };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'pre', fontFamily: font === 'sans' ? THEME.sans : font === 'mono' ? THEME.mono : THEME.serif, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight, color, fontWeight: weight,
      transform: `translate(${o.x}em, ${o.y}em) rotate(${o.rot}deg) scale(${o.scale}) scale(${o.sx}, ${o.sy})`, transformOrigin: origin, opacity: o.o, filter: o.blur > 0.1 ? `blur(${o.blur}px)` : undefined, letterSpacing: `${tracking + o.track}em` }}>
      {parts.map((u, i) => {
        const t0 = p.at + (p.mode === 'accel' ? accel(i, p.stagger * p.speed) : gaps(i, p.stagger * p.speed));
        const q = R.pose(t, t0, i, parts.length, p);
        const inner = (
          <span style={{
            display: 'inline-block', transformOrigin: '50% 80%',
            transform: `translate(${q.x}em, ${q.y + (R.mask ? (1 - q.reveal) * 1.4 : 0)}em) rotate(${q.rot}deg) scale(${q.scale}) scale(${q.sx}, ${q.sy})`,
            opacity: q.o, letterSpacing: `${tracking + (p.mode === 'fixed' ? 0 : q.track) + o.track}em`, // 'fixed': the line shares a row, its width must not move
            fontVariationSettings: `'wght' ${weight + q.weight + o.weight}`, fontWeight: weight + q.weight + o.weight,
            filter: q.blur > 0.1 ? `blur(${q.blur.toFixed(1)}px)` : undefined,
          }}>{u === ' ' ? ' ' : u}</span>
        );
        const gap = R.split === 'word' && i < parts.length - 1 ? <span style={{ display: 'inline-block', width: '0.28em' }} /> : null;
        return (
          <React.Fragment key={i}>
            {R.mask ? <span style={{ display: 'inline-block', overflow: 'hidden', padding: '0.12em 0.02em 0.06em', margin: '-0.12em -0.02em -0.06em' }}>{inner}</span> : inner}
            {gap}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Typo: React.FC<TypoProps> = (props) => {
  const R = PRESETS[props.preset]!;
  const t = useT();
  // Blur only while the type actually moves fast (still type stays perfectly sharp).
  const p = { speed: 1, intensity: 1, dir: 1 as 1 | -1, stagger: 50, mode: '', ...props.params };
  const a = R.pose(t, p.at, 0, 1, p), b = R.pose(t - 34, p.at, 0, 1, p);
  const moving = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.scale - b.scale) * 2 + Math.abs(a.sx - b.sx) + Math.abs(a.sy - b.sy) > 0.04;
  let body: React.ReactNode;
  if (props.pen) {
    // On its baseline, exactly where the layout engine measured it.
    const m = measure(props.text, { size: props.size, font: props.font, weight: props.weight, tracking: props.tracking, upper: props.upper, italic: props.italic });
    const lh = m.fontAscent + m.fontDescent;
    body = (
      <div style={{ position: 'absolute', left: props.pen.x, top: props.pen.baseline - m.fontAscent, height: lh, whiteSpace: 'pre' }}>
        <Units {...props} lineHeight={`${lh}px`} />
      </div>
    );
  } else {
    body = (
      <div style={{ position: 'absolute', left: (props.x ?? 960) - 1500, width: 3000, top: (props.y ?? 540) - props.size * 0.56, display: 'flex', justifyContent: 'center' }}>
        <Units {...props} />
      </div>
    );
  }
  return R.smear && moving ? <div style={{ position: 'absolute', inset: 0 }}><Smear samples={R.smear} shutter={R.shutter}>{body}</Smear></div> : body;
};

export { mix };

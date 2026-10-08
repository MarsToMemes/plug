import React from 'react';
import { measure } from '../layout/measure';
import { C, clamp, mix } from '../motion/time';
import { THEME } from '../theme';

/**
 * Effects of the reel language (skill motion-reel-techniques). All take the time `t` in seconds.
 */

/** T1 — a point, a ring, rays growing one after the other, an orbiting label; then implosion. */
export const Seed: React.FC<{ t: number; at: number; rays: number; implode: number; label: string; color?: string; ink?: string }> = ({ t, at, rays, implode, label, color = THEME.accent, ink = THEME.ink }) => {
  const u = (a: number, d: number, e = C.expoOut) => e(clamp((t - a) / d));
  const imp = C.exit(clamp((t - implode) / 0.36));
  const k = 1 - imp; // everything collapses to the centre
  const dot = u(at, 0.25) * 10 * k + 2.5 * imp;
  const ring1 = u(at, 0.4) * 46;
  const ring2 = u(rays, 0.7) * 620, ring2o = 1 - clamp((t - rays - 0.2) / 0.6);
  const textO = u(rays + 0.35, 0.4, C.settle) * k;
  const spin = (t - at) * 14 + imp * 160;
  const id = React.useId().replace(/:/g, '');
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <defs><path id={`${id}c`} d="M960,540 m-200,0 a200,200 0 1,1 400,0 a200,200 0 1,1 -400,0" /></defs>
      <g transform={`translate(960,540) rotate(${spin * (imp > 0 ? 1 : 0.15)}) scale(${k}) translate(-960,-540)`} style={{ filter: imp > 0 && imp < 1 ? `blur(${(imp * 6).toFixed(1)}px)` : undefined }}>
        <circle cx={960} cy={540} r={ring1 * (1 + 0.5 * u(rays, 0.5))} fill="none" stroke={ink} strokeOpacity={0.45} strokeWidth={1.4} />
        {ring2 > 0 && <circle cx={960} cy={540} r={ring2} fill="none" stroke={ink} strokeOpacity={0.3 * ring2o} strokeWidth={3 * ring2o + 0.8} />}
        {Array.from({ length: 12 }, (_, i) => {
          const g = u(rays + i * 0.03, 0.22);
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2, L = 40 + 110 * g;
          return g > 0 && <line key={i} x1={960} y1={540} x2={960 + Math.cos(a) * L} y2={540 + Math.sin(a) * L} stroke={color} strokeWidth={9} strokeLinecap="round" />;
        })}
        <g opacity={textO} transform={`rotate(${(t - rays) * 22} 960 540)`}>
          <text fontFamily={THEME.mono} fontSize={17} letterSpacing="0.3em" fill={ink}><textPath href={`#${id}c`}>{label}</textPath></text>
        </g>
      </g>
      <circle cx={960} cy={540} r={dot} fill={imp > 0.6 ? ink : color} opacity={t >= at ? 1 : 0} />
    </svg>
  );
};

/** T2 — iris: a cream disc with a chromatic fringe opens, the next ground follows inside it. Returns the clip radius of the next shot. */
export const irisRadius = (t: number, at: number, lag = 0.07) => mix(0, 1250, C.expoOut(clamp((t - at - lag) / 0.42)));
export const Iris: React.FC<{ t: number; at: number; cx?: number; cy?: number }> = ({ t, at, cx = 960, cy = 540 }) => {
  if (t < at || t > at + 0.6) return null;
  const r = mix(0, 1250, C.expoOut(clamp((t - at) / 0.42)));
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <defs><filter id="irisSoft"><feGaussianBlur stdDeviation="7" /></filter></defs>
      <circle cx={cx - 7} cy={cy} r={r + 6} fill="#7b4cff" opacity={0.85} filter="url(#irisSoft)" />
      <circle cx={cx + 7} cy={cy} r={r + 4} fill="#3fd18b" opacity={0.55} filter="url(#irisSoft)" />
      <circle cx={cx} cy={cy} r={r} fill={THEME.ink} />
    </svg>
  );
};

/** Odometer: a figure whose digits roll (right digit first) from one value to another, with vertical motion blur. */
export const Odometer: React.FC<{ t: number; at: number; from: number; to: number; size: number; cx: number; cy: number; color: string; unit?: string; dur?: number }> = ({ t, at, from, to, size, cx, cy, color, unit = '€', dur = 0.5 }) => {
  const style = { size, font: 'wide' as const, weight: 900 };
  const a = String(from), b = String(to);
  const digitW = measure('0', style).advance, cap = measure('0', style).capAscent;
  const unitM = measure(unit, style), gap = size * 0.18;
  const total = digitW * b.length + gap + unitM.inkWidth;
  const x0 = cx - total / 2, base = cy + cap / 2;
  const H = size * 1.05;
  const font: React.CSSProperties = { fontFamily: THEME.wide, fontWeight: 900, fontStretch: '125%', fontSize: size, lineHeight: `${H}px`, color, fontVariantNumeric: 'tabular-nums', textAlign: 'center' };
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {[...b].map((d1, k) => {
        const d0 = Number(a[k] ?? 0), n1 = Number(d1);
        const steps = ((n1 - d0 + 10) % 10) + 10 * (b.length - k); // the right digits spin more
        const st = at + (b.length - 1 - k) * 0.05;
        const pos = (tt: number) => steps * C.settle(clamp((tt - st) / dur));
        const p = pos(t), v = Math.abs(p - pos(t - 1 / 60)) * H;
        const first = Math.floor(p);
        return (
          <div key={k} style={{ position: 'absolute', left: x0 + k * digitW, top: base - cap / 2 - H / 2, width: digitW, height: H, overflow: 'hidden' }}>
            <div style={{ ...font, transform: `translateY(${-(p - first) * H}px)`, filter: v > 1 ? `blur(${Math.min(14, v * 0.06).toFixed(1)}px)` : undefined }}>
              <div>{(d0 + first) % 10}</div><div>{(d0 + first + 1) % 10}</div>
            </div>
          </div>
        );
      })}
      <div style={{ ...font, position: 'absolute', left: x0 + digitW * b.length + gap - unitM.inkLeft, top: base - cap / 2 - H / 2, textAlign: 'left' }}>{unit}</div>
    </div>
  );
};

/** T10 — a word multiplies into a scrolling wall: solid row in the middle, outline rows around, alternating directions. */
export const Wall: React.FC<{ t: number; at: number; text: string; size: number; cy: number; color: string; rows?: number }> = ({ t, at, text, size, cy, color, rows = 3 }) => {
  if (t < at) return null;
  const style = { size, font: 'wide' as const, weight: 900 };
  const unit = measure(`${text}  `, style).advance;
  const cap = measure(text, style).capAscent;
  const pitch = cap * 1.55;
  const line = Array.from({ length: Math.ceil(1920 / unit) + 3 }, () => `${text}  `).join('');
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {Array.from({ length: rows * 2 }, (_, j) => {
        const r = j < rows ? j - rows : j - rows + 1; // -rows..-1, 1..rows
        const appear = C.expoOut(clamp((t - at - (Math.abs(r) - 1) * 0.06) / 0.3));
        if (appear <= 0) return null;
        const dir = r % 2 ? 1 : -1;
        const x = -unit + ((dir * (t - at) * 260 + Math.abs(r) * unit * 0.37) % unit + unit) % unit - unit * 0.5;
        const y = cy + r * pitch;
        return (
          <div key={j} style={{ position: 'absolute', left: x, top: y - cap / 2 - size * 0.62, whiteSpace: 'pre', fontFamily: THEME.wide, fontWeight: 900, fontStretch: '125%', fontSize: size, color: 'transparent', WebkitTextStroke: `2px ${color}`, opacity: appear * (1 - 0.18 * Math.abs(r)), transform: `translateY(${(1 - appear) * 40 * Math.sign(r)}px)` }}>{line}</div>
        );
      })}
    </div>
  );
};

/** Soft diagonal wipe (T4): returns a CSS mask that reveals a layer from the bottom right. */
export const wipeMask = (t: number, at: number, dur = 0.38): React.CSSProperties => {
  const u = C.inOut(clamp((t - at) / dur));
  const p = mix(-25, 125, u); // position of the soft edge along the diagonal (%)
  const m = `linear-gradient(-62deg, #000 ${p - 9}%, transparent ${p + 9}%)`;
  return { WebkitMaskImage: m, maskImage: m };
};

import React from 'react';
import { THEME } from '../theme';
import { TEMPO, beatAt } from './beat';

/**
 * The "monitor" frame of the reel language: corner brackets, title, chapter, running timecode,
 * tempo with the current beat, a progress rule, and live technical captions. Everything is set
 * in the mono face, small and quiet: it frames the shot, it never competes with it.
 */
export type HudProps = {
  t: number; // seconds
  total: number; // seconds (progress rule)
  ink: string; // colour of the HUD on the current ground
  title: string;
  subtitle: string;
  chapter: string;
  caption?: { left?: string; right?: string };
  opacity?: number;
  fps?: number;
};

const mono: React.CSSProperties = { position: 'absolute', fontFamily: THEME.mono, fontSize: 15, letterSpacing: '0.16em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontWeight: 500 };
const two = (n: number) => String(Math.floor(n)).padStart(2, '0');

export const Hud: React.FC<HudProps> = ({ t, total, ink, title, subtitle, chapter, caption, opacity = 1, fps = 30 }) => {
  const b = Math.max(0, beatAt(t));
  const tc = `${two(t / 3600)}:${two((t / 60) % 60)}:${two(t % 60)}:${two((t * fps) % fps)}`;
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <path key={`${x}${y}`} d={`M${x},${y + 20 * sy} V${y} H${x + 20 * sx}`} fill="none" stroke={ink} strokeWidth={1.6} />
  );
  return (
    <div style={{ position: 'absolute', inset: 0, color: ink, opacity, pointerEvents: 'none' }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {corner(44, 44, 1, 1)}{corner(1876, 44, -1, 1)}{corner(44, 1036, 1, -1)}{corner(1876, 1036, -1, -1)}
        <line x1={44} y1={1052} x2={44 + (1876 - 44) * Math.min(1, t / total)} y2={1052} stroke={ink} strokeWidth={1.4} opacity={0.7} />
      </svg>
      <div style={{ ...mono, left: 80, top: 66 }}><b style={{ fontWeight: 700 }}>{title}</b><span style={{ marginLeft: 40, opacity: 0.6 }}>{subtitle}</span></div>
      <div style={{ ...mono, right: 80, top: 66, fontWeight: 700 }}>{chapter}</div>
      <div style={{ ...mono, left: 80, bottom: 62 }}>{tc}<span style={{ marginLeft: 56, opacity: 0.55 }}>{fps} IPS</span></div>
      <div style={{ ...mono, right: 80, bottom: 62, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ opacity: 0.6, marginRight: 26 }}>{TEMPO.bpm} BPM</span>
        {[0, 1, 2, 3].map((k) => <span key={k} style={{ width: 11, height: 11, border: `1.5px solid ${ink}`, background: k === b % 4 ? ink : 'transparent' }} />)}
        <span style={{ marginLeft: 12 }}>MESURE {Math.floor(b / 4) + 1}</span>
      </div>
      {caption?.left && <div style={{ ...mono, left: 80, bottom: 118, opacity: 0.75 }}>{caption.left}</div>}
      {caption?.right && <div style={{ ...mono, right: 80, bottom: 118, opacity: 0.75 }}>{caption.right}</div>}
    </div>
  );
};

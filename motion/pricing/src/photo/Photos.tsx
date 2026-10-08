import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { THEME, clamp01, rng } from '../theme';

/**
 * Real photographs inserted into the episode (skill archival-montage-edit), treated so they
 * belong to its world: black & white, lifted blacks, grain, vignette, a slow push on every still
 * (never static), hard cuts in and out on the word. Licensed media only (public/photos/CREDITS.md,
 * bible SRC-01/02).
 */
export type Shot = { src: string; from: number; to: number; focus?: [number, number]; push?: number };

const FPS = 30;

/** One still, full frame, at voice time t (s). */
const Still: React.FC<{ s: Shot; t: number }> = ({ s, t }) => {
  const u = clamp01((t - s.from) / (s.to - s.from));
  const k = 1 + (s.push ?? 0.07) * u;
  const [fx, fy] = s.focus ?? [50, 50];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <Img src={staticFile(`photos/${s.src}`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${fx}% ${fy}%`, transformOrigin: `${fx}% ${fy}%`, transform: `scale(${k})`, filter: 'grayscale(1) contrast(1.12) brightness(0.86)' }} />
    </div>
  );
};

/** Film grain + vignette, re-seeded every frame (deterministic). */
const Grain: React.FC<{ seed: number }> = ({ seed }) => {
  const r = rng(seed + 1);
  const ox = Math.floor(r() * 200), oy = Math.floor(r() * 200);
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.35 }}>
        <filter id={`g${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed % 97} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect x={-ox} y={-oy} width={2200} height={1300} filter={`url(#g${seed})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: THEME.bg, opacity: 0.12, mixBlendMode: 'lighten' }} />
    </>
  );
};

/** All the photo shots of the episode, over the scenes (voice-time based). */
export const PhotoLayer: React.FC<{ shots: Shot[] }> = ({ shots }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const s = shots.find((x) => t >= x.from && t < x.to);
  if (!s) return null;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Still s={s} t={t} />
      <Grain seed={f} />
    </div>
  );
};

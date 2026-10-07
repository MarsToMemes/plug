import React, { useContext } from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CHAR, CharcoalArt, PAPER_WHITE } from './Charcoal';
import { rng } from './Engraving';
import { InFilm } from './film';
import { LAYERS, ORDER, PLATE_H, PLATE_W, STACK, type LayerDef } from './face';

// Timeline (frames at 30 fps). Everything that is drawn moves on twos.
const START = 64;
const STEP = 80;
const DRAW = 50;
const BUILD_END = START + ORDER.length * STEP;
const EXPLODE_IN = BUILD_END + 10;
const EXPLODE_OUT = EXPLODE_IN + 120;
const FINAL = EXPLODE_OUT + 30;
export const CHARCOAL_DURATION = FINAL + 130;

const S = 1.12;
const PW = PLATE_W * S, PH = PLATE_H * S;
const BUILD_CX = 760, FINAL_CX = 700, PLATE_TOP = 118;
const ASIDE_AT = { x: 1440, y: 410 };
const ASIDE: Partial<Record<string, [number, number]>> = { eyes: [300, 404], nose: [300, 470], jaw: [300, 580], cheeks: [300, 480], hair: [300, 158] };

const byId = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<string, LayerDef>;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hand = '"Caveat Brush", cursive';
const script = 'Caveat, cursive';

/** Handwritten charcoal text, rubbed in from left to right with a ragged edge. */
const Rub: React.FC<{ t: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, children, style }) => {
  const e = clamp(t) * 120 - 10;
  const mask = `linear-gradient(100deg, #000 ${e - 8}%, rgba(0,0,0,0.35) ${e}%, transparent ${e + 6}%)`;
  return (
    <div style={{ ...style, WebkitMaskImage: mask, maskImage: mask, filter: 'url(#ch-text)' }}>{children}</div>
  );
};

/** Paper: tooth, a few old smudges, charcoal dust that changes with each drawing. */
const Paper: React.FC<{ boil: number }> = ({ boil }) => {
  const r = rng(91 + boil * 31);
  const dust = Array.from({ length: 70 }, () => ({ x: r() * 1920, y: r() * 1080, s: 0.4 + r() * 1.5, o: 0.15 + r() * 0.4 }));
  return (
    <AbsoluteFill>
      <svg width="1920" height="1080">
        <defs>
          <filter id="tooth"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} /><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.11 0" /></filter>
          <filter id="stain"><feTurbulence type="fractalNoise" baseFrequency="0.0025" numOctaves={2} seed={12} /><feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 -0.9 0.5" /><feGaussianBlur stdDeviation={30} /></filter>
          {/* Charcoal for the lettering: grain and a dusty halo, re-seeded on twos. */}
          <filter id="ch-text" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} seed={boil + 40} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.95" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={boil + 44} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={3} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" result="g" />
            <feGaussianBlur in="d" stdDeviation={1.6} result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0" result="halo" />
            <feMerge><feMergeNode in="halo" /><feMergeNode in="g" /></feMerge>
          </filter>
          <filter id="ch-line" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={boil + 60} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.6" result="grain" />
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={boil + 64} result="w" />
            <feDisplacementMap in="SourceGraphic" in2="w" scale={5} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComposite in="d" in2="grain" operator="in" />
          </filter>
        </defs>
        <rect width="1920" height="1080" filter="url(#stain)" opacity={0.12} />
        <rect width="1920" height="1080" filter="url(#tooth)" />
        {dust.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.s} fill={CHAR} opacity={d.o} />)}
      </svg>
    </AbsoluteFill>
  );
};

export const CharcoalPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fq = Math.floor(frame / 2) * 2; // on twos
  const boil = Math.floor(frame / 2) % 3;

  const ex = spring({ frame: fq - EXPLODE_IN, fps, config: { damping: 20, stiffness: 60, mass: 1.1 } })
    - spring({ frame: fq - EXPLODE_OUT, fps, config: { damping: 16, stiffness: 70, mass: 1 } });
  const toFinal = ease(clamp((fq - EXPLODE_IN) / 40));
  const cx = lerp(BUILD_CX, 1010, toFinal) + (FINAL_CX - 1010) * ease(clamp((fq - EXPLODE_OUT - 10) / 40));
  const push = 1 + 0.045 * ease(clamp((fq - FINAL) / 150));
  const left = cx - PW / 2;
  const orbit = interpolate(fq, [EXPLODE_IN, EXPLODE_OUT], [-26, -34], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const activeIdx = Math.floor((frame - START) / STEP);
  const active = activeIdx >= 0 && activeIdx < ORDER.length ? byId[ORDER[activeIdx]!]! : null;
  const lf = fq - START - activeIdx * STEP;
  const inFilm = useContext(InFilm);
  const endFade = inFilm ? 1 : 1 - clamp((frame - (CHARCOAL_DURATION - 22)) / 22);
  const buildOut = 1 - ease(clamp((fq - BUILD_END) / 16));

  return (
    <AbsoluteFill style={{ background: PAPER_WHITE }}>
      <Paper boil={boil} />
      <AbsoluteFill style={{ opacity: endFade }}>
        <AbsoluteFill style={{ perspective: 2600, perspectiveOrigin: `${cx}px 520px` }}>
          <div style={{
            position: 'absolute', left, top: PLATE_TOP, width: PW, height: PH, transformStyle: 'preserve-3d', transformOrigin: '50% 50%',
            transform: `scale(${push * lerp(1, 0.66, clamp(ex))}) rotateX(${7 * ex}deg) rotateY(${orbit * ex}deg)`,
          }}>
            {STACK.map((id, si) => {
              const def = byId[id]!;
              const z = (si - 4) * 130 * ex;
              if (id === 'silhouette') {
                return (
                  <Sheet key={id} z={z} ex={ex} label={null}>
                    <CharcoalArt def={def} p={clamp((fq - 6) / 48)} boil={boil} />
                  </Sheet>
                );
              }
              const t0 = START + ORDER.indexOf(id) * STEP;
              const lq = fq - t0;
              if (lq < 0) return null;
              const fly = spring({ frame: lq - DRAW - 6, fps, config: { damping: 15, stiffness: 150, mass: 0.8 } });
              const aside = ASIDE[id];
              const dx = aside ? (ASIDE_AT.x - (left + aside[0] * S)) * (1 - fly) : 0;
              const dy = aside ? (ASIDE_AT.y - (PLATE_TOP + aside[1] * S)) * (1 - fly) : 0;
              const arriving = `translate3d(${dx}px, ${dy}px, ${aside ? (1 - fly) * 60 : 0}px) rotateZ(${aside ? (1 - fly) * 2.5 : 0}deg)`;
              const exV = clamp((ex - 0.3) / 0.5);
              const settle = def.final !== undefined ? lerp(lerp(1, def.final, ease(clamp((lq - DRAW - 14) / 16))), 1, exV) : 1;
              return (
                <Sheet key={id} z={z} ex={ex} label={def} extra={arriving} opacity={settle}>
                  <CharcoalArt def={def} p={clamp(lq / DRAW)} boil={boil} />
                </Sheet>
              );
            })}
          </div>
        </AbsoluteFill>

        {active && <Callout def={active} lf={lf} left={left} boil={boil} />}

        {/* Index, handwritten. */}
        <div style={{ position: 'absolute', left: 120, top: 400, width: 300, opacity: buildOut }}>
          {ORDER.map((id, i) => {
            const t0 = START + i * STEP;
            const on = clamp((fq - t0 - 4) / 10);
            const isActive = i === activeIdx;
            return (
              <Rub key={id} t={on} style={{ fontFamily: script, fontSize: 28, lineHeight: '38px', color: CHAR, opacity: isActive ? 1 : 0.5 }}>
                {byId[id]!.n}  {byId[id]!.name}
              </Rub>
            );
          })}
        </div>

        {/* Title. */}
        <div style={{ position: 'absolute', left: 120, top: 64, opacity: buildOut }}>
          <Rub t={(fq - 6) / 30} style={{ fontFamily: hand, fontSize: 70, color: CHAR, lineHeight: 1.05 }}>Le visage, une combinaison</Rub>
          <Rub t={(fq - 26) / 20} style={{ fontFamily: script, fontSize: 32, color: CHAR, opacity: 0.7, marginTop: 6 }}>de facteurs biologiques</Rub>
        </div>

        {/* Exploded view. */}
        <div style={{ position: 'absolute', left: 120, top: 840, opacity: 1 - clamp((fq - EXPLODE_OUT) / 12) }}>
          <Rub t={(fq - EXPLODE_IN - 24) / 24} style={{ fontFamily: hand, fontSize: 58, color: CHAR }}>Huit couches, un seul visage.</Rub>
        </div>

        {/* Final statement. */}
        <div style={{ position: 'absolute', left: 1130, top: 380, width: 680 }}>
          <Rub t={(fq - FINAL - 6) / 40} style={{ fontFamily: hand, fontSize: 78, lineHeight: 1.02, color: CHAR }}>
            Un visage est la combinaison de nombreuses caractéristiques.
          </Rub>
          <Rub t={(fq - FINAL - 56) / 30} style={{ fontFamily: script, fontSize: 28, color: CHAR, opacity: 0.6, marginTop: 26 }}>
            forme · yeux · nez · mâchoire · pommettes · pigmentation · cheveux · os
          </Rub>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Tracing-paper sheets in the exploded view. */
const Sheet: React.FC<{ z: number; ex: number; label: LayerDef | null; extra?: string; opacity?: number; children: React.ReactNode }> = ({ z, ex, label, extra = '', opacity = 1, children }) => {
  const v = clamp((ex - 0.3) / 0.5);
  return (
    <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${z}px) ${extra}`, transformOrigin: '50% 50%', opacity }}>
      {v > 0.01 && (
        <div style={{
          position: 'absolute', inset: '-16px -20px', background: `rgba(250,249,245,${0.3 * v})`,
          boxShadow: `0 0 0 1.5px rgba(22,21,20,${0.35 * v}), 0 26px 50px rgba(0,0,0,${0.07 * v})`,
        }}>
          {label && (
            <div style={{ position: 'absolute', left: 16, top: 2, fontFamily: script, fontSize: 30, color: CHAR, opacity: v, filter: 'url(#ch-text)' }}>
              {label.n} {label.name}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

const Callout: React.FC<{ def: LayerDef; lf: number; left: number; boil: number }> = ({ def, lf, left, boil }) => {
  const outT = ease(clamp((lf - (STEP - 8)) / 8));
  const labelX = 1290, labelY = 580;
  const [ax, ay] = def.anchor!;
  const px = left + ax * S, py = PLATE_TOP + ay * S;
  const line = ease(clamp((lf - DRAW - 12) / 8));
  const sx = labelX - 26, sy = labelY + 44;
  const r = rng(boil * 7 + 3);
  const mx = (sx + px) / 2 + (r() - 0.5) * 6, my = (sy + py) / 2 + (r() - 0.5) * 6;
  return (
    <div style={{ opacity: 1 - outT }}>
      <div style={{ position: 'absolute', left: labelX, top: labelY, width: 560 }}>
        <Rub t={(lf - 4) / 14} style={{ fontFamily: script, fontSize: 30, color: CHAR, opacity: 0.6 }}>{def.n} / 08</Rub>
        <Rub t={(lf - 8) / 16} style={{ fontFamily: hand, fontSize: 80, lineHeight: 1, color: CHAR }}>{def.name}</Rub>
        <Rub t={(lf - 18) / 20} style={{ fontFamily: script, fontSize: 30, lineHeight: 1.15, color: CHAR, opacity: 0.75, marginTop: 10, maxWidth: 520 }}>{def.desc}</Rub>
      </div>
    </div>
  );
};

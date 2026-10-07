import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LayerArt } from './Engraving';
import { FACE, INK, LAYERS, ORDER, PAPER, PLATE_H, PLATE_W, SEPIA, STACK, WASH, type LayerDef } from './face';

// Timeline (frames at 30 fps).
export const START = 64;
const STEP = 80;
const DRAW = 50; // frames the hand takes to draw one part
const BUILD_END = START + ORDER.length * STEP; // 532
const EXPLODE_IN = BUILD_END + 10;
const EXPLODE_OUT = EXPLODE_IN + 120;
const FINAL = EXPLODE_OUT + 30;
export const DURATION = FINAL + 130;

const S = 1.12; // plate scale on screen
const PW = PLATE_W * S, PH = PLATE_H * S;
const BUILD_CX = 760, FINAL_CX = 700, PLATE_TOP = 118;
// Small parts are drawn aside, full size, centred here; then they slide onto the face.
const ASIDE_AT = { x: 1440, y: 410 };
const ASIDE: Partial<Record<string, [number, number]>> = { eyes: [300, 404], nose: [300, 470], jaw: [300, 580], cheeks: [300, 480], hair: [300, 158] };

const byId = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<string, LayerDef>;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const serif = 'Newsreader, serif';
const sans = 'Inter, sans-serif';

/** Text that rises out of a mask, word by word. */
const Rise: React.FC<{ text: string; from: number; frame: number; style: React.CSSProperties; stagger?: number }> = ({ text, from, frame, style, stagger = 3 }) => (
  <div style={{ ...style, display: 'flex', flexWrap: 'wrap', columnGap: '0.26em' }}>
    {text.split(' ').map((w, i) => {
      const t = easeOut(clamp((frame - from - i * stagger) / 22));
      return (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.08em' }}>
          <span style={{ display: 'inline-block', transform: `translateY(${(1 - t) * 105}%)`, opacity: t }}>{w}</span>
        </span>
      );
    })}
  </div>
);

export const Plate: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Drawn animation is shot on twos: the drawings change every other frame, and boil.
  const fq = Math.floor(frame / 2) * 2;
  const boil = Math.floor(frame / 2) % 3;

  // Exploded view: 0 = flat plate, 1 = the layers spread in depth.
  const ex = spring({ frame: frame - EXPLODE_IN, fps, config: { damping: 20, stiffness: 60, mass: 1.1 } })
    - spring({ frame: frame - EXPLODE_OUT, fps, config: { damping: 16, stiffness: 70, mass: 1 } });
  const toFinal = ease(clamp((frame - EXPLODE_IN) / 40));
  const cx = lerp(BUILD_CX, 1010, toFinal) + (FINAL_CX - 1010) * ease(clamp((frame - EXPLODE_OUT - 10) / 40));
  const push = 1 + 0.045 * ease(clamp((frame - FINAL) / 150));
  const left = cx - PW / 2;
  const orbit = interpolate(frame, [EXPLODE_IN, EXPLODE_OUT], [-26, -34], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Which layer is on show.
  const activeIdx = Math.floor((frame - START) / STEP);
  const active = activeIdx >= 0 && activeIdx < ORDER.length ? byId[ORDER[activeIdx]!]! : null;
  const lf = frame - START - activeIdx * STEP;

  // Fade the whole plate out at the end.
  const endFade = 1 - clamp((frame - (DURATION - 22)) / 22);

  return (
    <AbsoluteFill style={{ background: PAPER }}>
    <AbsoluteFill style={{ background: PAPER, opacity: endFade }}>
      {/* Paper grain and a soft light falloff. */}
      <AbsoluteFill>
        <svg width="1920" height="1080">
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={3} /><feColorMatrix values="0 0 0 0 0.28  0 0 0 0 0.22  0 0 0 0 0.14  0 0 0 0.09 0" /></filter>
          <rect width="1920" height="1080" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 45% 45%, rgba(255,250,238,0.55) 0%, rgba(0,0,0,0) 55%, rgba(70,48,24,0.16) 100%)' }} />

      <Frame frame={frame} />

      {/* The plate, in 3D: layers are sheets that can spread in depth. */}
      <AbsoluteFill style={{ perspective: 2600, perspectiveOrigin: `${cx}px 520px` }}>
        <div
          style={{
            position: 'absolute', left, top: PLATE_TOP, width: PW, height: PH, transformStyle: 'preserve-3d',
            transformOrigin: '50% 50%',
            transform: `scale(${push * lerp(1, 0.66, clamp(ex))}) rotateX(${7 * ex}deg) rotateY(${orbit * ex}deg)`,
          }}
        >
          {STACK.map((id, si) => {
            const def = byId[id]!;
            const z = (si - 4) * 130 * ex;
            if (id === 'silhouette') {
              return (
                <Sheet key={id} z={z} ex={ex} label={null}>
                  <LayerArt def={def} p={clamp((fq - 6) / 48)} boil={boil} />
                </Sheet>
              );
            }
            const oi = ORDER.indexOf(id);
            const t0 = START + oi * STEP;
            const l = frame - t0;
            if (l < 0) return null;
            const lq = fq - t0;
            const draw = clamp(lq / DRAW);
            // Drawn by hand (aside for the small parts, in place for the large ones), then it slides onto the face.
            const fly = spring({ frame: lq - DRAW - 6, fps, config: { damping: 16, stiffness: 150, mass: 0.8 } });
            const aside = ASIDE[id];
            const dx = aside ? (ASIDE_AT.x - (left + aside[0] * S)) * (1 - fly) : 0;
            const dy = aside ? (ASIDE_AT.y - (PLATE_TOP + aside[1] * S)) * (1 - fly) : 0;
            const arriving = `translate3d(${dx}px, ${dy}px, ${aside ? (1 - fly) * 60 : 0}px) rotateZ(${aside ? (1 - fly) * 2 : 0}deg)`;
            const exV = clamp((ex - 0.3) / 0.5);
            const settle = def.final !== undefined ? lerp(lerp(1, def.final, ease(clamp((l - DRAW - 14) / 16))), 1, exV) : 1;
            return (
              <Sheet key={id} z={z} ex={ex} label={def} extra={arriving} opacity={settle}>
                <LayerArt def={def} p={draw} boil={boil} />
              </Sheet>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* Callout of the layer on show: number, name, what varies; a leader line to the face. */}
      {active && <Callout def={active} lf={lf} left={left} />}

      {/* Index of factors, left. */}
      <div style={{ position: 'absolute', left: 120, top: 420, width: 250, fontFamily: sans, fontSize: 15, lineHeight: '30px', letterSpacing: '0.01em', opacity: 1 - ease(clamp((frame - BUILD_END) / 20)) }}>
        {ORDER.map((id, i) => {
          const t0 = START + i * STEP;
          const on = clamp((frame - t0 - 6) / 8);
          const isActive = i === activeIdx;
          return (
            <div key={id} style={{ display: 'flex', gap: 16, opacity: on, transform: `translateX(${(1 - on) * -8}px)`, color: isActive ? INK : '#8b806f' }}>
              <span style={{ color: SEPIA, fontWeight: 500, width: 24, letterSpacing: '0.06em' }}>{byId[id]!.n}</span>
              <span>{byId[id]!.name}</span>
              {isActive && <span style={{ flex: 1, borderBottom: `1px solid ${INK}`, opacity: 0.4, transform: 'translateY(-14px)', marginLeft: 6 }} />}
            </div>
          );
        })}
      </div>

      {/* Title. */}
      <div style={{ position: 'absolute', left: 120, top: 70, opacity: 1 - ease(clamp((frame - BUILD_END) / 20)) }}>
        <Rise text="PLANCHE 01" from={8} frame={frame} style={{ fontFamily: sans, fontWeight: 500, fontSize: 14, letterSpacing: '0.32em', color: SEPIA }} />
        <Rise text="Le visage comme combinaison de facteurs" from={14} frame={frame} style={{ fontFamily: serif, fontWeight: 300, fontSize: 50, letterSpacing: '-0.012em', color: INK, marginTop: 14, width: 1100 }} />
      </div>

      {/* Exploded view caption. */}
      <div style={{ position: 'absolute', left: 120, top: 860, opacity: clamp((frame - EXPLODE_IN - 20) / 16) * (1 - clamp((frame - EXPLODE_OUT) / 12)) }}>
        <Rise text="Huit couches, un seul visage." from={EXPLODE_IN + 20} frame={frame} style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 40, color: INK }} />
      </div>

      {/* Final statement. */}
      <div style={{ position: 'absolute', left: 1140, top: 400, width: 640 }}>
        <Rise text="Un visage est la combinaison de nombreuses caractéristiques." from={FINAL + 6} frame={frame} stagger={4}
          style={{ fontFamily: serif, fontWeight: 300, fontSize: 58, lineHeight: 1.12, letterSpacing: '-0.015em', color: INK }} />
        <div style={{ height: 1, background: INK, opacity: 0.45, marginTop: 34, width: 80 * ease(clamp((frame - FINAL - 40) / 24)) }} />
        <Rise text="Forme · Yeux · Nez · Mâchoire · Pommettes · Pigmentation · Cheveux · Os" from={FINAL + 50} frame={frame} stagger={2}
          style={{ fontFamily: sans, fontSize: 15, letterSpacing: '0.04em', color: '#6d6355', marginTop: 22, width: 600 }} />
      </div>
    </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A sheet of the plate: flat during the build, a translucent page in the exploded view. */
const Sheet: React.FC<{ z: number; ex: number; label: LayerDef | null; extra?: string; opacity?: number; children: React.ReactNode }> = ({ z, ex, label, extra = '', opacity = 1, children }) => (
  <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${z}px) ${extra}`, transformOrigin: '50% 50%', opacity }}>
    {(ex = clamp((ex - 0.3) / 0.5)) > 0.01 && (
      <div style={{
        position: 'absolute', inset: '-14px -18px', border: `1px solid rgba(29,26,22,${0.32 * ex})`,
        background: `rgba(244,236,219,${0.1 * ex})`, boxShadow: `0 24px 50px rgba(60,40,20,${0.06 * ex})`,
      }}>
        {label && (
          <div style={{ position: 'absolute', left: 14, top: 10, fontFamily: sans, fontSize: 16, letterSpacing: '0.08em', color: INK, opacity: ex }}>
            <span style={{ color: SEPIA, fontWeight: 500, marginRight: 10 }}>{label.n}</span>{label.name}
          </div>
        )}
      </div>
    )}
    {children}
  </div>
);

const Callout: React.FC<{ def: LayerDef; lf: number; left: number }> = ({ def, lf, left }) => {
  const inT = easeOut(clamp((lf - 6) / 12));
  const outT = ease(clamp((lf - (STEP - 7)) / 7));
  const op = inT * (1 - outT);
  const labelX = 1300, labelY = 590;
  const [ax, ay] = def.anchor!;
  const px = left + ax * S, py = PLATE_TOP + ay * S;
  const line = ease(clamp((lf - DRAW - 14) / 8)) * (1 - outT);
  const sx = labelX - 24, sy = labelY + 14;
  return (
    <>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={sx} y1={sy} x2={lerp(sx, px, line)} y2={lerp(sy, py, line)} stroke={INK} strokeWidth={1} opacity={0.7 * line} />
        <circle cx={px} cy={py} r={4} fill={SEPIA} opacity={line > 0.98 ? 1 - outT : 0} />
        <circle cx={px} cy={py} r={4 + 8 * clamp((lf - DRAW - 22) / 8)} fill="none" stroke={SEPIA} strokeWidth={1} opacity={line > 0.98 ? (1 - clamp((lf - DRAW - 22) / 8)) : 0} />
      </svg>
      <div style={{ position: 'absolute', left: labelX, top: labelY, width: 520, opacity: op, transform: `translateY(${(1 - inT) * 14}px)` }}>
        <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 14, letterSpacing: '0.28em', color: SEPIA }}>{def.n} — 08</div>
        <div style={{ fontFamily: serif, fontWeight: 300, fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.015em', color: INK, marginTop: 14 }}>{def.name}</div>
        <div style={{ height: 1, width: 64, background: INK, opacity: 0.5, margin: '22px 0 18px' }} />
        <div style={{ fontFamily: sans, fontSize: 18, lineHeight: 1.55, color: '#4d453b', maxWidth: 440 }}>{def.desc}</div>
      </div>
    </>
  );
};

/** Plate furniture: crop marks, a hairline frame, references. */
const Frame: React.FC<{ frame: number }> = ({ frame }) => {
  const d = ease(clamp((frame - 2) / 30));
  const m = 56, L = 26;
  const c = 'rgba(29,26,22,0.55)';
  const corners: Array<[number, number, number, number]> = [[m, m, 1, 1], [1920 - m, m, -1, 1], [m, 1080 - m, 1, -1], [1920 - m, 1080 - m, -1, -1]];
  return (
    <AbsoluteFill>
      <svg width="1920" height="1080">
        {corners.map(([x, y, sx, sy], i) => (
          <g key={i} stroke={c} strokeWidth={1}>
            <line x1={x} y1={y} x2={x + sx * L * d} y2={y} />
            <line x1={x} y1={y} x2={x} y2={y + sy * L * d} />
          </g>
        ))}
        <rect x={m + 18} y={m + 18} width={(1920 - 2 * m - 36) * d} height={1080 - 2 * m - 36} fill="none" stroke="rgba(29,26,22,0.12)" strokeWidth={1} />
      </svg>
      <div style={{ position: 'absolute', left: 120, bottom: 92, fontFamily: sans, fontSize: 12.5, letterSpacing: '0.14em', color: '#8b806f', opacity: d }}>FIG. 01 — ANATOMIE D’UN VISAGE</div>
      <div style={{ position: 'absolute', right: 120, bottom: 92, fontFamily: sans, fontSize: 12.5, letterSpacing: '0.14em', color: '#8b806f', opacity: d }}>LE VISAGE · GÉNÉTIQUE ET APPARENCE</div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Camera, Layer, type CamPose } from '../motion/Camera';
import { Smear } from '../motion/Smear';
import { Typo } from '../motion/Typo';
import { C, clamp, keys, mix, phases, ramp, useT, type Key } from '../motion/time';
import { THEME } from '../theme';

/**
 * Benchmark — 10 s of editorial motion design (see docs/motion-language.md for the breakdown).
 * POURQUOI · VOTRE BILLET · COÛTE · PLUS CHER · 129 € → 349 € · 2 HEURES.
 * Times are in ms. World: shot 1 is around x = 960; from the whip on, the composition lives
 * around x = W (a depth-1 plane); a layer at depth d sits at 960 + 2600·d.
 */
export const BENCHMARK_FRAMES = 300;
const PAN = 2600, W = 960 + PAN;
const at = (d: number) => 960 + PAN * d; // centre of the composition on a layer of depth d

// ── the virtual camera ─────────────────────────────────────────────────────────────────────
const CAM_X: Key[] = [[0, -650], [1250, 150, C.glide], [1360, 150], [1560, PAN + 50, C.whip], [1720, PAN, C.settle], [10000, PAN]];
const CAM_ZOOM: Key[] = [
  [0, 1.9], [1250, 0.82, C.glide], [1360, 0.82], [1560, 1, C.whip], // track + pull back, then whip
  [4100, 1], [4220, 1.05, C.expoOut], [4500, 1.04, C.settle], // micro push at the impact
  [5450, 1.04], [6400, 1.12, C.glide], // slow push: a figure matters
  [6700, 1.12], [6920, 1.22, C.expoOut], [7400, 1.2, C.settle], // fast push: the new price
  [7700, 1, C.whip], [8650, 1], [9200, 1.03, C.glide], // whip back: time; then a slow lean in
  [9480, 0.02, C.exit], [10000, 0.02], // everything collapses into a point
];
const CAM_ROLL: Key[] = [[1360, 0], [1460, -1.4, C.inOut], [1720, 0, C.settle], [7400, 0], [7560, 0.7, C.inOut], [7800, 0, C.settle]];
const pose = (t: number): CamPose => ({ x: keys(t, CAM_X), y: 0, zoom: keys(t, CAM_ZOOM), roll: keys(t, CAM_ROLL) });

// ── shot 5: a digit that becomes another (squash into a line, unfold as the new digit) ─────
const Digit: React.FC<{ a: string; b: string; start: number; size: number; heavy: number }> = ({ a, b, start, size, heavy }) => {
  const t = useT();
  const sy = phases(t, start, 1, [[90, 0.04, C.power2In], [1, 0.04], [170, 1.14, C.impact], [150, 1, C.settle]]);
  const ch = t < start + 90 ? a : b;
  return <span style={{ display: 'inline-block', width: '0.62em', textAlign: 'center', transform: `scaleY(${sy})`, transformOrigin: '50% 72%', fontVariationSettings: `'wght' ${mix(260, 520, heavy)}` }}>{ch}</span>;
};

const Price: React.FC<{ reveal: number; change: number; x: number; y: number; size: number; out: number }> = ({ reveal, change, x, y, size, out }) => {
  const t = useT();
  const r = ramp(t, reveal, reveal + 360, C.expoOut); // rises from behind the bar
  const heavy = ramp(t, change + 300, change + 560, C.settle);
  const drop = phases(t, out, 0, [[260, 1, C.exit]]);
  const color = heavy > 0 ? `rgb(${Math.round(mix(241, 255, heavy))},${Math.round(mix(237, 91, heavy))},${Math.round(mix(228, 53, heavy))})` : THEME.ink;
  const order = [2, 1, 0]; // right-most digit first, irregular gaps
  const gap = [0, 70, 160];
  return (
    <div style={{ position: 'absolute', left: x - 900, width: 1800, top: y - size * 0.95, height: size * 1.1, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <div style={{ transform: `translateY(${(1 - r) * size * 1.1 + drop * size * 1.4}px)`, fontFamily: THEME.sans, fontSize: size, lineHeight: 1.05, color, letterSpacing: `${mix(-0.01, -0.04, heavy)}em`, fontVariantNumeric: 'tabular-nums', whiteSpace: 'pre' }}>
        {'129'.split('').map((d, k) => <Digit key={k} a={d} b={'349'[k]!} start={change + gap[order.indexOf(k)]!} size={size} heavy={heavy} />)}
        <span style={{ fontSize: '0.42em', marginLeft: '0.12em', color: THEME.muted }}>€</span>
      </div>
    </div>
  );
};

// ── shot 6: a clock running faster and faster, then braking on 02:00 (secondary information)
const Clock: React.FC<{ t0: number; brake: number; x: number; y: number }> = ({ t0, brake, x, y }) => {
  const t = useT();
  const minutes = phases(t, t0, 0, [[brake - t0, 112, (u) => u * u * u], [220, 120, C.settle]]);
  const hh = Math.floor(minutes / 60), mm = Math.floor(minutes % 60);
  const on = ramp(t, t0 - 100, t0 + 200);
  return <div style={{ position: 'absolute', left: x - 300, width: 600, top: y, textAlign: 'center', fontFamily: THEME.sans, fontSize: 44, fontWeight: 300, letterSpacing: '0.12em', color: t > brake + 150 ? THEME.accent : THEME.muted, opacity: on, fontVariantNumeric: 'tabular-nums' }}>{`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`}</div>;
};

// ── shot 6: the line of time, ticks streaming faster and faster, then braking ──────────────
const Timeline: React.FC<{ t0: number; brake: number; y: number }> = ({ t0, brake, y }) => {
  const t = useT();
  const pos = phases(t, t0, 0, [[brake - t0, 3200, (u) => u * u * u], [220, 3420, C.settle]]);
  const on = ramp(t, t0 - 200, t0 + 100);
  return (
    <svg width={1920 + PAN * 2} height={1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: on }}>
      {Array.from({ length: 60 }, (_, k) => {
        const x = W - 1500 + ((k * 60 - pos) % 3600 + 3600) % 3600;
        if (x > W + 1500) return null;
        return <line key={k} x1={x} y1={y - (k % 5 ? 26 : 56)} x2={x} y2={y} stroke={THEME.ink} strokeOpacity={k % 5 ? 0.45 : 0.9} strokeWidth={k % 5 ? 2 : 3} />;
      })}
    </svg>
  );
};

const World: React.FC = () => {
  const t = useT();

  // shot 2 → 3: the ticket tears along its perforation
  const tear = phases(t, 2350, 0, [[90, -0.04, C.anticipate], [360, 1, C.expoOut]]);
  // shot 4: COÛTE is pushed up by the impact of PLUS CHER (and leaves when the word collapses)
  const push = phases(t, 3790, 0, [[210, 1, C.expoOut], [120, 0.97, C.settle]]);
  const leaveCost = phases(t, 5100, 0, [[240, 1, C.exit]]);
  // shot 5: PLUS CHER squashes into a bar; the bar is the 129 €, then grows to 349 €
  const squash = phases(t, 5100, 1, [[80, 1.05, C.anticipate], [200, 0.02, C.expoOut]]);
  const barOn = t >= 5180;
  const barW = keys(t, [[5180, 1440], [5600, 520, C.expoOut], [6300, 520], [6720, 520 * 349 / 129, C.expoOut], [7400, 1407], [7700, 2600, C.whip]]);
  const barH = keys(t, [[5180, 18], [7400, 14], [7700, 3, C.whip]]);
  const barY = keys(t, [[5180, 712], [7400, 712], [7700, 770, C.whip]]);
  const barC = t < 6600 ? THEME.ink : THEME.accent;

  return (
    <>
      {/* BACKGROUND — faint guides: they make the depth visible when the camera moves. */}
      <Layer depth={0.35}>
        {[260, 820].map((y) => <div key={y} style={{ position: 'absolute', left: -2000, width: 8000, top: y, height: 1, background: THEME.faint, opacity: 0.6 }} />)}
      </Layer>

      {/* SECONDARY — the route, far back. */}
      <Layer depth={0.55}>
        <div style={{ position: 'absolute', left: at(0.55) - 600, width: 1200, top: 92, textAlign: 'center', fontFamily: THEME.sans, fontSize: 22, letterSpacing: '0.5em', color: THEME.muted, opacity: ramp(t, 1500, 1900) * (1 - ramp(t, 7300, 7500)) }}>PARIS — NEW YORK</div>
        <Typo text="Votre" preset="TYPO_CAMERA" params={{ at: 1420 }} x={at(0.55)} y={200} size={80} font="sans" weight={300} tracking={0.5} over={{ o: 1 - ramp(t, 2350, 2550), y: -tear * 1.2 }} />
      </Layer>

      {/* PRIMARY / HERO — depth 1. */}
      <Layer depth={1}>
        {/* 1. POURQUOI — monumental, written out of a line while the camera tracks across it. */}
        {t < 1800 && <Typo text="Pourquoi" preset="TYPO_REVEAL" params={{ at: 120, stagger: 58 }} x={960} y={560} size={520} weight={300} over={{ sx: phases(t, 1250, 1, [[110, 0.96, C.anticipate]]) }} />}

        {/* 2. BILLET — carried by the whip; torn in two along its perforation. */}
        {t > 1300 && t < 3000 && [0, 1].map((half) => (
          <div key={half} style={{ position: 'absolute', inset: 0, clipPath: half ? 'inset(430px -6000px -200px -6000px)' : 'inset(-200px -6000px 650px -6000px)', transform: `translateY(${(half ? 1 : -1) * tear * 300}px)`, opacity: 1 - ramp(t, 2650, 2900) }}>
            <Typo text="Billet" preset="TYPO_CAMERA" params={{ at: 1380 }} x={W} y={560} size={420} weight={300} />
          </div>
        ))}

        {/* 3. COÛTE — unfolds out of the tear line; then pushed up by the impact. */}
        {t > 2600 && t < 5400 && (
          <Typo text="Coûte" preset="TYPO_MORPH" params={{ at: 2620, stagger: 34 }} x={W} y={mix(470, 300, push)} size={300} weight={300}
            over={{ scale: mix(1, 0.52, push), o: 1 - leaveCost, y: -leaveCost * 1.2, blur: leaveCost * 8 }} />
        )}

        {/* 4. PLUS CHER — the hero: anticipation, entry, impact, overshoot, settle, hold. */}
        {t > 3500 && t < 5320 && <Typo text="Plus cher" preset="TYPO_SLAM" params={{ at: 3600 }} x={W} y={600} size={250} weight={420} color={THEME.accent} over={{ sy: squash }} origin="50% 100%" />}

        {/* 5. the bar: PLUS CHER became it; it measures the price; then it becomes the line of time. */}
        {barOn && t < 9600 && <div style={{ position: 'absolute', left: W - barW / 2, width: barW, top: barY - barH / 2, height: barH, background: barC }} />}
        {t > 5300 && t < 7800 && <Price reveal={5450} change={6300} x={W} y={650} size={300} out={7400} />}

        {/* 6. 2 HEURES — the time line streams faster and faster, the 2 drops onto it, HEURES
               arrives with gaps that shorten (acceleration), then everything brakes. */}
        {t > 7300 && <Smear samples={t > 7900 && t < 8700 ? 8 : 1} shutter={34}><Timeline t0={7700} brake={8650} y={770} /></Smear>}
        {t > 7500 && <Clock t0={7700} brake={8650} x={W + 300} y={300} />}
        {t > 7600 && <Typo text="2" preset="TYPO_IMPACT" params={{ at: 7750 }} x={W - 430} y={560} size={560} font="sans" weight={260} origin="50% 100%" />}
        {t > 7900 && <Typo text="Heures" preset="TYPO_REVEAL" params={{ at: 7980, stagger: 150, mode: 'accel' }} x={W + 300} y={640} size={190} weight={300} />}
      </Layer>

      {/* FOREGROUND — the perforation of the ticket, closest to the lens (fastest in the whip). */}
      <Layer depth={1.5}>
        {t > 1300 && t < 2800 && (
          <div style={{ position: 'absolute', left: at(1.5) - 1300, width: 2600, top: 429, height: 0, borderTop: `3px dashed ${tear > 0.02 ? THEME.accent : THEME.line}`, opacity: ramp(t, 1400, 1700) * (1 - ramp(t, 2500, 2750)) }} />
        )}
      </Layer>
    </>
  );
};

export const Benchmark: React.FC = () => {
  const t = useT();
  const p = pose(t), q = pose(t - 33);
  // The whole world blurs only when the camera moves fast (whips, collapses).
  const speed = Math.abs(p.x - q.x) + Math.abs(p.zoom - q.zoom) * 900;
  const end = phases(t, 9420, 0, [[140, 1.35, C.expoOut], [120, 1, C.settle], [220, 1, C.linear], [180, 0, C.exit]]);
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <Smear samples={speed > 30 ? 6 : 1} shutter={34}>
        <Camera pose={p}><World /></Camera>
      </Smear>
      {/* 7. the last point: everything collapsed into it, then black. */}
      {end > 0 && <div style={{ position: 'absolute', left: 960 - 12, top: 540 - 12, width: 24, height: 24, borderRadius: 12, background: THEME.accent, transform: `scale(${end})` }} />}
    </AbsoluteFill>
  );
};

export { clamp };

import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { Placed } from '../layout/layout';
import { measure } from '../layout/measure';
import { QAOverlay } from '../layout/QA';
import { Camera, Layer, type CamPose } from '../motion/Camera';
import { Smear } from '../motion/Smear';
import { Typo } from '../motion/Typo';
import { C, keys, mix, phases, ramp, useT, type Key } from '../motion/time';
import { THEME } from '../theme';
import { PRICE, TWO, shot1, shot2, shot3, shot4, shot5, shot6, shot7, tearY } from './benchmark/layouts';

/**
 * Benchmark — 10 s. The compositions are validated as static frames first
 * (scenes/benchmark/layouts.ts, composition "BenchmarkLayouts"); the animation only travels to
 * those exact positions and away from them. Times in ms.
 * From the whip on, the composition lives one PAN to the right on the depth-1 plane
 * (a layer at depth d shifts by PAN·d): the camera moving there IS the transition.
 */
export const BENCHMARK_FRAMES = 300;
const PAN = 2600;

/** The validated compositions, measured at render time (after the fonts are loaded). */
function build() {
  const L1 = shot1(), L2 = shot2(), L3 = shot3(), L4 = shot4(), L5 = shot5(), L6 = shot6(), L7 = shot7();
  return {
    L1, L2, L3, L4, L5, L6, L7,
    POURQUOI: get(L1, 'pourquoi'), VOTRE: get(L2, 'votre'), BILLET: get(L2, 'billet'), ROUTE: get(L2, 'route'), PERF: get(L2, 'perforation'),
    COUTE3: get(L3, 'coute'), COUTE4: get(L4, 'coute'), PLUSCHER: get(L4, 'pluscher'),
    LABEL5: get(L5, 'label'), PRICE5: get(L5, 'price'), BAR5: get(L5, 'bar'),
    TWO6: get(L6, 'two'), HEURES6: get(L6, 'heures'), CLOCK6: get(L6, 'clock'), LINE6: get(L6, 'timeline'),
    LABEL7: get(L7, 'label'), PRICE7: get(L7, 'price'), BAR7: get(L7, 'bar'), SEC7: get(L7, 'secondary'),
    TEAR: tearY(),
  };
}
let LAY: ReturnType<typeof build> | null = null;
const lay = () => (LAY ??= build());
const get = (L: Placed[], id: string) => L.find((p) => p.id === id)!;
const at = (p: Placed, d = 1) => ({ x: p.pen!.x + PAN * d, baseline: p.pen!.baseline }); // pen in the world
const S = (p: Placed) => ({ size: p.style!.size, font: p.style!.font, weight: p.style!.weight, tracking: p.style!.tracking });
const centre = (p: Placed) => ({ px: p.box.x + p.box.w / 2, py: p.box.y + p.box.h / 2 });

// ── camera: track + pull back on POURQUOI, whip, then small pushes AROUND the hero (pivot),
//    never around the frame centre (the type sits on the left edge and must stay in the safe area).
const CAM_X: Key[] = [[0, -560], [1250, 0, C.glide], [1360, 0], [1560, PAN + 40, C.whip], [1720, PAN, C.settle], [10000, PAN]];
const CAM_ZOOM: Key[] = [
  [0, 1.85], [1250, 1, C.glide], // POURQUOI: from very close to the whole word
  [4100, 1], [4200, 1.03, C.expoOut], [4500, 1.025, C.settle], // micro push at the impact of PLUS CHER
  [5100, 1.025], [5500, 1, C.settle], [6300, 1.04, C.glide], // slow push: the price matters
  [6650, 1.04], [6850, 1.075, C.expoOut], [7000, 1.07, C.settle], // fast push: the new price lands
  [7250, 1, C.whip], [8900, 1], [9500, 1.02, C.glide], // back for time, then a slow lean on the summary
  [9760, 0.02, C.exit], [10000, 0.02],
];
const CAM_ROLL: Key[] = [[1360, 0], [1460, -1.2, C.inOut], [1720, 0, C.settle]];
const pivot = (t: number) => { const { PLUSCHER, PRICE5, PRICE7 } = lay(); return (t < 1400 ? { px: 960, py: 540 } : t < 5100 ? centre(PLUSCHER) : t < 7100 ? centre(PRICE5) : t < 9600 ? centre(PRICE7) : { px: 960, py: 540 }); };
const pose = (t: number): CamPose => ({ x: keys(t, CAM_X), y: 0, zoom: keys(t, CAM_ZOOM), roll: keys(t, CAM_ROLL), ...pivot(t) });

// ── a digit that becomes another: squashed into a line, unfolded as the new digit ──────────
const Digit: React.FC<{ a: string; b: string; start: number }> = ({ a, b, start }) => {
  const t = useT();
  const sy = phases(t, start, 1, [[90, 0.04, C.power2In], [1, 0.04], [170, 1.14, C.impact], [150, 1, C.settle]]);
  return <span style={{ display: 'inline-block', transform: `scaleY(${sy})`, transformOrigin: '50% 78%' }}>{t < start + 90 ? a : b}</span>;
};

/** The price on its measured baseline; it rises from behind its bar (the bar is its floor). */
const Price: React.FC<{ p: Placed; floor: number; reveal: number; change?: number; out?: number; from?: string }> = ({ p, floor, reveal, change, out, from }) => {
  const t = useT();
  const m = measure(p.text!, PRICE);
  const r = ramp(t, reveal, reveal + 380, C.expoOut);
  const leave = out === undefined ? 0 : phases(t, out, 0, [[240, 1, C.exit]]);
  const heavy = change === undefined ? 1 : ramp(t, change + 300, change + 560);
  const color = `rgb(${Math.round(mix(241, 255, heavy))},${Math.round(mix(237, 91, heavy))},${Math.round(mix(228, 53, heavy))})`;
  const gaps = [160, 70, 0]; // right-most digit first, irregular gaps
  const lh = m.fontAscent + m.fontDescent;
  const top = p.pen!.baseline - m.fontAscent;
  const travel = floor - top + 20;
  return (
    // The window ends on the floor: the number is hidden below it, as if it came out of the bar.
    <div style={{ position: 'absolute', left: p.pen!.x + PAN - 40, top: top - 60, width: m.advance + 120, height: floor - (top - 60), overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 40, top: 60 + (1 - r) * travel + leave * travel, height: lh, lineHeight: `${lh}px`, whiteSpace: 'pre', fontFamily: THEME.sans, fontSize: PRICE.size, fontWeight: 300, fontVariationSettings: `'wght' ${mix(300, 460, heavy)}`, letterSpacing: `${PRICE.tracking}em`, color, fontVariantNumeric: 'tabular-nums' }}>
        {change === undefined ? m.text : (from ?? m.text).split('').map((d, k) => <Digit key={k} a={d} b={m.text[k]!} start={change + (gaps[k] ?? 0)} />)}
      </div>
    </div>
  );
};

/** The line of time: ticks streaming faster and faster, then braking. */
const Timeline: React.FC<{ t0: number; brake: number; box: Placed['box'] }> = ({ t0, brake, box }) => {
  const t = useT();
  const pos = phases(t, t0, 0, [[brake - t0, 3200, (u) => u * u * u], [220, 3420, C.settle]]);
  const on = ramp(t, t0 - 150, t0 + 150) * (1 - ramp(t, 8500, 8800));
  const w = box.w, x0 = box.x + PAN;
  return (
    <svg width={1920 + PAN * 2} height={1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: on }}>
      {Array.from({ length: Math.ceil(w / 48) }, (_, k) => {
        const x = x0 + ((((k * 48 - pos) % w) + w) % w);
        return <line key={k} x1={x} y1={box.y - (k % 5 ? 22 : 48)} x2={x} y2={box.y} stroke={THEME.ink} strokeOpacity={k % 5 ? 0.4 : 0.85} strokeWidth={k % 5 ? 2 : 3} />;
      })}
    </svg>
  );
};

const Clock: React.FC<{ p: Placed; t0: number; brake: number }> = ({ p, t0, brake }) => {
  const t = useT();
  const minutes = phases(t, t0, 0, [[brake - t0, 112, (u) => u * u * u], [220, 120, C.settle]]);
  const s = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(Math.floor(minutes % 60)).padStart(2, '0')}`;
  const m = measure('00:00', { ...S(p), upper: false });
  return <div style={{ position: 'absolute', left: p.pen!.x + PAN, top: p.pen!.baseline - m.fontAscent, lineHeight: `${m.fontAscent + m.fontDescent}px`, whiteSpace: 'pre', fontFamily: THEME.sans, fontSize: p.style!.size, fontWeight: 300, letterSpacing: `${p.style!.tracking}em`, fontVariantNumeric: 'tabular-nums', color: t > brake + 150 ? THEME.accent : THEME.muted, opacity: ramp(t, t0 - 100, t0 + 200) * (1 - ramp(t, 8500, 8700)) }}>{s}</div>;
};

/** A rectangle that becomes another (a word squashed flat → a measure → a line of time → a bar). */
const Bar: React.FC<{ frames: Array<[number, Placed['box'], ((u: number) => number)?]>; color: (t: number) => string; on: [number, number] }> = ({ frames, color, on }) => {
  const t = useT();
  if (t < on[0] || t > on[1]) return null;
  const k = (f: (b: Placed['box']) => number) => keys(t, frames.map(([ms, b, e]) => [ms, f(b), e] as Key));
  return <div style={{ position: 'absolute', left: k((b) => b.x) + PAN, top: k((b) => b.y), width: k((b) => b.w), height: k((b) => b.h), background: color(t) }} />;
};

const GUIDES = [96, 984]; // the safe area's top and bottom, as faint background lines

/** Which validated composition holds at time t (for the diagnostic overlay). */
const HOLDS = (): Array<[number, number, Placed[], string]> => { const { L1, L2, L3, L4, L5, L6, L7 } = lay(); return [[900, 1250, L1, '1'], [1900, 2340, L2, '2'], [3100, 3600, L3, '3'], [4700, 5090, L4, '4'], [6950, 7000, L5, '5'], [8300, 8500, L6, '6'], [9050, 9500, L7, '7']]; };

const World: React.FC<{ qa?: boolean }> = ({ qa }) => {
  const t = useT();
  const hold = HOLDS().find(([a, b]) => t >= a && t <= b);
  const { L2, POURQUOI, VOTRE, BILLET, ROUTE, PERF, COUTE3, COUTE4, PLUSCHER, LABEL5, PRICE5, BAR5, TWO6, HEURES6, CLOCK6, LINE6, LABEL7, PRICE7, BAR7, SEC7, TEAR } = lay();
  const tear = phases(t, 2350, 0, [[90, -0.04, C.anticipate], [360, 1, C.expoOut]]);
  // COÛTE travels from its shot-3 place to its shot-4 place (smaller, above), pushed at contact.
  const push = phases(t, 3790, 0, [[220, 1, C.expoOut], [140, 1, C.settle]]);
  const k34 = COUTE4.style!.size / COUTE3.style!.size;
  const dx = (COUTE4.pen!.x - COUTE3.pen!.x) * push, dy = (COUTE4.pen!.baseline - COUTE3.pen!.baseline) * push;
  const leaveCost = phases(t, 5100, 0, [[220, 1, C.exit]]);
  const squash = phases(t, 5100, 1, [[80, 1.05, C.anticipate], [200, 0.02, C.expoOut]]);
  const cm = measure('Coûte', S(COUTE3));
  const fold = phases(t, 8500, 0, [[380, 1, C.expoOut]]); // shot 7: "2 HEURES" gives way to "+2 HEURES"
  const barBox5 = (ratio: number) => ({ ...BAR5.box, w: BAR5.box.w * ratio });
  const plusCherBase = { x: PLUSCHER.box.x, y: PLUSCHER.pen!.baseline - 7, w: PLUSCHER.box.w, h: 14 };

  return (
    <>
      {/* BACKGROUND — two faint guides on the safe area: they make the depth readable. */}
      <Layer depth={0.35}>
        {GUIDES.map((y) => <div key={y} style={{ position: 'absolute', left: -2000, width: 9000, top: y, height: 1, background: THEME.faint, opacity: 0.5 }} />)}
      </Layer>

      {/* SUPPORT — further back than the hero (parallax in the whip). */}
      <Layer depth={0.6}>
        {t > 1300 && t < 2700 && <Typo text="Votre" preset="TYPO_CAMERA" params={{ at: 1420 }} pen={at(VOTRE, 0.6)} {...S(VOTRE)} over={{ o: 1 - ramp(t, 2350, 2500) }} />}
      </Layer>

      {/* PRIMARY / HERO — depth 1. */}
      <Layer depth={1}>
        {/* 1. POURQUOI — written out of its line while the camera tracks across it; compresses before the whip. */}
        {t < 1800 && <Typo text="Pourquoi" preset="TYPO_REVEAL" params={{ at: 120, stagger: 58 }} pen={POURQUOI.pen} {...S(POURQUOI)} over={{ sx: phases(t, 1250, 1, [[110, 0.96, C.anticipate]]) }} />}

        {/* meta: the route, on the shared left edge (shots 2 → 4). */}
        {t > 1400 && t < 5300 && <Typo text={ROUTE.text!} preset="TYPO_CAMERA" params={{ at: 1650 }} pen={at(ROUTE)} {...S(ROUTE)} color={THEME.muted} over={{ o: 1 - ramp(t, 5000, 5250) }} />}

        {/* 2. BILLET — carried by the whip; torn in two along its perforation. */}
        {t > 1300 && t < 3000 && [0, 1].map((half) => (
          <div key={half} style={{ position: 'absolute', inset: 0, clipPath: half ? `inset(${TEAR}px -9000px -400px -9000px)` : `inset(-400px -9000px ${1080 - TEAR}px -9000px)`, transform: `translateY(${(half ? 1 : -1) * tear * 300}px)`, opacity: 1 - ramp(t, 2650, 2900) }}>
            <Typo text="Billet" preset="TYPO_CAMERA" params={{ at: 1380 }} pen={at(BILLET)} {...S(BILLET)} />
          </div>
        ))}

        {/* 3. COÛTE — unfolds out of the tear line; 4. pushed into its secondary place at the impact. */}
        {t > 2600 && t < 5400 && (
          <Typo text="Coûte" preset="TYPO_MORPH" params={{ at: 2620, stagger: 34 }} pen={at(COUTE3)} {...S(COUTE3)} origin={`0px ${cm.fontAscent}px`}
            over={{ x: dx / COUTE3.style!.size, y: dy / COUTE3.style!.size - leaveCost * 0.6, scale: mix(1, k34, push), o: 1 - leaveCost, blur: leaveCost * 8 }} />
        )}

        {/* 4. PLUS CHER — anticipation, entry, impact, overshoot, settle, hold; 5. squashed into a bar. */}
        {t > 3500 && t < 5320 && <Typo text="Plus cher" preset="TYPO_SLAM" params={{ at: 3600 }} pen={at(PLUSCHER)} {...S(PLUSCHER)} color={THEME.accent} over={{ sy: squash }} origin={`50% ${measure('Plus cher', S(PLUSCHER)).fontAscent}px`} />}

        {/* the bar: PLUS CHER flattened → the measure of 129 € → of 349 € → the line of time → the bar again. */}
        <Bar on={[5180, 9620]} color={(tt) => (tt < 6600 ? THEME.ink : THEME.accent)} frames={[
          [5180, plusCherBase], [5520, barBox5(129 / 349), C.expoOut], [6300, barBox5(129 / 349)], [6720, barBox5(1), C.expoOut],
          [7000, barBox5(1)], [7250, LINE6.box, C.whip], [8500, LINE6.box], [8880, BAR7.box, C.expoOut], [9620, BAR7.box],
        ]} />

        {/* 5. DATA: the label, then 129 € rising out of its bar, transformed into 349 €. */}
        {t > 5300 && t < 7300 && <Typo text={LABEL5.text!} preset="TYPO_REVEAL" params={{ at: 5380, stagger: 22 }} pen={at(LABEL5)} {...S(LABEL5)} color={THEME.muted} over={{ o: 1 - ramp(t, 7000, 7200) }} />}
        {t > 5300 && t < 7300 && <Price p={PRICE5} floor={BAR5.box.y} reveal={5520} change={6300} from="129 €" out={7000} />}

        {/* 6. 2 HEURES on the line of time; the clock runs and brakes on 02:00. */}
        {t > 7100 && <Smear samples={t > 7600 && t < 8250 ? 8 : 1} shutter={34}><Timeline t0={7300} brake={8250} box={LINE6.box} /></Smear>}
        {t > 7100 && t < 8900 && <Clock p={CLOCK6} t0={7300} brake={8250} />}
        {t > 7150 && t < 8950 && <Typo text="2" preset="TYPO_IMPACT" params={{ at: 7250 }} pen={at(TWO6)} {...S(TWO6)} origin={`50% ${measure('2', TWO).fontAscent}px`} over={{ o: 1 - fold, scale: mix(1, 0.3, fold), blur: fold * 6 }} />}
        {t > 7350 && t < 8950 && <Typo text="Heures" preset="TYPO_REVEAL" params={{ at: 7420, stagger: 150, mode: 'accel' }} pen={at(HEURES6)} {...S(HEURES6)} over={{ o: 1 - fold, y: fold * 0.6, blur: fold * 6 }} />}

        {/* 7. SUMMARY — 349 € (hero) · bar · +2 HEURES (secondary) · VOTRE BILLET (support). */}
        {t > 8500 && <Typo text={LABEL7.text!} preset="TYPO_REVEAL" params={{ at: 8640, stagger: 20 }} pen={at(LABEL7)} {...S(LABEL7)} color={THEME.muted} />}
        {t > 8500 && <Price p={PRICE7} floor={BAR7.box.y} reveal={8700} />}
        {t > 8500 && <Typo text={SEC7.text!} preset="TYPO_MASK" params={{ at: 8820 }} pen={at(SEC7)} {...S(SEC7)} />}
      </Layer>

      {/* DIAGNOSTIC — the validated boxes, through the same camera: the motion must land on them. */}
      {qa && hold && <Layer depth={1}><div style={{ position: 'absolute', left: hold[3] === '1' ? 0 : PAN, top: 0, width: 1920, height: 1080 }}><QAOverlay items={hold[2]} title={`shot ${hold[3]} (animated)`} /></div></Layer>}

      {/* FOREGROUND — the ticket's perforation, nearest to the lens (fastest in the whip). */}
      <Layer depth={1.5}>
        {t > 1300 && t < 2800 && (
          <div style={{ position: 'absolute', left: PERF.box.x + PAN * 1.5, width: PERF.box.w, top: TEAR - 1.5, height: 0, borderTop: `3px dashed ${tear > 0.02 ? THEME.accent : THEME.line}`, opacity: ramp(t, 1400, 1700) * (1 - ramp(t, 2500, 2750)) }} />
        )}
      </Layer>
    </>
  );
};

export const Benchmark: React.FC<{ qa?: boolean }> = ({ qa }) => {
  const t = useT();
  const p = pose(t), q = pose(t - 33);
  const speed = Math.abs(p.x - q.x) + Math.abs(p.zoom - q.zoom) * 900;
  const end = phases(t, 9700, 0, [[120, 1.35, C.expoOut], [100, 1, C.settle], [40, 1, C.linear], [140, 0, C.exit]]);
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <Smear samples={speed > 30 ? 6 : 1} shutter={34}>
        <Camera pose={p}><World qa={qa} /></Camera>
      </Smear>
      {end > 0 && <div style={{ position: 'absolute', left: 948, top: 528, width: 24, height: 24, borderRadius: 12, background: THEME.accent, transform: `scale(${end})` }} />}
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraRig, MOVE_TIMING } from '../camera/CameraRig';
import { InventoryRibbon, MilestoneTick } from '../components/time';
import { S03, availableAt, type Lane } from '../data/scene03';
import { Title } from '../type/Title';
import { EASE, THEME, clamp01, rng, seg } from '../theme';

const B = S03.beats, W = S03.world;
const X = (tau: number) => W.x0 + (W.x1 - W.x0) * tau;
const CELL = 11, PITCH = 15, ROWS = 10;

/** Order in which units are sold: deterministic, so the same data always empties the same cells. */
const ranks = (n: number, seed: number) => {
  const r = rng(seed), idx = Array.from({ length: n }, (_, i) => i).sort(() => r() - 0.5);
  const out = new Array<number>(n);
  idx.forEach((u, k) => (out[u] = k));
  return out;
};

const LaneView: React.FC<{ lane: Lane; f: number; tau: number; seed: number }> = ({ lane, f, tau, seed }) => {
  const y = W.laneY[lane.key];
  const rank = React.useMemo(() => ranks(lane.total, seed), [lane.total, seed]);
  const avail = availableAt(lane, tau);
  const sold = lane.total - avail;
  const perishing = seg(f, B.perish, B.perish + 44);
  const axis = EASE.out(seg(f, B.lanes, B.lanes + 40));
  const cols = Math.ceil(lane.total / ROWS);
  const gx = X(tau) + 70, gy = y - 34 - ROWS * PITCH;
  const left = Math.round(avail * (1 - EASE.inOut(perishing)));
  return (
    <g>
      {/* Time axis: solid up to now, dashed for what is still to come. */}
      <line x1={W.x0} y1={y} x2={W.x0 + (W.x1 + 420 - W.x0) * axis} y2={y} stroke={THEME.faint} strokeWidth={1.6} strokeDasharray="6 8" />
      <line x1={W.x0} y1={y} x2={X(tau)} y2={y} stroke={THEME.line} strokeWidth={1.8} />
      <text x={W.x0} y={y - W.ribbonH - 46} fill={THEME.muted} fontFamily={THEME.sans} fontSize={18} letterSpacing="0.34em" opacity={axis}>{lane.title.toUpperCase()}</text>
      {lane.milestones.map((m) => <MilestoneTick key={m.label} x={X(m.tau)} y={y} label={m.label} o={axis} strong={m.tau === 1 && f >= B.perish} />)}

      <InventoryRibbon x0={W.x0} x1={W.x1} y={y} h={W.ribbonH} tau={tau} share={(t) => availableAt(lane, t) / lane.total} perish={EASE.inOut(perishing)} />
      {/* Now: the playhead. */}
      {tau > 0 && <line x1={X(tau)} y1={y - W.ribbonH - 10} x2={X(tau)} y2={y + 12} stroke={THEME.ink} strokeWidth={1.4} opacity={0.5} />}

      {/* The capacity units, riding just ahead of time: sold ones fade, the rest perish at the deadline. */}
      {Array.from({ length: lane.total }, (_, i) => {
        const appear = clamp01((f - B.units - (i / lane.total) * 50) / 8);
        if (appear <= 0) return null;
        const x = gx + (i % cols) * PITCH, yy = gy + (ROWS - 1 - Math.floor(i / cols)) * PITCH;
        const isSold = rank[i]! < sold;
        if (isSold) return <rect key={i} x={x} y={yy} width={CELL} height={CELL} fill="none" stroke={THEME.line} strokeWidth={1} opacity={0.45 * appear} />;
        // Unsold at the deadline: it does not wait, it disappears.
        const k = EASE.in(clamp01((f - B.perish - ((rank[i]! - sold) / Math.max(1, avail)) * 30) / 14));
        const s = CELL * (1 - k);
        return (
          <g key={i}>
            {k > 0 && k < 1 && <rect x={x - 2} y={yy - 2} width={CELL + 4} height={CELL + 4} fill="none" stroke={THEME.accent} strokeWidth={1.2} opacity={1 - k} />}
            {s > 0.3 && <rect x={x + (CELL - s) / 2} y={yy + (CELL - s) / 2} width={s} height={s} fill={k > 0 ? THEME.accent : THEME.ink} opacity={0.92 * appear} />}
          </g>
        );
      })}
      <text x={gx} y={y - 4} fill={THEME.ink} fontFamily={THEME.sans} fontSize={22} style={{ fontVariantNumeric: 'tabular-nums' }} opacity={clamp01((f - B.units) / 20)}>
        <tspan fontSize={30} fill={perishing > 0 ? THEME.accent : THEME.ink}>{left}</tspan>
        <tspan fill={THEME.muted}>{` / ${lane.total} ${lane.unit}`}</tspan>
      </text>
    </g>
  );
};

export const Scene03: React.FC = () => {
  const f = useCurrentFrame();
  // Time and camera share one eased progress: the camera follows time exactly.
  const tau = MOVE_TIMING.PAN.ease(seg(f, B.pan, B.panEnd));
  const dead = EASE.out(seg(f, B.perish, B.perish + 30));
  const msg = EASE.out(seg(f, B.message, B.message + 30));
  return (
    <AbsoluteFill style={{ background: THEME.bg }}>
      <CameraRig shots={S03.camera}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* The deadline, shared by both: the same instant for the seat and the room. */}
          {dead > 0 && (
            <line x1={W.x1} y1={W.laneY.flight - W.ribbonH - 30} x2={W.x1} y2={W.laneY.flight - W.ribbonH - 30 + (W.laneY.hotel + 12 - (W.laneY.flight - W.ribbonH - 30)) * dead} stroke={THEME.accent} strokeWidth={2} strokeDasharray="4 6" />
          )}
          {S03.lanes.map((lane, k) => <LaneView key={lane.key} lane={lane} f={f} tau={tau} seed={31 + k * 17} />)}
        </svg>
      </CameraRig>
      <Title text={S03.message} at={B.message} top={912} size={70} family="TITLE_REVEAL_SLOW" layout="inline" focus={[1]} tracking={0.03} />
    </AbsoluteFill>
  );
};

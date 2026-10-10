import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';
import { mix } from './products';

/**
 * ShopOne — « 1 € » : make the price feel incoherent before explaining it. Editorial 2.5D.
 *
 * Every element is a flat plane at a real depth, seen by one pinhole camera (screen = 960 + F·(X − Cx)/(Z − Cz)):
 * parallax, scale and the visible sides of the slab all come from the same camera, so they agree.
 *
 * 0–1.5 s  a real gadget (photo of a plastic fidget spinner) in the dark, raking orange light, slow push.
 * 1.5–2.5  « 1 € » surges from the depth behind it: hard acceleration, heavy braking, blur, a short settle.
 *          The slab is a stack of glyph planes (Geist ExtraBold outlines): real thickness, real sides.
 * 2.5–4    lateral travelling: the gadget slides by in the foreground, the slab shows its mass.
 * 4–6      the « 1 » comes apart into its layers (surface, contour, depth, shadow — an exploded view),
 *          then a slit opens down its stem: inside, a machine heating plastic preforms (drawn, no footage),
 *          whose glow lights the slit's walls.
 * 6–8      the camera goes through the slit, into the machine: the preforms run on a chain through the
 *          heaters, cold on the left, incandescent on the right.
 *
 * Light: one directional key from the left (LIGHT): the slab's face is graded along it, the gadget's
 * shadow falls on the « € », the slab's shadow on the back wall.
 * Media: spinner « Fidget spinner (Yellow) », Gpkp, CC BY-SA 4.0 (Wikimedia Commons). Credits in
 * public/photos/CREDITS.md. Everything else is drawn.
 */
export const ONE = { fps: 60, seconds: 8.5 };

// ---------------------------------------------------------------- glyphs (Geist ExtraBold, font units, y up)
const P1 = 'M193 0V448H37V571H98Q145 571 173.5 584.0Q202 597 215.0 627.5Q228 658 228 710H367V0Z';
const PE = 'M445 -16Q375 -16 315.5 11.5Q256 39 211.0 89.0Q166 139 141.0 206.5Q116 274 116 354Q116 434 141.0 502.0Q166 570 211.0 620.0Q256 670 315.5 698.0Q375 726 445 726Q517 726 578.0 695.5Q639 665 681.5 608.0Q724 551 739 472L560 464Q549 519 517.0 551.5Q485 584 441 584Q394 584 361.0 554.5Q328 525 311.0 473.5Q294 422 294 354Q294 287 311.0 235.5Q328 184 361.0 155.0Q394 126 441 126Q487 126 519.0 161.5Q551 197 560 256L741 247Q726 166 684.0 107.0Q642 48 580.5 16.0Q519 -16 445 -16ZM51 235V318H468L457 235ZM51 384V467H490L477 384Z';
const EURO_X = 450, CUT = 298, CAP = 710; // pen of « € »; the slit goes down the stem of « 1 » (x 228–367)
const SC = 2, GCX = 614, GCY = 355; // font units → world: X = (u − GCX)·SC, Y = −(v − GCY)·SC
const fx = (u: number) => (u - GCX) * SC, fy = (v: number) => -(v - GCY) * SC;
const FONT = `scale(${SC} ${-SC}) translate(${-GCX} ${-GCY})`;

// ---------------------------------------------------------------- world
const F = 1000; // focal: a plane at Z − Cz = 1000 is seen at scale 1
const ZP = 1800, DEPTH = 280, NC = 30, ZW = 3200; // slab front, thickness, planes in the stack, back wall
const GAP_MAX = 130; // slit width, font units
const SPIN = { x: -330, y: 200, z: 1000, w: 440, h: 440 * 703 / 1024 };
const LIGHT = { x: 0.9, y: 0.16 }; // shadow shift per unit of depth (light from the left, slightly above)

// ---------------------------------------------------------------- timing
const SLAM = [1.5, 2.4] as const, PAN = [2.6, 4.0] as const, LAYERS = [4.0, 4.6] as const, RESTACK = [4.85, 5.3] as const, SLIT = [4.9, 5.85] as const, DIVE = [5.9, 7.2] as const;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const slam = bez(0.6, 0, 0.06, 1), move = bez(0.6, 0, 0.25, 1), dive = bez(0.5, 0, 0.3, 1), soft = bez(0.4, 0, 0.6, 1), settle = bez(0.16, 1, 0.3, 1);
const seg = (t: number, [a, b]: readonly [number, number]) => (t - a) / (b - a);

type Cam = { x: number; y: number; z: number };
const sOf = (c: Cam, Z: number) => F / (Z - c.z);
const ahead = (c: Cam, Z: number) => Z - c.z > 25;
const plane = (c: Cam, Z: number) => { const s = sOf(c, Z); return `translate(${960 - s * c.x} ${540 - s * c.y}) scale(${s})`; };
const proj = (c: Cam, X: number, Y: number, Z: number) => { const s = sOf(c, Z); return { x: 960 + s * (X - c.x), y: 540 + s * (Y - c.y), s }; };

/** Where the slab is: from a speck deep in the dark to its place, then a heavy settle. */
function slabZ(t: number) {
  if (t < SLAM[0]) return 1e6;
  const u = slam(seg(t, SLAM));
  const z = 1 / lerp(1 / 90000, 1 / ZP, u);
  const a = t - SLAM[1];
  return a > 0 ? z - 34 * Math.exp(-a * 7) * Math.sin(a * 17) : z;
}

function camera(t: number): Cam {
  const push = soft(t / SLAM[0]), pan = move(seg(t, PAN)), toSlit = move((t - PAN[1]) / (SLIT[1] - PAN[1]));
  let x = lerp(-80, -420, pan), y = lerp(60, 20, pan), z = lerp(lerp(120, 230, push), 360, clamp((t - SLAM[0]) / (PAN[1] - SLAM[0])));
  const fwd = move((t - SLIT[0]) / (SLIT[1] - SLIT[0]));
  x = lerp(x, fx(CUT), toSlit); y = lerp(y, 0, toSlit); z = lerp(z, 900, fwd);
  // The impact: a short jolt.
  const a = t - SLAM[1];
  if (a > 0) y += 9 * Math.exp(-a * 9) * Math.sin(a * 46);
  // The dive: the distance to the back of the slab shrinks in log space (constant perceived speed).
  const d = dive(seg(t, DIVE)), zb = ZP + DEPTH;
  if (t > DIVE[0]) z = zb - Math.exp(lerp(Math.log(zb - 900), Math.log(90), d)) - 22 * clamp((t - DIVE[1]) / (ONE.seconds - DIVE[1]));
  return { x, y, z };
}

// ---------------------------------------------------------------- pieces
/** The three glyph pieces of one plane of the slab (font units). */
const Pieces: React.FC<{ gap: number; fill: string; fillE?: string; one?: boolean; euro?: boolean; stroke?: string }> = ({ gap, fill, fillE, one = true, euro = true, stroke }) => {
  const st = stroke ? { fill: 'none', stroke, strokeWidth: 2.2, vectorEffect: 'non-scaling-stroke' as const } : {};
  return (
    <>
      {one && <g transform={`translate(${-gap / 2} 0)`}><path d={P1} clipPath="url(#oneL)" fill={fill} {...st} /></g>}
      {one && <g transform={`translate(${gap / 2} 0)`}><path d={P1} clipPath="url(#oneR)" fill={fill} {...st} /></g>}
      {euro && <g transform={`translate(${EURO_X + gap / 2} 0)`}><path d={PE} fill={fillE ?? fill} {...st} /></g>}
    </>
  );
};
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, u: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i]!, u))).join(',')})`; };

const DUST = Array.from({ length: 90 }, (_, i) => {
  const r = (k: number) => mix(7300 + i * 7 + k) / 4294967296;
  return { x: lerp(-3200, 2400, r(0)), y: lerp(-1300, 1300, r(1)), z: lerp(500, 3000, r(2)), r: lerp(1.2, 3.4, r(3)), ph: r(4) * 6.28, sp: lerp(6, 18, r(5)) };
});

// ---------------------------------------------------------------- the machine (screen space, drawn)
const SLOTS = [-3, -2, -1, 0, 1, 2, 3].map((i) => 960 + i * 330), PITCH = 165, SPEED = 120, BASE = 760;
/** Heat of a preform at x: it builds up slot after slot (cold on the left, incandescent on the right). */
const heatAt = (x: number) => {
  const near = Math.max(...SLOTS.map((sx) => Math.exp(-(((x - sx) / 80) ** 2))));
  return clamp(0.15 + 0.55 * clamp((x - 300) / 1300) + 0.45 * near * (0.4 + 0.6 * clamp((x - 500) / 1000)));
};
const Preform: React.FC<{ x: number; h: number; id: number }> = ({ x, h, id }) => {
  const body = mixHex('#2a1408', '#ff7a2a', clamp((h - 0.2) * 1.4)), core = h < 0.75 ? mixHex('#4a230e', '#ff9a50', clamp((h - 0.3) / 0.45)) : mixHex('#ff9a50', '#fff1cc', (h - 0.75) / 0.25);
  const neck = mixHex('#3a1c0c', '#a0461a', clamp(h - 0.3)); // the neck stays cooler: it is shielded from the heaters
  return (
    <g transform={`translate(${x} ${BASE})`}>
      {/* Body: a test tube, glowing from the inside as it heats. */}
      <defs><linearGradient id={`pf${id}`} x1="0" x2="1">
        <stop offset="0" stopColor={body} /><stop offset="0.45" stopColor={core} /><stop offset="1" stopColor={body} />
      </linearGradient></defs>
      {h > 0.55 && <ellipse cx={0} cy={-210} rx={70} ry={190} fill="#ff8a3a" opacity={(h - 0.55) * 0.9} filter="url(#mGlow)" />}
      <path d="M -36 -96 L -36 -330 A 36 36 0 0 1 36 -330 L 36 -96 Z" fill={`url(#pf${id})`} />
      {/* A hollow tube: the inner wall shows through the plastic. */}
      <path d="M -22 -96 L -22 -322 A 22 22 0 0 1 22 -322 L 22 -96" fill="none" stroke="#120804" strokeOpacity={0.35 - 0.2 * h} strokeWidth={3} />
      <path d="M -29 -112 L -29 -322" stroke="#fff6e0" strokeOpacity={0.12 + 0.35 * h} strokeWidth={4} strokeLinecap="round" />
      {/* Neck, same plastic: support ring, thread, open mouth (held upside down on the chain). */}
      <rect x={-54} y={-96} width={108} height={13} rx={5} fill={neck} />
      <rect x={-41} y={-83} width={82} height={66} rx={4} fill={neck} />
      {[0, 1, 2].map((k) => <path key={k} d={`M -43 ${-72 + k * 18} L 43 ${-78 + k * 18}`} stroke="#c8703a" strokeOpacity={0.45} strokeWidth={5} strokeLinecap="round" />)}
      <rect x={-41} y={-17} width={82} height={17} fill="#1a110c" />
    </g>
  );
};
/** The heating line, filling 1920 × 1080 at scale 1. Driven by t only. */
const Machine: React.FC<{ t: number }> = ({ t }) => {
  const shift = (t * SPEED) % PITCH;
  const pre: React.ReactNode[] = [];
  for (let k = -5; k < 2320 / PITCH + 3; k++) { const x = k * PITCH + shift; pre.push(<Preform key={k} x={x} h={heatAt(x)} id={k + 2} />); }
  const flick = (i: number) => 0.92 + 0.08 * Math.sin(t * 23 + i * 1.7) * Math.sin(t * 7.3 + i);
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <defs>
        <filter id="mGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="28" /></filter>
        <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c130e" /><stop offset="0.6" stopColor="#120c09" /><stop offset="1" stopColor="#080504" /></linearGradient>
        <linearGradient id="lamp" x1="0" x2="1"><stop offset="0" stopColor="#7a2a0c" /><stop offset="0.5" stopColor="#ffb060" /><stop offset="1" stopColor="#7a2a0c" /></linearGradient>
      </defs>
      <rect x={-400} width={2720} height={1080} fill="url(#panel)" />
      {/* Heaters: tall slots in the panel, lamp tubes and coils behind the preforms. */}
      {SLOTS.map((sx, i) => (
        <g key={i}>
          <rect x={sx - 95} y={250} width={190} height={460} rx={95} fill="#0a0605" />
          <g opacity={flick(i)}>
            {[-48, 0, 48].map((dx) => <rect key={dx} x={sx + dx - 9} y={300} width={18} height={360} rx={9} fill="url(#lamp)" />)}
            {Array.from({ length: 9 }, (_, k) => <rect key={k} x={sx - 80} y={300 + k * 44} width={160} height={3} fill="#ffcf8a" opacity={0.35} />)}
            <ellipse cx={sx} cy={480} rx={150} ry={260} fill="#ff7a2a" opacity={0.35} filter="url(#mGlow)" />
          </g>
          <rect x={sx - 95} y={250} width={190} height={460} rx={95} fill="none" stroke="#3a2a22" strokeWidth={6} />
        </g>
      ))}
      {/* Rivets and a seam on the panel. */}
      {Array.from({ length: 34 }, (_, k) => <circle key={k} cx={-360 + k * 80} cy={210} r={5} fill="#2e231d" />)}
      <rect x={-400} y={190} width={2720} height={2} fill="#2a1f19" />
      {pre}
      {/* The chain that carries them. */}
      <rect x={-400} y={BASE} width={2720} height={56} fill="#1a1411" />
      {Array.from({ length: Math.ceil(2720 / 55) + 2 }, (_, k) => <rect key={k} x={k * 55 - 455 + ((t * SPEED) % 55)} y={BASE + 10} width={40} height={36} rx={8} fill="#332823" stroke="#4a3b33" strokeWidth={2} />)}
      <rect x={-400} y={BASE + 56} width={2720} height={1080 - BASE - 56} fill="#0a0706" />
      {Array.from({ length: 9 }, (_, k) => <rect key={k} x={-180 + k * 330} y={BASE + 90} width={14} height={300} fill="#17110e" />)}
      {/* Heat on the right of the line. */}
      <rect x={-400} width={2720} height={1080} fill="url(#heatSide)" />
      <defs><linearGradient id="heatSide" x1="0" x2="1"><stop offset="0" stopColor="#000" stopOpacity="0.35" /><stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#ff7a2a" stopOpacity="0.08" /></linearGradient></defs>
    </svg>
  );
};

export const ShopOne: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const cam = camera(t), Zs = slabZ(t), zb = Zs + DEPTH;
  const live = t >= SLAM[0];
  const appear = clamp(seg(t, SLAM) / 0.12);
  // Exploded view of the « 1 »: its layers come apart along a diagonal (forward, up-left), hold, then re-stack as the slit opens.
  const sep = move(seg(t, LAYERS)) * (1 - move(seg(t, RESTACK)));
  const g = move(seg(t, SLIT)), gap = GAP_MAX * g; // slit, font units
  const gapW = gap * SC;
  const zFace1 = Zs - 170 * sep, zLine = Zs - 260 * sep, zShade = zb + 380 * sep;
  const off = (k: number) => ({ x: -110 * k * sep, y: -80 * k * sep }); // world shift of a layer (k = 1 surface, 1.5 contour, −2 shadow)
  const oF = off(1), oL = off(1.5), oS = off(-2);

  // Blur while the slab rushes in: proportional to the speed of its apparent scale.
  const s0 = sOf(cam, Zs), s1 = sOf(camera(t - 1 / fps), slabZ(t - 1 / fps));
  const rush = live && t < SLAM[1] + 0.05 ? clamp((Math.abs(s0 - s1) / Math.max(s0, 1e-3)) * 260, 0, 26) : 0;

  // ---- the slit's opening on screen = intersection of the openings of every slab plane still ahead
  const xL = fx(CUT) - gapW / 2, xR = fx(CUT) + gapW / 2, yT = fy(CAP), yB = fy(0);
  let rect = { l: -1e5, r: 1e5, t: -1e5, b: 1e5 }, through = true;
  for (const [Z, o] of [[zFace1, oF], [Zs, { x: 0, y: 0 }], [zb, { x: 0, y: 0 }]] as const) {
    if (!ahead(cam, Z)) continue;
    const a = proj(cam, xL + o.x, yT + o.y, Z), b = proj(cam, xR + o.x, yB + o.y, Z);
    rect = { l: Math.max(rect.l, a.x), r: Math.min(rect.r, b.x), t: Math.max(rect.t, a.y), b: Math.min(rect.b, b.y) };
    if (a.x > -40 || b.x < 1960 || a.y > -40 || b.y < 1120) through = false;
  }
  const open = gap > 0.3 && rect.r > rect.l;
  const centre = proj(cam, fx(CUT), 0, Zs);

  // ---- the slab: stack of planes, back to front
  const stack: React.ReactNode[] = [];
  if (live) {
    for (let i = NC; i >= 0; i--) {
      const Z = Zs + (DEPTH * i) / NC;
      if (!ahead(cam, Z)) continue;
      const u = i / NC, c = mixHex('#5e2a10', '#160804', u ** 0.8);
      stack.push(<g key={`s${i}`} transform={plane(cam, Z)}><g transform={FONT}><Pieces gap={gap} fill={c} /></g></g>);
    }
  }
  // The slit's walls: the cut faces of the two halves, lit by the machine from inside.
  const walls: React.ReactNode[] = [];
  if (live && gap > 0.3) {
    for (const side of [-1, 1] as const) {
      const X = side < 0 ? xL : xR;
      if (side < 0 ? cam.x <= X : cam.x >= X) continue; // facing away
      const z0 = Math.max(Zs, cam.z + 26);
      if (z0 >= zb) continue;
      const p = [proj(cam, X, yT, z0), proj(cam, X, yB, z0), proj(cam, X, yB, zb), proj(cam, X, yT, zb)];
      const m0 = { x: (p[0]!.x + p[1]!.x) / 2, y: (p[0]!.y + p[1]!.y) / 2 }, m1 = { x: (p[2]!.x + p[3]!.x) / 2, y: (p[2]!.y + p[3]!.y) / 2 };
      walls.push(
        <g key={`w${side}`}>
          <defs><linearGradient id={`wall${side}`} gradientUnits="userSpaceOnUse" x1={m0.x} y1={m0.y} x2={m1.x} y2={m1.y}>
            <stop offset="0" stopColor="#2a1007" /><stop offset="0.55" stopColor="#8a3412" /><stop offset="1" stopColor="#ff9a4a" />
          </linearGradient></defs>
          <polygon points={p.map((q) => `${q.x},${q.y}`).join(' ')} fill={`url(#wall${side})`} opacity={clamp(g * 3)} />
        </g>,
      );
    }
  }

  // ---- the gadget
  const sp = proj(cam, SPIN.x, SPIN.y + 8 * Math.sin(t * 1.3), SPIN.z);
  const spOn = ahead(cam, SPIN.z) && sp.s < 6;
  const spW = SPIN.w * sp.s, spH = SPIN.h * sp.s;
  const spFade = 1 - clamp((sp.s - 3.2) / 2.2);
  // Its shadow on the slab's face (directional light): shifted along LIGHT by the depth between them.
  const shDZ = Zs - SPIN.z, shX = SPIN.x + LIGHT.x * shDZ, shY = SPIN.y + LIGHT.y * shDZ;

  const dust = (near: boolean) => DUST.map((d, i) => {
    const X = d.x + d.sp * t + 30 * Math.sin(t * 0.4 + d.ph), Y = d.y - 9 * t + 20 * Math.cos(t * 0.3 + d.ph), Z = d.z;
    if ((Z < ZP) !== near || !ahead(cam, Z + 60)) return null;
    const p = proj(cam, X, Y, Z);
    if (p.x < -60 || p.x > 1980 || p.y < -60 || p.y > 1140) return null;
    const lit = 0.12 + 0.75 * clamp(1 - (X + 2600) / 4200); // brighter in the beam, on the left
    const big = p.s > 1.6, r = d.r * p.s * (big ? 2.2 : 1);
    return <circle key={i} cx={p.x} cy={p.y} r={r} fill="#ffc48a" opacity={lit * (big ? 0.25 : 0.8) * clamp(2 - p.s * 0.35) * clamp(t / 0.8)} />;
  });

  // ---- the machine: fixed to the screen, a hot slot centred in the slit; pushed a little during the dive
  const dv = dive(seg(t, DIVE)), tail = clamp((t - DIVE[1]) / (ONE.seconds - DIVE[1]));
  const vs = lerp(1.45, 1.12, dv) * (1 + 0.05 * tail), vx = lerp(-330 * 1.45, -165 * 1.12, dv), vy = lerp(40, 20, dv);
  const veil = 1 - clamp((dv - 0.45) / 0.45);

  // ---- layer labels (exploded view)
  const lab = clamp((t - 4.35) / 0.3) * (1 - clamp((t - 4.85) / 0.2));
  const at = (u: number, v: number, Z: number, o: { x: number; y: number }) => proj(cam, fx(u) + o.x - gapW / 2, fy(v) + o.y, Z);
  const LABELS: Array<[string, { x: number; y: number; s: number }]> = [
    ['CONTOUR', at(37, 571, zLine, oL)], ['SURFACE', at(110, 520, zFace1, oF)], ['PROFONDEUR', at(367, 420, Zs + DEPTH * 0.5, { x: 0, y: 0 })], ['OMBRE', at(367, 250, zShade, oS)],
  ];

  return (
    <AbsoluteFill style={{ background: '#060403', overflow: 'hidden' }}>
      {/* Back wall: the key light's beam, the slab's cast shadow, far dust. */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="beam" gradientUnits="userSpaceOnUse" cx={-2600} cy={-300} r={5200}>
            <stop offset="0" stopColor="#ff8a3d" stopOpacity="0.55" /><stop offset="0.35" stopColor="#c8521c" stopOpacity="0.28" /><stop offset="0.7" stopColor="#3a1608" stopOpacity="0.08" /><stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <filter id="wallShadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22" /></filter>
        </defs>
        <g transform={plane(cam, ZW)}>
          <rect x={-12000} y={-8000} width={24000} height={16000} fill="url(#beam)" />
          {/* (Only once the slab is in front of the wall: while it rushes in from beyond, it casts nothing there.) */}
          {live && zb < ZW - 100 && (
            <g transform={`translate(${LIGHT.x * (ZW - Zs - DEPTH / 2)} ${LIGHT.y * (ZW - Zs - DEPTH / 2)})`} opacity={0.85 * clamp((ZW - zb - 100) / 700)}>
              <g transform={FONT} filter="url(#wallShadow)"><Pieces gap={gap} fill="#050302" /></g>
            </g>
          )}
        </g>
        {dust(false)}
      </svg>

      {/* The machine, seen through the slit. */}
      {open && (
          <AbsoluteFill style={{ clipPath: through ? undefined : `inset(${rect.t}px ${1920 - rect.r}px ${1080 - rect.b}px ${rect.l}px)` }}>
            <AbsoluteFill style={{ transform: `translate(${vx}px, ${vy}px) scale(${vs})`, transformOrigin: '50% 50%' }}>
              <Machine t={t} />
            </AbsoluteFill>
            {/* Deep inside, the machine is a glow: the dark closes in around it until the camera is through. */}
            <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 60% at ${centre.x}px 45%, rgba(6,4,3,0) 0%, rgba(6,4,3,${0.55 * veil}) 70%, rgba(6,4,3,${0.9 * veil}) 100%)` }} />
          </AbsoluteFill>
        )}

      {/* The slab. */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: appear, filter: rush > 0.3 ? `blur(${rush}px)` : undefined }}>
        <defs>
          <clipPath id="oneL" clipPathUnits="userSpaceOnUse"><rect x={-2000} y={-2000} width={2000 + CUT} height={5000} /></clipPath>
          <clipPath id="oneR" clipPathUnits="userSpaceOnUse"><rect x={CUT} y={-2000} width={3000} height={5000} /></clipPath>
          {/* The key light rakes the face from the left. */}
          <linearGradient id="face1" gradientUnits="userSpaceOnUse" x1={37} y1={710} x2={1191} y2={0}>
            <stop offset="0" stopColor="#ffd3a6" /><stop offset="0.28" stopColor="#f2873f" /><stop offset="0.62" stopColor="#a8441a" /><stop offset="1" stopColor="#4a1d0a" />
          </linearGradient>
          <linearGradient id="faceE" gradientUnits="userSpaceOnUse" x1={37 - EURO_X} y1={710} x2={1191 - EURO_X} y2={0}>
            <stop offset="0" stopColor="#ffd3a6" /><stop offset="0.28" stopColor="#f2873f" /><stop offset="0.62" stopColor="#a8441a" /><stop offset="1" stopColor="#4a1d0a" />
          </linearGradient>
          <filter id="spShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feColorMatrix type="matrix" values="0 0 0 0 0.03  0 0 0 0 0.01  0 0 0 0 0  0 0 0 0.75 0" /><feGaussianBlur stdDeviation="14" />
          </filter>
          <clipPath id="faceClip" clipPathUnits="userSpaceOnUse">
            <path transform={`${FONT} translate(${EURO_X + gap / 2} 0)`} d={PE} />
          </clipPath>
          <filter id="ghost"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="shade" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18" /></filter>
          <radialGradient id="slitGlow"><stop offset="0" stopColor="#ff9a4a" stopOpacity="0.75" /><stop offset="0.35" stopColor="#ff7a2a" stopOpacity="0.28" /><stop offset="1" stopColor="#ff7a2a" stopOpacity="0" /></radialGradient>
        </defs>
        {live && (
          <>
            {/* « Ombre »: the « 1 »'s shadow layer, pulled back in the exploded view. */}
            {sep > 0.01 && ahead(cam, zShade) && (
              <g transform={`${plane(cam, zShade)} translate(${oS.x} ${oS.y})`} opacity={clamp(sep * 1.5)}>
                <g transform={FONT} filter="url(#shade)" opacity={0.8}><Pieces gap={gap} fill="#000" euro={false} /></g>
                {/* Drawn as a diagram layer too, so it reads on the dark wall. */}
                <g transform={FONT}><Pieces gap={gap} fill="rgba(0,0,0,0.35)" euro={false} /><Pieces gap={gap} fill="none" stroke="rgba(255,176,112,0.45)" euro={false} /></g>
              </g>
            )}
            {stack}
            {walls}
            {/* Faces: « € » on the stack, « 1 » lifted forward in the exploded view. */}
            {ahead(cam, Zs) && (
              <g transform={plane(cam, Zs)}>
                <g transform={FONT}><Pieces gap={gap} fill="url(#face1)" fillE="url(#faceE)" one={false} /></g>
                {/* The gadget's shadow, falling on the « € ». */}
                <g clipPath="url(#faceClip)"><image href={staticFile('shop/spinner.png')} x={shX - SPIN.w / 2} y={shY - SPIN.h / 2} width={SPIN.w} height={SPIN.h} filter="url(#spShadow)" /></g>
              </g>
            )}
            {ahead(cam, zFace1) && (
              <g transform={`${plane(cam, zFace1)} translate(${oF.x} ${oF.y})`}>
                <g transform={FONT}>
                  <Pieces gap={gap} fill="url(#face1)" euro={false} />
                  {/* Incandescent lips along the cut. */}
                  {gap > 0.3 && <>
                    <rect x={CUT - gap / 2 - 5} y={0} width={5} height={CAP} fill="#ffd8a0" opacity={clamp(g * 4)} />
                    <rect x={CUT + gap / 2} y={0} width={5} height={CAP} fill="#ffd8a0" opacity={clamp(g * 4)} />
                  </>}
                </g>
              </g>
            )}
            {sep > 0.01 && ahead(cam, zLine) && (
              <g transform={`${plane(cam, zLine)} translate(${oL.x} ${oL.y})`} opacity={clamp(sep * 2)}><g transform={FONT}><Pieces gap={gap} fill="none" stroke="#ffb070" euro={false} /></g></g>
            )}
            {/* The machine's light spills out of the slit. */}
            {gap > 0.3 && (
              <ellipse cx={centre.x} cy={centre.y} rx={900 * centre.s * (0.4 + g)} ry={1100 * centre.s * (0.4 + g)} fill="url(#slitGlow)" style={{ mixBlendMode: 'screen' }} opacity={g * (1 - clamp((dv - 0.5) / 0.4))} />
            )}
          </>
        )}
      </svg>

      {/* The gadget: the real photo, relit by the same key (warm on the left, falling off to the right). */}
      {spOn && (
        <div style={{ position: 'absolute', left: sp.x - spW / 2, top: sp.y - spH / 2, width: spW, height: spH, opacity: spFade * clamp(t / 0.6), transform: `rotate(${1.2 * Math.sin(t * 0.7)}deg)`, filter: sp.s > 2.2 ? `blur(${(sp.s - 2.2) * 5}px)` : undefined }}>
          <Img src={staticFile('shop/spinner.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, #ffc08a 0%, #d0662a 38%, #6a2a10 72%, #1d0b05 100%)', mixBlendMode: 'multiply', WebkitMaskImage: `url(${staticFile('shop/spinner.png')})`, WebkitMaskSize: '100% 100%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(255,150,70,0.5) 0%, rgba(255,150,70,0) 35%)', mixBlendMode: 'screen', WebkitMaskImage: `url(${staticFile('shop/spinner.png')})`, WebkitMaskSize: '100% 100%' }} />
        </div>
      )}

      {/* Near dust; labels of the exploded view. */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {dust(true)}
        {lab > 0.01 && LABELS.map(([name, a], i) => {
          // A column of labels on the left, each tied to its layer by a leader line.
          const lx = 150, ly = 300 + i * 150, w = name.length * 13.2 + 26;
          return (
            <g key={name} opacity={lab}>
              <polyline points={`${lx + w},${ly} ${lx + w + 40},${ly} ${a.x},${a.y}`} fill="none" stroke="#f2efe9" strokeOpacity={0.55} strokeWidth={1.2} strokeDasharray={1400} strokeDashoffset={1400 * (1 - clamp((t - 4.35 - i * 0.05) / 0.3))} />
              <circle cx={a.x} cy={a.y} r={4} fill="#f2efe9" />
              <rect x={lx} y={ly - 17} width={w} height={34} rx={3} fill="#0b0705" fillOpacity={0.82} />
              <text x={lx + 13} y={ly + 5.5} fontFamily={THEME.mono} fontSize={15} letterSpacing="0.22em" fill="#f2efe9">{name}</text>
            </g>
          );
        })}
      </svg>

      {/* Film: grain and vignette. */}
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile(`shop/grain-${frame % 8}.png`)})`, backgroundSize: '512px 512px', mixBlendMode: 'overlay', opacity: 0.22 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)' }} />
    </AbsoluteFill>
  );
};

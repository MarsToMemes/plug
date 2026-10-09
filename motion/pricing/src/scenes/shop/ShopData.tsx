import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { rng } from '../../theme';
import { GARMENTS, paints, type Kind } from './garments';
import { product, mix, type Product } from './products';

/**
 * ShopData — how a profile is built from browsing, shown as an editorial data graph.
 *
 * Real perspective (pinhole camera looking down +z, drawn on a canvas, depth-sorted). Miniature
 * product cards hang in space along the camera's path; the profile is a typographic block far ahead,
 * a point at first. As the camera travels through, each card appears, then links to its category,
 * clicks link to their cards, categories link to the profile — every link is drawn from its source
 * when the camera passes it, and the profile's counters follow. The camera settles; eight recommended
 * products come OUT of the profile (the data went in, the selection comes out) and gather into a
 * selection, each one pulling its thread in the one accent.
 *
 * No brain, no face, no glow: thin lines, paper cards, mono labels, one serif figure.
 */
export const DATA = { fps: 60, seconds: 9 };

// ---------------------------------------------------------------- palette & type
const BG = '#0B0C0E', PAPER = '#F2EFE9', LINE = '233,228,218', ACCENT = '#E8442B', MUTED = '#8C877F';
const MONO = "'Geist Mono', monospace", SERIF = "'Instrument Serif', serif", SANS = 'Geist, sans-serif';

// ---------------------------------------------------------------- camera
const F = 1100, NEAR = 60;
type V3 = { x: number; y: number; z: number };
const KEYS: V3[] = [{ x: -300, y: 120, z: -6400 }, { x: 220, y: -90, z: -4800 }, { x: -120, y: 70, z: -3200 }, { x: 450, y: 0, z: -1250 }];
const TRAVEL = 6.4;
const smooth = (u: number) => { const x = Math.min(1, Math.max(0, u)); return x * x * x * (x * (6 * x - 15) + 10); }; // quintic: zero speed AND acceleration at both ends
function catmull(p: V3[], s: number): V3 {
  const n = p.length - 1, i = Math.min(n - 1, Math.floor(s)), u = s - i;
  const P0 = p[Math.max(0, i - 1)]!, P1 = p[i]!, P2 = p[i + 1]!, P3 = p[Math.min(n, i + 2)]!;
  const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return { x: f(P0.x, P1.x, P2.x, P3.x), y: f(P0.y, P1.y, P2.y, P3.y), z: f(P0.z, P1.z, P2.z, P3.z) };
}
const camAt = (t: number) => catmull(KEYS, (KEYS.length - 1) * smooth(t / TRAVEL));
// When does the camera reach depth z? (its z is monotonic)
const CZ = Array.from({ length: 1201 }, (_, i) => camAt((i / 1200) * TRAVEL).z);
const timeAtZ = (z: number) => { if (z <= CZ[0]!) return 0; let i = 0; while (i < 1200 && CZ[i + 1]! < z) i++; if (i >= 1200) return TRAVEL; return ((i + (z - CZ[i]!) / (CZ[i + 1]! - CZ[i]!)) / 1200) * TRAVEL; };

// ---------------------------------------------------------------- the graph
const PROFILE: V3 = { x: 0, y: 0, z: 0 };
const CATS = ['ROBES', 'TOPS', 'MAILLE', 'BAS', 'VESTES', 'SACS'] as const;
const CAT_OF: Record<Kind, number> = { dress: 0, tee: 1, cami: 1, sweater: 2, hoodie: 2, jeans: 3, shorts: 3, skirt: 3, jacket: 4, bag: 5 };
const pathAtZ = (z: number) => camAt(timeAtZ(z));
type Item = { p: V3; prod: Product; cat: number; show: number; link: number; click?: { p: V3; t: number; label: string } };
const ITEMS: Item[] = [];
{
  const r = rng(mix(5150));
  for (let i = 0; i < 64; i++) {
    const z = -5800 + (i / 63) * 4350 + (r() - 0.5) * 120, c = pathAtZ(z);
    const a = r() * Math.PI * 2, d = 260 + r() * 460; // never on the camera's line
    const prod = product(i, mix(8800 + i));
    const p = { x: c.x + Math.cos(a) * d * 1.6, y: c.y + Math.sin(a) * d * 0.8, z };
    const due = timeAtZ(z - 2700); // the cards already in view at the start appear one by one, far ones last
    ITEMS.push({ p, prod, cat: CAT_OF[prod.kind], show: due > 0 ? due : 0.05 + ((z + 5800) / 2700) * 0.7, link: timeAtZ(z - 1500) + 0.1 });
  }
  // Clicks: on some of the cards, a small mark beside the card, linked to it a beat after.
  ITEMS.forEach((it, i) => { if (r() < 0.4) { const h = 9 + Math.floor(r() * 12), m = Math.floor(r() * 60); it.click = { p: { x: it.p.x + 110, y: it.p.y - 90, z: it.p.z }, t: it.link + 0.25, label: `CLIC ${h}:${String(m).padStart(2, '0')}` }; } });
}
const CAT_NODES = CATS.map((_, k) => {
  const z = -2500 + (k % 3) * 260, c = pathAtZ(z), a = (k / CATS.length) * Math.PI * 2 + 0.4;
  const p = { x: c.x + Math.cos(a) * 760, y: c.y + Math.sin(a) * 420, z };
  return { p, link: timeAtZ(z - 1700), toProfile: timeAtZ(z - 900) };
});

// ---------------------------------------------------------------- the selection
const GATHER = 5.35, SLOT = { w: 120, h: 170, g: 24 }, GRID_Z = -500, GRID_C = { x: 716, y: 0 };
const slot = (j: number): V3 => ({ x: GRID_C.x + ((j % 4) - 1.5) * (SLOT.w + SLOT.g), y: GRID_C.y + (Math.floor(j / 4) - 0.5) * (SLOT.h + SLOT.g), z: GRID_Z });
const inOut = (u: number) => { const x = Math.min(1, Math.max(0, u)); return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2; };
const outCubic = (u: number) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp3 = (a: V3, b: V3, u: number): V3 => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u });
const SELECTION = Array.from({ length: 8 }, (_, j) => product(200 + j, mix(4242 + j * 7)));
/** A recommendation leaves the profile and arcs to its slot (it grows as it comes towards the camera). */
function pickPos(j: number, t: number): { p: V3; u: number } {
  const u = inOut((t - GATHER - j * 0.09) / 1.05), g = slot(j);
  const mid = { x: (PROFILE.x + g.x) / 2, y: g.y * 1.6, z: (PROFILE.z + GRID_Z) / 2 };
  return { p: lerp3(lerp3(PROFILE, mid, u), lerp3(mid, g, u), u), u };
}

// ---------------------------------------------------------------- drawing
const PATHS = new Map<Kind, Path2D[]>();
const pathsOf = (k: Kind) => { let p = PATHS.get(k); if (!p) { p = GARMENTS[k].map((o) => new Path2D(o.d)); PATHS.set(k, p); } return p; };

function draw(ctx: CanvasRenderingContext2D, t: number) {
  const cam = camAt(Math.min(t, TRAVEL));
  const proj = (p: V3) => { const d = p.z - cam.z; return d < NEAR ? null : { X: 960 + (F * (p.x - cam.x)) / d, Y: 540 + (F * (p.y - cam.y)) / d, k: F / d, d }; };
  const fog = (d: number) => clamp((5200 - d) / 2600) * clamp((d - NEAR) / 260); // far: fades; very near: fades before it fills the lens
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = BG; ctx.fillRect(0, 0, 1920, 1080);
  const dim = 1 - 0.78 * inOut((t - GATHER) / 0.8);

  // A segment a → b drawn up to fraction u (in 3D, so the growth is perspective-correct), clipped at the near plane.
  const seg = (a: V3, b: V3, u: number, style: string, w: number) => {
    if (u <= 0) return;
    let A = a, B = lerp3(a, b, clamp(u));
    const da = A.z - cam.z - NEAR, db = B.z - cam.z - NEAR;
    if (da < 0 && db < 0) return;
    if (da < 0) A = lerp3(A, B, da / (da - db)); else if (db < 0) B = lerp3(A, B, da / (da - db));
    const pa = proj(A), pb = proj(B); if (!pa || !pb) return;
    ctx.strokeStyle = style; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pa.X, pa.Y); ctx.lineTo(pb.X, pb.Y); ctx.stroke();
  };
  const grow = (t0: number, dur = 0.7) => outCubic((t - t0) / dur);
  const lineAlpha = (t0: number) => 0.26 + 0.5 * Math.exp(-Math.max(0, t - t0 - 0.7) / 0.5); // bright while it is drawn, then it settles

  // Links (under everything).
  ctx.lineCap = 'round';
  for (const c of CAT_NODES) seg(c.p, PROFILE, grow(c.toProfile, 1.1), `rgba(${LINE},${lineAlpha(c.toProfile) * dim})`, 1);
  for (const it of ITEMS) {
    seg(it.p, CAT_NODES[it.cat]!.p, grow(it.link), `rgba(${LINE},${lineAlpha(it.link) * dim})`, 1);
    if (it.click) seg(it.click.p, it.p, grow(it.click.t, 0.4), `rgba(${LINE},${lineAlpha(it.click.t) * dim})`, 1);
  }
  // The selection: each recommendation pulls a thread from the profile, in the accent.
  SELECTION.forEach((_, j) => { const { p, u } = pickPos(j, t); if (u > 0) seg(PROFILE, { x: p.x - (SLOT.w / 2) * u, y: p.y, z: p.z }, 1, ACCENT, 1.3); });

  // Nodes, far to near.
  type D = { d: number; f: () => void };
  const list: D[] = [];
  for (const it of ITEMS) {
    const pr = proj(it.p); if (!pr) continue;
    const appear = outCubic((t - it.show) / 0.6); if (appear <= 0) continue;
    const a = fog(pr.d) * appear * dim;
    if (a < 0.01) continue;
    list.push({ d: pr.d, f: () => drawCard(ctx, it.prod, pr.X, pr.Y, pr.k * (0.85 + 0.15 * appear), a) });
    if (it.click) {
      const pc = proj(it.click.p), ca = outCubic((t - it.click.t + 0.15) / 0.3) * dim;
      if (pc && ca > 0.01) list.push({ d: pc.d, f: () => { ctx.globalAlpha = ca * fog(pc.d); ctx.strokeStyle = PAPER; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(pc.X, pc.Y, 5 * pc.k + 2, 0, Math.PI * 2); ctx.stroke(); label(ctx, it.click!.label, pc.X + 10 * pc.k + 6, pc.Y + 4 * pc.k, 13 * pc.k, MUTED); ctx.globalAlpha = 1; } });
    }
  }
  CAT_NODES.forEach((c, k) => {
    const pr = proj(c.p); if (!pr) return;
    const a = fog(pr.d) * outCubic((t - c.link + 0.4) / 0.5) * dim; if (a < 0.01) return;
    const n = ITEMS.filter((it) => it.cat === k && t >= it.link).length;
    list.push({ d: pr.d, f: () => { ctx.globalAlpha = a; ctx.fillStyle = PAPER; const s = 7 * pr.k + 2; ctx.fillRect(pr.X - s / 2, pr.Y - s / 2, s, s); label(ctx, `${CATS[k]}  ${String(n).padStart(2, '0')}`, pr.X + 14 * pr.k + 6, pr.Y + 6 * pr.k, 20 * pr.k, PAPER); ctx.globalAlpha = 1; } });
  });
  SELECTION.forEach((prod, j) => {
    const { p, u } = pickPos(j, t); if (u <= 0) return;
    const pr = proj(p); if (pr) list.push({ d: pr.d - 1e5, f: () => drawCard(ctx, prod, pr.X, pr.Y, pr.k, clamp((u - 0.02) * 8)) }); // always in front
  });
  list.sort((a, b) => b.d - a.d).forEach((x) => x.f());

  // The profile: a point with a typographic block; its counters follow the links already drawn.
  const pp = proj(PROFILE);
  if (pp) {
    const seen = ITEMS.filter((it) => t >= it.link).length, clicks = ITEMS.filter((it) => it.click && t >= it.click.t).length, cats = CAT_NODES.filter((c) => t >= c.toProfile).length;
    const k = pp.k, a = clamp((7000 - pp.d) / 2500);
    ctx.globalAlpha = a;
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(pp.X, pp.Y, 6 * k + 2.5, 0, Math.PI * 2); ctx.fill();
    label(ctx, 'PROFIL', pp.X - 40 * k, pp.Y - 70 * k, 20 * k, MUTED, 'right');
    ctx.textAlign = 'right'; ctx.fillStyle = PAPER; ctx.font = `400 ${96 * k}px ${SERIF}`; ctx.fillText('n° 0482', pp.X - 36 * k, pp.Y + 4 * k);
    [[`${seen * 5 - (seen ? 8 : 0)}`, 'articles consultés'], [`${clicks}`, 'clics'], [`${cats}`, 'catégories']].forEach(([v, l], i) => {
      ctx.font = `400 ${22 * k}px ${SANS}`; const lw = ctx.measureText(l!).width + 12 * k;
      ctx.textAlign = 'right'; ctx.fillStyle = MUTED; ctx.font = `400 ${22 * k}px ${SANS}`; ctx.fillText(l!, pp.X - 40 * k, pp.Y + (56 + i * 34) * k);
      ctx.fillStyle = PAPER; ctx.font = `600 ${22 * k}px ${SANS}`; ctx.fillText(v!, pp.X - 40 * k - lw, pp.Y + (56 + i * 34) * k);
    });
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  }

  // Selection caption, set in the grid's plane.
  const ga = outCubic((t - GATHER - 1.3) / 0.6);
  if (ga > 0) {
    const tl = proj({ x: GRID_C.x - 2 * (SLOT.w + SLOT.g) + SLOT.g / 2, y: GRID_C.y - SLOT.h - SLOT.g / 2 - 26, z: GRID_Z })!;
    const bl = proj({ x: GRID_C.x - 2 * (SLOT.w + SLOT.g) + SLOT.g / 2, y: GRID_C.y + SLOT.h + SLOT.g / 2 + 40, z: GRID_Z })!;
    ctx.globalAlpha = ga;
    label(ctx, 'SÉLECTION PERSONNALISÉE', tl.X, tl.Y, 15 * tl.k, ACCENT);
    label(ctx, '8 articles, calculés à partir de 312 consultations', bl.X, bl.Y, 15 * bl.k, MUTED, 'left', SANS);
    ctx.globalAlpha = 1;
  }
}

function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left', family = MONO) {
  if (size < 3) return;
  ctx.textAlign = align; ctx.fillStyle = color; ctx.font = `400 ${size}px ${family}`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = family === MONO ? `${size * 0.14}px` : '0px';
  ctx.fillText(s, x, y);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px';
  ctx.textAlign = 'left';
}

const CW = 120, CH = 170, IMG = 120;
function drawCard(ctx: CanvasRenderingContext2D, p: Product, X: number, Y: number, k: number, a: number) {
  ctx.globalAlpha = a;
  ctx.setTransform(k, 0, 0, k, X, Y);
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.roundRect(-CW / 2, -CH / 2, CW, CH, 4); ctx.fill();
  ctx.fillStyle = p.bg; ctx.fillRect(-CW / 2 + 5, -CH / 2 + 5, CW - 10, IMG - 10);
  if (CW * k > 10) {
    const g = 0.9, pal = paints(p.color), ops = GARMENTS[p.kind], paths = pathsOf(p.kind);
    ctx.setTransform(k * g, 0, 0, k * g, X - 45 * k, Y - CH / 2 * k + 6 * k);
    for (let i = 0; i < ops.length; i++) { const o = ops[i]!; ctx.globalAlpha = a * (o.op ?? 1); if (o.fill) { ctx.fillStyle = pal[o.fill]; ctx.fill(paths[i]!); } if (o.stroke) { ctx.strokeStyle = pal[o.stroke]; ctx.lineWidth = o.sw ?? 1.4; ctx.stroke(paths[i]!); } }
    ctx.globalAlpha = a; ctx.setTransform(k, 0, 0, k, X, Y);
    if (CW * k > 40) { ctx.fillStyle = '#111'; ctx.font = `700 15px ${SANS}`; ctx.fillText(`${p.price.toFixed(2).replace('.', ',')} €`, -CW / 2 + 7, CH / 2 - 18); ctx.fillStyle = '#B9B4AC'; ctx.fillRect(-CW / 2 + 7, CH / 2 - 44, 70, 5); }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
}

export const ShopData: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender('ShopData: canvas fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const need = ['Geist', 'Geist Mono', 'Instrument Serif'];
    const ok = () => need.every((n) => [...document.fonts].some((f) => f.family.replace(/["']/g, '') === n && f.status === 'loaded'));
    const tick = () => { if (!alive) return; if (ok()) { setReady(true); continueRender(handle); } else setTimeout(tick, 25); };
    tick();
    return () => { alive = false; };
  }, [handle]);
  useLayoutEffect(() => { const ctx = ref.current?.getContext('2d'); if (ready && ctx) draw(ctx, t); }, [t, ready]);
  return (
    <AbsoluteFill style={{ background: BG }}>
      <canvas ref={ref} width={1920} height={1080} />
    </AbsoluteFill>
  );
};

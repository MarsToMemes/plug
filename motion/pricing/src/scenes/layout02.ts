/**
 * Geometry of scene 02, computed from capacities (no hard-coded counts): where each seat sits
 * in the aircraft, where each room sits on the facade, where each unit sits in the abstract grid.
 */
export type Box = { x: number; y: number; w: number; h: number };
export type Unit = { x: number; y: number; w: number; h: number };

export function aircraftLayout(seats: number, layout: number[], cx = 960, cy = 540) {
  const per = layout.reduce((a, b) => a + b, 0);
  const rows = Math.ceil(seats / per);
  const S = 22, G = 6, PITCH = 30, AISLE = 22;
  const across = per * S + (per - layout.length) * G + (layout.length - 1) * AISLE;
  const cabin = rows * PITCH;
  const body: Box = { w: cabin + 150, h: across + 72, x: 0, y: 0 };
  body.x = cx - body.w / 2 - 60;
  body.y = cy - body.h / 2;
  const units: Unit[] = [];
  for (let r = 0; r < rows; r++) {
    let y = cy - across / 2, c = 0;
    layout.forEach((n, g) => {
      for (let k = 0; k < n; k++, c++) {
        if (units.length < seats) units.push({ x: body.x + body.w - 70 - (r + 1) * PITCH + (PITCH - S), y, w: S, h: S });
        y += S + G;
      }
      y += AISLE - G;
    });
  }
  return { body, units, rows, per };
}

export function hotelLayout(rooms: number, perFloor: number, cx = 960, cy = 540) {
  const floors = Math.ceil(rooms / perFloor);
  const W = 24, H = 30, PX = 36, PY = 44;
  const gw = perFloor * PX - (PX - W), gh = floors * PY - (PY - H);
  const body: Box = { w: gw + 80, h: gh + 96, x: 0, y: 0 };
  body.x = cx - body.w / 2;
  body.y = cy - body.h / 2 - 10;
  const units: Unit[] = [];
  for (let i = 0; i < rooms; i++) {
    const f = Math.floor(i / perFloor), k = i % perFloor;
    units.push({ x: body.x + 40 + k * PX, y: body.y + 40 + (floors - 1 - f) * PY, w: W, h: H });
  }
  return { body, units, floors };
}

/** A plain grid: `n` cells, `cols` wide, centred on (cx, cy). */
export function gridLayout(n: number, cols: number, cx: number, cy: number, cell = 20, pitch = 28): Unit[] {
  const rows = Math.ceil(n / cols);
  const w = cols * pitch - (pitch - cell), h = rows * pitch - (pitch - cell);
  return Array.from({ length: n }, (_, i) => ({ x: cx - w / 2 + (i % cols) * pitch, y: cy + h / 2 - cell - Math.floor(i / cols) * pitch, w: cell, h: cell }));
}

/** Apply "scale around origin then translate" to a unit or a box. */
export const place = <T extends Box>(u: T, s: number, dx: number, dy: number, ox = 960, oy = 540): T => ({ ...u, x: ox + (u.x - ox) * s + dx, y: oy + (u.y - oy) * s + dy, w: u.w * s, h: u.h * s });

export const mixBox = <T extends Box>(a: T, b: T, t: number): T => ({ ...a, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t });

/**
 * Pair two sets of units by position (left to right, then top to bottom), so a morph moves
 * every unit to the corresponding place instead of crossing the whole shape.
 * Returns, for each unit of `from`, the index of its target in `to`.
 */
export function matchByPosition(from: Unit[], to: Unit[]): number[] {
  const key = (u: Unit) => u.x * 10000 + u.y;
  const fi = from.map((_, i) => i).sort((a, b) => key(from[a]!) - key(from[b]!));
  const ti = to.map((_, i) => i).sort((a, b) => key(to[a]!) - key(to[b]!));
  const out = new Array<number>(from.length);
  fi.forEach((f, k) => (out[f] = ti[Math.round((k * (ti.length - 1)) / Math.max(1, fi.length - 1))]!));
  return out;
}

/** Position of a unit's centre inside a box, as (0..1, 0..1). */
export const norm = (u: Unit, b: Box): [number, number] => [(u.x + u.w / 2 - b.x) / b.w, (u.y + u.h / 2 - b.y) / b.h];
const boundsOf = (us: Unit[]): Box => {
  const x0 = Math.min(...us.map((u) => u.x)), y0 = Math.min(...us.map((u) => u.y));
  return { x: x0, y: y0, w: Math.max(...us.map((u) => u.x + u.w)) - x0, h: Math.max(...us.map((u) => u.y + u.h)) - y0 };
};

/**
 * Pair units by their relative place in their own shape (nearest free target), so that during
 * a morph the whole set reads as one shape being stretched, not as units crossing each other.
 */
export function matchByShape(from: Unit[], to: Unit[]): number[] {
  const bf = boundsOf(from), bt = boundsOf(to);
  const nf = from.map((u) => norm(u, bf)), nt = to.map((u) => norm(u, bt));
  const used = new Uint8Array(to.length);
  const order = from.map((_, i) => i).sort((a, b) => nf[a]![1] - nf[b]![1] || nf[a]![0] - nf[b]![0]);
  const out = new Array<number>(from.length);
  for (const i of order) {
    let best = -1, bd = Infinity;
    for (let j = 0; j < to.length; j++) {
      if (used[j]) continue;
      const d = (nf[i]![0] - nt[j]![0]) ** 2 + (nf[i]![1] - nt[j]![1]) ** 2;
      if (d < bd) { bd = d; best = j; }
    }
    used[best] = 1;
    out[i] = best;
  }
  return out;
}

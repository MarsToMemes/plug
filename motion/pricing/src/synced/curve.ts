/**
 * Curves for word-synced motion (skill word-synced-motion): a smooth path through points,
 * sampled once, with its arc length, so that a spark can travel it at a given distance and
 * letters can be placed on it (position + tangent angle).
 */
export type P = { x: number; y: number };
export type Curve = { pts: P[]; len: number[]; total: number };

/** Catmull-Rom through the points (centripetal enough for prices), `n` samples per segment. */
export function smooth(points: P[], n = 60): Curve {
  const pts: P[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!, p1 = points[i]!, p2 = points[i + 1]!, p3 = points[Math.min(points.length - 1, i + 2)]!;
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      pts.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  pts.push(points[points.length - 1]!);
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1]! + Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y));
  return { pts, len, total: len[len.length - 1]! };
}

/** Point and tangent angle (radians) at distance s along the curve. */
export function at(c: Curve, s: number): P & { a: number } {
  const d = Math.min(Math.max(s, 0), c.total);
  let lo = 0, hi = c.len.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c.len[m]! <= d) lo = m; else hi = m; }
  const a = c.pts[lo]!, b = c.pts[hi]!, seg = c.len[hi]! - c.len[lo]! || 1, u = (d - c.len[lo]!) / seg;
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, a: Math.atan2(b.y - a.y, b.x - a.x) };
}

/** SVG path of the curve from distance s0 to s1. */
export function pathOf(c: Curve, s0: number, s1: number) {
  if (s1 <= s0) return '';
  const p0 = at(c, s0);
  let d = `M${p0.x.toFixed(1)},${p0.y.toFixed(1)}`;
  for (let i = 0; i < c.pts.length; i++) if (c.len[i]! > s0 && c.len[i]! < s1) d += ` L${c.pts[i]!.x.toFixed(1)},${c.pts[i]!.y.toFixed(1)}`;
  const p1 = at(c, s1);
  return d + ` L${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
}

/**
 * The editorial grid. Every position in a composition comes from here: 12 columns, outer
 * margins, a spacing scale and semantic anchors. No arbitrary coordinates.
 */
export const FRAME = { w: 1920, h: 1080 } as const;

/** Spacing scale: the only distances a composition may use (optical corrections aside). */
export const SPACE = { xs: 8, s: 16, m: 24, l: 32, xl: 48, xxl: 64, x3: 96, x4: 128 } as const;

export const GRID = {
  cols: 12,
  margin: 112, // outer margin, left and right
  gutter: 24,
  top: 96, // vertical safe margins
  bottom: 96,
};

export const SAFE = {
  left: GRID.margin,
  right: FRAME.w - GRID.margin,
  top: GRID.top,
  bottom: FRAME.h - GRID.bottom,
  get width() { return this.right - this.left; },
  get height() { return this.bottom - this.top; },
};

const COL_W = (SAFE.right - SAFE.left - GRID.gutter * (GRID.cols - 1)) / GRID.cols;

/** Left edge of column c (1-based) and the width spanned by n columns. */
export const col = (c: number) => SAFE.left + (c - 1) * (COL_W + GRID.gutter);
export const span = (n: number) => n * COL_W + (n - 1) * GRID.gutter;

/** Horizontal thirds and the optical centre (slightly above the geometric one). */
export const ANCHOR = {
  CENTER_X: FRAME.w / 2,
  CENTER_Y: FRAME.h / 2,
  OPTICAL_Y: FRAME.h / 2 - SPACE.l, // the eye places the centre a little higher
  HERO_LEFT: col(1),
  HERO_CENTER: FRAME.w / 2,
  HERO_RIGHT: col(7),
  GRAPHIC_LEFT: col(1),
  GRAPHIC_RIGHT: col(8),
  TITLE_LEFT: col(1),
  TOP_LABEL: SAFE.top,
  BOTTOM_META: SAFE.bottom,
} as const;

export const COLUMNS = Array.from({ length: GRID.cols }, (_, i) => ({ x: col(i + 1), w: COL_W }));

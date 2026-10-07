import React from 'react';
import { COLUMNS, FRAME, SAFE } from './grid';
import { qa, type Placed } from './layout';

/**
 * Diagnostic overlay: the grid, the safe area, every bounding box (green = fine, red = issue),
 * baselines, and the QA checklist. Rendered on top of a STATIC frame before any animation.
 */
export const QAOverlay: React.FC<{ items: Placed[]; allow?: Array<[string, string]>; title: string }> = ({ items, allow, title }) => {
  const r = qa(items, { allow });
  const bad = new Set(r.issues.flatMap((i) => i.ids));
  const has = (k: string) => r.issues.some((i) => i.kind === k);
  const checks: Array<[string, boolean]> = [
    ['No text clipping', !has('clipped')],
    ['No accidental overlap', !has('overlap')],
    ['Spacing ≥ 16 px', !has('proximity')],
    ['Inside safe margins', !has('unsafe')],
    ['Clear hierarchy (hero dominant)', !has('hierarchy')],
    [`Shared left edges: ${r.sharedEdges}`, r.sharedEdges <= 2],
  ];
  return (
    <svg width={FRAME.w} height={FRAME.h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {COLUMNS.map((c, i) => <rect key={i} x={c.x} y={0} width={c.w} height={FRAME.h} fill="#3fb6ff" opacity={0.06} />)}
      <rect x={SAFE.left} y={SAFE.top} width={SAFE.width} height={SAFE.height} fill="none" stroke="#3fb6ff" strokeDasharray="8 6" opacity={0.7} />
      {items.map((p) => (
        <g key={p.id}>
          <rect x={p.box.x} y={p.box.y} width={p.box.w} height={p.box.h} fill="none" stroke={bad.has(p.id) ? '#ff3b3b' : '#3dff8a'} strokeWidth={2} />
          {p.pen && <line x1={p.box.x - 12} x2={p.box.x + p.box.w + 12} y1={p.pen.baseline} y2={p.pen.baseline} stroke="#ffd23f" strokeWidth={1} opacity={0.8} />}
          <text x={p.box.x} y={p.box.y - 8} fontFamily="monospace" fontSize={16} fill={bad.has(p.id) ? '#ff3b3b' : '#3dff8a'}>{`${p.id} · ${p.role} · w${Math.round(p.weight)}`}</text>
        </g>
      ))}
      <g transform={`translate(${FRAME.w - 470}, ${FRAME.h - 40 - checks.length * 26 - 40})`}>
        <rect x={-16} y={-34} width={460} height={checks.length * 26 + 70} fill="#000" opacity={0.75} />
        <text x={0} y={-8} fontFamily="monospace" fontSize={18} fill="#fff">{`QA · ${title}`}</text>
        {checks.map(([label, ok], k) => <text key={label} x={0} y={22 + k * 26} fontFamily="monospace" fontSize={17} fill={ok ? '#3dff8a' : '#ff3b3b'}>{`${ok ? '✓' : '✗'} ${label}`}</text>)}
        {r.issues.slice(0, 3).map((i, k) => <text key={k} x={0} y={22 + (checks.length + k) * 22 + 6} fontFamily="monospace" fontSize={13} fill="#ff9b9b">{i.detail}</text>)}
      </g>
    </svg>
  );
};

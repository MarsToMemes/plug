import React from 'react';
import { useCurrentFrame } from 'remotion';
import { FRAME, SAFE } from './grid';

/**
 * Composition QA of ANY frame, measured in the browser: every visible text node's real box
 * (after transforms), then overlaps between different texts and texts outside the safe area.
 * The result is logged as one line `QA <frame> <json>` (read by scripts/qa.mjs).
 */
type B = { t: string; x: number; y: number; w: number; h: number; o: number };

function visibleOpacity(el: Element | null): number {
  let o = 1;
  for (let e = el; e && e !== document.body; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
    o *= Number(cs.opacity);
    if (o < 0.05) return 0;
  }
  return o;
}

export const TextQA: React.FC = () => {
  const f = useCurrentFrame();
  const origin = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const o0 = origin.current!.getBoundingClientRect(); // the composition's top-left corner in the page
    const boxes: B[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = (n.textContent ?? '').trim();
      if (!text || text.length < 1) continue;
      const parent = n.parentElement;
      if (!parent || parent.closest('svg[data-qa-ignore]')) continue;
      const o = visibleOpacity(parent);
      if (o < 0.35) continue;
      const r = document.createRange();
      r.selectNodeContents(n);
      const rr = r.getBoundingClientRect();
      // Clip by every ancestor that hides its overflow (odometer digits, masks): what is cut is not seen.
      let L = rr.left, T = rr.top, R = rr.right, Bm = rr.bottom;
      for (let e: Element | null = parent; e && e !== document.body; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden' || cs.overflow === 'clip') {
          const c = e.getBoundingClientRect();
          L = Math.max(L, c.left); T = Math.max(T, c.top); R = Math.min(R, c.right); Bm = Math.min(Bm, c.bottom);
        }
      }
      if (R - L < 3 || Bm - T < 3) continue;
      const rect = { left: L - o0.left, top: T - o0.top, width: R - L, height: Bm - T };
      if (rect.width < 4 || rect.height < 6) continue;
      if (Math.abs(rect.top) > 20000 || Math.abs(rect.left) > 20000) continue; // premounted (hidden) sequences are parked far away
      boxes.push({ t: text.slice(0, 40), x: rect.left, y: rect.top, w: rect.width, h: rect.height, o });
    }
    // Group the letters of one word/line drawn as separate spans: merge boxes on the same row that touch.
    const issues: string[] = [];
    for (const b of boxes) {
      const inside = (Math.min(b.x + b.w, FRAME.w) - Math.max(b.x, 0)) * (Math.min(b.y + b.h, FRAME.h) - Math.max(b.y, 0)) / (b.w * b.h);
      if (inside <= 0) continue; // entirely off frame: not on screen
      if (inside < 0.999) issues.push(`CLIP "${b.t}" ${Math.round(inside * 100)}%`);
      else if (b.h > 24 && (b.x < SAFE.left - 8 || b.x + b.w > SAFE.right + 8 || b.y < SAFE.top - 16 || b.y + b.h > SAFE.bottom + 16)) issues.push(`UNSAFE "${b.t}"`);
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!, b = boxes[j]!;
      if (a.t === b.t) continue; // motion-blur samples of the same text
      const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ix <= 2 || iy <= 2) continue;
      const share = (ix * iy) / Math.min(a.w * a.h, b.w * b.h);
      if (share > 0.12) issues.push(`OVERLAP "${a.t}" × "${b.t}" ${Math.round(share * 100)}%`);
    }
    console.log(`QA ${f} ${JSON.stringify([...new Set(issues)])}`);
  });
  return <div ref={origin} style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }} />;
};

import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import React from 'react';

/**
 * Font Awesome icon as plain SVG (no runtime, no web font): crisp at any size, animatable like
 * any SVG. Icons: Font Awesome Free 7.3.1 — CC BY 4.0 (credit "Font Awesome" in the film's
 * credits); code MIT. Brand icons are trademarks of their owners.
 *
 *   import { faPlane } from '@fortawesome/free-solid-svg-icons';
 *   <Icon icon={faPlane} size={120} color={THEME.ink} />
 */
export const Icon: React.FC<{ icon: IconDefinition; size: number; color?: string; style?: React.CSSProperties; secondaryOpacity?: number }> = ({ icon, size, color = 'currentColor', style, secondaryOpacity = 0.4 }) => {
  const [w, h, , , d] = icon.icon;
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={(size * w) / h} height={size} style={{ display: 'inline-block', overflow: 'visible', ...style }} aria-hidden>
      {paths.map((p, k) => <path key={k} d={p} fill={color} opacity={paths.length > 1 && k === 0 ? secondaryOpacity : 1} />)}
    </svg>
  );
};

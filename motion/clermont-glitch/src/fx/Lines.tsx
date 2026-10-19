import React from 'react';

// Trait technique tracé progressivement (p de 0 à 1), avec flèche en bout éventuelle.
export const Stroke: React.FC<{d: string; len: number; p: number; color: string; arrow?: boolean; id: string}> = ({d, len, p, color, arrow, id}) => (
	<>
		{arrow ? (
			<defs>
				<marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
					<path d="M0 0 L10 5 L0 10 Z" fill={color} />
				</marker>
			</defs>
		) : null}
		{p > 0 ? (
			<path d={d} fill="none" stroke={color} strokeWidth={2} strokeDasharray={len} strokeDashoffset={len * (1 - Math.min(1, p))} markerEnd={arrow && p >= 1 ? `url(#${id})` : undefined} />
		) : null}
	</>
);

export const Cross: React.FC<{x: number; y: number; color: string}> = ({x, y, color}) => (
	<path d={`M${x - 8} ${y - 8} L${x + 8} ${y + 8} M${x + 8} ${y - 8} L${x - 8} ${y + 8}`} stroke={color} strokeWidth={2} />
);

import React from 'react';

// Trame de demi-teintes : points en quinconce dont la densité s'efface selon un dégradé (coins des aplats).
// from/to : direction du dégradé en fractions (0–1) de la boîte, du plus dense au plus clair.
export const HalftoneDefs: React.FC<{id: string; color: string; size?: number; r?: number}> = ({id, color, size = 12, r = 3.6}) => (
	<pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
		<circle cx={size / 2} cy={size / 2} r={r} fill={color} />
	</pattern>
);

export const HalftonePatch: React.FC<{
	id: string;
	color: string;
	x: number;
	y: number;
	w: number;
	h: number;
	from?: [number, number];
	to?: [number, number];
	opacity?: number;
}> = ({id, color, x, y, w, h, from = [1, 1], to = [0.3, 0.3], opacity = 0.9}) => (
	<svg viewBox="0 0 1200 1200" width={1200} height={1200} style={{position: 'absolute', inset: 0, opacity}}>
		<defs>
			<HalftoneDefs id={`${id}-p`} color={color} />
			<linearGradient id={`${id}-g`} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}>
				<stop offset="0" stopColor="#fff" />
				<stop offset="1" stopColor="#000" />
			</linearGradient>
			<mask id={`${id}-m`}>
				<rect x={x} y={y} width={w} height={h} fill={`url(#${id}-g)`} />
			</mask>
		</defs>
		<rect x={x} y={y} width={w} height={h} fill={`url(#${id}-p)`} mask={`url(#${id}-m)`} />
	</svg>
);

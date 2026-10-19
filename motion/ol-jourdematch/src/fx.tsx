import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import emblem from './emblem.json';
import {P} from './theme';

// Fond uni + éclats de lumière diagonaux (triangles translucides) qui dérivent légèrement.
export const Shards: React.FC<{color: string; f: number; light?: number; dark?: number}> = ({color, f, light = 0.16, dark = 0.1}) => {
	const d = Math.sin(f / 30) * 12;
	const tri = (pts: number[][]) => pts.map(([x, y]) => `${x},${y}`).join(' ');
	return (
		<AbsoluteFill style={{background: color, overflow: 'hidden'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.12), transparent 65%)'}} />
			<svg width={1080} height={1920} style={{position: 'absolute', translate: `${d}px ${-d}px`}}>
				<defs>
					<linearGradient id={`sh-${color}`} x1="1" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#fff" stopOpacity={light} />
						<stop offset="1" stopColor="#fff" stopOpacity={0} />
					</linearGradient>
				</defs>
				<polygon points={tri([[1080, 120], [1080, 520], [430, 1180]])} fill={`url(#sh-${color})`} />
				<polygon points={tri([[1080, 760], [1080, 1080], [520, 1600]])} fill={`url(#sh-${color})`} />
				<polygon points={tri([[860, 0], [1080, 0], [300, 880]])} fill={`url(#sh-${color})`} />
				<polygon points={tri([[1080, 1420], [1080, 1920], [700, 1920]])} fill={`url(#sh-${color})`} />
				<polygon points={tri([[0, 1300], [0, 1920], [420, 1920]])} fill="#000" opacity={dark} />
				<polygon points={tri([[0, 0], [380, 0], [0, 640]])} fill="#000" opacity={dark} />
			</svg>
		</AbsoluteFill>
	);
};

// Mot aux lettres instables : avant `settle`, chaque lettre est visible, absente, en contour ou décalée en couleur.
export const Unstable: React.FC<{text: string; f: number; settle: number; seed: string; alt?: string; style?: React.CSSProperties}> = ({
	text,
	f,
	settle,
	seed,
	alt = P.white,
	style,
}) => (
	<span style={{whiteSpace: 'pre', ...style}}>
		{text.split('').map((c, i) => {
			if (f >= settle || c === ' ') return <span key={i}>{c}</span>;
			const r = random(`${seed}-${i}-${f}`);
			if (r < 0.15) return <span key={i} style={{opacity: 0}}>{c}</span>;
			if (r < 0.26) return <span key={i} style={{color: 'transparent', WebkitTextStroke: '2px currentColor'}}>{c}</span>;
			if (r < 0.31) return <span key={i} style={{color: alt}}>{c}</span>;
			return <span key={i}>{c}</span>;
		})}
	</span>
);

// Silhouette de l'emblème (masque PNG recoloré).
export const Silhouette: React.FC<{src: string; w: number; h: number; color: string; style?: React.CSSProperties}> = ({src, w, h, color, style}) => (
	<div
		style={{
			width: w,
			height: h,
			background: color,
			WebkitMaskImage: `url(${src})`,
			WebkitMaskSize: 'contain',
			WebkitMaskRepeat: 'no-repeat',
			WebkitMaskPosition: 'center',
			...style,
		}}
	/>
);

// Contour de l'emblème (un seul tracé), dessiné de 0 à 1, ou rempli.
export const EmblemPath: React.FC<{size: number; draw?: number; fill?: string; stroke?: string; width?: number; style?: React.CSSProperties}> = ({
	size,
	draw = 1,
	fill = 'none',
	stroke = '#fff',
	width = 8,
	style,
}) => (
	<svg width={size} height={(size * emblem.h) / emblem.w} viewBox={`0 0 ${emblem.w} ${emblem.h}`} style={{position: 'absolute', overflow: 'visible', ...style}}>
		<path
			d={emblem.d}
			fill={fill}
			stroke={stroke}
			strokeWidth={width}
			vectorEffect="non-scaling-stroke"
			strokeLinejoin="round"
			pathLength={1}
			strokeDasharray={fill === 'none' ? 1 : undefined}
			strokeDashoffset={fill === 'none' ? 1 - draw : undefined}
		/>
	</svg>
);

// Étoile à 5 branches (polygone).
export const starPoints = (r: number, inner = 0.42) =>
	Array.from({length: 10})
		.map((_, i) => {
			const a = -Math.PI / 2 + (i * Math.PI) / 5;
			const rr = i % 2 ? r * inner : r;
			return `${r + Math.cos(a) * rr},${r + Math.sin(a) * rr}`;
		})
		.join(' ');

export const Stars3: React.FC<{color: string; lit: number; size?: number; style?: React.CSSProperties}> = ({color, lit, size = 16, style}) => (
	<div style={{position: 'absolute', display: 'flex', flexDirection: 'column', gap: 6, ...style}}>
		{[0, 1, 2].map((i) => (
			<svg key={i} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{opacity: lit > i ? 1 : 0.15}}>
				<polygon points={starPoints(size / 2)} fill={color} />
			</svg>
		))}
	</div>
);

import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors} from 'remotion';
import {C, FONT, clamp, fr, out} from './theme';

// Fond sombre du site + lueur turquoise qui respire depuis le bas.
export const Dark: React.FC<{f: number; glow?: number}> = ({f, glow = 1}) => (
	<AbsoluteFill style={{background: C.bg}}>
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse 70% 75% at 50% 112%, rgba(63,216,200,${0.34 * glow}), rgba(63,216,200,0) 70%)`,
				scale: `${1 + Math.sin(f / 22) * 0.04}`,
			}}
		/>
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(0,0,0,0.45))'}} />
	</AbsoluteFill>
);

export const Light: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{background: `linear-gradient(${118 + f * 0.4}deg, #BFF3EC 0%, #F3F8FC 42%, ${C.accent2} 100%)`}} />
);

// Typo cinétique : chaque mot arrive flou et coloré, puis se pose en blanc (ou en encre sur fond clair).
export const Kinetic: React.FC<{
	words: {t: string; at: number}[];
	f: number;
	size: number;
	from?: string;
	to?: string;
	weight?: number;
	style?: React.CSSProperties;
}> = ({words, f, size, from = C.teal, to = C.text, weight = 600, style}) => (
	<div style={{fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.05, whiteSpace: 'nowrap', letterSpacing: '-0.02em', ...style}}>
		{words.map((w, i) => {
			const p = interpolate(f, [w.at, w.at + 6], [0, 1], out);
			return (
				<span
					key={i}
					style={{
						display: 'inline-block',
						marginRight: i < words.length - 1 ? '0.26em' : 0,
						opacity: p,
						color: interpolateColors(f, [w.at + 3, w.at + 15], [from, to]),
						filter: p < 1 ? `blur(${(1 - p) * 16}px)` : undefined,
						translate: `0 ${(1 - p) * 0.18}em`,
					}}
				>
					{w.t}
				</span>
			);
		})}
	</div>
);

// Scène 3D : une « caméra » (perspective) et un monde que l'on déplace et que l'on fait tourner.
export const World: React.FC<{rx?: number; ry?: number; x?: number; y?: number; z?: number; children: React.ReactNode}> = ({
	rx = 0,
	ry = 0,
	x = 0,
	y = 0,
	z = 0,
	children,
}) => (
	<AbsoluteFill style={{perspective: 1700, perspectiveOrigin: '50% 50%'}}>
		<div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`}}>
			{children}
		</div>
	</AbsoluteFill>
);

export const At: React.FC<{x: number; y: number; z?: number; ry?: number; rx?: number; s?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
	x,
	y,
	z = 0,
	ry = 0,
	rx = 0,
	s = 1,
	style,
	children,
}) => (
	<div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s}) translate(-50%,-50%)`, ...style}}>
		{children}
	</div>
);

export const Pill: React.FC<{children: React.ReactNode; light?: boolean; size?: number}> = ({children, light, size = 30}) => (
	<div
		style={{
			fontFamily: FONT,
			fontWeight: 400,
			fontSize: size,
			padding: `${size * 0.42}px ${size * 0.9}px`,
			borderRadius: 999,
			whiteSpace: 'nowrap',
			color: light ? C.ink : C.text,
			border: `1.5px solid ${light ? 'rgba(11,20,32,0.16)' : 'rgba(255,255,255,0.16)'}`,
			background: light ? 'rgba(255,255,255,0.6)' : 'rgba(28,42,62,0.55)',
		}}
	>
		{children}
	</div>
);

export type Player = {tag: string; score: number; name: string; match: string; chance: number};

// Carte joueur, d'après celles de la page d'accueil : sport, Braqueur Score, joueur, match, chance de réussite.
export const PlayerCard: React.FC<{p: Player; k?: number; active?: number; light?: boolean}> = ({p, k = 1, active = 0, light}) => {
	const fg = light ? C.ink : C.text;
	return (
		<div
			style={{
				width: 420,
				height: 540,
				borderRadius: 34,
				padding: 38,
				boxSizing: 'border-box',
				fontFamily: FONT,
				color: fg,
				background: light ? 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(255,255,255,0.6))' : `linear-gradient(160deg, #1C2A3E, ${C.bg2})`,
				border: `1.5px solid ${light ? 'rgba(11,20,32,0.1)' : `rgba(63,216,200,${0.14 + active * 0.5})`}`,
				boxShadow: light ? '0 40px 80px rgba(11,20,32,0.16)' : `0 50px 90px rgba(0,0,0,0.55), 0 0 ${active * 90}px rgba(63,216,200,${active * 0.35})`,
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<div style={{fontSize: 24, fontWeight: 600, letterSpacing: '0.08em', color: light ? '#3C6FA8' : C.amber}}>{p.tag}</div>
			<div style={{fontSize: 22, color: C.muted, marginTop: 36}}>score</div>
			<div style={{fontSize: 136, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums'}}>{fr(p.score * k)}</div>
			<div style={{fontSize: 34, fontWeight: 600, marginTop: 26, lineHeight: 1.1}}>{p.name}</div>
			<div style={{fontSize: 24, color: C.muted, marginTop: 8}}>{p.match}</div>
			<div style={{flex: 1}} />
			<div style={{height: 10, borderRadius: 5, background: light ? 'rgba(11,20,32,0.1)' : 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
				<div style={{width: `${p.chance * k}%`, height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${C.teal}, ${C.green})`}} />
			</div>
			<div style={{fontSize: 24, marginTop: 14}}>
				<span style={{fontWeight: 600, color: light ? '#128A7C' : C.teal}}>{fr(p.chance * k)} %</span> de chance
			</div>
		</div>
	);
};

// Entrée et sortie d'un plan : poussée + flou, façon caméra qui traverse.
export const cut = (f: number, start: number, end: number, n = 7) => {
	const a = interpolate(f, [start, start + n], [1, 0], out);
	const b = interpolate(f, [end - n, end], [0, 1], {...clamp});
	return {scale: 1 + a * 0.14 + b * b * 0.18, blur: a * 18 + b * b * 22, opacity: 1};
};

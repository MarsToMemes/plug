import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {F, P, TEX} from './theme';

// Masque recoloré (lion, silhouette du logo).
export const Mask: React.FC<{src: string; w: number; h: number; color: string; style?: React.CSSProperties}> = ({src, w, h, color, style}) => (
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

// Les trois petits logos dessinés : lion du blason, médaillon « Olympique lyonnais · 1950 », badge « 6★9 » (Rhône).
export const Icons: React.FC<{color: string; size?: number; founded: string; dept: string; style?: React.CSSProperties}> = ({
	color,
	size = 64,
	founded,
	dept,
	style,
}) => {
	const s = size;
	return (
		<div style={{position: 'absolute', display: 'flex', alignItems: 'center', gap: s * 0.75, ...style}}>
			<Mask src={TEX.lion} w={s * 1.05} h={s} color={color} />
			<svg width={s} height={s} viewBox="0 0 64 64">
				<defs>
					<path id="ring" d="M32,32 m-23,0 a23,23 0 1,1 46,0 a23,23 0 1,1 -46,0" />
				</defs>
				<circle cx={32} cy={32} r={30} fill="none" stroke={color} strokeWidth={2.5} />
				<circle cx={32} cy={32} r={17} fill="none" stroke={color} strokeWidth={1.4} />
				<text fill={color} fontFamily={F.wideBold} fontSize={6.2} letterSpacing={0.6}>
					<textPath href="#ring" startOffset="2%">{`OLYMPIQUE LYONNAIS · ${founded} ·`}</textPath>
				</text>
				<text x={32} y={36.5} textAnchor="middle" fill={color} fontFamily={F.wide} fontSize={11}>
					OL
				</text>
			</svg>
			<svg width={s * 1.1} height={s} viewBox="0 0 70 64">
				<path d="M6 16 Q35 2 64 16" fill="none" stroke={color} strokeWidth={4} />
				<path d="M6 48 Q35 62 64 48" fill="none" stroke={color} strokeWidth={4} />
				<path d="M4 20 L4 44 M66 20 L66 44" stroke={color} strokeWidth={3} />
				<text x={35} y={40} textAnchor="middle" fill={color} fontFamily={F.wide} fontSize={19}>
					{dept[0]}
					<tspan fontSize={13} dy={-2}>★</tspan>
					<tspan dy={2}>{dept.slice(1)}</tspan>
				</text>
			</svg>
		</div>
	);
};

// Grain (change à chaque image)
export const Grain: React.FC<{f: number; opacity?: number}> = ({f, opacity = 0.08}) => (
	<AbsoluteFill
		style={{
			backgroundImage: `url(${TEX.grain})`,
			backgroundPosition: `${Math.floor(random(`gx${f}`) * 512)}px ${Math.floor(random(`gy${f}`) * 512)}px`,
			mixBlendMode: 'overlay',
			opacity,
			pointerEvents: 'none',
		}}
	/>
);

// Texte qui se décode : chaque lettre passe par des caractères aléatoires, ordre de résolution mélangé.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/';
export const decode = (text: string, f: number, start: number, dur: number, seed: string) => {
	const n = text.length;
	return text
		.split('')
		.map((c, i) => {
			if (c === ' ') return ' ';
			const order = random(`${seed}o${i}`);
			const t = start + order * dur;
			if (f >= t) return c;
			if (f < start + order * dur * 0.4) return ' ';
			return GLYPHS[Math.floor(random(`${seed}${i}-${f}`) * GLYPHS.length)];
		})
		.join('')
		.slice(0, n);
};

// Transition en blocs : la scène B apparaît par rectangles (et quelques aplats) par-dessus la scène A.
export type Block = {x: number; y: number; w: number; h: number; t: number; flat?: string};
export const makeBlocks = (seed: string, start: number, end: number, n: number, flats: string[]): Block[] =>
	Array.from({length: n}).map((_, i) => {
		const w = 220 + random(`${seed}w${i}`) * 520;
		const h = 180 + random(`${seed}h${i}`) * 520;
		return {
			x: Math.round(random(`${seed}x${i}`) * (1080 - w * 0.5) - w * 0.25),
			y: Math.round(random(`${seed}y${i}`) * (1080 - h * 0.5) - h * 0.25),
			w: Math.round(w),
			h: Math.round(h),
			t: start + Math.floor((i / n) * (end - start)),
			flat: i % 3 === 1 ? flats[i % flats.length] : undefined,
		};
	});

export const Blocks: React.FC<{f: number; a: React.ReactNode; b: React.ReactNode; blocks: Block[]; id: string; extra?: (bl: Block) => React.ReactNode}> = ({
	f,
	a,
	b,
	blocks,
	id,
	extra,
}) => {
	const shown = blocks.filter((bl) => f >= bl.t);
	const toB = shown.filter((bl) => !bl.flat);
	return (
		<AbsoluteFill>
			<AbsoluteFill>{a}</AbsoluteFill>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<clipPath id={id}>
					{toB.map((bl, i) => (
						<rect key={i} x={bl.x} y={bl.y} width={bl.w} height={bl.h} />
					))}
				</clipPath>
			</svg>
			<AbsoluteFill style={{clipPath: `url(#${id})`}}>{b}</AbsoluteFill>
			{shown
				.filter((bl) => bl.flat)
				.map((bl, i) => (
					<div key={i} style={{position: 'absolute', left: bl.x, top: bl.y, width: bl.w, height: bl.h, background: bl.flat, overflow: 'hidden'}}>
						{extra?.(bl)}
					</div>
				))}
		</AbsoluteFill>
	);
};

import React from 'react';
import {AbsoluteFill} from 'remotion';
import cells from '../vitrail-cells.json';
import {C, fontFamily, fontHeavy} from '../theme';

// Planche de matières inspirées de Metz pour le mot club plein cadre (scène 2). Image fixe, pas dans la vidéo.
const TILE_H = 440;
const FONT_SIZE = 235;

const wordTransform = (y: number) => `translate(540 ${y}) skewX(-12) translate(-540 ${-y})`;

const Word: React.FC<{y: number} & React.SVGProps<SVGTextElement>> = ({y, ...rest}) => (
	<text
		x={540}
		y={y}
		textAnchor="middle"
		dominantBaseline="central"
		fontFamily={fontHeavy}
		fontWeight={900}
		fontSize={FONT_SIZE}
		letterSpacing={-2}
		transform={wordTransform(y)}
		{...rest}
	>
		METZ
	</text>
);

const Defs: React.FC = () => (
	<defs>
		{/* Écailles : rangées de cercles qui se chevauchent vers le bas, reflet en haut de chaque écaille */}
		<radialGradient id="scale-fill" cx="0.5" cy="0.15" r="0.9">
			<stop offset="0" stopColor="#c8354b" />
			<stop offset="0.55" stopColor={C.grenatAlt} />
			<stop offset="1" stopColor="#5e0811" />
		</radialGradient>
		<pattern id="scales" width="44" height="22" patternUnits="userSpaceOnUse">
			<rect width="44" height="22" fill="#5e0811" />
			<circle cx="22" cy="0" r="22" fill="url(#scale-fill)" stroke="#4a050c" strokeWidth="2" />
			<circle cx="0" cy="22" r="22" fill="url(#scale-fill)" stroke="#4a050c" strokeWidth="2" />
			<circle cx="44" cy="22" r="22" fill="url(#scale-fill)" stroke="#4a050c" strokeWidth="2" />
		</pattern>
		<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
			<stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
			<stop offset="1" stopColor="#000000" stopOpacity="0.3" />
		</linearGradient>
		{/* Vitrail : lumière qui traverse le verre depuis le haut-gauche */}
		<radialGradient id="glass-light" cx="0.25" cy="0.1" r="0.9">
			<stop offset="0" stopColor="#ffd9a8" stopOpacity="0.55" />
			<stop offset="0.45" stopColor="#ff8a7a" stopOpacity="0.15" />
			<stop offset="1" stopColor="#000000" stopOpacity="0.25" />
		</radialGradient>
		<filter id="glass-glow" x="-10%" y="-20%" width="120%" height="140%">
			<feGaussianBlur in="SourceAlpha" stdDeviation="14" result="b" />
			<feFlood floodColor={C.grenatAlt} floodOpacity="0.55" />
			<feComposite in2="b" operator="in" result="g" />
			<feMerge>
				<feMergeNode in="g" />
				<feMergeNode in="SourceGraphic" />
			</feMerge>
		</filter>
		{/* Pierre de Jaumont : calcaire poreux (grain + petits pores sombres), teinté grenat */}
		<filter id="stone" x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={4} seed={21} result="big" />
			<feColorMatrix in="big" type="saturate" values="0" result="bigg" />
			<feComposite in="bigg" in2="SourceAlpha" operator="in" result="bm" />
			<feBlend in="bm" in2="SourceGraphic" mode="soft-light" result="s1" />
			<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={2} seed={3} result="pores" />
			<feColorMatrix in="pores" type="luminanceToAlpha" result="pl" />
			<feComponentTransfer in="pl" result="pm">
				<feFuncA type="linear" slope="7" intercept="-3.9" />
			</feComponentTransfer>
			<feFlood floodColor="#3a0309" floodOpacity="0.7" />
			<feComposite in2="pm" operator="in" result="pc" />
			<feComposite in="pc" in2="SourceAlpha" operator="in" result="pcm" />
			<feMerge>
				<feMergeNode in="s1" />
				<feMergeNode in="pcm" />
			</feMerge>
		</filter>
	</defs>
);

const Vitrail: React.FC<{y: number; id: string}> = ({y, id}) => (
	<g filter="url(#glass-glow)">
		<clipPath id={id}>
			<Word y={y} />
		</clipPath>
		<g clipPath={`url(#${id})`}>
			{/* boîte de 1000 × 300 posée sur le mot */}
			<g transform={`translate(40 ${y - 150})`}>
				{(cells as {d: string; fill: string}[]).map((c, i) => (
					<path key={i} d={c.d} fill={c.fill} stroke="#1a0306" strokeWidth={5} strokeLinejoin="round" />
				))}
				<rect width={1000} height={300} fill="url(#glass-light)" style={{mixBlendMode: 'screen'}} />
			</g>
		</g>
		{/* plomb du contour des lettres */}
		<Word y={y} fill="none" stroke="#1a0306" strokeWidth={6} />
	</g>
);

const VARIANTS: {label: string; render: (y: number) => React.ReactNode}[] = [
	{label: '0 · APLAT (VERSION SANS MATIÈRE)', render: (y) => <Word y={y} fill={C.grenatAlt} />},
	{
		label: '1 · ÉCAILLES DU GRAOULLY',
		render: (y) => (
			<g>
				<Word y={y} fill="url(#scales)" />
				<Word y={y} fill="url(#shade)" />
			</g>
		),
	},
	{label: '2 · VITRAIL DE LA CATHÉDRALE', render: (y) => <Vitrail y={y} id="vitrail-clip" />},
	{label: '3 · PIERRE DE JAUMONT, TEINTÉE GRENAT', render: (y) => <Word y={y} fill={C.grenatAlt} filter="url(#stone)" />},
];

export const TypoMaterials: React.FC = () => (
	<AbsoluteFill style={{background: C.black}}>
		<svg viewBox={`0 0 1080 ${TILE_H * VARIANTS.length}`} width={1080} height={TILE_H * VARIANTS.length}>
			<Defs />
			{VARIANTS.map((v, i) => {
				const top = i * TILE_H;
				return (
					<g key={v.label}>
						<rect x={0} y={top} width={1080} height={TILE_H} fill="#120206" />
						<rect x={0} y={top} width={1080} height={TILE_H} fill={C.grenatDeep} opacity={0.45} />
						<line x1={0} x2={1080} y1={top} y2={top} stroke={C.black} strokeWidth={6} />
						<text x={36} y={top + 44} fontFamily={fontFamily} fontSize={20} fill={C.ivory} letterSpacing={2}>
							{v.label}
						</text>
						{v.render(top + TILE_H / 2 + 18)}
					</g>
				);
			})}
		</svg>
	</AbsoluteFill>
);

import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import cells from '../vitrail-cells.json';
import {C, fontFamily, fontHeavy} from '../theme';

// Planche « METZ en grenat taillé » : texture calculée par tools/gemme.py découpée dans le mot.
const TILE_H = 440;
const FS = 235;
const tf = (y: number) => `translate(540 ${y}) skewX(-12) translate(-540 ${-y})`;

const Word: React.FC<{y: number} & React.SVGProps<SVGTextElement>> = ({y, ...rest}) => (
	<text x={540} y={y} textAnchor="middle" dominantBaseline="central" fontFamily={fontHeavy} fontWeight={900} fontSize={FS} letterSpacing={-2} transform={tf(y)} {...rest}>
		METZ
	</text>
);

const Gem: React.FC<{y: number; id: string; leads?: boolean; tex?: string}> = ({y, id, leads, tex = 'matieres/grenat-gemme.png'}) => (
	<g>
		<defs>
			<clipPath id={`${id}-clip`}>
				<Word y={y} />
			</clipPath>
			{/* liseré de lumière sur le bord des lettres (Fresnel), plus fort en haut à gauche */}
			<linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0.4" y2="1">
				<stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
				<stop offset="0.45" stopColor="#ff9aa6" stopOpacity="0.35" />
				<stop offset="1" stopColor="#ff9aa6" stopOpacity="0.05" />
			</linearGradient>
			{/* ombre interne en bas des lettres : épaisseur de la pierre */}
			<filter id={`${id}-inner`} x="-5%" y="-10%" width="110%" height="120%">
				<feOffset in="SourceAlpha" dx="-3" dy="-7" result="o" />
				<feGaussianBlur in="o" stdDeviation="6" result="ob" />
				<feComposite in="SourceAlpha" in2="ob" operator="out" result="edge" />
				<feFlood floodColor="#1a0005" floodOpacity="0.85" />
				<feComposite in2="edge" operator="in" />
			</filter>
			{/* lumière rouge projetée autour de la pierre */}
			<filter id={`${id}-glow`} x="-10%" y="-30%" width="120%" height="160%">
				<feGaussianBlur in="SourceAlpha" stdDeviation="22" result="b" />
				<feFlood floodColor="#c01530" floodOpacity="0.55" />
				<feComposite in2="b" operator="in" />
			</filter>
		</defs>
		<Word y={y} fill="#000" filter={`url(#${id}-glow)`} />
		<g clipPath={`url(#${id}-clip)`}>
			<image href={staticFile(tex)} x={10} y={y - 200} width={1060} height={326} preserveAspectRatio="xMidYMid slice" />
			{leads ? (
				<g transform={`translate(40 ${y - 150})`}>
					{(cells as {d: string}[]).map((c, i) => (
						<path key={i} d={c.d} fill="none" stroke="#120104" strokeWidth={3.5} strokeLinejoin="round" />
					))}
				</g>
			) : null}
			<Word y={y} fill="#000" filter={`url(#${id}-inner)`} />
			<Word y={y} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={5} />
		</g>
		<Word y={y} fill="none" stroke="#2a0008" strokeWidth={1.5} />
	</g>
);

const VARIANTS: {label: string; render: (y: number) => React.ReactNode}[] = [
	{label: 'A · GRENAT TAILLÉ', render: (y) => <Gem y={y} id="gem-a" />},
	{label: 'B · GRENAT TAILLÉ, GRANDES FACETTES', render: (y) => <Gem y={y} id="gem-b" tex="matieres/grenat-gemme-large.png" />},
	{label: 'C · GRENAT TAILLÉ + PLOMBS DE VITRAIL', render: (y) => <Gem y={y} id="gem-c" leads />},
	{label: '0 · APLAT (RÉFÉRENCE)', render: (y) => <Word y={y} fill={C.grenatAlt} />},
];

export const GemPreview: React.FC = () => (
	<AbsoluteFill style={{background: C.black}}>
		<svg viewBox={`0 0 1080 ${TILE_H * VARIANTS.length}`} width={1080} height={TILE_H * VARIANTS.length}>
			{VARIANTS.map((v, i) => {
				const top = i * TILE_H;
				return (
					<g key={v.label}>
						<rect x={0} y={top} width={1080} height={TILE_H} fill="#0d0204" />
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

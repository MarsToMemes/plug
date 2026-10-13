import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, fontFamily, fontHeavy} from '../theme';

// Planche de propositions de matières pour le mot club plein cadre (scène 2). Image fixe, pas dans la vidéo.
const TILE_H = 420;

const Defs: React.FC = () => (
	<defs>
		<linearGradient id="m-grenat" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stopColor="#b5263a" />
			<stop offset="0.55" stopColor={C.grenatAlt} />
			<stop offset="1" stopColor={C.grenat} />
		</linearGradient>
		{/* satin : grenat vif plus clair en haut, plus profond en bas */}
		<linearGradient id="m-satin" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stopColor="#c02a40" />
			<stop offset="0.5" stopColor={C.grenatAlt} />
			<stop offset="1" stopColor="#6e0a14" />
		</linearGradient>
		{/* grain fin : variations de luminosité serrées, sans trous */}
		<filter id="m-grain" x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={2} seed={5} result="n" />
			<feColorMatrix in="n" type="saturate" values="0" result="g" />
			<feComposite in="g" in2="SourceAlpha" operator="in" result="gm" />
			<feBlend in="gm" in2="SourceGraphic" mode="soft-light" result="b1" />
			<feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={11} result="c" />
			<feColorMatrix in="c" type="saturate" values="0" result="cg" />
			<feComponentTransfer in="cg" result="cs">
				<feFuncR type="linear" slope="0.5" intercept="0.25" />
				<feFuncG type="linear" slope="0.5" intercept="0.25" />
				<feFuncB type="linear" slope="0.5" intercept="0.25" />
			</feComponentTransfer>
			<feComposite in="cs" in2="SourceAlpha" operator="in" result="cm" />
			<feBlend in="cm" in2="b1" mode="soft-light" />
		</filter>
		{/* biseau : lumière rasante venant du haut-gauche, appliquée sur le relief de l'alpha */}
		<filter id="m-bevel" x="-5%" y="-10%" width="110%" height="120%">
			<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b" />
			<feSpecularLighting in="b" surfaceScale="4" specularConstant="0.9" specularExponent="22" lightingColor="#ffffff" result="s">
				<feDistantLight azimuth="235" elevation="38" />
			</feSpecularLighting>
			<feComposite in="s" in2="SourceAlpha" operator="in" result="si" />
			<feComposite in="SourceGraphic" in2="si" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0" />
		</filter>
		{/* encre usée : bruit seuillé qui ronge le remplissage */}
		<filter id="m-worn" x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={4} result="fine" />
			<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={3} seed={9} result="coarse" />
			<feComposite in="fine" in2="coarse" operator="arithmetic" k1="0" k2="0.6" k3="0.7" k4="0" result="n" />
			<feColorMatrix in="n" type="luminanceToAlpha" result="l" />
			<feComponentTransfer in="l" result="mask">
				<feFuncA type="linear" slope="-9" intercept="5.2" />
			</feComponentTransfer>
			<feComposite in="SourceGraphic" in2="mask" operator="in" result="ink" />
			<feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={1} seed={2} result="g" />
			<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 -0.05" result="grain" />
			<feComposite in="grain" in2="ink" operator="in" result="gi" />
			<feMerge>
				<feMergeNode in="ink" />
				<feMergeNode in="gi" />
			</feMerge>
		</filter>
		{/* métal brossé anodisé : stries horizontales fondues dans le grenat, puis biseau */}
		<filter id="m-brushed" x="-5%" y="-10%" width="110%" height="120%">
			<feTurbulence type="fractalNoise" baseFrequency="0.003 0.85" numOctaves={3} seed={7} result="t" />
			<feColorMatrix in="t" type="saturate" values="0" result="tg" />
			<feComposite in="tg" in2="SourceAlpha" operator="in" result="tm" />
			<feBlend in="tm" in2="SourceGraphic" mode="soft-light" result="br" />
			<feComposite in="br" in2="SourceAlpha" operator="in" />
		</filter>
		{/* maille du maillot : petits trous ronds en quinconce */}
		<pattern id="m-mesh" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
			<rect width="9" height="9" fill={C.grenatAlt} />
			<circle cx="4.5" cy="4.5" r="1.7" fill="#7f0f19" />
		</pattern>
		<linearGradient id="m-shade" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
			<stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
			<stop offset="1" stopColor="#000000" stopOpacity="0.35" />
		</linearGradient>
		{/* laque : bande de reflet nette dans le haut des lettres */}
		<linearGradient id="m-gloss" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
			<stop offset="0.36" stopColor="#ffffff" stopOpacity="0.08" />
			<stop offset="0.37" stopColor="#ffffff" stopOpacity="0" />
			<stop offset="1" stopColor="#ffffff" stopOpacity="0" />
		</linearGradient>
	</defs>
);

const Word: React.FC<{y: number; children?: never} & React.SVGProps<SVGTextElement>> = ({y, ...rest}) => (
	<text
		x={540}
		y={y}
		textAnchor="middle"
		dominantBaseline="central"
		fontFamily={fontHeavy}
		fontWeight={900}
		fontSize={235}
		letterSpacing={-2}
		transform={`translate(540 ${y}) skewX(-12) translate(-540 ${-y})`}
		{...rest}
	>
		METZ
	</text>
);

const VARIANTS: {label: string; render: (y: number) => React.ReactNode}[] = [
	{label: '0 · APLAT ACTUEL', render: (y) => <Word y={y} fill={C.grenatAlt} />},
	{label: '1 · GRAIN IMPRIMÉ FIN', render: (y) => <Word y={y} fill={C.grenatAlt} filter="url(#m-grain)" />},
	{
		label: '2 · SATIN (DÉGRADÉ + REFLET)',
		render: (y) => (
			<g>
				<Word y={y} fill="url(#m-satin)" />
				<Word y={y} fill="url(#m-gloss)" />
			</g>
		),
	},
	{label: '3 · MÉTAL BROSSÉ', render: (y) => <Word y={y} fill="url(#m-satin)" filter="url(#m-brushed)" />},
	{
		label: '4 · MAILLE DU MAILLOT',
		render: (y) => (
			<g>
				<Word y={y} fill="url(#m-mesh)" />
				<Word y={y} fill="url(#m-shade)" />
			</g>
		),
	},
	{
		label: '5 · SATIN + GRAIN + FILET OR',
		render: (y) => (
			<g filter="url(#m-grain)">
				<Word y={y} fill="url(#m-satin)" stroke={C.gold} strokeWidth={5} paintOrder="stroke" strokeLinejoin="round" />
				<Word y={y} fill="url(#m-gloss)" />
			</g>
		),
	},
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

import React from 'react';
import {AbsoluteFill, Img, random, useCurrentFrame} from 'remotion';
import {FONT, P, TEX} from './theme';

// Lignes topographiques (fond anthracite ou bleu), légèrement translatées dans le temps.
export const Topo: React.FC<{opacity?: number; drift?: number; blend?: React.CSSProperties['mixBlendMode']}> = ({
	opacity = 0.09,
	drift = 0,
	blend = 'screen',
}) => (
	<AbsoluteFill style={{opacity, mixBlendMode: blend}}>
		<Img src={TEX.topo} style={{width: '100%', height: '100%', translate: `${drift}px ${drift * 0.4}px`, scale: '1.04'}} />
	</AbsoluteFill>
);

// Grain de film qui change à chaque image.
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.1}) => {
	const f = useCurrentFrame();
	const x = Math.floor(random(`gx${f}`) * 512);
	const y = Math.floor(random(`gy${f}`) * 512);
	return (
		<AbsoluteFill
			style={{
				backgroundImage: `url(${TEX.grain})`,
				backgroundPosition: `${x}px ${y}px`,
				mixBlendMode: 'overlay',
				opacity,
				pointerEvents: 'none',
			}}
		/>
	);
};

// Bande de pinceau à bord sec : un conteneur masqué par un coup de pinceau. `reveal` (0–1) la peint de gauche à droite.
export const Brush: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	color?: string;
	variant?: number;
	reveal?: number;
	rotate?: number;
	flip?: boolean;
	style?: React.CSSProperties;
	children?: React.ReactNode;
}> = ({x, y, w, h, color = P.club, variant = 0, reveal = 1, rotate = 0, flip = false, style, children}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: w,
			height: h,
			rotate: `${rotate}deg`,
			clipPath: `inset(-20% ${(1 - reveal) * 100}% -20% 0)`,
			...style,
		}}
	>
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background: color,
				WebkitMaskImage: `url(${TEX.brush[variant % 3]})`,
				WebkitMaskSize: '100% 100%',
				maskImage: `url(${TEX.brush[variant % 3]})`,
				maskSize: '100% 100%',
				scale: flip ? '-1 1' : undefined,
				overflow: 'hidden',
			}}
		>
			<div style={{position: 'absolute', inset: 0, scale: flip ? '-1 1' : undefined}}>{children}</div>
		</div>
	</div>
);

// Logo du club recoloré (masque) : plein ou contour.
export const Logo: React.FC<{size: number; color?: string; kind?: 'plein' | 'contour'; style?: React.CSSProperties}> = ({
	size,
	color = P.white,
	kind = 'contour',
	style,
}) => {
	const src = kind === 'plein' ? TEX.logoPlein : TEX.logoContour;
	return (
		<div
			style={{
				width: size,
				height: size,
				background: color,
				WebkitMaskImage: `url(${src})`,
				WebkitMaskSize: '100% 100%',
				maskImage: `url(${src})`,
				maskSize: '100% 100%',
				...style,
			}}
		/>
	);
};

// Flou de mouvement horizontal (SVG feGaussianBlur anisotrope).
export const HBlur: React.FC<{id: string; amount: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
	id,
	amount,
	children,
	style,
}) => (
	<div style={{position: 'absolute', inset: 0, filter: amount > 0.3 ? `url(#${id})` : undefined, ...style}}>
		<svg width={0} height={0} style={{position: 'absolute'}}>
			<filter id={id} x="-50%" y="-10%" width="200%" height="120%">
				<feGaussianBlur stdDeviation={`${amount} 0`} />
			</filter>
		</svg>
		{children}
	</div>
);

// Petits points (or Marseille) en haut à droite, comme les points orange de la référence.
export const Dots: React.FC<{n?: number; x?: number; y?: number; color?: string}> = ({n = 2, x = 1760, y = 70, color = P.gold}) => (
	<div style={{position: 'absolute', left: x, top: y, display: 'flex', gap: 14}}>
		{Array.from({length: n}).map((_, i) => (
			<div key={i} style={{width: 14, height: 14, borderRadius: 7, background: color}} />
		))}
	</div>
);

// Texte qui défile (chaîne répétée), petites capitales très espacées.
export const Ticker: React.FC<{text: string; y: number; speed?: number; size?: number; color?: string; vertical?: boolean; x?: number}> = ({
	text,
	y,
	speed = 3,
	size = 15,
	color = P.white,
	vertical = false,
	x = 0,
}) => {
	const f = useCurrentFrame();
	const off = (((f * speed) % 2000) + 2000) % 2000;
	const unit = `${text}   •   `;
	const s = Array.from({length: 14}).map(() => unit).join('');
	const base: React.CSSProperties = {
		position: 'absolute',
		whiteSpace: 'nowrap',
		fontFamily: FONT.small,
		fontWeight: 600,
		fontSize: size,
		letterSpacing: size * 0.45,
		color,
	};
	if (vertical) {
		return (
			<div style={{...base, left: x, top: 0, height: 1080, overflow: 'hidden', writingMode: 'vertical-rl', rotate: '180deg'}}>
				<div style={{translate: `0 ${-off}px`}}>{s}</div>
			</div>
		);
	}
	return <div style={{...base, top: y, left: 0, translate: `${-off}px 0`}}>{s}</div>;
};

// Silhouette de Marseille dessinée (pas de photo de la ville fournie) : Fort Saint-Jean, Mucem, la Major, mâts du
// Vieux-Port, colline et basilique Notre-Dame-de-la-Garde (clocher + statue), tour CMA CGM.
export const Skyline: React.FC<{color: string; style?: React.CSSProperties; seed?: string}> = ({color, style, seed = 'm'}) => {
	const roofs: React.ReactNode[] = [];
	let x = 0;
	let i = 0;
	while (x < 1920) {
		const w = 30 + random(`${seed}w${i}`) * 70;
		const h = 40 + random(`${seed}h${i}`) * 70;
		roofs.push(<rect key={`r${i}`} x={x} y={600 - h} width={w + 1} height={h} />);
		x += w;
		i++;
	}
	const masts = [455, 490, 520, 548, 590, 622, 655, 1010, 1040];
	return (
		<svg viewBox="0 0 1920 600" preserveAspectRatio="xMidYMax slice" style={{position: 'absolute', ...style}}>
			<g fill={color}>
				{roofs}
				{/* Fort Saint-Jean : murs, tour du Roi René crénelée, tour du Fanal */}
				<rect x={40} y={460} width={360} height={140} />
				<rect x={90} y={330} width={95} height={140} />
				{[0, 1, 2, 3, 4].map((k) => (
					<rect key={k} x={90 + k * 21} y={318} width={12} height={14} />
				))}
				<rect x={262} y={300} width={26} height={170} />
				<path d="M256 300 L275 268 L294 300 Z" />
				{/* Mucem */}
				<rect x={420} y={478} width={190} height={122} />
				{/* mâts du Vieux-Port */}
				{masts.map((m, k) => (
					<rect key={`m${k}`} x={m} y={390 + (k % 3) * 25} width={3} height={210} />
				))}
				{/* Cathédrale de la Major : nef, deux tours à dôme, grand dôme */}
				<rect x={700} y={440} width={300} height={160} />
				<rect x={712} y={350} width={58} height={100} />
				<ellipse cx={741} cy={350} rx={29} ry={30} />
				<rect x={738} y={305} width={6} height={20} />
				<rect x={930} y={350} width={58} height={100} />
				<ellipse cx={959} cy={350} rx={29} ry={30} />
				<rect x={956} y={305} width={6} height={20} />
				<rect x={800} y={380} width={100} height={70} />
				<ellipse cx={850} cy={382} rx={64} ry={66} />
				<rect x={842} y={300} width={16} height={24} />
				{/* Colline de la Garde et basilique */}
				<path d="M1040 600 C1150 520 1210 380 1290 340 L1460 335 C1540 380 1620 500 1720 600 Z" />
				<rect x={1290} y={262} width={170} height={80} />
				<ellipse cx={1320} cy={262} rx={28} ry={26} />
				<rect x={1352} y={140} width={46} height={130} />
				<rect x={1346} y={128} width={58} height={16} />
				<rect x={1364} y={100} width={22} height={30} />
				{/* statue de la Bonne Mère : silhouette stylisée */}
				<path d="M1366 100 L1384 100 L1381 70 L1386 64 L1380 58 L1375 46 L1370 58 L1364 64 L1369 70 Z" />
				<circle cx={1375} cy={44} r={6} />
				{/* Tour CMA CGM : fût effilé et courbé */}
				<path d="M1752 600 L1758 210 C1762 140 1790 80 1820 60 L1832 60 L1836 600 Z" />
			</g>
		</svg>
	);
};

// Fond anthracite texturé
export const DarkBg: React.FC<{color?: string; drift?: number; topo?: number}> = ({color = P.ink, drift = 0, topo = 0.08}) => (
	<AbsoluteFill style={{background: color}}>
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.05), rgba(0,0,0,0.35) 80%)'}} />
		<Topo opacity={topo} drift={drift} />
	</AbsoluteFill>
);

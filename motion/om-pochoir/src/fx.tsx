import React from 'react';
import {AbsoluteFill, Img, random} from 'remotion';
import {F, TEX} from './theme';

// Impression au pochoir : bords rugueux (turbulence + déplacement), grain de bombe (masque à trous qui change toutes
// les 4 images) et surpulvérisation (copie floue masquée par des points épars).
export const Pochoir: React.FC<{
	id: string;
	f: number;
	rough?: number;
	grainScale?: number;
	overspray?: number;
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({id, f, rough = 4, grainScale = 512, overspray = 0.75, style, children}) => {
	const step = Math.floor(f / 4);
	const ox = Math.floor(random(`${id}x${step}`) * 512);
	const oy = Math.floor(random(`${id}y${step}`) * 512);
	const mask = (src: string, size: number): React.CSSProperties => ({
		WebkitMaskImage: `url(${src})`,
		WebkitMaskSize: `${size}px ${size}px`,
		WebkitMaskPosition: `${ox}px ${oy}px`,
		WebkitMaskRepeat: 'repeat',
	});
	return (
		<div style={{position: 'relative', ...style}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id={`rough-${id}`} x="-5%" y="-5%" width="110%" height="110%">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={step % 7} />
					<feDisplacementMap in="SourceGraphic" scale={rough} xChannelSelector="R" yChannelSelector="G" />
				</filter>
			</svg>
			{overspray > 0 && (
				<div style={{position: 'absolute', inset: 0, filter: 'blur(5px)', opacity: overspray, ...mask(TEX.surpulv, 256)}}>{children}</div>
			)}
			<div style={{position: 'relative', filter: rough > 0 ? `url(#rough-${id})` : undefined, ...mask(TEX.grainBombe, grainScale)}}>{children}</div>
		</div>
	);
};

// Fond texturé plein cadre (béton, toile, ciel) avec dérive lente.
export const Backdrop: React.FC<{src: string; dx?: number; dy?: number; scale?: number; filter?: string}> = ({
	src,
	dx = 0,
	dy = 0,
	scale = 1,
	filter,
}) => (
	<AbsoluteFill style={{overflow: 'hidden', background: '#333'}}>
		<Img
			src={src}
			style={{
				position: 'absolute',
				left: -180 + dx,
				top: -225 + dy,
				width: 1440,
				height: 1800,
				objectFit: 'cover',
				scale: `${scale}`,
				filter,
			}}
		/>
	</AbsoluteFill>
);

export const Grain: React.FC<{f: number; opacity?: number}> = ({f, opacity = 0.12}) => (
	<AbsoluteFill
		style={{
			backgroundImage: `url(${TEX.grain})`,
			backgroundPosition: `${Math.floor(random(`g${f}`) * 512)}px ${Math.floor(random(`h${f}`) * 512)}px`,
			mixBlendMode: 'overlay',
			opacity,
			pointerEvents: 'none',
		}}
	/>
);

// Texte géant ton sur ton en diagonale (fond des temps 2–4).
export const DiagonalText: React.FC<{text: string; shift: number}> = ({text, shift}) => (
	<AbsoluteFill style={{overflow: 'hidden'}}>
		<div style={{position: 'absolute', left: -700, top: -600, width: 2600, rotate: '-25deg', translate: `${shift}px 0`}}>
			{Array.from({length: 9}).map((_, i) => (
				<div
					key={i}
					style={{
						fontFamily: F.cond,
						fontSize: 190,
						lineHeight: 1.08,
						whiteSpace: 'nowrap',
						color: 'rgba(0,0,0,0.3)',
						mixBlendMode: 'multiply',
						marginLeft: i % 2 ? -260 : 0,
					}}
				>
					{Array.from({length: 4})
						.map(() => text)
						.join('  ')}
				</div>
			))}
		</div>
	</AbsoluteFill>
);

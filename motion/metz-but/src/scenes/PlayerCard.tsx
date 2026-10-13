import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ZoomEcho} from '../fx/ZoomEcho';
import {C, clamp, fontFamily} from '../theme';
import {PlayerDecor} from './PlayerDecor';
import {PlayerPlaceholder} from './PlayerPlaceholder';

// Prénom + nom en chrome ivoire, reflet doré, tracking qui se resserre (f108–130).
const ChromeName: React.FC<{firstName: string; lastName: string; t: number}> = ({firstName, lastName, t}) => {
	const p = interpolate(t, [0, 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const fill = interpolate(t, [6, 20], [0, 1], clamp);
	const flicker = t < 0 ? 0 : t === 1 ? 0.4 : 1;
	const nameSize = Math.min(118, 1000 / (lastName.length * 1.3)); // Michroma : ~1,2 em par capitale
	return (
		<svg viewBox="0 0 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0, opacity: flicker}}>
			<defs>
				<linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#ffffff" />
					<stop offset="0.42" stopColor={C.ivory} />
					<stop offset="0.5" stopColor={C.gold} />
					<stop offset="0.56" stopColor={C.grey} />
					<stop offset="1" stopColor={C.ivory} />
				</linearGradient>
				<filter id="name-glow" x="-20%" y="-50%" width="140%" height="200%">
					<feGaussianBlur in="SourceAlpha" stdDeviation="10" result="b" />
					<feFlood floodColor={C.black} floodOpacity="0.75" />
					<feComposite in2="b" operator="in" result="shadow" />
					<feMerge>
						<feMergeNode in="shadow" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			<g filter="url(#name-glow)">
				<text
					transform="translate(540 850) skewX(-12) translate(-540 -850)"
					x={540}
					y={850}
					textAnchor="middle"
					dominantBaseline="central"
					fontFamily={fontFamily}
					fontSize={44}
					letterSpacing={interpolate(p, [0, 1], [1.2, 0.15]) * 44}
					fill="url(#chrome)"
					fillOpacity={fill}
					stroke={C.ivory}
					strokeOpacity={0.5 + fill * 0.5}
					strokeWidth={1.5}
				>
					{firstName}
				</text>
				<text
					transform="translate(540 935) skewX(-12) translate(-540 -935)"
					x={540}
					y={935}
					textAnchor="middle"
					dominantBaseline="central"
					fontFamily={fontFamily}
					fontSize={nameSize}
					letterSpacing={interpolate(p, [0, 1], [0.6, 0.04]) * nameSize}
					fill="url(#chrome)"
					fillOpacity={fill}
					stroke={C.ivory}
					strokeOpacity={0.5 + fill * 0.5}
					strokeWidth={2}
				>
					{lastName}
				</text>
			</g>
		</svg>
	);
};

// Scène 8 avec l'arrivée (fin de la scène 7) et la plongée de sortie (début de la scène 9) : f88–259.
export const PlayerCard: React.FC<{
	playerPhoto: string | null;
	crestPoint: {x: number; y: number};
	firstName: string;
	lastName: string;
}> = ({playerPhoto, crestPoint, firstName, lastName}) => {
	const frame = useCurrentFrame(); // 0 = f88
	const origin = `${crestPoint.x * 100}% ${crestPoint.y * 100}%`;

	const scale =
		frame < 9
			? interpolate(frame, [0, 5, 8], [4, 4, 1.02], {...clamp, easing: Easing.out(Easing.exp)})
			: frame < 167
				? interpolate(frame, [9, 166], [1.02, 1.05], clamp)
				: interpolate(frame, [167, 171], [1.05, 5], {...clamp, easing: Easing.in(Easing.cubic)});
	const blur = interpolate(frame, [0, 4, 8, 9], [60, 40, 6, 0], clamp);
	const zoomBlur = interpolate(frame, [4, 6, 9, 167, 170, 171], [0.04, 0.03, 0, 0, 0.05, 0.06], clamp);

	return (
		<AbsoluteFill
			style={{
				background: C.black,
				opacity: interpolate(frame, [0, 4], [0, 1], clamp),
				filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
			}}
		>
			<AbsoluteFill style={{transformOrigin: origin, scale: String(scale)}}>
				<ZoomEcho strength={zoomBlur} origin={origin}>
					{playerPhoto ? (
						<AbsoluteFill>
							<PlayerDecor />
							{/* joueur détouré (PNG transparent, carré) */}
							<Img src={staticFile(playerPhoto)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
						</AbsoluteFill>
					) : (
						<PlayerPlaceholder crest={crestPoint} />
					)}
					{/* assombrit le bas pour la lisibilité du nom */}
					<AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 52%, rgba(16,16,16,0.55) 72%, rgba(16,16,16,0.92) 100%)'}} />
					<ChromeName firstName={firstName} lastName={lastName} t={frame - 20} />
				</ZoomEcho>
			</AbsoluteFill>
			{/* fontFamily référencée ici pour que la police soit chargée avant le premier rendu du nom */}
			<span style={{fontFamily, position: 'absolute', opacity: 0}}>.</span>
		</AbsoluteFill>
	);
};

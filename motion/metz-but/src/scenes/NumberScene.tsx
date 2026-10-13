import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {BrushBg} from '../fx/BrushBg';
import {Echoes} from '../fx/Echoes';
import {Grain} from '../fx/Grain';
import {ZoomEcho} from '../fx/ZoomEcho';
import {C, clamp, fontHeavy} from '../theme';
import {GoalRows} from './GoalWord';

const ZOOM_ORIGIN = '60% 45%';

// Numéro en néon : contour or → ivoire, intérieur grenat profond texturé, double halo.
const NeonNumber: React.FC<{value: string}> = ({value}) => (
	<svg viewBox="0 0 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0}}>
		<defs>
			<linearGradient id="num-stroke" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stopColor={C.gold} />
				<stop offset="0.55" stopColor={C.ivory} />
				<stop offset="1" stopColor={C.ivory} />
			</linearGradient>
			<filter id="num-glow" x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur in="SourceAlpha" stdDeviation="5" result="a" />
				<feFlood floodColor={C.ivory} floodOpacity="0.8" />
				<feComposite in2="a" operator="in" result="g1" />
				<feGaussianBlur in="SourceAlpha" stdDeviation="20" result="b" />
				<feFlood floodColor={C.gold} floodOpacity="0.45" />
				<feComposite in2="b" operator="in" result="g2" />
				<feMerge>
					<feMergeNode in="g2" />
					<feMergeNode in="g1" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
			<filter id="num-texture">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} result="n" />
				<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.03  0 0 0 0 0.06  0 0 0 0.35 0" result="t" />
				<feComposite in="t" in2="SourceGraphic" operator="in" result="tt" />
				<feMerge>
					<feMergeNode in="SourceGraphic" />
					<feMergeNode in="tt" />
				</feMerge>
			</filter>
		</defs>
		<g transform="translate(540 540) skewX(-12) translate(-540 -540)">
			<text
				x={540}
				y={540}
				textAnchor="middle"
				dominantBaseline="central"
				fontFamily={fontHeavy}
				fontWeight={900}
				fontSize={420}
				fill={C.grenatDeep}
				fillOpacity={0.85}
				filter="url(#num-texture)"
			>
				{value}
			</text>
			<text
				x={540}
				y={540}
				textAnchor="middle"
				dominantBaseline="central"
				fontFamily={fontHeavy}
				fontWeight={900}
				fontSize={420}
				fill="none"
				stroke="url(#num-stroke)"
				strokeWidth={6}
				filter="url(#num-glow)"
			>
				{value}
			</text>
		</g>
	</svg>
);

// Scène 6 et plongée de la scène 7 (f56–92).
export const NumberScene: React.FC<{goalWord: string; number: string}> = ({goalWord, number}) => {
	const frame = useCurrentFrame(); // 0 = f56
	const arrive = interpolate(frame, [1, 3], [300, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	const push = interpolate(frame, [2, 27], [1, 1.12], clamp);
	const drift = interpolate(frame, [2, 27], [0, -30], clamp);
	const dive = interpolate(frame, [28, 31], [1, 7], {...clamp, easing: Easing.in(Easing.exp)});
	const zoomBlur = interpolate(frame, [28, 31, 33], [0, 0.06, 0.02], clamp);
	const mush = interpolate(frame, [30, 33], [0, 50], clamp);

	return (
		<AbsoluteFill style={{filter: mush > 0.5 ? `blur(${mush}px) saturate(1.4)` : undefined}}>
			<AbsoluteFill style={{transformOrigin: ZOOM_ORIGIN, scale: String(dive)}}>
				<ZoomEcho strength={zoomBlur} origin={ZOOM_ORIGIN}>
					<BrushBg durationInFrames={37} />
					{frame === 0 ? (
						// f56 : restes étirés de BUUUT avant que le numéro ne se forme
						<AbsoluteFill style={{opacity: 0.4}}>
							<Echoes smearPx={400} clip="inset(0 0 0 30%)">
								<GoalRows word={goalWord} glow={1} strokeOpacity={1} />
							</Echoes>
						</AbsoluteFill>
					) : (
						<AbsoluteFill style={{scale: String(push), translate: `${drift}px 0px`}}>
							<Echoes smearPx={-arrive} count={8}>
								<NeonNumber value={number} />
							</Echoes>
						</AbsoluteFill>
					)}
				</ZoomEcho>
			</AbsoluteFill>
			<Grain id="number" opacity={0.08} />
		</AbsoluteFill>
	);
};

import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {BrushBg} from '../fx/BrushBg';
import {Grain} from '../fx/Grain';
import {C, clamp, fontFamily} from '../theme';

// Forme d'emblème PROVISOIRE (bouclier neutre). À remplacer par la forme tirée de l'écusson SVG officiel fourni par le club.
export const PLACEHOLDER_MARK = 'M-100 -120 H100 V20 C100 90 40 125 0 140 C-40 125 -100 90 -100 20 Z';

const Mark: React.FC<{d: string; color: string; opacity?: number; rotate?: number}> = ({d, color, opacity = 1, rotate = 0}) => (
	<svg viewBox="-540 -540 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0, opacity}}>
		<path d={d} fill={color} transform={`rotate(${rotate})`} />
	</svg>
);

// Scène 9 (f260–299) : l'emblème géant rétrécit avec flou en rotation, se pose, puis le nom du club s'écrit.
export const Outro: React.FC<{markPath: string; clubName: string}> = ({markPath, clubName}) => {
	const frame = useCurrentFrame(); // 0 = f260
	const scale = interpolate(frame, [0, 6, 9, 20], [14, 12, 1.6, 0.9], {...clamp, easing: Easing.out(Easing.cubic)});
	const settle = interpolate(frame, [20, 26], [0.9, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
	const rotation = interpolate(frame, [6, 20], [120, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	const spin = interpolate(frame, [6, 9, 20], [0, 14, 0], clamp); // écart des copies = vitesse de rotation
	const finalScale = frame < 20 ? scale : settle;
	const lift = interpolate(frame, [22, 30], [0, -70], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const textP = interpolate(frame, [25, 34], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});

	return (
		<AbsoluteFill>
			<BrushBg durationInFrames={40} />
			<AbsoluteFill style={{scale: String(finalScale), translate: `0px ${lift}px`}}>
				{spin > 0.5
					? [-3, -2, -1, 1, 2, 3].map((k) => (
							<Mark key={k} d={markPath} color={C.grenatAlt} opacity={0.18} rotate={rotation + (k * spin) / 3} />
						))
					: null}
				<Mark d={markPath} color={C.grenatAlt} rotate={rotation} />
			</AbsoluteFill>
			{/* filet doré + nom du club */}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: 680,
					width: interpolate(textP, [0, 1], [0, 360]),
					height: 3,
					translate: '-50% 0px',
					background: C.gold,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: 740,
					translate: '-50% -50%',
					fontFamily,
					fontSize: 56,
					color: C.ivory,
					whiteSpace: 'nowrap',
					letterSpacing: `${interpolate(textP, [0, 1], [0.8, 0.2])}em`,
					opacity: textP,
				}}
			>
				{clubName}
			</div>
			<Grain id="outro" opacity={0.08} />
		</AbsoluteFill>
	);
};

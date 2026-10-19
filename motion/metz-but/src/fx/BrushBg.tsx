import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, clamp} from '../theme';

// Fond sombre grenat avec coups de pinceau diagonaux qui glissent lentement.
const STROKES = [
	{left: -260, top: 40, width: 1500, height: 260, color: C.grenat, opacity: 0.85},
	{left: 260, top: 860, width: 1500, height: 240, color: C.grenat, opacity: 0.6},
	{left: -160, top: 430, width: 1400, height: 110, color: C.grenatAlt, opacity: 0.22},
];

export const BrushBg: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
	const frame = useCurrentFrame();
	const drift = interpolate(frame, [0, durationInFrames], [0, 40], clamp);
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #1a0407 0%, #0c0204 70%, ${C.black} 100%)`}}>
			{STROKES.map((s, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: s.left,
						top: s.top,
						width: s.width,
						height: s.height,
						opacity: s.opacity,
						rotate: '35deg',
						translate: `${drift}px ${drift}px`,
						filter: 'blur(38px)',
						background: `linear-gradient(90deg, transparent, ${s.color} 30%, ${s.color} 70%, transparent)`,
					}}
				/>
			))}
		</AbsoluteFill>
	);
};

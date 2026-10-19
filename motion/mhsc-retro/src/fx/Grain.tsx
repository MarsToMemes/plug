import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

// Poussière d'impression : points épars sombres et clairs (bruit seuillé), graine qui change à chaque image.
export const Grain: React.FC<{id: string; dark: string; light: string}> = ({id, dark, light}) => {
	const frame = useCurrentFrame();
	const seed = frame % 6;
	const specks = (fid: string, s: number, color: string, opacity: number, freq: number) => (
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
			<filter id={fid} x="0" y="0" width="100%" height="100%">
				<feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={1} seed={s} result="n" />
				<feColorMatrix in="n" type="luminanceToAlpha" result="a" />
				<feComponentTransfer in="a" result="t">
					<feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 1" />
				</feComponentTransfer>
				<feFlood floodColor={color} floodOpacity={opacity} />
				<feComposite in2="t" operator="in" />
			</filter>
			<rect width="100%" height="100%" filter={`url(#${fid})`} />
		</svg>
	);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{specks(`${id}-d`, seed, dark, 0.55, 0.55)}
			{specks(`${id}-l`, seed + 11, light, 0.35, 0.7)}
		</AbsoluteFill>
	);
};

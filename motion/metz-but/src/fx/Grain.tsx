import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

// Bruit vidéo + scanlines fines, au-dessus des fonds sombres.
export const Grain: React.FC<{id: string; opacity?: number}> = ({id, opacity = 0.08}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{opacity, mixBlendMode: 'overlay'}}>
				<svg width="100%" height="100%">
					<filter id={`grain-${id}`}>
						<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 9} stitchTiles="stitch" />
						<feColorMatrix type="saturate" values="0" />
					</filter>
					<rect width="100%" height="100%" filter={`url(#grain-${id})`} />
				</svg>
			</AbsoluteFill>
			<AbsoluteFill
				style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 3px)'}}
			/>
		</AbsoluteFill>
	);
};

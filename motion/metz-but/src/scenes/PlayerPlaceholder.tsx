import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, fontFamily} from '../theme';

// Remplaçant tant que la photo du buteur n'est pas fournie : décor tunnel grenat + silhouette neutre.
// L'écusson provisoire est placé sur CREST_POINT pour caler les zooms.
export const PlayerPlaceholder: React.FC<{crest: {x: number; y: number}}> = ({crest}) => (
	<AbsoluteFill style={{background: `radial-gradient(ellipse 60% 55% at 50% 30%, ${C.grenatAlt} 0%, ${C.grenat} 35%, ${C.grenatDeep} 65%, ${C.black} 100%)`}}>
		<svg viewBox="0 0 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0}}>
			{/* arche du tunnel */}
			<path d="M120 1080 V420 Q120 90 540 90 Q960 90 960 420 V1080" fill="none" stroke={C.ivory} strokeOpacity={0.12} strokeWidth={26} />
			<path d="M40 1080 V400 Q40 10 540 10 Q1040 10 1040 400 V1080" fill="none" stroke={C.black} strokeOpacity={0.5} strokeWidth={60} />
			{/* silhouette */}
			<g fill="#1c0709" stroke={C.ivory} strokeOpacity={0.25} strokeWidth={3}>
				<path d="M170 1080 C180 720 280 580 440 540 L480 520 H600 L640 540 C800 580 900 720 910 1080 Z" fill={C.grenat} />
				<rect x={495} y={420} width={90} height={110} rx={30} />
				<ellipse cx={540} cy={320} rx={100} ry={125} />
			</g>
			{/* écusson provisoire */}
			<path
				transform={`translate(${crest.x * 1080} ${crest.y * 1080})`}
				d="M-34 -40 H34 V6 C34 30 14 42 0 48 C-14 42 -34 30 -34 6 Z"
				fill={C.gold}
			/>
			<text x={60} y={60} fontFamily={fontFamily} fontSize={18} fill={C.grey} letterSpacing={2}>
				PHOTO JOUEUR À FOURNIR
			</text>
		</svg>
	</AbsoluteFill>
);

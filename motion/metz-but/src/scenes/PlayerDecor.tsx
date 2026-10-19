import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BrushBg} from '../fx/BrushBg';
import {CROSS_PATH} from '../club';
import {C} from '../theme';

// Décor derrière le joueur détouré : lumière grenat derrière la tête, grande croix en filigrane, pinceaux.
export const PlayerDecor: React.FC = () => (
	<AbsoluteFill>
		<BrushBg durationInFrames={172} />
		<AbsoluteFill
			style={{background: `radial-gradient(ellipse 55% 50% at 50% 28%, ${C.grenatAlt} 0%, rgba(116,7,11,0.85) 35%, transparent 75%)`}}
		/>
		<svg viewBox="-540 -540 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0}}>
			<path d={CROSS_PATH} transform="translate(0 -40) scale(3.4)" fill={C.grenatDeep} fillOpacity={0.55} />
		</svg>
	</AbsoluteFill>
);

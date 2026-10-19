import React from 'react';
import {useCurrentFrame} from 'remotion';
import {F} from '../theme';

// Bandeau de nom en boucle : « PRÉNOM NOM · » répété, défilement linéaire (dir = -1 vers la gauche).
export const Ticker: React.FC<{text: string; y: number; color: string; size?: number; speed?: number; dir?: 1 | -1}> = ({
	text,
	y,
	color,
	size = 30,
	speed = 6,
	dir = -1,
}) => {
	const frame = useCurrentFrame();
	return (
		<div
			style={{
				position: 'absolute',
				left: -600,
				top: y,
				translate: `${dir * frame * speed}px -50%`,
				whiteSpace: 'nowrap',
				fontFamily: F.small,
				fontWeight: 600,
				fontSize: size,
				letterSpacing: '0.15em',
				color,
			}}
		>
			{`${text} · `.repeat(14)}
		</div>
	);
};

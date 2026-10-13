import React from 'react';
import {AbsoluteFill} from 'remotion';

// Flou de zoom : copies agrandies autour du même point, opacité décroissante.
export const ZoomEcho: React.FC<{strength: number; origin: string; children: React.ReactNode}> = ({
	strength,
	origin,
	children,
}) => {
	const copies = strength > 0.002 ? 6 : 0;
	return (
		<AbsoluteFill>
			<AbsoluteFill>{children}</AbsoluteFill>
			{Array.from({length: copies}).map((_, i) => (
				<AbsoluteFill
					key={i}
					style={{transformOrigin: origin, scale: String(1 + (i + 1) * strength), opacity: 0.2 * (1 - i / copies)}}
				>
					{children}
				</AbsoluteFill>
			))}
		</AbsoluteFill>
	);
};

import React from 'react';
import {AbsoluteFill} from 'remotion';

// Traînée directionnelle : copies décalées d'opacité décroissante derrière la copie nette.
// smearPx < 0 étire vers la gauche, > 0 vers la droite. clip limite l'étirement à une zone.
export const Echoes: React.FC<{smearPx: number; clip?: string; count?: number; children: React.ReactNode}> = ({
	smearPx,
	clip,
	count = 10,
	children,
}) => {
	const active = Math.abs(smearPx) > 0.5;
	return (
		<AbsoluteFill>
			{active ? (
				<AbsoluteFill style={{clipPath: clip}}>
					{Array.from({length: count}).map((_, i) => (
						<AbsoluteFill
							key={i}
							style={{translate: `${((i + 1) / count) * smearPx}px 0px`, opacity: (1 - i / count) * 0.35}}
						>
							{children}
						</AbsoluteFill>
					))}
				</AbsoluteFill>
			) : null}
			<AbsoluteFill>{children}</AbsoluteFill>
		</AbsoluteFill>
	);
};

import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {F, P} from '../theme';

// Temps 3 (f17–35) : lettres qui claquent par paliers (aucune interpolation), puis mot en tranches.
type Step = {chars: string; size: number; color: string; x?: number};
const steps = (w: string): Record<number, Step> => ({
	17: {chars: w[0], size: 860, color: P.white},
	18: {chars: w[0], size: 390, color: P.white},
	19: {chars: w[0], size: 280, color: P.dark},
	20: {chars: w[1], size: 860, color: P.white},
	21: {chars: w[1], size: 450, color: P.dark},
	22: {chars: w[1], size: 280, color: P.dark},
	23: {chars: w[0], size: 1150, color: P.white, x: 260},
	24: {chars: w[0], size: 1000, color: P.white, x: 380},
	25: {chars: w[0], size: 360, color: P.white, x: 320},
	26: {chars: w.slice(0, 2), size: 300, color: P.white},
	27: {chars: w.slice(0, 2), size: 300, color: P.white, x: 660},
});

const Word: React.FC<{text: string; size: number; color: string; x?: number; y?: number; clip?: string; dx?: number}> = ({text, size, color, x = 540, y = 560, clip, dx = 0}) => (
	<div
		style={{
			position: 'absolute',
			left: x + dx,
			top: y,
			translate: '-50% -50%',
			fontFamily: F.big,
			fontWeight: 700,
			fontSize: size,
			lineHeight: 0.8,
			color,
			whiteSpace: 'nowrap',
			clipPath: clip,
		}}
	>
		{text}
	</div>
);

export const Letters: React.FC<{offset: number; word: string}> = ({offset, word}) => {
	const f = useCurrentFrame() + offset;
	const st = steps(word)[f];
	if (st) {
		return (
			<AbsoluteFill style={{background: P.red}}>
				<Word text={st.chars} size={st.size} color={st.color} x={st.x} />
			</AbsoluteFill>
		);
	}
	if (f <= 31) {
		// mot en tranches : bande haute blanche, bande basse sombre, décalages qui se résorbent
		const amp = [160, 100, 60, 0][f - 28];
		return (
			<AbsoluteFill style={{background: P.red}}>
				<Word text={word} size={300} color={P.white} clip="inset(0 0 50% 0)" dx={-amp} />
				<Word text={word} size={300} color={f === 31 ? P.dark : P.white} clip="inset(50% 0 0 0)" dx={amp * 0.7} />
			</AbsoluteFill>
		);
	}
	// f32–35 : 3 lignes empilées, haut et bas coupés, ligne du milieu bicolore (coupe verticale qui avance)
	const cut = 470 + (f - 32) * 50;
	return (
		<AbsoluteFill style={{background: P.red}}>
			<Word text={word} size={230} color={P.white} y={380} clip="inset(50% 0 0 0)" />
			{/* coupe verticale en coordonnées du cadre (le clip d'un élément centré serait relatif à sa propre boîte) */}
			<AbsoluteFill style={{clipPath: `inset(0 ${1080 - cut}px 0 0)`}}>
				<Word text={word} size={230} color={P.white} y={560} />
			</AbsoluteFill>
			<AbsoluteFill style={{clipPath: `inset(0 0 0 ${cut}px)`}}>
				<Word text={word} size={230} color={P.dark} y={560} />
			</AbsoluteFill>
			<Word text={word} size={230} color={P.white} y={740} clip="inset(0 0 50% 0)" />
		</AbsoluteFill>
	);
};

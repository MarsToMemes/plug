import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Grain} from '../fx/Grain';
import {BrushBg} from '../fx/BrushBg';
import {GemWord} from './GemWord';
import {ObjectMaterial, ScaledLetters} from './ScaledLetters';
import {C, clamp} from '../theme';

export const CLUB_ROWS = [175, 540, 905];
export const CLUB_FONT_SIZE = 300;

// Scènes 1 et 2 : « METZ » ×3 en grenat taillé dès la première image (miniature forte). Un reflet balaie
// les facettes, puis sur le drop de la musique (f15) la pierre s'allume : à-coup et second reflet (les éclats en étoile ont été retirés).
const ROW_TEX_X = [-200, -120, -260]; // décalage de la texture : les trois lignes ne sont pas identiques
const ROW_DRIFT: [number, number][] = [[-30, 10], [30, -10], [-20, 15]];

export const ClubWord: React.FC<{word: string; material?: 'grenat' | ObjectMaterial}> = ({word, material = 'grenat-relief'}) => {
	const frame = useCurrentFrame();
	const brightness =
		frame < 15
			? interpolate(frame, [0, 14], [0.8, 0.95], clamp)
			: interpolate(frame, [15, 16, 19, 21], [1.45, 1.2, 1.0, 0.75], clamp);
	const punch = interpolate(frame, [15, 17], [1.05, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const sweepX =
		frame < 15
			? interpolate(frame, [1, 14], [-500, 1400], {...clamp, easing: Easing.inOut(Easing.quad)})
			: interpolate(frame, [15, 21], [-500, 1400], {...clamp, easing: Easing.out(Easing.quad)});
	return (
		<AbsoluteFill>
			<BrushBg durationInFrames={22} />
			<AbsoluteFill style={{opacity: 0.55, background: C.black}} />
			<AbsoluteFill style={{scale: String(punch)}}>
				{material !== 'grenat'
					? CLUB_ROWS.map((y, r) => (
							<ScaledLetters key={y} y={y} row={r} material={material} dx={interpolate(frame, [0, 21], ROW_DRIFT[r], clamp)} brightness={1 + (brightness - 1) * 0.45} />
						))
					: CLUB_ROWS.map((y, r) => (
					<GemWord
						key={y}
						id={`club-${r}`}
						word={word}
						y={y}
						fontSize={CLUB_FONT_SIZE}
						dx={interpolate(frame, [0, 21], ROW_DRIFT[r], clamp)}
						texX={ROW_TEX_X[r]}
						brightness={brightness}
						sweepX={sweepX + r * 120}
						glow={frame >= 15 ? 0.75 : 0.5}
					/>
				))}
			</AbsoluteFill>
			<Grain id="club" opacity={0.07} />
		</AbsoluteFill>
	);
};

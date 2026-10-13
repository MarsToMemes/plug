import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Grain} from '../fx/Grain';
import {BrushBg} from '../fx/BrushBg';
import {GemWord, Glint} from './GemWord';
import {C, clamp} from '../theme';

export const CLUB_ROWS = [175, 540, 905];
export const CLUB_FONT_SIZE = 300;

// Scènes 1 et 2 : « METZ » ×3 en grenat taillé dès la première image (miniature forte). Un reflet balaie
// les facettes, puis sur le drop de la musique (f15) la pierre s'allume : à-coup, éclats, second reflet.
const ROW_TEX_X = [-200, -120, -260]; // décalage de la texture : les trois lignes ne sont pas identiques
const ROW_DRIFT: [number, number][] = [[-30, 10], [30, -10], [-20, 15]];
const GLINTS = [
	{x: 250, y: 140, at: 15, size: 34},
	{x: 760, y: 520, at: 16, size: 42},
	{x: 480, y: 880, at: 17, size: 30},
	{x: 900, y: 170, at: 19, size: 26},
];

export const ClubWord: React.FC<{word: string}> = ({word}) => {
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
				{CLUB_ROWS.map((y, r) => (
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
				{GLINTS.map((g) => (
					<Glint
						key={`${g.x}-${g.y}`}
						x={g.x}
						y={g.y}
						size={g.size * interpolate(frame, [g.at, g.at + 2, g.at + 5], [0.2, 1, 0.3], clamp)}
						opacity={interpolate(frame, [g.at, g.at + 1, g.at + 5], [0, 1, 0], clamp)}
					/>
				))}
			</AbsoluteFill>
			<Grain id="club" opacity={0.07} />
		</AbsoluteFill>
	);
};

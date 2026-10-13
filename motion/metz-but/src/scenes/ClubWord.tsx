import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {Grain} from '../fx/Grain';
import {BrushBg} from '../fx/BrushBg';
import {C, SKEW, clamp, fontHeavy} from '../theme';

export const CLUB_ROWS = [110, 540, 970];
export const CLUB_FONT_SIZE = 300;

// Une ligne du mot club, centrée et plus large que le cadre. revealed = nb de lettres visibles depuis la droite.
export const ClubRow: React.FC<{
	word: string;
	y: number;
	color: string;
	revealed?: number;
	letterAge?: number[];
	dx?: number;
}> = ({word, y, color, revealed, letterAge, dx = 0}) => {
	const letters = word.split('');
	const visibleFrom = letters.length - (revealed ?? letters.length);
	return (
		<div
			style={{
				position: 'absolute',
				left: '50%',
				top: y,
				translate: `calc(-50% + ${dx}px) -50%`,
				transform: SKEW,
				whiteSpace: 'nowrap',
				fontFamily: fontHeavy,
				fontWeight: 900,
				fontSize: CLUB_FONT_SIZE,
				lineHeight: 1,
				color,
				letterSpacing: '-0.01em',
			}}
		>
			{letters.map((l, i) => {
				const age = letterAge?.[i] ?? 99;
				const slide = interpolate(age, [0, 3], [180, 0], clamp);
				return (
					<span key={i} style={{position: 'relative', display: 'inline-block', opacity: i < visibleFrom ? 0 : 1}}>
						{/* traînée horizontale de la lettre qui arrive */}
						{slide > 1
							? [1, 2, 3, 4, 5].map((k) => (
									<span
										key={k}
										style={{position: 'absolute', left: 0, top: 0, translate: `${slide + k * slide * 0.35}px 0px`, opacity: 0.32 - k * 0.05}}
									>
										{l}
									</span>
								))
							: null}
						<span style={{display: 'inline-block', translate: `${slide}px 0px`}}>{l}</span>
					</span>
				);
			})}
		</div>
	);
};

// Scènes 1 et 2 : arrivée lettre par lettre sur fond nuit, puis coupe sèche plein cadre (f15).
export const ClubWord: React.FC<{word: string}> = ({word}) => {
	const frame = useCurrentFrame();
	const n = word.length;
	// Lettres révélées de droite à gauche entre f2 et f14, chaque ligne avec 1 frame de décalage.
	const revealAt = (rowDelay: number, letterFromRight: number) => 2 + rowDelay + Math.round((letterFromRight * 11) / Math.max(1, n - 1));
	const rowDelays = [1, 0, 2];
	const rowDx = [-20, 15, -5];

	if (frame < 15) {
		return (
			<AbsoluteFill style={{background: `radial-gradient(circle at 50% 55%, #24070b 0%, #0d0305 60%, ${C.black} 100%)`}}>
				{/* halo flou grenat qui dérive */}
				<div
					style={{
						position: 'absolute',
						left: 180,
						top: 300,
						width: 620,
						height: 520,
						borderRadius: '50%',
						background: `radial-gradient(circle, ${C.grenatAlt} 0%, transparent 70%)`,
						filter: 'blur(40px)',
						opacity: 0.55,
						translate: `${interpolate(frame, [0, 15], [0, 40], clamp)}px 0px`,
					}}
				/>
				{CLUB_ROWS.map((y, r) => {
					const ages = word.split('').map((_, i) => frame - revealAt(rowDelays[r], n - 1 - i));
					const revealed = ages.filter((a) => a >= 0).length;
					return (
						<ClubRow key={r} word={word} y={y} dx={rowDx[r]} color={C.grenatAlt} revealed={revealed} letterAge={ages} />
					);
				})}
				<AbsoluteFill style={{opacity: 0.45, background: C.black, mixBlendMode: 'multiply'}} />
				<Grain id="club-intro" opacity={0.12} />
			</AbsoluteFill>
		);
	}

	const color = interpolateColors(frame, [15, 21], [C.grenatAlt, '#4a0508']);
	const dx = interpolate(frame, [15, 21], [0, -10], clamp);
	return (
		<AbsoluteFill>
			<BrushBg durationInFrames={7} />
			<AbsoluteFill style={{opacity: 0.6, background: C.black}} />
			{CLUB_ROWS.map((y, r) => (
				<ClubRow key={r} word={word} y={y} dx={dx} color={color} />
			))}
			<Grain id="club-full" opacity={0.08} />
		</AbsoluteFill>
	);
};

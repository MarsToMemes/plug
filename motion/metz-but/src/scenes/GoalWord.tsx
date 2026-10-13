import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {Echoes} from '../fx/Echoes';
import {Grain} from '../fx/Grain';
import {C, SKEW, clamp, fontFamily} from '../theme';
import {CLUB_ROWS, ClubRow} from './ClubWord';

export const GOAL_ROWS = [45, 260, 475, 690, 905];
const GOAL_FONT_SIZE = 150;

// MOT_BUT ×5 en contour, alignés à gauche. glow = 0 contour terne, 1 néon.
export const GoalRows: React.FC<{word: string; glow: number; strokeOpacity: number}> = ({word, glow, strokeOpacity}) => (
	<AbsoluteFill>
		{GOAL_ROWS.map((y) => (
			<div
				key={y}
				style={{
					position: 'absolute',
					left: 70,
					top: y,
					translate: '0px -50%',
					transform: SKEW,
					whiteSpace: 'nowrap',
					fontFamily,
					fontSize: GOAL_FONT_SIZE,
					lineHeight: 1,
					color: 'transparent',
					WebkitTextStroke: `3px rgba(245, 242, 237, ${strokeOpacity})`,
					filter:
						glow > 0.01
							? `drop-shadow(0 0 ${5 * glow}px rgba(245,242,237,${0.9 * glow})) drop-shadow(0 0 ${22 * glow}px rgba(212,175,55,${0.45 * glow}))`
							: undefined,
				}}
			>
				{word}
			</div>
		))}
	</AbsoluteFill>
);

// Glitch par tranches : chaque bande montre l'ancien ou le nouveau calque, décalée en x.
const SliceGlitch: React.FC<{frame: number; progress: number; amplitude: number; from: React.ReactNode; to: React.ReactNode}> = ({
	frame,
	progress,
	amplitude,
	from,
	to,
}) => {
	const tick = Math.floor(frame / 2);
	const raw = Array.from({length: 10}).map((_, i) => 0.3 + random(`h-${i}-${tick}`));
	const total = raw.reduce((a, b) => a + b, 0);
	let top = 0;
	return (
		<AbsoluteFill>
			{raw.map((r, i) => {
				const h = (r / total) * 100;
				const dx = (random(`x-${i}-${tick}`) - 0.5) * 2 * amplitude;
				const showNew = random(`n-${i}-${tick}`) < progress;
				const band = (
					<AbsoluteFill key={i} style={{clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - h)}% 0)`, translate: `${dx}px 0px`}}>
						{showNew ? to : from}
					</AbsoluteFill>
				);
				top += h;
				return band;
			})}
		</AbsoluteFill>
	);
};

// Scènes 3 à 5 (f22–55) : glitch, BUUUT en contour qui se résorbe, néon, sortie en smear.
export const GoalWord: React.FC<{clubWord: string; goalWord: string}> = ({clubWord, goalWord}) => {
	const frame = useCurrentFrame(); // 0 = f22
	const night = `radial-gradient(circle at 40% 60%, #1c0508 0%, #0b0204 65%, ${C.black} 100%)`;

	const rows = (
		<GoalRows
			word={goalWord}
			glow={interpolate(frame, [12, 17], [0, 1], clamp)}
			strokeOpacity={interpolate(frame, [5, 15], [0.5, 1], clamp)}
		/>
	);

	if (frame < 5) {
		const oldLayer = (
			<AbsoluteFill style={{background: C.black}}>
				{CLUB_ROWS.map((y) => (
					<ClubRow key={y} word={clubWord} y={y} dx={-10} color="#4a0508" />
				))}
			</AbsoluteFill>
		);
		return (
			<AbsoluteFill style={{background: C.black}}>
				<SliceGlitch
					frame={frame}
					progress={interpolate(frame, [0, 4], [0.2, 1], clamp)}
					amplitude={interpolate(frame, [0, 2, 4], [40, 180, 60], clamp)}
					from={oldLayer}
					to={<AbsoluteFill style={{background: night}}>{rows}</AbsoluteFill>}
				/>
				{/* flash doré très bref : seul usage de l'or dans la transition */}
				<AbsoluteFill style={{background: C.gold, mixBlendMode: 'screen', opacity: interpolate(frame, [1, 2, 4], [0, 0.18, 0], clamp)}} />
				<Grain id="goal-glitch" opacity={0.12} />
			</AbsoluteFill>
		);
	}

	// f27–36 : moitié gauche étirée vers la gauche, qui se rétracte.
	const leftSmear = interpolate(frame, [5, 14], [-250, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	// f50–55 : moitié droite qui s'étire vers la droite.
	const rightSmear = interpolate(frame, [28, 33], [0, 400], {...clamp, easing: Easing.in(Easing.quad)});
	const fadeOut = interpolate(frame, [31, 34], [1, 0.4], clamp);

	return (
		<AbsoluteFill style={{background: night}}>
			{/* halo chaud qui monte du bas-gauche (f37–49) */}
			<AbsoluteFill
				style={{
					background: `radial-gradient(ellipse 70% 60% at 15% 100%, ${C.grenatAlt} 0%, rgba(116,7,11,0.6) 40%, transparent 75%)`,
					opacity: interpolate(frame, [15, 27], [0, 0.85], {...clamp, easing: Easing.inOut(Easing.quad)}),
					translate: `0px ${interpolate(frame, [15, 27], [120, 0], clamp)}px`,
				}}
			/>
			<AbsoluteFill style={{opacity: fadeOut, scale: String(interpolate(frame, [15, 27], [1, 1.02], clamp))}}>
				<Echoes smearPx={rightSmear > 0.5 ? rightSmear : leftSmear} clip={rightSmear > 0.5 ? 'inset(0 0 0 45%)' : 'inset(0 55% 0 0)'}>
					{rows}
				</Echoes>
			</AbsoluteFill>
			<Grain id="goal" opacity={0.1} />
		</AbsoluteFill>
	);
};

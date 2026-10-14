import React from 'react';
import {AbsoluteFill, Html5Audio as Audio, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {CinemaGoalProps} from './props';
import {FaceScene} from './scenes/Face';
import {FinalScene} from './scenes/Final';
import {LogoBuild, Slogan} from './scenes/Intro';
import {NameScene} from './scenes/Name';
import {NumberScene, PositionScene} from './scenes/Number';
import {GoalWord, Rush1} from './scenes/Rushes';
import {P} from './theme';

export {cinemaGoalSchema, defaultCinemaGoalProps} from './props';

// Musique : « Stadium Rocker » (Taelimb, Epidemic Sound, fournie par l'utilisateur). Le coup qui suit le blanc de
// 97,7–98,25 s (98,35 s) tombe sur la coupe du slogan (f15) : le logo s'assemble dans le blanc, sous l'aspiration.
// trimBefore = (98,35 − 0,5) s × 30 i/s.
const MUSIC_TRIM = 2936;

// Effets synthétisés (repris de motion/metz-but/tools/sfx.py), en appoint sous la musique.
const SFX: [string, number, number][] = [
	['aspiration', 3, 0.35],
	['whoosh-lettres', 13, 0.3],
	['impact-but', 62, 0.35],
	['impact-numero', 91, 0.3],
	['scintillement', 105, 0.25],
	['whoosh-sortie', 165, 0.3],
	['impact-final', 188, 0.35],
];

const SCENES: [string, number, number, React.FC<{p: CinemaGoalProps; from: number}>][] = [
	['1 · Logo', 0, 15, ({p}) => <LogoBuild p={p} />],
	['2 · Slogan', 15, 22, Slogan],
	['3 · Rush 1', 37, 25, Rush1],
	['4 · BUT', 62, 29, GoalWord],
	['5 · Numéro', 91, 21, NumberScene],
	['6 · Poste', 112, 13, PositionScene],
	['7 · Visage', 125, 42, FaceScene],
	['8 · Nom', 167, 21, NameScene],
	['9 · Plan final', 188, 95, FinalScene],
];

export const CinemaGoal: React.FC<CinemaGoalProps> = (p) => {
	const {fps, durationInFrames} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: P.ink}}>
			{SCENES.map(([name, from, dur, Scene]) => (
				<Sequence key={name} name={name} from={from} durationInFrames={dur} premountFor={fps}>
					<Scene p={p} from={from} />
				</Sequence>
			))}
			<Audio
				src={staticFile('music/stadium-rocker-taelimb.mp3')}
				trimBefore={MUSIC_TRIM}
				volume={(fr) => interpolate(fr, [0, durationInFrames - 20, durationInFrames - 1], [0.41, 0.41, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
			/>
			{SFX.map(([name, at, vol], i) => (
				<Sequence key={i} name={`SFX ${name}`} from={at} layout="none">
					<Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};

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
// 97,5–98,1 s (98,10 s, image 2943 du morceau à 30 i/s) tombe sur la coupe du slogan (f15) : le logo s'assemble dans
// le blanc, sous l'aspiration. trimBefore = 2943 − 15 = 2928.
const MUSIC_TRIM = 2928;

// Bruitages, seulement là où ils s'entendent sous la musique :
// - Epidemic Sound (fournis par l'utilisateur) : whoosh (le fichier en contient 3, un par passage, sommet ≈ 0,5 s
//   après son début) sur les volets, les entailles et le panoramique du nom ; flash photo sur les deux flashs.
// - synthétisés (motion/metz-but/tools/sfx.py) : aspiration dans le blanc de la musique, impacts du BUT et du plan final.
// [fichier, image du coup, volume, début dans le fichier (s), durée (images)]
const SFX: [string, number, number, number, number][] = [
	['aspiration.wav', 3, 0.35, 0, 12],
	['es-whoosh-classic.mp3', 40, 0.7, 0, 34],
	['impact-but.wav', 62, 0.35, 0, 66],
	['es-camera-flash.mp3', 112, 0.55, 0, 60],
	['es-whoosh-classic.mp3', 128, 0.7, 1.35, 34],
	['es-whoosh-classic.mp3', 168, 0.7, 2.87, 40],
	['impact-final.wav', 188, 0.35, 0, 78],
	['es-camera-flash.mp3', 193, 0.45, 0, 60],
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
			{SFX.map(([file, hit, vol, start, dur], i) => {
				// le sommet d'un whoosh arrive ≈ 15 images après son début ; flash et impacts frappent tout de suite
				const lead = file.includes('whoosh') ? 15 : file.includes('flash') ? 2 : 0;
				return (
					<Sequence key={i} name={`SFX ${file}`} from={hit - lead} durationInFrames={dur} layout="none">
						<Audio src={staticFile(`sfx/${file}`)} volume={vol} trimBefore={Math.round(start * fps)} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};

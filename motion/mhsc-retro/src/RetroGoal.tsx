import React from 'react';
import {AbsoluteFill, Html5Audio as Audio, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {CrestWord} from './scenes/CrestWord';
import {Marquee} from './scenes/Marquee';
import {NumberScript} from './scenes/NumberScript';
import {PlayerCard} from './scenes/PlayerCard';
import {MHSC} from './theme';

export const retroGoalSchema = z.object({
	goalWord: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	number: z.string(),
	city: z.string(),
	clubShort: z.string(),
	script: z.string(), // surnom en manuscrit (le club n'a pas de logo-script)
	subtitle: z.string(),
	ringText: z.string(),
	playerPhoto: z.string(),
	palette: z.object({hot: z.string(), dark: z.string(), cream: z.string()}),
});
export type RetroGoalProps = z.infer<typeof retroGoalSchema>;

export const defaultRetroGoalProps: RetroGoalProps = {
	goalWord: 'BUUUT',
	firstName: 'THÉO',
	lastName: 'SAINTE-LUCE',
	number: '17',
	city: 'MONTPELLIER',
	clubShort: 'M H S C',
	script: 'Paillade',
	subtitle: 'MONTPELLIER HSC',
	ringText: 'MONTPELLIER · LA PAILLADE · 1974',
	playerPhoto: 'joueurs/theo-sainte-luce.png',
	palette: MHSC,
};

// Musique fournie par l'utilisateur (Epidemic Sound, sous sa licence) : on démarre sur le gros coup de 125,2 s ;
// l'accalmie du morceau (127,35–127,65 s) tombe sur la fin de la scène 2 et la reprise (127,69 s) sur la coupe
// du numéro (f75). trimBefore = 125,2 s × 30 i/s.
const MUSIC_TRIM = 3756;

// Effets synthétisés (copiés de motion/metz-but/tools/sfx.py), en appoint sous la musique, calés sur les coupes.
const SFX: [string, number, number][] = [
	['glitch', 10, 0.25],
	['impact-but', 40, 0.5],
	['impact-numero', 75, 0.5],
	['whoosh-sortie', 107, 0.35],
	['impact-final', 110, 0.5],
	['atterrissage', 116, 0.4],
];

export const RetroGoal: React.FC<RetroGoalProps> = (p) => {
	const {fps} = useVideoConfig();
	const ticker = `${p.firstName} ${p.lastName}`;
	return (
		<AbsoluteFill style={{background: p.palette.dark}}>
			<Sequence name="Mot géant" from={0} durationInFrames={40} premountFor={fps}>
				<Marquee word={p.goalWord} ticker={ticker} P={p.palette} />
			</Sequence>
			<Sequence name="Mot sur écusson" from={40} durationInFrames={35} premountFor={fps}>
				<CrestWord word={p.goalWord} city={p.city} clubShort={p.clubShort} P={p.palette} />
			</Sequence>
			<Sequence name="Numéro + manuscrit" from={75} durationInFrames={35} premountFor={fps}>
				<NumberScript number={p.number} script={p.script} ticker={ticker} P={p.palette} />
			</Sequence>
			<Sequence name="Carte joueur" from={110} durationInFrames={161} premountFor={fps}>
				<PlayerCard
					firstName={p.firstName}
					lastName={p.lastName}
					number={p.number}
					subtitle={p.subtitle}
					ringText={p.ringText}
					photo={p.playerPhoto}
					P={p.palette}
				/>
			</Sequence>
			<Audio
				src={staticFile('music/limitless-lonely-robot.mp3')}
				trimBefore={MUSIC_TRIM}
				volume={(fr) => interpolate(fr, [0, 255, 270], [0.55, 0.55, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
			/>
			{SFX.map(([name, at, vol], i) => (
				<Sequence key={i} name={`SFX ${name}`} from={at} layout="none">
					<Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};

import React from 'react';
import {AbsoluteFill, Html5Audio as Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {ActionBW} from './scenes/ActionBW';
import {Letters} from './scenes/Letters';
import {LogoCard} from './scenes/LogoCard';
import {PlayerCard} from './scenes/PlayerCard';
import {Reels} from './scenes/Reel';
import {Mosaic, Slices} from './scenes/Transitions';
import {WordGrid} from './scenes/WordGrid';
import {P} from './theme';

export const glitchGoalSchema = z.object({
	goalWord: z.string(),
	cityWord: z.string(),
	clubWord: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	number: z.string(),
	role: z.string(),
	portrait: z.string(),
	actionPhoto: z.string(),
	cardPhoto: z.string(),
});
export type GlitchGoalProps = z.infer<typeof glitchGoalSchema>;

export const defaultGlitchGoalProps: GlitchGoalProps = {
	goalWord: 'BUT',
	cityWord: 'CLERMONT',
	clubWord: 'FOOT 63',
	firstName: 'FLORIAN',
	lastName: 'BIANCHINI',
	number: '7',
	role: 'CLERMONT FOOT 63',
	portrait: 'joueurs/bianchini-portrait.png',
	actionPhoto: 'joueurs/bianchini-nb.jpg',
	cardPhoto: 'joueurs/bianchini-buste.png',
};

// Base de la première mosaïque : logotype qui se casse en tranches (f8–11), puis fond rouge uni.
const FirstMosaicBase: React.FC<{p: GlitchGoalProps}> = ({p}) => {
	const f = useCurrentFrame() + 8;
	return f < 12 ? (
		<Slices offset={8} amp={(f - 7) * 30} keyName="m1">
			<LogoCard offset={8} city={p.cityWord} club={p.clubWord} />
		</Slices>
	) : (
		<AbsoluteFill style={{background: P.red}} />
	);
};

// Effets synthétisés (repris de motion/metz-but/tools/sfx.py) : impacts sur les coupes, glitch sur les mosaïques.
const SFX: [string, number, number][] = [
	['glitch', 8, 0.4],
	['impact-but', 17, 0.6],
	['impact-numero', 20, 0.45],
	['impact-but', 36, 0.55],
	['impact-numero', 57, 0.5],
	['atterrissage', 68, 0.45],
	['impact-final', 76, 0.55],
	['glitch', 89, 0.35],
	['impact-but', 99, 0.55],
	['whoosh-sortie', 155, 0.4],
	['glitch', 159, 0.35],
];

export const GlitchGoal: React.FC<GlitchGoalProps> = (p) => {
	const {fps} = useVideoConfig();
	const card = (offset: number) => <PlayerCard offset={offset} photo={p.cardPhoto} firstName={p.firstName} lastName={p.lastName} number={p.number} />;
	return (
		<AbsoluteFill style={{background: P.red}}>
			<Sequence name="1 · Logotype" from={0} durationInFrames={8} premountFor={fps}>
				<LogoCard offset={0} city={p.cityWord} club={p.clubWord} />
			</Sequence>
			<Sequence name="2 · Mosaïque" from={8} durationInFrames={9} premountFor={fps}>
				<Mosaic offset={8} start={8} end={16} base={<FirstMosaicBase p={p} />} flat={[P.grey, P.white]} keyName="mos1" />
			</Sequence>
			<Sequence name="3 · Lettres" from={17} durationInFrames={19} premountFor={fps}>
				<Letters offset={17} word={p.goalWord} />
			</Sequence>
			<Sequence name="4 · Grille de mots" from={36} durationInFrames={21} premountFor={fps}>
				<WordGrid offset={36} word={p.goalWord} portrait={p.portrait} />
			</Sequence>
			<Sequence name="5 · Rouleaux" from={57} durationInFrames={19} premountFor={fps}>
				<Reels offset={57} number={p.number} />
			</Sequence>
			<Sequence name="6 · Photo N&B" from={76} durationInFrames={13} premountFor={fps}>
				<ActionBW offset={76} photo={p.actionPhoto} number={p.number} city={p.cityWord} role={p.role} />
			</Sequence>
			<Sequence name="7a · Mosaïque" from={89} durationInFrames={10} premountFor={fps}>
				<Mosaic
					offset={89}
					start={89}
					end={98}
					base={<ActionBW offset={89} photo={p.actionPhoto} number={p.number} city={p.cityWord} role={p.role} />}
					next={card(89)}
					switchAt={95}
					flat={[P.grey, P.white]}
					keyName="mos2"
				/>
			</Sequence>
			<Sequence name="7 · Carte joueur" from={99} durationInFrames={56} premountFor={fps}>
				{card(99)}
			</Sequence>
			<Sequence name="8a · Tranches" from={155} durationInFrames={4} premountFor={fps}>
				<Slices offset={155} amp={160} keyName="out">
					{card(155)}
				</Slices>
			</Sequence>
			<Sequence name="8b · Mosaïque" from={159} durationInFrames={8} premountFor={fps}>
				<Mosaic
					offset={159}
					start={159}
					end={166}
					base={card(159)}
					next={<LogoCard offset={159} city={p.cityWord} club={p.clubWord} />}
					switchAt={162}
					flat={[P.redDark, '#9A0333']}
					keyName="mos3"
				/>
			</Sequence>
			<Sequence name="8 · Logotype (boucle)" from={167} durationInFrames={20} premountFor={fps}>
				<LogoCard offset={167} city={p.cityWord} club={p.clubWord} />
			</Sequence>
			{SFX.map(([name, at, vol], i) => (
				<Sequence key={i} name={`SFX ${name}`} from={at} layout="none">
					<Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};

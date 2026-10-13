import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {ClubWord} from './scenes/ClubWord';
import {GoalWord} from './scenes/GoalWord';
import {NumberScene} from './scenes/NumberScene';
import {CROSS_PATH} from './club';
import {Outro} from './scenes/Outro';
import {PlayerCard} from './scenes/PlayerCard';
import {SoundTrack} from './SoundTrack';

export const goalCardSchema = z.object({
	clubWord: z.string(),
	goalWord: z.string(),
	number: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	clubLogotype: z.string(),
	playerPhoto: z.string().nullable(),
	crestPoint: z.object({x: z.number().min(0).max(1), y: z.number().min(0).max(1)}),
	markPath: z.string(),
	sponsorLogo: z.string().nullable(),
});

export type GoalCardProps = z.infer<typeof goalCardSchema>;

export const defaultGoalCardProps: GoalCardProps = {
	clubWord: 'METZ',
	goalWord: 'BUUUT',
	number: '8',
	firstName: 'JESSY',
	lastName: 'DEMINGUET',
	clubLogotype: 'club/fc-metz-logotype.png',
	playerPhoto: 'joueurs/jessy-deminguet.png',
	crestPoint: {x: 0.64, y: 0.56},
	markPath: CROSS_PATH,
	sponsorLogo: null,
};

// Languette sponsor blanche en haut à droite, au-dessus de tout et jamais animée.
const SponsorTab: React.FC<{logo: string}> = ({logo}) => (
	<div style={{position: 'absolute', right: 0, top: 0, width: 247, height: 104}}>
		<svg width={247} height={104} style={{position: 'absolute', inset: 0}}>
			<path d="M0 0 H247 V104 H40 C18 104 18 60 0 0 Z" fill="#fff" />
		</svg>
		<Img src={staticFile(logo)} style={{position: 'absolute', left: 50, top: 14, width: 183, height: 76, objectFit: 'contain'}} />
	</div>
);

export const GoalCard: React.FC<GoalCardProps> = (props) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: '#101010'}}>
			<Sequence name="Mot club" from={0} durationInFrames={22} premountFor={fps}>
				<ClubWord word={props.clubWord} />
			</Sequence>
			<Sequence name="BUUUT" from={22} durationInFrames={34} premountFor={fps}>
				<GoalWord clubWord={props.clubWord} goalWord={props.goalWord} />
			</Sequence>
			<Sequence name="Numéro" from={56} durationInFrames={37} premountFor={fps}>
				<NumberScene goalWord={props.goalWord} number={props.number} />
			</Sequence>
			<Sequence name="Joueur" from={88} durationInFrames={172} premountFor={fps}>
				<PlayerCard
					playerPhoto={props.playerPhoto}
					crestPoint={props.crestPoint}
					firstName={props.firstName}
					lastName={props.lastName}
				/>
			</Sequence>
			<Sequence name="Emblème" from={260} durationInFrames={40} premountFor={fps}>
				<Outro markPath={props.markPath} clubLogotype={props.clubLogotype} />
			</Sequence>
			{props.sponsorLogo ? <SponsorTab logo={props.sponsorLogo} /> : null}
			<SoundTrack />
		</AbsoluteFill>
	);
};

import React from 'react';
import {Composition} from 'remotion';
import {CinemaGoal, cinemaGoalSchema, defaultCinemaGoalProps} from './CinemaGoal';
import './theme';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="CinemaGoal"
		component={CinemaGoal}
		schema={cinemaGoalSchema}
		durationInFrames={283}
		fps={30}
		width={1920}
		height={1080}
		defaultProps={defaultCinemaGoalProps}
	/>
);

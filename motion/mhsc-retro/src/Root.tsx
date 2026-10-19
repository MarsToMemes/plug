import React from 'react';
import {Composition} from 'remotion';
import {RetroGoal, defaultRetroGoalProps, retroGoalSchema} from './RetroGoal';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="RetroGoal"
		component={RetroGoal}
		schema={retroGoalSchema}
		durationInFrames={271}
		fps={30}
		width={1200}
		height={1200}
		defaultProps={defaultRetroGoalProps}
	/>
);

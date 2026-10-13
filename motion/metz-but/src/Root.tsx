import React from 'react';
import {Composition} from 'remotion';
import {GoalCard, defaultGoalCardProps, goalCardSchema} from './GoalCard';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="GoalCard"
		component={GoalCard}
		schema={goalCardSchema}
		durationInFrames={300}
		fps={30}
		width={1080}
		height={1080}
		defaultProps={defaultGoalCardProps}
	/>
);

import React from 'react';
import {Composition, Still} from 'remotion';
import {GoalCard, defaultGoalCardProps, goalCardSchema} from './GoalCard';
import {TypoMaterials} from './previews/TypoMaterials';
import {GemPreview} from './previews/GemPreview';

export const RemotionRoot: React.FC = () => (
	<>
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
	<Still id="MatieresMETZ" component={TypoMaterials} width={1080} height={1760} />
	<Still id="GrenatTaille" component={GemPreview} width={1080} height={1760} />
	</>
);

import React from 'react';
import {Composition} from 'remotion';
import {GlitchGoal, defaultGlitchGoalProps, glitchGoalSchema} from './GlitchGoal';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="GlitchGoal"
		component={GlitchGoal}
		schema={glitchGoalSchema}
		durationInFrames={187}
		fps={24}
		width={1080}
		height={1080}
		defaultProps={defaultGlitchGoalProps}
	/>
);

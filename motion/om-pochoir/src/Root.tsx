import React from 'react';
import {Composition} from 'remotion';
import {GrungePochoir, LOOP, defaultGrungeProps, grungeSchema} from './GrungePochoir';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="GrungePochoir"
		component={GrungePochoir}
		schema={grungeSchema}
		durationInFrames={LOOP * 2}
		fps={60}
		width={1080}
		height={1350}
		defaultProps={defaultGrungeProps}
	/>
);

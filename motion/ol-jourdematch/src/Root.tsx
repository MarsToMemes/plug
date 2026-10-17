import React from 'react';
import {Composition} from 'remotion';
import {JourDeMatch} from './JourDeMatch';
import {defaultJdmProps, jdmSchema} from './props';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="JourDeMatch"
		component={JourDeMatch}
		schema={jdmSchema}
		durationInFrames={233}
		fps={24}
		width={1080}
		height={1920}
		defaultProps={defaultJdmProps}
	/>
);

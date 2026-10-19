import React from 'react';
import {Composition} from 'remotion';
import {LogoRelief, VictoireChrome, defaultVictoireProps, victoireSchema} from './VictoireChrome';

export const RemotionRoot: React.FC = () => (
	<>
	<Composition
		id="VictoireChrome"
		component={VictoireChrome}
		schema={victoireSchema}
		durationInFrames={360}
		fps={30}
		width={1080}
		height={1080}
		defaultProps={defaultVictoireProps}
	/>
	<Composition
		id="LogoRelief"
		component={LogoRelief}
		schema={victoireSchema}
		durationInFrames={66}
		fps={30}
		width={1080}
		height={1080}
		defaultProps={defaultVictoireProps}
	/>
	</>
);

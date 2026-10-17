import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {JdmProps} from './props';
import {Affiche} from './scenes/Affiche';
import {Carte} from './scenes/Carte';
import {Grey1, Grey4, Navy2, Red3} from './scenes/Intro';
import {fontsLoaded} from './theme';

// Coupes sèches aux images 4, 20, 41, 60, 115 (la transition rose 112–114 est dans Affiche).
export const JourDeMatch: React.FC<JdmProps> = (p) => {
	const f = useCurrentFrame();
	const [ready, setReady] = useState(false);
	const [handle] = useState(() => delayRender('polices'));
	useEffect(() => {
		fontsLoaded.then(() => {
			setReady(true);
			continueRender(handle);
		});
	}, [handle]);
	if (!ready) return null;
	const Scene = f < 4 ? Grey1 : f < 20 ? Navy2 : f < 41 ? Red3 : f < 60 ? Grey4 : f < 115 ? Affiche : Carte;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Scene p={p} f={f} />
		</AbsoluteFill>
	);
};

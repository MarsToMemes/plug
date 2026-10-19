import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Loop, continueRender, delayRender, interpolate, useCurrentFrame} from 'remotion';
import {GrungeProps} from './props';
import {LogoPrint} from './scenes/LogoPrint';
import {Slogan} from './scenes/Slogan';
import {WordBlock} from './scenes/WordBlock';
import {fontsLoaded} from './theme';

export {defaultGrungeProps, grungeSchema} from './props';

export const LOOP = 380;

// Une boucle de 380 images (60 i/s) ; chaque temps est une fonction pure de l'image `f` de la boucle.
const OneLoop: React.FC<{p: GrungeProps}> = ({p}) => {
	const f = useCurrentFrame();
	if (f < 50) return <LogoPrint f={f} />;
	if (f < 54)
		return (
			<LogoPrint
				f={f}
				overlay={
					<AbsoluteFill style={{opacity: interpolate(f, [50, 53], [0.25, 0.6])}}>
						<WordBlock p={p} f={54} />
					</AbsoluteFill>
				}
			/>
		);
	if (f < 188) return <WordBlock p={p} f={f} />;
	return <Slogan p={p} f={f} />;
};

export const GrungePochoir: React.FC<GrungeProps> = (p) => {
	const [ready, setReady] = useState(false);
	const [handle] = useState(() => delayRender('polices'));
	useEffect(() => {
		fontsLoaded.then(() => {
			setReady(true);
			continueRender(handle);
		});
	}, [handle]);
	if (!ready) return null;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Loop durationInFrames={LOOP} times={2}>
				<OneLoop p={p} />
			</Loop>
		</AbsoluteFill>
	);
};

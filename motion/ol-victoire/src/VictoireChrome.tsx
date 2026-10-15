import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame} from 'remotion';
import {Blocks, makeBlocks} from './fx';
import {VictoireProps} from './props';
import {DarkCard, DarkCardReturn} from './scenes/DarkCard';
import {Giant} from './scenes/Giant';
import {Logo3D} from './scenes/Logo3D';
import {RedBand} from './scenes/RedBand';
import {WhiteCard} from './scenes/WhiteCard';
import {F, P, chrome, fontsLoaded} from './theme';

export {defaultVictoireProps, victoireSchema} from './props';

// Transitions en blocs (timeline.md) : morceaux de la scène suivante + aplats.
const B_23 = makeBlocks('b23', 104, 113, 9, [P.red, P.white, P.night]);
const B_34 = makeBlocks('b34', 172, 176, 7, [P.night, P.white, P.redDeep]);
const B_56 = makeBlocks('b56', 340, 348, 9, [P.red, P.night, '#1A1B22']);

// Chaque scène est une fonction pure de l'image absolue `f` : on peut l'afficher dans une transition.
export const VictoireChrome: React.FC<VictoireProps> = (p) => {
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

	let scene: React.ReactNode;
	if (f < 47) scene = <DarkCard p={p} f={f} />;
	else if (f < 104) scene = <RedBand p={p} f={f} />;
	else if (f < 114) scene = <Blocks f={f} id="t23" blocks={B_23} a={<RedBand p={p} f={f} />} b={<Logo3D p={p} f={Math.max(f, 110)} />} />;
	else if (f < 172) scene = <Logo3D p={p} f={f} />;
	else if (f < 176) scene = <Blocks f={f} id="t34" blocks={B_34} a={<Logo3D p={p} f={f} />} b={<Giant p={p} f={176} />} />;
	else if (f < 199) scene = <Giant p={p} f={f} />;
	else if (f < 340) scene = <WhiteCard p={p} f={f} />;
	else if (f < 348)
		scene = (
			<Blocks
				f={f}
				id="t56"
				blocks={B_56}
				a={<WhiteCard p={p} f={f} />}
				b={<DarkCardReturn p={p} f={f} />}
				extra={(bl) =>
					bl.flat === '#1A1B22' ? (
						<div style={{fontFamily: F.black, fontSize: bl.h * 1.1, lineHeight: 1, filter: 'blur(6px)', ...chrome(40)}}>{p.club[0]}</div>
					) : null
				}
			/>
		);
	else scene = <DarkCardReturn p={p} f={f} />;
	return <AbsoluteFill style={{background: '#000'}}>{scene}</AbsoluteFill>;
};

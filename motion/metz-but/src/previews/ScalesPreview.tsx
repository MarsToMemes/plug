import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {GemWord} from '../scenes/GemWord';
import {C, fontFamily} from '../theme';

// Comparaison des deux matières retenues pour « METZ », à la taille réelle de la vidéo (police 300 px).
const Label: React.FC<{y: number; children: string}> = ({y, children}) => (
	<div style={{position: 'absolute', left: 36, top: y, fontFamily, fontSize: 20, color: C.ivory, letterSpacing: 2}}>{children}</div>
);

export const ScalesPreview: React.FC = () => (
	<AbsoluteFill style={{background: '#0d0204'}}>
		<Label y={24}>A · GRENAT TAILLÉ (VERSION ACTUELLE)</Label>
		<AbsoluteFill style={{top: 0, height: 1080}}>
			<GemWord id="cmp-gem" word="METZ" y={250} fontSize={300} texX={-180} />
		</AbsoluteFill>
		<Label y={474}>B · ÉCAILLES DU GRAOULLY</Label>
		<AbsoluteFill style={{top: 0, height: 1080}}>
			<GemWord
				id="cmp-scales"
				word="METZ"
				y={700}
				fontSize={300}
				texX={-260}
				texture="matieres/ecailles-graoully.png"
				texAspect={3}
				texScale={2.0}
				glow={0.4}
			/>
		</AbsoluteFill>
		<Label y={924}>B · GROS PLAN DE LA TEXTURE (PIXELS RÉELS)</Label>
		<div style={{position: 'absolute', left: 0, top: 960, width: 1080, height: 520, overflow: 'hidden'}}>
			<Img src={staticFile('matieres/ecailles-graoully.png')} style={{position: 'absolute', left: -700, top: -180, width: 3000, height: 1000}} />
		</div>
	</AbsoluteFill>
);

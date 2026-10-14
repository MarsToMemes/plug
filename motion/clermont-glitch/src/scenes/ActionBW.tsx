import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {F, P, clamp} from '../theme';

// Temps 6 (f76–91) : photo noir et blanc cadrée entre deux bandes sombres, numéro en case blanche, chiffres qui tombent.
const Tiny: React.FC<{y: number; items: string[]}> = ({y, items}) => (
	<div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'space-around', fontFamily: F.small, fontWeight: 500, fontSize: 14, letterSpacing: '0.6em', color: P.white}}>
		{items.map((t, i) => (
			<span key={i}>{t}</span>
		))}
	</div>
);

export const ActionBW: React.FC<{offset: number; photo: string; number: string; city: string; role: string}> = ({offset, photo, number, city, role}) => {
	const f = useCurrentFrame() + offset;
	const framed = f < 90;
	const zoom = interpolate(f, [76, 89], [1, 1.06], clamp) * (framed ? 1 : 1.15);
	const shown = f < 88 ? number : f < 89 ? number.slice(1) || '' : '';
	return (
		<AbsoluteFill style={{background: P.ink}}>
			<div style={{position: 'absolute', left: 0, right: 0, top: framed ? 90 : 0, bottom: framed ? 150 : 0, overflow: 'hidden'}}>
				<Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0%', scale: String(zoom), translate: `${interpolate(f, [76, 89], [0, -20], clamp)}px 0px`, filter: 'grayscale(1) contrast(1.1)'}} />
			</div>
			{framed ? (
				<>
					<Tiny y={38} items={[city, role, city]} />
					<Tiny y={1010} items={[city, role, city, role]} />
				</>
			) : null}
			{f < 90 ? (
				<div style={{position: 'absolute', left: '50%', top: 470, translate: '-50% -50%', display: 'flex', gap: 8}}>
					{number.split('').map((d, i) => (
						<div key={i} style={{width: 120, height: 160, background: P.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.big, fontWeight: 700, fontSize: 150, lineHeight: 1, color: P.ink}}>
							{shown.length === number.length || i >= number.length - shown.length ? (f >= 89 ? '' : d) : ''}
						</div>
					))}
				</div>
			) : (
				<div style={{position: 'absolute', left: 500, top: 466, width: 80, height: 6, background: P.white}} />
			)}
		</AbsoluteFill>
	);
};

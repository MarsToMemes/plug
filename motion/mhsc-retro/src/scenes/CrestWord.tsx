import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../fx/Grain';
import {HalftoneDefs} from '../fx/Halftone';
import {F, Palette, clamp} from '../theme';

// Scène 2 (f40–74) : écusson en filigrane, mot lettre par lettre puis poussée, stroboscope de couleur.
const STROBE = new Set([46, 47, 48, 50, 57, 64, 71]); // mot entier en CHAUD

export const CrestWord: React.FC<{word: string; city: string; clubShort: string; P: Palette}> = ({word, city, clubShort, P}) => {
	const f = useCurrentFrame() + 40; // numéros d'image de la vidéo entière
	const n = word.length;
	// largeur du mot ≈ 880 px à l'échelle 1 quelle que soit sa longueur (560 px de police pour 4 lettres)
	const FS = Math.min(560, 2150 / n);
	const mid = Math.floor(n / 2);
	// apparition : f41 lettre centrale, f42 lettres centrales, f43 mot complet (cf. timeline.md)
	const visible = (i: number) => (f >= 43 ? true : f === 42 ? Math.abs(i - mid) <= 1 : f === 41 ? i === mid : false);
	const bg = f === 41 || f === 43 ? P.hot : P.dark;
	const letterColor = (i: number) => {
		if (f === 41) return P.cream;
		if (f === 42) return P.hot;
		if (f === 43) return i === mid ? P.dark : P.cream;
		if (f <= 45) return Math.abs(i - mid) <= 1 && i !== mid ? P.hot : P.cream;
		return STROBE.has(f) ? P.hot : P.cream;
	};
	const scale = f < 65 ? interpolate(f, [44, 64], [1, 1.12], clamp) : interpolate(f, [65, 73], [1.25, 1.35], clamp);
	const slide = f >= 74 ? -250 : 0;
	const tracking = interpolate(f, [44, 60], [0.2, 0.8], clamp);
	const small = (text: string, y: number) =>
		f < 65 ? (
			<div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: F.small, fontWeight: 600, fontSize: 20, letterSpacing: `${tracking}em`, color: P.cream}}>
				{text}
			</div>
		) : null;
	return (
		<AbsoluteFill style={{background: bg}}>
			{/* écusson ton sur ton : on teinte la silhouette de l'écusson avec une couleur proche du fond */}
			<div
				style={{
					position: 'absolute',
					left: 90,
					top: 90,
					width: 1020,
					height: 1020,
					background: bg === P.dark ? '#1a3a74' : '#ec7838',
					opacity: 0.45,
					WebkitMaskImage: `url(${staticFile('club/ecusson-mono.png')})`,
					WebkitMaskSize: 'contain',
					maskImage: `url(${staticFile('club/ecusson-mono.png')})`,
					maskSize: 'contain',
				}}
			/>
			{small(city, 236)}
			{small(clubShort, 946)}
			{f >= 41 ? (
				<svg viewBox="0 0 1200 1200" width={1200} height={1200} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					<defs>
						<HalftoneDefs id="cw-dots" color={P.hot} size={10} r={3} />
					</defs>
					<g transform={`translate(${600 + slide} 580) scale(${scale}) translate(-600 -580)`}>
						{/* ombre en trame, puis lettres */}
						{[true, false].map((shadow) => (
							<text
								key={String(shadow)}
								x={600 + (shadow ? 12 : 0)}
								y={775 + (shadow ? 12 : 0)}
								textAnchor="middle"
								fontFamily={F.cond}
								fontWeight={900}
								fontSize={FS}
								letterSpacing={6}
								opacity={shadow ? 0.7 : 1}
							>
								{word.split('').map((ch, i) => (
									<tspan key={i} fill={shadow ? (visible(i) ? 'url(#cw-dots)' : 'transparent') : visible(i) ? letterColor(i) : 'transparent'}>
										{ch}
									</tspan>
								))}
							</text>
						))}
					</g>
				</svg>
			) : null}
			<Grain id="crest" dark={P.dark} light={P.cream} />
		</AbsoluteFill>
	);
};

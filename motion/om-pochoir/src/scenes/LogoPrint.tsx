import React from 'react';
import {AbsoluteFill, Img, interpolate, random} from 'remotion';
import {Backdrop, Grain, Pochoir} from '../fx';
import {P, TEX, clamp} from '../theme';

// Temps 1 (f0–53) : logo imprimé sur béton — poussée, coupe sèche (f14), coulure, saturation, flash (f48), plan serré.
export const LogoPrint: React.FC<{f: number; overlay?: React.ReactNode}> = ({f, overlay}) => {
	let s: number, tx: number, ty: number, rot: number;
	if (f < 14) {
		s = interpolate(f, [0, 13], [1, 1.12]);
		tx = interpolate(f, [0, 13], [0, 20]);
		ty = 0;
		rot = 0;
	} else if (f < 50) {
		s = interpolate(f, [14, 16, 36, 49], [1.35, 1.35, 1.5, 1.55], clamp);
		tx = -40;
		ty = -60;
		rot = interpolate(f, [16, 49], [-3, 2], clamp);
	} else {
		s = 2.25;
		tx = -60;
		ty = -40;
		rot = 2;
	}
	const drip = interpolate(f, [26, 36, 49], [0, 70, 80], clamp);
	const hot = interpolate(f, [38, 44, 46], [0, 1, 1], clamp);
	const shake = f >= 38 && f <= 46 ? [(random(`sx${f}`) - 0.5) * 12, (random(`sy${f}`) - 0.5) * 12] : [0, 0];
	const blur = f >= 50 ? 3 : 0;
	const size = 540;
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Backdrop src={TEX.beton} dx={f * 0.4} filter={`brightness(${1 + hot * 0.25})`} />
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="coulure" x="-10%" y="-10%" width="120%" height="140%">
					<feImage href={TEX.coulure} result="m" x={0} y={0} width={size} height={size} preserveAspectRatio="none" />
					<feDisplacementMap in="SourceGraphic" in2="m" scale={drip} xChannelSelector="R" yChannelSelector="G" />
				</filter>
			</svg>
			<AbsoluteFill
				style={{
					translate: `${tx + shake[0]}px ${ty + shake[1]}px`,
					scale: `${s}`,
					rotate: `${rot}deg`,
					filter: blur ? `blur(${blur}px)` : undefined,
				}}
			>
				<div style={{position: 'absolute', left: 540 - size / 2, top: 640 - size / 2, width: size, height: size}}>
					<div style={{filter: drip > 1 ? 'url(#coulure)' : undefined}}>
						<Pochoir id="logo" f={f} rough={5} grainScale={420} overspray={0.6}>
							<Img
								src={TEX.logo}
								style={{
									width: size,
									height: size,
									display: 'block',
									filter: `brightness(${1 + hot * 0.35}) saturate(${1 + hot * 0.5}) drop-shadow(0 0 ${hot * 14}px ${P.inkHot})`,
								}}
							/>
						</Pochoir>
					</div>
				</div>
			</AbsoluteFill>
			{/* flash une image */}
			{f === 48 && <AbsoluteFill style={{background: P.inkWash, mixBlendMode: 'screen', opacity: 0.75}} />}
			{overlay}
			<Grain f={f} />
		</AbsoluteFill>
	);
};


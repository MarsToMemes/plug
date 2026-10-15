import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring} from 'remotion';
import {Grain, Mask} from '../fx';
import {VictoireProps} from '../props';
import {F, P, TEX, clamp} from '../theme';

// Temps 4 (f176–198) : une lettre géante du nom par image (à l'envers), mot géant qui défile, logo qui se retourne.
export const Giant: React.FC<{p: VictoireProps; f: number}> = ({p, f}) => {
	const rev = p.name.split('').reverse();
	const k = f - 176;
	const dark = k < rev.length;
	const letter = dark ? rev[k] : p.name[(k - rev.length) % p.name.length];
	const pal = dark
		? k % 2 === 0
			? {bg: P.night, fg: P.red, word: P.redDeep}
			: {bg: P.red, fg: P.redDeep, word: P.night}
		: k % 2 === 0
			? {bg: '#EDEDEF', fg: P.red, word: '#9A9AA2'}
			: {bg: '#CFCFD4', fg: P.white, word: P.red};
	const flip = spring({frame: f - 176, fps: 30, config: {damping: 11, stiffness: 110}});
	const rot = interpolate(flip, [0, 1], [86, 0]);
	const size = f < 184 ? 430 : interpolate(f, [184, 192, 198], [430, 320, 150], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const cy = interpolate(f, [192, 198], [470, 330], {...clamp, easing: Easing.in(Easing.cubic)});
	const bgBlur = interpolate(f, [191, 198], [0, 18], clamp);
	const h = size * (1489 / 1280);
	return (
		<AbsoluteFill style={{background: pal.bg, overflow: 'hidden'}}>
			<AbsoluteFill style={{filter: bgBlur > 0.3 ? `blur(${bgBlur}px)` : undefined}}>
				<div style={{position: 'absolute', left: -60, top: -170, fontFamily: F.black, fontSize: 1150, lineHeight: 1, color: pal.fg}}>{letter}</div>
				{!dark && <div style={{position: 'absolute', left: 620, top: 0, width: 150, height: 1080, background: '#5F5F66', opacity: 0.85}} />}
				<div
					style={{
						position: 'absolute',
						left: 40 - k * 70,
						top: 640,
						fontFamily: F.black,
						fontSize: 560,
						lineHeight: 1,
						whiteSpace: 'nowrap',
						color: pal.word,
					}}
				>
					{p.word}
				</div>
			</AbsoluteFill>
			{/* logo qui se retourne : tranche dorée (silhouettes empilées) + face */}
			<div style={{position: 'absolute', left: 540 - size / 2, top: cy - h / 2, width: size, height: h, perspective: 1200}}>
				<div style={{position: 'absolute', inset: 0, transform: `rotateX(${rot}deg)`, transformStyle: 'preserve-3d'}}>
					{Array.from({length: 7}).map((_, i) => (
						<Mask
							key={i}
							src={TEX.silhouette}
							w={size}
							h={h}
							color={i < 3 ? '#8A5E16' : '#C88C28'}
							style={{position: 'absolute', left: 0, top: 0, transform: `translateZ(${-(7 - i) * 1.6}px)`}}
						/>
					))}
					<Img src={TEX.logo} style={{position: 'absolute', left: 0, top: 0, width: size, height: h, transform: 'translateZ(0px)', filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.45))'}} />
				</div>
			</div>
			<Grain f={f} opacity={0.06} />
		</AbsoluteFill>
	);
};

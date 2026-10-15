import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Backdrop, DiagonalText, Grain, Pochoir} from '../fx';
import {GrungeProps} from '../props';
import {F, P, TEX, clamp, fit} from '../theme';

const BLOCK = {x: 110, y: 400, w: 860};

// Une lettre qui naît en ondulant, précédée d'un fantôme décalé qui la rejoint.
const BuildLetter: React.FC<{c: string; f: number; t0: number; id: string}> = ({c, f, t0, id}) => {
	if (f < t0 - 2) return <span style={{opacity: 0}}>{c}</span>;
	const amp = interpolate(f, [t0, t0 + 4], [38, 0], clamp);
	const sy = interpolate(f, [t0, t0 + 4], [1.4, 1], clamp);
	const ghost = interpolate(f, [t0 - 2, t0 + 3], [1, 0], clamp);
	const shown = f >= t0;
	return (
		<span style={{position: 'relative', display: 'inline-block'}}>
			{amp > 0.5 && (
				<svg width={0} height={0} style={{position: 'absolute'}}>
					<filter id={`wave-${id}`} x="-30%" y="-30%" width="160%" height="160%">
						<feTurbulence type="fractalNoise" baseFrequency="0.006 0.035" numOctaves={1} seed={id.length * 7 + t0} />
						<feDisplacementMap in="SourceGraphic" scale={amp} xChannelSelector="R" yChannelSelector="G" />
					</filter>
				</svg>
			)}
			{ghost > 0 && (
				<span style={{position: 'absolute', left: 0, top: 0, opacity: 0.4 * ghost, filter: 'brightness(0.7)', translate: `${45 * ghost}px ${30 * ghost}px`}}>
					{c}
				</span>
			)}
			<span
				style={{
					display: 'inline-block',
					opacity: shown ? 1 : 0,
					scale: `1 ${sy}`,
					transformOrigin: '50% 100%',
					filter: amp > 0.5 ? `url(#wave-${id})` : undefined,
				}}
			>
				{c}
			</span>
		</span>
	);
};

// Temps 2–4 (f54–187) : le mot se construit, flash blanc, rotation, pop surexposé, sortie.
export const WordBlock: React.FC<{p: GrungeProps; f: number}> = ({p, f}) => {
	const s1 = fit(p.club, F.cond, BLOCK.w);
	const s2 = fit(p.word, F.cond, BLOCK.w);
	// état du bloc
	let color = P.ink;
	let blur = 0;
	let scale = 1;
	let rot = -4;
	let sy = 1;
	let tx = 0;
	let glow = 0;
	if (f >= 74 && f <= 82) {
		color = P.white;
		blur = interpolate(f, [74, 77, 82], [6, 12, 4], clamp);
	}
	if (f >= 84 && f < 114) {
		rot = interpolate(f, [84, 109], [-4, -8], clamp);
		scale = interpolate(f, [84, 109], [1, 1.05], clamp);
		sy = interpolate(f, [110, 111, 112], [1, 0.82, 1], clamp);
	}
	if (f >= 114) {
		const t = interpolate(f, [114, 122, 132, 183], [0, 0, 1, 1], clamp);
		color = f < 124 ? P.inkHot : P.ink;
		glow = f < 124 ? 1 : interpolate(f, [124, 132], [1, 0], clamp);
		blur = interpolate(f, [114, 122, 132], [16, 16, 0], clamp);
		scale = f < 124 ? 1.25 : interpolate(f, [124, 132, 183], [1.25, 1.45, 1.55], {...clamp, easing: Easing.out(Easing.quad)});
		rot = interpolate(f, [114, 132, 183], [-8, -2, -4], clamp) + t * 0;
		tx = interpolate(f, [184, 187], [0, -320], {...clamp, easing: Easing.in(Easing.quad)});
		if (f >= 184) blur = 10;
	}
	const bgCanvas = f < 64;
	const l1 = p.club.split('');
	const l2 = p.word.split('');
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			{bgCanvas ? (
				<Backdrop src={TEX.toile} dx={-f * 0.3} />
			) : (
				<>
					<Backdrop src={TEX.orageGris} dx={-f * 0.5} dy={-f * 0.2} filter={`brightness(${f >= 74 && f <= 82 ? 0.75 : 0.6}) contrast(1.1)`} />
					<DiagonalText text={`${p.club} ${p.word}`} shift={-(f - 64) * 2.2} />
				</>
			)}
			<AbsoluteFill
				style={{
					translate: `${tx}px 0`,
					scale: `${scale} ${scale * sy}`,
					rotate: `${rot}deg`,
					transformOrigin: '50% 45%',
					filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
				}}
			>
				<div style={{position: 'absolute', left: BLOCK.x, top: BLOCK.y, width: BLOCK.w}}>
					<Pochoir id="bloc" f={f} rough={4} grainScale={360} overspray={0.7}>
						<div
							style={{
								fontFamily: F.cond,
								color,
								lineHeight: 0.98,
								whiteSpace: 'nowrap',
								filter: glow > 0 ? `drop-shadow(0 0 ${24 * glow}px ${P.inkHot})` : undefined,
							}}
						>
							<div style={{fontSize: s1}}>
								{l1.map((c, i) => (
									<BuildLetter key={i} c={c} f={f} t0={54 + i * 2} id={`a${i}`} />
								))}
							</div>
							<div style={{fontSize: s2, marginTop: -s2 * 0.06}}>
								{l2.map((c, i) => (
									<BuildLetter key={i} c={c} f={f} t0={56 + i * 2} id={`b${i}`} />
								))}
							</div>
						</div>
					</Pochoir>
				</div>
			</AbsoluteFill>
			{f >= 74 && f <= 82 && <AbsoluteFill style={{background: '#FFFFFF', mixBlendMode: 'overlay', opacity: 0.25}} />}
			<Grain f={f} />
		</AbsoluteFill>
	);
};

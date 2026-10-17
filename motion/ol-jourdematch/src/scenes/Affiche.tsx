import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring} from 'remotion';
import {Silhouette, Stars3, starPoints} from '../fx';
import {JdmProps} from '../props';
import {F, P, TEX, clamp, fit} from '../theme';

const BigStar: React.FC<{x: number; y: number; r: number; rot: number; tilt: number}> = ({x, y, r, rot, tilt}) => (
	<div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, perspective: 1200}}>
		<svg width={r * 2} height={r * 2} style={{transform: `rotateX(${tilt}deg) rotateZ(${rot}deg)`}}>
			<defs>
				<linearGradient id={`st${x}`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor={P.navyLight} stopOpacity={0.75} />
					<stop offset="1" stopColor={P.navyLight} stopOpacity={0.25} />
				</linearGradient>
			</defs>
			<polygon points={starPoints(r)} fill={`url(#st${x})`} />
		</svg>
	</div>
);

// Temps 5–6 (f60–114) : affiche du match sur étoiles, noms qui s'écartent, logos en silhouette, trait → bande → rose.
export const Affiche: React.FC<{p: JdmProps; f: number}> = ({p, f}) => {
	const size = 48;
	const sp = spring({frame: f - 61, fps: 24, config: {damping: 15}});
	const yClub = 960 - 70 - sp * 120;
	const yAdv = 960 + 50 + sp * 160;
	const logos = interpolate(f, [62, 68], [0, 1], clamp);
	const band = f < 104 ? 0 : interpolate(f, [104, 106, 111], [4, 4, 120], {...clamp, easing: Easing.in(Easing.quad)});
	const rot = (f - 60) * 0.2;
	const advSize = fit(p.adversaryShort, F.wide, 620);
	const text: React.CSSProperties = {position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: F.wideBold, fontSize: size, color: P.white, letterSpacing: '0.04em', whiteSpace: 'nowrap'};
	if (f >= 112) {
		// lavis rose : la bande a tout rempli, textes dédoublés
		const sq = interpolate(f, [112, 114], [260, 60], clamp);
		return (
			<AbsoluteFill style={{background: `linear-gradient(${P.pink}, #EFB8C9)`}}>
				<div style={{position: 'absolute', left: 0, right: 0, top: 905 - sq / 2, height: sq, background: P.redHot, opacity: 0.55}} />
				{[0, 1].map((k) => (
					<React.Fragment key={k}>
						<div style={{...text, top: 770 + k * 10, color: P.redHot, opacity: k ? 0.35 : 0.8}}>{p.club}</div>
						<div style={{...text, top: 1130 + k * 10, color: P.redHot, opacity: k ? 0.35 : 0.8}}>{p.adversary}</div>
					</React.Fragment>
				))}
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill style={{background: P.navy, overflow: 'hidden'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, #1A2E6A, transparent 70%)'}} />
			<BigStar x={760} y={520} r={620} rot={18 + rot} tilt={40} />
			<BigStar x={180} y={1500} r={520} rot={-12 - rot} tilt={50} />
			<BigStar x={980} y={1700} r={380} rot={30 + rot} tilt={35} />
			{/* logos en silhouette rouge derrière les noms */}
			<div style={{position: 'absolute', left: 540 - 160, top: yClub - 150, opacity: logos, scale: `${0.9 + 0.1 * logos}`}}>
				<Silhouette src={TEX.lion} w={320} h={326} color={P.redHot} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: yAdv - advSize * 0.3,
					textAlign: 'center',
					fontFamily: F.wide,
					fontSize: advSize,
					lineHeight: 1,
					color: 'transparent',
					WebkitTextStroke: `4px ${P.redHot}`,
					opacity: logos,
					scale: `${0.9 + 0.1 * logos}`,
				}}
			>
				{p.adversaryShort}
			</div>
			<div style={{...text, top: yClub}}>{p.club}</div>
			<div style={{...text, top: 960 - 24, opacity: f >= 61 ? 1 : 0}}>VS</div>
			<div style={{...text, top: yAdv}}>{p.adversary}</div>
			<Stars3 color={P.white} lit={interpolate(f, [62, 70], [0, 3], clamp)} style={{left: 532, top: 210}} />
			<Stars3 color={P.white} lit={interpolate(f, [64, 72], [0, 3], clamp)} style={{left: 532, top: 1640}} />
			{band > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 905 - band / 2, height: band, background: P.redHot}} />}
		</AbsoluteFill>
	);
};

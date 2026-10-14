import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Grain, Logo, Topo} from '../fx';
import {CinemaGoalProps} from '../props';
import {FONT, P, clamp} from '../theme';

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

// Barre latérale type HUD : trait vertical + graduations, tracée par strokeDashoffset.
const Hud: React.FC<{x: number; draw: number; label: string; flip?: boolean}> = ({x, draw, label, flip}) => (
	<div style={{position: 'absolute', left: x - 30, top: 220, width: 60, height: 540}}>
		<svg width={60} height={540} style={{position: 'absolute', scale: flip ? '-1 1' : undefined}}>
			<line x1={30} y1={10} x2={30} y2={530} stroke={P.club} strokeWidth={4} strokeDasharray={520} strokeDashoffset={520 * (1 - draw)} />
			{Array.from({length: 11}).map((_, i) => (
				<line key={i} x1={30} y1={10 + i * 52} x2={i % 5 === 0 ? 52 : 42} y2={10 + i * 52} stroke={P.club} strokeWidth={2} opacity={draw > i / 11 ? 1 : 0} />
			))}
		</svg>
		<div
			style={{
				position: 'absolute',
				left: flip ? -4 : 40,
				top: 120,
				writingMode: 'vertical-rl',
				rotate: '180deg',
				fontFamily: FONT.small,
				fontWeight: 600,
				fontSize: 11,
				letterSpacing: 5,
				color: '#8FA3B8',
				opacity: draw,
			}}
		>
			{label}
		</div>
	</div>
);

// Temps 9 (f188–282) : plan final, joueur avec traînée de copies fantômes (imitation de la traînée stroboscopique).
export const FinalScene: React.FC<{p: CinemaGoalProps; from: number}> = ({p, from}) => {
	const f = useCurrentFrame() + from;
	const duo = interpolate(f, [188, 195], [1, 0], clamp);
	const flash = interpolate(f, [192, 193, 196], [0, 0.85, 0], clamp);
	const focus = interpolate(f, [188, 194, 195, 202], [2, 2, 10, 0], {...clamp, easing: Easing.out(Easing.quad)});
	const cx = interpolate(f, [188, 282], [880, 1010], clamp);
	const trail = interpolate(f, [203, 214], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const draw = interpolate(f, [203, 210], [0, 1], clamp);
	const textIn = interpolate(f, [196, 204], [0, 1], clamp);
	const s = 0.6;
	const geo = (dx: number): React.CSSProperties => ({
		position: 'absolute',
		width: 1763 * s,
		height: 1753 * s,
		left: cx - 960 * s + dx,
		top: 40,
	});
	const [d0, d1, d2] = [hex(P.night), hex(P.club), hex(P.glow)];
	const table = (k: number) => `${d0[k]} ${d1[k]} ${d2[k]}`;
	return (
		<AbsoluteFill style={{background: P.night}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="duo">
					<feColorMatrix type="saturate" values="0" />
					<feComponentTransfer>
						<feFuncR type="table" tableValues={table(0)} />
						<feFuncG type="table" tableValues={table(1)} />
						<feFuncB type="table" tableValues={table(2)} />
					</feComponentTransfer>
				</filter>
			</svg>
			<AbsoluteFill style={{filter: duo > 0.01 ? 'url(#duo)' : undefined}}>
				{/* fond : la photo d'origine, très sombre et bleutée */}
				<Img src={staticFile(p.actionPlate)} style={{position: 'absolute', width: 2200, height: 2188, left: -140, top: -500, filter: 'blur(18px) brightness(0.35) saturate(0.4)'}} />
				<AbsoluteFill style={{background: P.night, mixBlendMode: 'color', opacity: 0.7}} />
				<AbsoluteFill style={{background: `radial-gradient(ellipse at 55% 45%, transparent, ${P.night} 75%)`}} />
				<Topo opacity={0.05} />
				{/* nom en contour derrière le joueur */}
				<div
					style={{
						position: 'absolute',
						left: 560,
						top: 250,
						fontFamily: FONT.black,
						fontWeight: 900,
						fontSize: 300,
						lineHeight: 1,
						letterSpacing: 8,
						color: 'transparent',
						WebkitTextStroke: '2px #59626E',
						opacity: textIn,
						whiteSpace: 'nowrap',
					}}
				>
					{p.lastName}
				</div>
				{/* copies fantômes aux positions précédentes */}
				{[5, 4, 3, 2, 1].map((k) => (
					<Img
						key={k}
						src={staticFile(p.actionPhoto)}
						style={{
							...geo(-k * 62 * trail),
							top: 40 + k * 3 * trail,
							opacity: trail * (0.36 - k * 0.06),
							mixBlendMode: 'screen',
							filter: `grayscale(1) sepia(1) hue-rotate(170deg) saturate(3.5) brightness(${0.75 - k * 0.05}) blur(${k * 0.8}px)`,
						}}
					/>
				))}
				<Img src={staticFile(p.actionPhoto)} style={{...geo(0), filter: `blur(${focus}px) contrast(1.1) brightness(0.97)`}} />
				<AbsoluteFill style={{background: `linear-gradient(transparent 70%, ${P.night})`}} />
			</AbsoluteFill>
			{duo > 0 && <AbsoluteFill style={{background: P.club, mixBlendMode: 'soft-light', opacity: duo * 0.6}} />}
			<Hud x={60} draw={draw} label={`${p.clubTop} ${p.clubBottom}`} />
			<Hud x={1860} draw={draw} label={`${p.number} · ${p.position}`} flip />
			{/* bloc slogan en bas au centre */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 990,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 18,
					opacity: textIn,
				}}
			>
				<Logo size={46} color={P.white} kind="plein" />
				<div style={{fontFamily: FONT.blackItalic, fontStyle: 'italic', fontWeight: 900, fontSize: 46, letterSpacing: 3, color: P.white}}>
					{p.slogan.top} <span style={{color: P.gold, fontSize: 30}}>{p.slogan.link}</span> {p.slogan.bottom}
				</div>
			</div>
			<AbsoluteFill style={{background: P.glow, mixBlendMode: 'screen', opacity: flash}} />
			<Grain />
		</AbsoluteFill>
	);
};

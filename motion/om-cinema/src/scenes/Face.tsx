import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Brush, Grain, Logo, Topo} from '../fx';
import {CinemaGoalProps} from '../props';
import {FONT, P, clamp} from '../theme';
import {GlowNumber} from './Number';

const ANG = (60 * Math.PI) / 180;
const D = {x: Math.cos(ANG), y: -Math.sin(ANG)}; // direction de l'entaille
const N = {x: Math.sin(ANG), y: Math.cos(ANG)}; // normale

const stripe = (cx: number, hw: number) => {
	const L = 2000;
	const pts = [
		[cx - L * D.x - hw * N.x, 540 - L * D.y - hw * N.y],
		[cx + L * D.x - hw * N.x, 540 + L * D.y - hw * N.y],
		[cx + L * D.x + hw * N.x, 540 + L * D.y + hw * N.y],
		[cx - L * D.x + hw * N.x, 540 - L * D.y + hw * N.y],
	];
	return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`;
};

// Temps 7 (f125–166) : gros plan visage révélé par deux entailles diagonales.
export const FaceScene: React.FC<{p: CinemaGoalProps; from: number}> = ({p, from}) => {
	const f = useCurrentFrame() + from;
	const hw = interpolate(f, [125, 127, 134], [0, 70, 1500], {...clamp, easing: Easing.in(Easing.quad)});
	const push = interpolate(f, [125, 166], [1, 1.07], clamp);
	const sweep = interpolate(f, [136, 158], [-0.6, 1.4], clamp);
	const gel = interpolate(f, [162, 166], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const fadeIn = interpolate(f, [133, 138], [0, 1], clamp);

	const s = 1.28 * push;
	const geo: React.CSSProperties = {
		position: 'absolute',
		width: 806 * s,
		height: 1242 * s,
		left: 930 - 330 * s,
		top: 420 - 300 * s,
	};
	const portrait = (
		<AbsoluteFill style={{background: `radial-gradient(ellipse at 48% 40%, ${P.clubDark}, ${P.deep} 45%, ${P.night} 85%)`}}>
			<Topo opacity={0.07} drift={f * 0.5} />
			<Img src={staticFile(p.facePhoto)} style={{...geo, filter: 'contrast(1.08) saturate(0.95) drop-shadow(0 0 50px rgba(14,104,172,0.45))'}} />
			{/* balayage de lumière sur le joueur seulement (masque = détourage) */}
			<div
				style={{
					...geo,
					WebkitMaskImage: `url(${staticFile(p.facePhoto)})`,
					WebkitMaskSize: '100% 100%',
					background: `linear-gradient(105deg, transparent ${sweep * 100 - 25}%, ${P.glow}aa ${sweep * 100}%, transparent ${sweep * 100 + 25}%)`,
					mixBlendMode: 'soft-light',
				}}
			/>
			<AbsoluteFill style={{background: `linear-gradient(transparent 60%, ${P.night}dd)`}} />
			{/* gel de couleur bleu qui envahit la moitié gauche en diagonale */}
			<AbsoluteFill
				style={{
					background: `linear-gradient(120deg, ${P.clubLight} 0%, ${P.club} ${20 + gel * 30}%, transparent ${30 + gel * 40}%)`,
					mixBlendMode: 'hard-light',
					opacity: gel * 0.85,
				}}
			/>
		</AbsoluteFill>
	);
	const revealed = f >= 134;
	return (
		<AbsoluteFill style={{background: P.club}}>
			{!revealed && <Topo opacity={0.15} />}
			{revealed ? (
				portrait
			) : (
				<>
					{[620, 1260].map((cx) => (
						<AbsoluteFill key={cx} style={{clipPath: stripe(cx, hw)}}>
							{portrait}
						</AbsoluteFill>
					))}
					{[620, 1260].flatMap((cx) =>
						[-1, 1].map((sg) => (
							<Brush
								key={`${cx}${sg}`}
								x={cx + sg * hw * N.x - 1100}
								y={540 + sg * hw * N.y - 60}
								w={2200}
								h={120}
								color={sg < 0 ? P.clubLight : P.club}
								variant={sg < 0 ? 0 : 2}
								rotate={-60}
							/>
						)),
					)}
				</>
			)}
			{/* habillage */}
			<div style={{opacity: fadeIn}}>
				<Brush x={-180} y={60} w={620} h={70} color={P.club} variant={1} rotate={-30} />
				<GlowNumber text={p.number} size={300} style={{left: 1560, top: 750}} />
				<div style={{position: 'absolute', left: 70, top: 900}}>
					<Logo size={110} color={P.white} kind="contour" />
				</div>
				{[52, 1030].map((y) => (
					<div
						key={y}
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: y,
							textAlign: 'center',
							fontFamily: FONT.small,
							fontWeight: 600,
							fontSize: 14,
							letterSpacing: 7,
							color: '#C9D3DE',
						}}
					>
						{`${p.clubTop} ${p.clubBottom}  ·  ${p.season}`}
					</div>
				))}
			</div>
			<Grain />
		</AbsoluteFill>
	);
};

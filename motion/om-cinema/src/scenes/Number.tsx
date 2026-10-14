import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Brush, DarkBg, Dots, Grain, Logo, Skyline, Ticker} from '../fx';
import {CinemaGoalProps} from '../props';
import {FONT, P, clamp} from '../theme';

// Numéro lumineux : halo, cœur surexposé, bord net en option.
export const GlowNumber: React.FC<{text: string; size: number; intensity?: number; style?: React.CSSProperties}> = ({
	text,
	size,
	intensity = 1,
	style,
}) => {
	const base: React.CSSProperties = {
		position: 'absolute',
		left: 0,
		top: 0,
		fontFamily: FONT.black,
		fontWeight: 900,
		fontSize: size,
		lineHeight: 1,
		whiteSpace: 'nowrap',
	};
	return (
		<div style={{position: 'absolute', ...style}}>
			<div style={{...base, color: P.club, filter: `blur(${size * 0.045}px)`, opacity: 0.95}}>{text}</div>
			<div style={{...base, color: P.clubLight, filter: `blur(${size * 0.02}px)`, opacity: 0.9}}>{text}</div>
			<div style={{...base, color: P.glow, filter: `blur(${size * 0.012}px) brightness(${1.2 * intensity})`, WebkitTextStroke: `${size * 0.02}px transparent`, scale: '0.97', transformOrigin: '50% 55%'}}>
				{text}
			</div>
		</div>
	);
};

// Temps 5 (f91–111) : numéro qui irradie.
export const NumberScene: React.FC<{p: CinemaGoalProps; from: number}> = ({p, from}) => {
	const f = useCurrentFrame() + from;
	const push = interpolate(f, [91, 106], [1, 1.05], clamp);
	const burn = interpolate(f, [106, 111], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const stack = Math.min(4, Math.floor((f - 91) / 4) + 1);
	const last = p.number.slice(-1);
	return (
		<AbsoluteFill style={{filter: `brightness(${1 + burn * 1.2})`}}>
			<DarkBg drift={f * 0.6} topo={0.09} />
			<AbsoluteFill style={{scale: `${push}`}}>
				<GlowNumber text={p.number} size={1400} intensity={1 + burn} style={{left: -60, top: -230}} />
				{/* dernier chiffre en contour net, décalé à droite */}
				<div
					style={{
						position: 'absolute',
						left: 640,
						top: -150,
						fontFamily: FONT.black,
						fontWeight: 900,
						fontSize: 1300,
						lineHeight: 1,
						color: 'transparent',
						WebkitTextStroke: '3px #A7ADB5',
					}}
				>
					{last}
				</div>
				{/* ville en italique contour, empilée */}
				{Array.from({length: stack}).map((_, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 1250,
							top: 230 + i * 118,
							fontFamily: FONT.blackItalic,
							fontStyle: 'italic',
							fontWeight: 900,
							fontSize: 150,
							lineHeight: 1,
							color: 'transparent',
							WebkitTextStroke: '2px #4A5059',
							letterSpacing: 6,
						}}
					>
						{p.city}
					</div>
				))}
				<Dots n={2} x={1780} y={160} />
			</AbsoluteFill>
			<Ticker text={`${p.city}   ${p.clubTop} ${p.clubBottom}`} y={0} x={14} vertical speed={2} size={13} color="#6B7178" />
			{/* la lumière brûle la moitié gauche */}
			<AbsoluteFill style={{background: `linear-gradient(90deg, ${P.glow}, ${P.glow}00 60%)`, mixBlendMode: 'screen', opacity: burn * 0.9}} />
			<Grain />
		</AbsoluteFill>
	);
};

// Temps 6 (f112–124) : poste du joueur.
export const PositionScene: React.FC<{p: CinemaGoalProps; from: number}> = ({p, from}) => {
	const f = useCurrentFrame() + from;
	const flash = interpolate(f, [112, 113, 115], [1, 0.8, 0], clamp);
	const thick = interpolate(f, [117, 121], [1, 1.5], {...clamp, easing: Easing.out(Easing.cubic)});
	const fill = interpolate(f, [122, 124], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const bandH = 150 * thick + fill * 700;
	const bandTop = 420 - (bandH - 150) / 2 - fill * 380;
	const video = interpolate(f, [117, 120], [0, 1], clamp);
	const corner = interpolate(f, [114, 124], [260, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	const outline: React.CSSProperties = {
		position: 'absolute',
		left: 0,
		right: 0,
		textAlign: 'center',
		fontFamily: FONT.smallBold,
		fontWeight: 700,
		fontSize: 52,
		letterSpacing: 100,
		paddingLeft: 100,
		color: 'transparent',
		WebkitTextStroke: '1.5px #5A6068',
	};
	return (
		<AbsoluteFill style={{background: P.night}}>
			{/* ville en noir et blanc */}
			<AbsoluteFill style={{background: 'linear-gradient(#1B1E23, #0B0D10)'}}>
				<Skyline color="#30343B" style={{left: 0, top: 380, width: 1920, height: 700}} />
				<Skyline color="#202328" style={{left: -500, top: 520, width: 2600, height: 560}} seed="b" />
			</AbsoluteFill>
			<div style={{position: 'absolute', right: -200 - corner, bottom: -380 - corner}}>
				<Logo size={900} color="#3A3E45" kind="plein" />
			</div>
			<Ticker text={`${p.slogan.top} ${p.slogan.link} ${p.slogan.bottom}`} y={22} speed={4} size={14} color="#9AA0A8" />
			<Dots n={3} x={1740} y={70} />
			<div style={{...outline, top: 300}}>{p.position}</div>
			<div style={{...outline, top: 620}}>{p.position}</div>
			<Brush x={250 - fill * 400} y={bandTop} w={1440 + fill * 800} h={bandH} color={P.club} variant={0}>
				{/* bande remplie d'un gros plan flou du maillot, teinté bleu */}
				<AbsoluteFill style={{opacity: video}}>
					<Img
						src={staticFile(p.celebPhoto)}
						style={{position: 'absolute', width: 2600, height: 2600, left: -500 - (f - 117) * 18, top: -1200, filter: 'blur(14px) grayscale(1) contrast(1.3)'}}
					/>
					<AbsoluteFill style={{background: P.club, mixBlendMode: 'multiply'}} />
					<AbsoluteFill style={{background: P.clubLight, mixBlendMode: 'screen', opacity: 0.25}} />
				</AbsoluteFill>
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: '50%',
						translate: '0 -50%',
						textAlign: 'center',
						fontFamily: FONT.smallBold,
						fontWeight: 700,
						fontSize: 52,
						letterSpacing: 100,
						paddingLeft: 100,
						color: P.white,
						opacity: 1 - fill,
					}}
				>
					{p.position}
				</div>
			</Brush>
			<AbsoluteFill style={{background: P.glow, mixBlendMode: 'screen', opacity: flash}} />
			<Grain />
		</AbsoluteFill>
	);
};

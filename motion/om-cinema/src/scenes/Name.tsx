import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Grain, Logo, Skyline, Ticker, Topo} from '../fx';
import {CinemaGoalProps} from '../props';
import {FONT, P, TEX, clamp} from '../theme';

const SloganBlock: React.FC<{p: CinemaGoalProps; size: number; style?: React.CSSProperties}> = ({p, size, style}) => {
	const t: React.CSSProperties = {fontFamily: FONT.blackItalic, fontStyle: 'italic', fontWeight: 900, lineHeight: 0.92, color: P.white};
	return (
		<div style={{position: 'absolute', ...style}}>
			<div style={{...t, fontSize: size}}>{p.slogan.top}</div>
			<div style={{...t, fontSize: size * 0.4, marginLeft: size * 0.9, color: P.gold}}>{p.slogan.link}</div>
			<div style={{...t, fontSize: size}}>{p.slogan.bottom}</div>
		</div>
	);
};

// Temps 8 (f167–187) : nom géant texturé en panoramique, puis nom moitié plein / moitié contour.
export const NameScene: React.FC<{p: CinemaGoalProps; from: number}> = ({p, from}) => {
	const f = useCurrentFrame() + from;
	if (f < 183) {
		const pan = interpolate(f, [167, 182], [-2350, -1050], {...clamp, easing: Easing.out(Easing.quad)});
		const zoom = interpolate(f, [167, 182], [1.15, 1], clamp);
		const word: React.CSSProperties = {
			position: 'absolute',
			left: 0,
			top: -240,
			whiteSpace: 'nowrap',
			fontFamily: FONT.black,
			fontWeight: 900,
			fontSize: 1380,
			lineHeight: 1,
			letterSpacing: 10,
		};
		return (
			<AbsoluteFill style={{background: `linear-gradient(100deg, ${P.deep}, ${P.clubDark} 45%, ${P.club})`}}>
				<Topo opacity={0.12} drift={f} />
				<AbsoluteFill style={{scale: `${zoom}`, transformOrigin: '50% 60%'}}>
					<div style={{position: 'absolute', left: pan, top: 0}}>
						{/* ombre portée douce, puis lettres en plâtre */}
						<div style={{...word, color: 'rgba(0,10,25,0.55)', translate: '22px 26px', filter: 'blur(14px)'}}>{p.lastName}</div>
						<div
							style={{
								...word,
								backgroundImage: `url(${TEX.platre})`,
								backgroundSize: '2048px 1024px',
								backgroundPosition: `${f * 3}px 160px`,
								WebkitBackgroundClip: 'text',
								backgroundClip: 'text',
								color: 'transparent',
							}}
						>
							{p.lastName}
						</div>
					</div>
				</AbsoluteFill>
				<Grain opacity={0.12} />
			</AbsoluteFill>
		);
	}
	const t: React.CSSProperties = {fontFamily: FONT.black, fontWeight: 900, fontSize: 196, lineHeight: 1, letterSpacing: 4};
	return (
		<AbsoluteFill style={{background: P.club}}>
			<Topo opacity={0.14} />
			<div style={{position: 'absolute', left: 0, top: 380, width: 1920, height: 700, opacity: 0.9}}>
				<Skyline color={P.clubDark} style={{left: 0, top: 0, width: 1920, height: 700}} />
			</div>
			<div style={{position: 'absolute', left: 1060, top: -120, opacity: 0.5}}>
				<Logo size={1150} color={P.deep} kind="plein" />
			</div>
			<div style={{position: 'absolute', left: 90, top: 350, display: 'flex', gap: 40, whiteSpace: 'nowrap'}}>
				<span style={{...t, color: P.white}}>{p.firstName}</span>
				<span style={{...t, color: 'transparent', WebkitTextStroke: `4px ${P.white}`}}>{p.lastName}</span>
			</div>
			<SloganBlock p={p} size={96} style={{left: 1560, top: 700}} />
			<Ticker text={`${p.slogan.top} ${p.slogan.link} ${p.slogan.bottom}`} y={24} speed={4} size={14} />
			<Ticker text={`${p.slogan.top} ${p.slogan.link} ${p.slogan.bottom}`} y={1040} speed={-4} size={14} />
			<Grain />
		</AbsoluteFill>
	);
};

export {SloganBlock};

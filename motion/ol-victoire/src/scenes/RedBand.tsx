import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring} from 'remotion';
import {Grain, Mask, decode} from '../fx';
import {VictoireProps} from '../props';
import {F, P, TEX, chrome, clamp, fit} from '../theme';

const BAND_Y = 470;
const BAND_H = 150;

// Épure technique : grand cercle, emblème gravé (silhouette du logo très pâle + rayons), réticules, pointillés.
const Blueprint: React.FC = () => (
	<>
		<svg width={1080} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
			<g stroke={P.ink} fill="none">
				<circle cx={540} cy={545} r={505} strokeWidth={1.6} opacity={0.42} />
				<circle cx={540} cy={545} r={470} strokeWidth={1} opacity={0.18} />
				{Array.from({length: 72}).map((_, i) => {
					const a = (i / 72) * Math.PI * 2;
					return (
						<line
							key={i}
							x1={540 + Math.cos(a) * 300}
							y1={545 + Math.sin(a) * 300}
							x2={540 + Math.cos(a) * 465}
							y2={545 + Math.sin(a) * 465}
							strokeWidth={1}
							opacity={0.09}
						/>
					);
				})}
				<line x1={540} y1={0} x2={540} y2={44} strokeWidth={2} opacity={0.8} />
				<line x1={540} y1={1036} x2={540} y2={1080} strokeWidth={2} opacity={0.8} />
				<line x1={0} y1={BAND_Y - 26} x2={1080} y2={BAND_Y - 26} strokeWidth={1.4} strokeDasharray="14 10" opacity={0.55} />
				<line x1={0} y1={BAND_Y + BAND_H + 34} x2={1080} y2={BAND_Y + BAND_H + 34} strokeWidth={1.4} strokeDasharray="14 10" opacity={0.55} />
				<line x1={160} y1={BAND_Y + BAND_H + 250} x2={1080} y2={BAND_Y + BAND_H + 250} strokeWidth={1.2} opacity={0.5} />
			</g>
		</svg>
		{/* emblème gravé : contour fin de la silhouette du logo (copie claire légèrement réduite par-dessus) */}
		<div style={{position: 'absolute', left: 540 - 260, top: 545 - 300, opacity: 0.22}}>
			<Mask src={TEX.silhouette} w={520} h={605} color={P.ink} />
			<Mask src={TEX.silhouette} w={520} h={605} color={P.white} style={{position: 'absolute', left: 0, top: 0, scale: '0.988'}} />
		</div>
		{/* swoosh argent flou en bas */}
		<svg width={1080} height={200} style={{position: 'absolute', left: 0, top: 900, filter: 'blur(3px)'}}>
			<defs>
				<linearGradient id="sw" x1="0" x2="1">
					<stop offset="0" stopColor="#FFFFFF" />
					<stop offset="0.5" stopColor="#8E8E96" />
					<stop offset="1" stopColor="#F4F4F6" />
				</linearGradient>
			</defs>
			<path d="M-40 170 C 300 60, 700 40, 1120 90 L 1120 130 C 700 85, 320 110, -40 200 Z" fill="url(#sw)" opacity={0.85} />
		</svg>
	</>
);

// Lettre chromée extrudée : tranche (ombres empilées), face chrome, ombre portée.
const ChromeLetter: React.FC<{c: string; size: number; sheen: number}> = ({c, size, sheen}) => {
	const depth = Array.from({length: 12})
		.map((_, i) => `${(i + 1) * 0.55}px ${(i + 1) * 1.1}px 0 ${i < 6 ? '#4F4F57' : '#2A2A30'}`)
		.join(', ');
	const base: React.CSSProperties = {position: 'absolute', left: 0, top: 0, fontFamily: F.black, fontSize: size, lineHeight: 1};
	return (
		<div style={{position: 'relative', fontFamily: F.black, fontSize: size, lineHeight: 1, color: 'transparent'}}>
			{c}
			<div style={{...base, color: 'rgba(0,0,0,0.55)', translate: '12px 20px', filter: 'blur(10px)'}}>{c}</div>
			<div style={{...base, color: '#3A3A42', textShadow: depth}}>{c}</div>
			<div style={{...base, ...chrome(sheen), WebkitTextStroke: '1px rgba(255,255,255,0.5)'}}>{c}</div>
		</div>
	);
};

// Temps 2 (f47–113)
export const RedBand: React.FC<{p: VictoireProps; f: number}> = ({p, f}) => {
	const size = fit(p.word, F.black, 900, 14);
	const letters = p.word.split('');
	const focusIdx = Math.min(3, letters.length - 1);
	// position approximative de la lettre ciblée par la macro
	const focusX = 90 + ((focusIdx + 0.5) / letters.length) * 900;
	const scale =
		f < 62
			? interpolate(f, [47, 53, 62], [6, 1.6, 1.0], {...clamp, easing: Easing.out(Easing.cubic)})
			: interpolate(f, [62, 80, 98, 113], [1.0, 1.0, 1.12, 1.06], {...clamp, easing: Easing.inOut(Easing.quad)});
	const fx = interpolate(f, [47, 60], [focusX, 540], clamp);
	const fy = BAND_Y + BAND_H / 2;
	const cross = interpolate(f, [52, 57], [1, 0], clamp);
	const sigOut = interpolate(f, [88, 92], [0, -900], {...clamp, easing: Easing.in(Easing.cubic)});
	return (
		<AbsoluteFill style={{background: P.white, overflow: 'hidden'}}>
			<AbsoluteFill style={{transformOrigin: `${fx}px ${fy}px`, scale: `${scale}`}}>
				<Blueprint />
				{/* petit trait 3 couleurs */}
				<div style={{position: 'absolute', left: 40, top: 300, display: 'flex', gap: 6}}>
					{['#B9B9C0', P.navy, P.red].map((c) => (
						<div key={c} style={{width: 34, height: 11, background: c}} />
					))}
				</div>
				{/* bande à bord cranté */}
				<div style={{position: 'absolute', left: -300, width: 1680, top: BAND_Y, height: BAND_H, background: P.red}}>
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 0,
							height: 9,
							backgroundImage: `linear-gradient(90deg, ${P.white} 50%, transparent 50%)`,
							backgroundSize: '18px 9px',
						}}
					/>
					<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(transparent 60%, rgba(0,0,0,0.18))'}} />
				</div>
				{/* lettres chromées qui se rangent */}
				<div style={{position: 'absolute', left: 0, right: 0, top: fy - size * 0.56, display: 'flex', justifyContent: 'center', gap: 14}}>
					{letters.map((c, i) => {
						const off = (random(`off${i}`) - 0.5) * 300;
						const sp = spring({frame: f - 53 - i * 2.5, fps: 30, config: {damping: 13, stiffness: 120}});
						return (
							<div key={i} style={{translate: `0 ${off * (1 - sp)}px`}}>
								<ChromeLetter c={c} size={size} sheen={interpolate(f, [47, 113], [10, 70]) + i * 4} />
							</div>
						);
					})}
				</div>
				{/* croix de visée de la macro */}
				<div style={{opacity: cross}}>
					{[
						[focusX - 70, fy + 20, P.ink],
						[focusX + 40, fy + 40, '#F08A9A'],
						[focusX + 130, fy + 50, 'rgba(229,32,46,0.5)'],
					].map(([x, y, c], i) => (
						<div key={i} style={{position: 'absolute', left: x as number, top: y as number}}>
							<div style={{position: 'absolute', left: -16, top: -3, width: 32, height: 6, background: c as string}} />
							<div style={{position: 'absolute', left: -3, top: -16, width: 6, height: 32, background: c as string}} />
						</div>
					))}
				</div>
				{/* signature qui se décode */}
				<div
					style={{
						position: 'absolute',
						right: 80,
						top: BAND_Y + BAND_H + 190,
						translate: `${sigOut}px 0`,
						fontFamily: F.wideMed,
						fontSize: 22,
						letterSpacing: '0.42em',
						color: P.ink,
						whiteSpace: 'pre',
					}}
				>
					{decode(p.fullName, f, 53, 18, 'sig')}
				</div>
			</AbsoluteFill>
			<Grain f={f} opacity={0.05} />
		</AbsoluteFill>
	);
};

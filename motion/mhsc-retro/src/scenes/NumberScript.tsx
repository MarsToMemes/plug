import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Grain} from '../fx/Grain';
import {HalftoneDefs, HalftonePatch} from '../fx/Halftone';
import {Ticker} from '../fx/Ticker';
import {F, Palette, clamp} from '../theme';

// Scène 3 (f75–109) : numéro géant, flashs de palette, surnom manuscrit qui s'écrit, bande crème qui monte.
const DARK_BG = new Set([75, 76, 78, 80]); // fond SOMBRE / numéro CHAUD ; sinon fond CHAUD / numéro SOMBRE

export const NumberScript: React.FC<{number: string; script: string; ticker: string; P: Palette}> = ({number, script, ticker, P}) => {
	const f = useCurrentFrame() + 75;
	const darkBg = DARK_BG.has(f);
	const bg = darkBg ? P.dark : P.hot;
	const num = darkBg ? P.hot : P.dark;
	const p = interpolate(f, [76, 101], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const push = interpolate(f, [81, 107], [1, 1.04], clamp);
	const band = interpolate(f, [107, 108, 109], [0, 50, 90], clamp);
	// révélation de l'écriture : bord d'attaque penché qui avance de gauche à droite sur la largeur du mot
	const W0 = 180;
	const W1 = 980;
	const edge = W0 + (W1 - W0) * p;
	return (
		<AbsoluteFill style={{background: bg}}>
			<AbsoluteFill style={{scale: String(push)}}>
				<svg viewBox="0 0 1200 1200" width={1200} height={1200} style={{position: 'absolute', inset: 0}}>
					<defs>
						<HalftoneDefs id="ns-dots" color={bg} size={12} r={4} />
						<linearGradient id="ns-fade" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor="#fff" />
							<stop offset="0.45" stopColor="#000" />
						</linearGradient>
						<mask id="ns-mask">
							<rect x={0} y={150} width={1200} height={900} fill="url(#ns-fade)" />
						</mask>
						<clipPath id="ns-write">
							<polygon points={`0,0 ${edge + 60},0 ${edge - 60},1200 0,1200`} />
						</clipPath>
					</defs>
					<text x={640} y={1040} textAnchor="middle" fontFamily={F.cond} fontWeight={900} fontSize={1220} fill={num} opacity={f === 75 ? 0.75 : 1}>
						{number}
					</text>
					{/* trame qui ronge le haut des chiffres */}
					<text x={640} y={1040} textAnchor="middle" fontFamily={F.cond} fontWeight={900} fontSize={1220} fill="url(#ns-dots)" mask="url(#ns-mask)">
						{number}
					</text>
					{f >= 76 ? (
						<g transform="rotate(-15 560 380)">
							{/* pointe de pinceau sombre qui précède l'écriture */}
							{p < 1 ? <ellipse cx={edge + 10} cy={400} rx={46} ry={14} fill={P.dark} opacity={0.85} transform={`rotate(-30 ${edge + 10} 400)`} /> : null}
							<g clipPath="url(#ns-write)">
								<text x={560} y={430} textAnchor="middle" fontFamily={F.script} fontSize={230} fill={P.cream}>
									{script}
								</text>
								{/* trait de soulignement (swash) */}
								<path d="M230 470 C 420 440, 700 440, 930 410" stroke={P.cream} strokeWidth={14} strokeLinecap="round" fill="none" />
							</g>
						</g>
					) : null}
				</svg>
				<HalftonePatch id="ns-corner" color={P.dark} x={800} y={760} w={400} h={340} from={[1, 1]} to={[0.3, 0.3]} opacity={darkBg ? 0 : 0.6} />
				<Ticker text={ticker} y={1170} color={darkBg ? P.hot : P.dark} size={26} speed={4} dir={-1} />
			</AbsoluteFill>
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: band, background: P.cream}} />
			<Grain id="number" dark={P.dark} light={P.cream} />
		</AbsoluteFill>
	);
};

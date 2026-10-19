import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Grain} from '../fx/Grain';
import {HalftoneDefs, HalftonePatch} from '../fx/Halftone';
import {Ticker} from '../fx/Ticker';
import {F, Palette, clamp, pick} from '../theme';

// Scène 1 (f0–39) : mot géant qui défile entre deux bandeaux, badge penché, inversion de palette.
const INVERT = new Set([10, 12, 14, 16]); // bande centrale SOMBRE une image sur deux
const LATE_DARK = new Set([36, 37, 38, 39]);
const BIG = 780; // taille de police du mot géant (hauteur de capitale ≈ 560 px)

const Badge: React.FC<{fill: string; sx: number; children?: React.ReactNode}> = ({fill, sx, children}) => (
	<div style={{position: 'absolute', left: 340, top: 515, width: 520, height: 170, transformOrigin: 'left center', scale: `${sx} 1`}}>
		<svg viewBox="-260 -85 520 170" width={520} height={170} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<path d="M-218 -70 Q-214 -85 -198 -85 H250 Q264 -85 258 -70 L218 70 Q214 85 198 85 H-250 Q-264 85 -258 70 Z" fill={fill} />
		</svg>
		<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: `${1 / sx} 1`}}>
			{children}
		</div>
	</div>
);

export const Marquee: React.FC<{word: string; ticker: string; P: Palette}> = ({word, ticker, P}) => {
	const frame = useCurrentFrame();
	const inv = INVERT.has(frame);
	const late = LATE_DARK.has(frame);
	const band = inv || late ? P.dark : P.hot;
	const strip = inv || late ? P.hot : P.dark;
	const tickerColor = inv || late ? P.dark : P.hot;
	const badge = late ? P.hot : pick(frame, INVERT, P.hot, P.dark);
	const estWidth = BIG * 0.72 * word.length;
	const x = interpolate(frame, [0, 39], [680, 1200 - estWidth], clamp);
	const sx = interpolate(frame, [28, 35], [1, 1.4], {...clamp, easing: Easing.out(Easing.cubic)});
	const smallSpaced = (color: string) => (
		<span style={{fontFamily: F.small, fontWeight: 600, fontSize: 26, letterSpacing: '0.9em', color, paddingLeft: '0.9em'}}>{word}</span>
	);
	return (
		<AbsoluteFill style={{background: band}}>
			{/* bandeaux haut et bas */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 48, height: 192, background: strip}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 960, height: 200, background: strip}} />
			<Ticker text={ticker} y={144} color={tickerColor} dir={-1} />
			<Ticker text={ticker} y={1060} color={tickerColor} dir={1} />
			{/* mot géant + ombre en trame */}
			<svg viewBox="0 0 1200 1200" width={1200} height={1200} style={{position: 'absolute', inset: 0}}>
				<defs>
					<HalftoneDefs id="m-dots" color={late || inv ? P.hot : P.dark} size={11} r={3.4} />
					<clipPath id="m-band">
						<rect x={0} y={240} width={1200} height={720} />
					</clipPath>
				</defs>
				<g clipPath="url(#m-band)">
					<text x={x + 16} y={880 + 16} fontFamily={F.wide} fontSize={BIG} fill="url(#m-dots)" opacity={0.85}>
						{word}
					</text>
					<text x={x} y={880} fontFamily={F.wide} fontSize={BIG} fill={P.cream}>
						{word}
					</text>
				</g>
			</svg>
			<HalftonePatch id="m-corner" color={strip} x={820} y={700} w={380} h={260} from={[1, 1]} to={[0.2, 0.2]} />
			{/* badge et prémices */}
			{frame <= 2 ? <div style={{position: 'absolute', left: 0, right: 0, top: 585, textAlign: 'center'}}>{smallSpaced(P.dark)}</div> : null}
			{frame >= 3 && frame <= 7 ? (
				<div
					style={{
						position: 'absolute',
						top: 590,
						height: 20,
						left: 0,
						width: interpolate(frame, [3, 7], [300, 1200], clamp),
						background: `linear-gradient(${P.cream} 0 30%, ${P.hot} 30% 70%, ${P.cream} 70%)`,
					}}
				/>
			) : null}
			{frame >= 8 ? (
				<Badge fill={badge} sx={sx}>
					{frame >= 10 && frame <= 35 ? (
						<span style={{fontFamily: F.cond, fontWeight: 900, fontSize: 118, lineHeight: 1, color: P.cream, letterSpacing: '0.02em'}}>{word}</span>
					) : frame === 39 ? (
						smallSpaced(P.cream)
					) : null}
				</Badge>
			) : null}
			<Grain id="marquee" dark={P.dark} light={P.cream} />
		</AbsoluteFill>
	);
};

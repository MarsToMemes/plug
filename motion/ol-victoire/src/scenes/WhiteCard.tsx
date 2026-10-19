import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate} from 'remotion';
import {Grain, Icons, decode} from '../fx';
import {VictoireProps} from '../props';
import {F, P, TEX, clamp, fit} from '../theme';

const BOX = {x: 60, y: 262, w: 960, h: 84};
const BLOCK = {x: 60, y: 356, w: 960, h: 262};

// Le nom roule dans son cadre : colonne de copies (droite / italique) qui défile, puis se repose.
const ROLLS: [number, number][] = [
	[232, 250],
	[288, 300],
	[304, 316],
];

const NameBox: React.FC<{p: VictoireProps; f: number; size: number}> = ({p, f, size}) => {
	const roll = ROLLS.find(([a, b]) => f >= a && f <= b);
	const t = roll ? interpolate(f, roll, [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)}) : 0;
	const prev = roll ? interpolate(f - 1, roll, [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)}) : 0;
	const v = Math.abs(t - prev) * 4 * BOX.h;
	const text = f < 222 ? decode(p.fullName, f, 201, 20, 'nb') : p.fullName;
	const line = (italic: boolean, i: number) => (
		<div
			key={i}
			style={{
				height: BOX.h,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: F.wide,
				fontSize: size,
				color: P.ink,
				whiteSpace: 'pre',
				transform: italic ? 'skewX(-14deg) scaleY(0.82)' : undefined,
			}}
		>
			{text}
		</div>
	);
	// glitch d'entrée : lettres doublées et coupées
	const glitch = f >= 201 && f < 216;
	return (
		<div style={{position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h, outline: `3px solid ${P.ink}`, overflow: 'hidden'}}>
			<div style={{translate: `0 ${-t * 4 * BOX.h}px`, filter: v > 1 ? `blur(0px) url(#vblur)` : undefined}}>
				{[false, true, false, true, false].map((it, i) => line(it, i))}
			</div>
			{glitch && (
				<div style={{position: 'absolute', inset: 0, clipPath: 'inset(52% 0 0 0)', translate: '6px 8px', opacity: 0.85}}>{line(false, 9)}</div>
			)}
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="vblur">
					<feGaussianBlur stdDeviation={`0 ${Math.min(10, v * 0.25)}`} />
				</filter>
			</svg>
		</div>
	);
};

// Temps 5 (f199–339) : carte blanche éditoriale.
export const WhiteCard: React.FC<{p: VictoireProps; f: number}> = ({p, f}) => {
	const nameSize = fit(p.fullName, F.wide, BOX.w - 70);
	const wordSize = fit(p.word, F.black, BLOCK.w - 90);
	const push = interpolate(f, [199, 339], [1, 1.04]);
	const blockX = interpolate(f, [199, 205], [-900, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	const blockSolid = interpolate(f, [206, 212], [0.55, 1], clamp);
	const icons = interpolate(f, [224, 231], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const focus = interpolate(f, [234, 236, 238], [0, 4, 0], clamp);
	const letters = p.word.split('');
	return (
		<AbsoluteFill style={{background: P.paper, overflow: 'hidden'}}>
			<AbsoluteFill style={{scale: `${push}`, filter: focus > 0.2 ? `blur(${focus}px)` : undefined}}>
				{/* papier quadrillé + lumière diagonale */}
				<AbsoluteFill
					style={{
						backgroundImage:
							'repeating-linear-gradient(0deg, rgba(10,14,38,0.05) 0 1px, transparent 1px 36px), repeating-linear-gradient(90deg, rgba(10,14,38,0.05) 0 1px, transparent 1px 36px)',
					}}
				/>
				<AbsoluteFill style={{background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.7) 45%, transparent 60%)'}} />
				{/* logo rogné en haut */}
				<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 84, background: P.night, overflow: 'hidden'}}>
					<Img src={TEX.logo} style={{position: 'absolute', left: 540 - 520, top: -1110, width: 1040, filter: 'brightness(0.95)'}} />
				</div>
				{/* filets */}
				<div style={{position: 'absolute', left: 60, right: 0, top: 210, height: 2, background: P.ink}} />
				<div style={{position: 'absolute', left: 170, right: 0, top: 690, height: 2, background: P.ink}} />
				<Icons color={P.ink} size={56} founded={p.founded} dept={p.dept} style={{right: 60, top: 120 + (1 - icons) * 40, opacity: icons}} />
				<NameBox p={p} f={f} size={nameSize} />
				{/* bloc rouge et mot blanc */}
				<div
					style={{
						position: 'absolute',
						left: BLOCK.x + blockX,
						top: BLOCK.y,
						width: BLOCK.w,
						height: BLOCK.h,
						background: P.red,
						opacity: blockSolid,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						left: BLOCK.x,
						top: BLOCK.y + BLOCK.h / 2 - wordSize * 0.52,
						width: BLOCK.w,
						textAlign: 'center',
						fontFamily: F.black,
						fontSize: wordSize,
						lineHeight: 1,
						color: P.white,
						whiteSpace: 'nowrap',
					}}
				>
					{letters.map((c, i) => {
						const t0 = 201 + i;
						const x = interpolate(f, [t0, t0 + 5], [-120, 0], {...clamp, easing: Easing.out(Easing.cubic)});
						const trail = interpolate(f, [t0, t0 + 6], [1, 0], clamp);
						return (
							<span key={i} style={{position: 'relative', display: 'inline-block', translate: `${x}px 0`, opacity: f >= t0 ? 1 : 0}}>
								{trail > 0 && (
									<>
										<span style={{position: 'absolute', left: -40, opacity: 0.45 * trail, color: '#FFD3D6'}}>{c}</span>
										<span style={{position: 'absolute', left: -80, opacity: 0.22 * trail, color: '#FFD3D6'}}>{c}</span>
									</>
								)}
								{c}
							</span>
						);
					})}
				</div>
				{/* bloc club */}
				<div
					style={{
						position: 'absolute',
						left: 60,
						top: 760,
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						padding: '8px 14px 8px 10px',
						outline: `2.5px solid ${P.ink}`,
					}}
				>
					<Img src={TEX.logo} style={{width: 40}} />
					<div>
						<div style={{fontFamily: F.wide, fontSize: 21, color: P.ink, lineHeight: 1.05}}>{p.fullName}</div>
						<div style={{fontFamily: F.wideMed, fontSize: 11, letterSpacing: '0.4em', color: P.ink}}>{`DEPUIS ${p.founded}`}</div>
					</div>
				</div>
				{/* swoosh argent */}
				<svg width={1080} height={300} style={{position: 'absolute', left: 0, top: 820}}>
					<defs>
						<linearGradient id="sw2" x1="0" x2="1" y1="0" y2="0.3">
							<stop offset="0" stopColor="#FFFFFF" />
							<stop offset="0.45" stopColor="#7E7E86" />
							<stop offset="0.7" stopColor="#F2F2F5" />
							<stop offset="1" stopColor="#9C9CA4" />
						</linearGradient>
					</defs>
					<path d="M380 300 C 520 140, 760 70, 1120 60 L 1120 120 C 800 130, 600 190, 470 300 Z" fill="url(#sw2)" />
				</svg>
			</AbsoluteFill>
			<Grain f={f} opacity={0.05} />
		</AbsoluteFill>
	);
};

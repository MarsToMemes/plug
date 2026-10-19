import React from 'react';
import {AbsoluteFill, Easing, interpolate, random} from 'remotion';
import {Grain, Icons} from '../fx';
import {VictoireProps} from '../props';
import {F, P, TEX, chrome, clamp, fit} from '../theme';

// Fond fibre de carbone vu en légère perspective, vignettage bleu nuit, reflet qui glisse.
export const Carbon: React.FC<{o: number; tint?: string}> = ({o, tint = P.night}) => (
	<AbsoluteFill style={{background: '#0B0C10', overflow: 'hidden'}}>
		<div
			style={{
				position: 'absolute',
				left: -400,
				top: -300,
				width: 1880,
				height: 1700,
				backgroundImage: `url(${TEX.carbone})`,
				backgroundSize: '30px 30px',
				transform: 'perspective(900px) rotateX(24deg)',
				transformOrigin: '50% 100%',
			}}
		/>
		<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 38%, ${tint}22 20%, ${tint} 95%)`, mixBlendMode: 'multiply'}} />
		<AbsoluteFill style={{background: `linear-gradient(${tint}00 30%, ${tint}EE)`}} />
		<AbsoluteFill
			style={{
				background: `linear-gradient(115deg, transparent ${30 + o}%, rgba(255,255,255,0.07) ${38 + o}%, transparent ${46 + o}%)`,
				mixBlendMode: 'screen',
			}}
		/>
	</AbsoluteFill>
);

export type CardState = {
	zoom: number;
	sheen: number;
	zig: number;
	wash: 0 | 1 | 2; // 0 rien, 1 rouge multiplié, 2 rouge en écran
	wordMode: 'fill' | 'outline' | 'outlineDark' | 'dim';
	clubSpread: number; // interlettrage en plus (em) du nom en chrome
	wordShown: number; // nombre de lettres du mot visibles (ordre mélangé)
	blur: number;
	bgShift: number; // position du reflet du carbone (%)
};

export const DarkCardView: React.FC<{p: VictoireProps; f: number; s: CardState}> = ({p, f, s}) => {
	const wordSize = fit(p.word, F.black, 940);
	const clubSize = Math.min(150, fit(p.club, F.wide, 700));
	const letters = p.word.split('');
	const order = letters.map((_, i) => i).sort((a, b) => random(`w${a}`) - random(`w${b}`));
	const visible = new Set(order.slice(0, s.wordShown));
	const wordStyle: React.CSSProperties =
		s.wordMode === 'fill'
			? {color: P.red, textShadow: `0 0 22px ${P.red}77`}
			: s.wordMode === 'outline'
				? {color: 'transparent', WebkitTextStroke: `2px ${P.red}`}
				: s.wordMode === 'outlineDark'
					? {color: 'rgba(80,0,10,0.35)', WebkitTextStroke: `1.5px ${P.redDeep}`}
					: {color: P.redDeep};
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
			<AbsoluteFill style={{scale: `${s.zoom}`, filter: s.blur > 0.2 ? `blur(${s.blur}px)` : undefined}}>
				<Carbon o={s.bgShift} />
				<svg width={0} height={0} style={{position: 'absolute'}}>
					<filter id="zig" x="-5%" y="-5%" width="110%" height="110%">
						<feImage href={TEX.zigzag} result="m" x={0} y={0} width={1080} height={1080} preserveAspectRatio="none" />
						<feDisplacementMap in="SourceGraphic" in2="m" scale={s.zig} xChannelSelector="R" yChannelSelector="G" />
					</filter>
				</svg>
				<AbsoluteFill style={{filter: s.zig > 0.5 ? 'url(#zig)' : undefined}}>
					<div style={{position: 'absolute', left: 80, top: 0, width: 620, height: 30, background: P.red}} />
					<div style={{position: 'absolute', left: 0, top: 1050, width: 560, height: 30, background: P.red}} />
					<Icons color={P.white} size={58} founded={p.founded} dept={p.dept} style={{left: 60, top: 100}} />
					{[192, 532].map((y) => (
						<div key={y} style={{position: 'absolute', left: 0, right: 0, top: y, height: 1.5, background: 'rgba(255,255,255,0.55)'}} />
					))}
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 222,
							textAlign: 'center',
							fontFamily: F.wide,
							fontSize: clubSize,
							lineHeight: 1,
							letterSpacing: `${s.clubSpread}em`,
							paddingLeft: `${s.clubSpread}em`,
							whiteSpace: 'nowrap',
							filter: 'drop-shadow(0 3px 0 #2A2B33) drop-shadow(0 10px 16px rgba(0,0,0,0.7))',
						}}
					>
						<span style={chrome(s.sheen)}>{p.club}</span>
					</div>
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 520 - wordSize * 1.02,
							textAlign: 'center',
							fontFamily: F.black,
							fontSize: wordSize,
							lineHeight: 1,
							whiteSpace: 'nowrap',
						}}
					>
						{letters.map((c, i) => (
							<span key={i} style={{...wordStyle, opacity: visible.has(i) ? 1 : 0}}>
								{c}
							</span>
						))}
					</div>
					<div
						style={{
							position: 'absolute',
							right: 70,
							top: 560,
							display: 'flex',
							alignItems: 'center',
							gap: 10,
							fontFamily: F.wideBold,
							fontSize: 22,
							letterSpacing: 2,
							color: P.white,
						}}
					>
						<div style={{width: 7, height: 18, background: P.white}} />
						{p.signature}
					</div>
				</AbsoluteFill>
				{s.wash === 1 && <AbsoluteFill style={{background: P.red, mixBlendMode: 'multiply'}} />}
				{s.wash === 2 && <AbsoluteFill style={{background: P.red, mixBlendMode: 'screen', opacity: 0.45}} />}
			</AbsoluteFill>
			<Grain f={f} />
		</AbsoluteFill>
	);
};

// Temps 1 (f0–46)
export const DarkCard: React.FC<{p: VictoireProps; f: number}> = ({p, f}) => {
	const zoom =
		f < 39
			? interpolate(f, [0, 38], [1, 1.08], clamp)
			: interpolate(f, [39, 46], [1.08, 1.38], {...clamp, easing: Easing.in(Easing.cubic)});
	const zigTable: Record<number, number> = {13: 22, 14: 30, 15: 18};
	const modes: Record<number, CardState['wordMode']> = {14: 'outline', 17: 'outline', 18: 'outlineDark', 19: 'dim'};
	return (
		<DarkCardView
			p={p}
			f={f}
			s={{
				zoom,
				sheen: interpolate(f, [0, 46], [0, 45], clamp),
				zig: zigTable[f] ?? 0,
				wash: f >= 39 ? (f % 2 === 1 ? 1 : 2) : 0,
				wordMode: modes[f] ?? 'fill',
				clubSpread: 0,
				wordShown: 99,
				blur: f >= 43 ? (f - 42) * 1.5 : 0,
				bgShift: f * 0.08,
			}}
		/>
	);
};

// Temps 6 (f346–359) : la carte revient, le nom se resserre, le mot se complète ; f360 = f0.
export const DarkCardReturn: React.FC<{p: VictoireProps; f: number}> = ({p, f}) => (
	<DarkCardView
		p={p}
		f={f}
		s={{
			zoom: interpolate(f, [340, 360], [1.06, 1], {...clamp, easing: Easing.out(Easing.cubic)}),
			sheen: interpolate(f, [340, 360], [-20, 0], clamp),
			zig: 0,
			wash: 0,
			wordMode: 'fill',
			clubSpread: interpolate(f, [344, 357], [0.55, 0], {...clamp, easing: Easing.out(Easing.cubic)}),
			wordShown: Math.floor(interpolate(f, [346, 354], [2, p.word.length], clamp)),
			blur: interpolate(f, [340, 346], [4, 0], clamp),
			bgShift: (f - 360) * 0.08,
		}}
	/>
);

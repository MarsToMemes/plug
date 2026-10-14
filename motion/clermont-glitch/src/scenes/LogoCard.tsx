import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Cross, Stroke} from '../fx/Lines';
import {F, P, clamp} from '../theme';

// Temps 1 et 8 : carte logotype. f0–7 telle quelle ; f167–186 la ville se recompose (décodage), le nom du club se
// tape, les lignes se redessinent. À f186 tout est posé : identique à f0 (boucle).
const DECODE_START = 167;

const Glyph: React.FC<{ch: string; i: number; f: number; settleAt: number}> = ({ch, i, f, settleAt}) => {
	if (f >= settleAt) return <span>{ch}</span>;
	const r = random(`g-${i}-${f}`);
	const style: React.CSSProperties =
		r < 0.3 ? {scale: '-1 1', display: 'inline-block'} : r < 0.55 ? {clipPath: 'inset(0 0 52% 0)', display: 'inline-block'} : r < 0.75 ? {clipPath: 'inset(48% 0 0 0)', display: 'inline-block', translate: '8px 0px'} : {color: 'transparent', background: P.ink, display: 'inline-block'};
	return <span style={style}>{ch}</span>;
};

export const LogoCard: React.FC<{offset: number; city: string; club: string}> = ({offset, city, club}) => {
	const f = useCurrentFrame() + offset;
	const decoding = f >= DECODE_START;
	const settle = (i: number) => (decoding ? DECODE_START + 2 + i * 1.2 + random(`s-${i}`) * 3 : -1);
	const typed = decoding ? Math.max(0, Math.min(club.length, f - 179 + 1)) : club.length;
	const line = decoding ? interpolate(f, [DECODE_START, 180], [0, 1], clamp) : 1;
	return (
		<AbsoluteFill style={{background: P.red}}>
			{/* cavalier de l'écusson, géant, coupé en haut à gauche */}
			<Img src={staticFile('club/cavalier-blanc.png')} style={{position: 'absolute', left: -170, top: -250, width: 900}} />
			{/* chaîne des Puys en duotone rouge (dessin original) */}
			<svg viewBox="0 0 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0}}>
				<path d="M0 860 C 120 830, 190 800, 260 812 C 330 824, 360 780, 430 772 C 520 760, 560 700, 640 700 C 720 700, 760 760, 840 770 C 920 780, 990 820, 1080 812 V1080 H0 Z" fill="#9A0333" />
				<path d="M0 930 C 140 900, 230 880, 330 890 C 430 900, 470 850, 560 846 C 650 842, 700 900, 800 902 C 900 904, 980 880, 1080 890 V1080 H0 Z" fill="#7A022A" />
				<path d="M0 1000 C 200 980, 380 960, 540 970 C 700 980, 880 1000, 1080 985 V1080 H0 Z" fill={P.redDark} />
			</svg>
			<Img src={staticFile('club/ecusson-blanc.png')} style={{position: 'absolute', left: 512, top: 1000, width: 56}} />
			{/* logotype */}
			<div style={{position: 'absolute', left: 60, top: 352, fontFamily: F.big, fontWeight: 700, fontSize: 124, lineHeight: 1, color: P.white, letterSpacing: '0.01em', whiteSpace: 'nowrap'}}>
				{city.split('').map((ch, i) => (
					<Glyph key={i} ch={ch} i={i} f={f} settleAt={settle(i)} />
				))}
			</div>
			<div style={{position: 'absolute', left: 64, top: 492, fontFamily: F.small, fontWeight: 500, fontSize: 34, letterSpacing: '0.45em', color: P.white, whiteSpace: 'nowrap'}}>
				{club.slice(0, typed)}
				<span style={{visibility: 'hidden'}}>{club.slice(typed)}</span>
			</div>
			<svg viewBox="0 0 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0}}>
				<Stroke id="lc-a" d="M660 330 V 545 H 64" len={215 + 596} p={line} color={P.white} arrow />
				<Stroke id="lc-b" d="M1010 300 V 620" len={320} p={line} color={P.white} />
				{line >= 1 ? <Cross x={1010} y={640} color={P.white} /> : null}
			</svg>
		</AbsoluteFill>
	);
};

import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Cross, Stroke} from '../fx/Lines';
import {F, P, clamp} from '../theme';
import {DigitReel} from './Reel';

// Temps 7 (f95–158) : carte joueur. Nom qui se décode, compteur qui roule en comptant, lignes qui se dessinent.
// Motif du club en bas à gauche : bandes du maillot (rouge et bleu verticaux) couchées en courbes, au lieu de vagues.
const Decode: React.FC<{text: string; f: number; start: number; size: number; spacing: string; family: string; firstBig?: boolean}> = ({text, f, start, size, spacing, family, firstBig}) => (
	<div style={{fontFamily: family, fontWeight: family === F.big ? 700 : 500, fontSize: size, letterSpacing: spacing, color: P.white, whiteSpace: 'nowrap', lineHeight: 1}}>
		{text.split('').map((ch, i) => {
			const settle = start + i * 1.2 + random(`n-${text}-${i}`) * 3;
			const sz = firstBig && i === 0 ? size * 1.18 : size;
			if (f >= settle) return <span key={i} style={{fontSize: sz}}>{ch}</span>;
			const r = random(`d-${text}-${i}-${f}`);
			const other = text[Math.floor(random(`o-${text}-${i}-${f}`) * text.length)];
			const st: React.CSSProperties = {display: 'inline-block', fontSize: sz};
			if (r < 0.3) return <span key={i} style={{...st, scale: '-1 1'}}>{other}</span>;
			if (r < 0.55) return <span key={i} style={{...st, clipPath: 'inset(0 0 50% 0)'}}>{ch}</span>;
			if (r < 0.75) return <span key={i} style={{...st, color: P.ink}}>{other}</span>;
			return <span key={i} style={{...st, color: 'transparent'}}>{ch}</span>;
		})}
	</div>
);

export const PlayerCard: React.FC<{offset: number; photo: string; firstName: string; lastName: string; number: string}> = ({offset, photo, firstName, lastName, number}) => {
	const f = useCurrentFrame() + offset;
	const push = interpolate(f, [95, 158], [1, 1.03], clamp);
	const target = Number(number);
	// compteur : une valeur toutes les 2 images, de (numéro − 7, borné à 0) jusqu'au numéro, de f105 à ~f121
	const startVal = Math.max(0, target - 8);
	const count = Math.min(target, startVal + Math.max(0, Math.floor((f - 105) / 2)));
	const arc = interpolate(f, [107, 118], [0, 1], clamp);
	const arrows = interpolate(f, [100, 110], [0, 1], clamp);
	return (
		<AbsoluteFill style={{background: P.red}}>
			<Img src={staticFile(photo)} style={{position: 'absolute', left: 80, top: 30, height: 1240, transformOrigin: '50% 100%', scale: String(push)}} />
			{/* bande sombre derrière le nom */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 690, height: 250, background: P.redDark, opacity: 0.88}} />
			{/* bandes du maillot couchées en courbes, bas gauche */}
			<svg viewBox="0 0 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0}}>
				{[0, 1, 2, 3, 4].map((i) => {
					const o = i * 30;
					return (
						<path
							key={i}
							d={`M-40 ${1160 - o} C 260 ${1080 - o}, 560 ${1010 - o}, 1120 ${1030 - o * 1.2} L 1120 ${1046 - o * 1.2} C 560 ${1028 - o}, 260 ${1100 - o}, -40 ${1184 - o} Z`}
							fill={i % 2 === 0 ? P.white : P.dark}
						/>
					);
				})}
			</svg>
			{/* nom */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 725, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
				{f >= 101 ? <Decode text={firstName} f={f} start={101} size={44} spacing="0.4em" family={F.small} /> : null}
				{f >= 99 ? <Decode text={lastName} f={f} start={99} size={96} spacing="0.08em" family={F.big} firstBig /> : null}
			</div>
			{/* numéro en case(s), haut droite de la tête */}
			{f >= 105 ? (
				<div style={{position: 'absolute', left: 690, top: 46, display: 'flex', gap: 6}}>
					{String(count)
						.padStart(number.length, '0')
						.split('')
						.map((d, i) => (
							<DigitReel key={i} value={Number(d)} w={80} h={100} bg={f === 105 ? P.white : P.ink} fg={P.white} size={84} />
						))}
				</div>
			) : null}
			{/* lignes techniques */}
			<svg viewBox="0 0 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0}}>
				<Stroke id="pc-arc" d="M 1080 -10 A 330 330 0 0 0 750 320" len={520} p={arc} color={P.ink} />
				{arc >= 1 ? (
					<>
						<Cross x={1040} y={60} color={P.ink} />
						<Cross x={790} y={330} color={P.ink} />
					</>
				) : null}
				<Stroke id="pc-a1" d="M 60 680 H 420" len={360} p={arrows} color={P.white} arrow />
				<Stroke id="pc-a2" d="M 1020 960 H 640" len={380} p={arrows} color={P.white} arrow />
			</svg>
		</AbsoluteFill>
	);
};

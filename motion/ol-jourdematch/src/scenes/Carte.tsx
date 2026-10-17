import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate} from 'remotion';
import {Shards, Stars3} from '../fx';
import {JdmProps} from '../props';
import {F, ITALIC, P, TEX, clamp, fit} from '../theme';

const typed = (text: string, f: number, t0: number, cps = 1.2) => text.slice(0, Math.max(0, Math.floor((f - t0) * cps)));

// Temps 7 (f115–232) : carte d'infos — image en négatif qui clignote, nom géant qui s'assemble, infos tapées.
export const Carte: React.FC<{p: JdmProps; f: number}> = ({p, f}) => {
	const neg = f === 115 || f === 116 || f === 118;
	const grow = interpolate(f, [115, 118], [0.3, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const push = interpolate(f, [118, 232], [1, 1.06], clamp);
	const nameSize = fit(p.short, F.wide, 1000);
	const letters = p.short.split('');
	const bar = interpolate(f, [221, 232], [0, 200], {...clamp, easing: Easing.in(Easing.cubic)});
	const info: React.CSSProperties = {fontFamily: F.wideBold, fontSize: 38, lineHeight: 1.32, color: P.white, whiteSpace: 'pre'};
	// cascade de lignes tapées : chaque ligne démarre quand la précédente est à moitié
	const lines1 = p.info;
	let t = 116;
	const starts1 = lines1.map((l) => {
		const s = t;
		t += Math.ceil(l.length / 1.2 / 2);
		return s;
	});
	let t2 = 133;
	const starts2 = p.info2.map((l) => {
		const s = t2;
		t2 += Math.ceil(l.length / 1.2 / 2);
		return s;
	});
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Shards color={P.red} f={f} light={0.2} dark={0.16} />
			{/* image dans un rectangle arrondi */}
			<div style={{position: 'absolute', left: 30, top: 50, width: 1020, height: 1010, borderRadius: 40, overflow: 'hidden', scale: `${grow}`}}>
				<Img
					src={TEX.carte}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						objectPosition: '50% 30%',
						scale: `${push}`,
						filter: neg ? 'invert(1) sepia(1) saturate(3) hue-rotate(300deg) brightness(1.15)' : undefined,
					}}
				/>
				{neg && <AbsoluteFill style={{background: P.pink, mixBlendMode: 'multiply', opacity: 0.6}} />}
				{/* rayons de lumière depuis le coin haut gauche */}
				<AbsoluteFill
					style={{
						background:
							'linear-gradient(125deg, rgba(255,255,255,0.55) 0%, transparent 18%), linear-gradient(115deg, transparent 8%, rgba(255,255,255,0.25) 14%, transparent 22%), linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.18) 26%, transparent 34%)',
						mixBlendMode: 'screen',
					}}
				/>
				<AbsoluteFill style={{background: 'linear-gradient(transparent 70%, rgba(120,0,20,0.55))'}} />
			</div>
			{/* nom géant qui s'assemble : contour puis plein, dégradé bleu */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 1060, textAlign: 'center', fontFamily: F.wide, fontSize: nameSize, lineHeight: 1, transform: ITALIC, whiteSpace: 'nowrap'}}>
				{letters.map((c, i) => {
					const t0 = 115 + i * 3;
					const full = f >= t0 + 3;
					return (
						<span
							key={i}
							style={{
								opacity: f >= t0 ? 1 : 0,
								color: full ? 'transparent' : 'transparent',
								WebkitTextStroke: full ? undefined : `3px ${P.white}`,
								backgroundImage: full ? 'linear-gradient(90deg, #3E63E8, #0F23AA 60%, #0A1660)' : undefined,
								WebkitBackgroundClip: full ? 'text' : undefined,
								backgroundClip: full ? 'text' : undefined,
								filter: full ? 'drop-shadow(0 6px 10px rgba(60,0,10,0.35))' : undefined,
							}}
						>
							{c}
						</span>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: 60, top: 1060 + nameSize * 1.02, fontFamily: F.wide, fontSize: 46, color: P.white, whiteSpace: 'pre'}}>
				{typed(p.versus, f, 115)}
			</div>
			<Stars3 color={P.redHot} lit={f >= 134 ? 3 : 0} size={24} style={{left: 40, top: 1462}} />
			<div style={{position: 'absolute', left: 90, top: 1450}}>
				{lines1.map((l, i) => (
					<div key={i} style={info}>
						{typed(l, f, starts1[i])}
					</div>
				))}
				<div style={{height: 34}} />
				{p.info2.map((l, i) => (
					<div key={i} style={info}>
						{typed(l, f, starts2[i])}
					</div>
				))}
			</div>
			<div style={{position: 'absolute', left: 60, right: 60, top: 1830, height: 2, background: 'rgba(255,255,255,0.35)'}} />
			{bar > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 1000 - bar / 2, height: Math.max(2, bar), background: P.white}} />}
		</AbsoluteFill>
	);
};

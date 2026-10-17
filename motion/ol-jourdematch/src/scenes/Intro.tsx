import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring} from 'remotion';
import {EmblemPath, Shards, Silhouette, Unstable} from '../fx';
import {JdmProps} from '../props';
import {F, ITALIC, P, TEX, clamp, fit} from '../theme';

const vblur = (id: string, amount: number) => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<filter id={id} x="-10%" y="-60%" width="120%" height="220%">
			<feGaussianBlur stdDeviation={`0 ${amount}`} />
		</filter>
	</svg>
);

// Temps 1 (f0–3) : gris clair, 3 rangées bleu nuit, lettres qui manquent.
export const Grey1: React.FC<{p: JdmProps; f: number}> = ({p, f}) => {
	const s1 = fit(p.word, F.cond, 560);
	const s2 = fit(p.word, F.wide, 480);
	return (
		<AbsoluteFill>
			<Shards color={P.grey} f={f} light={0.55} dark={0.04} />
			{[270, 915, 1560].map((y, r) => (
				<div key={y} style={{position: 'absolute', left: 0, right: 0, top: y - s1 * 0.6, textAlign: 'center', color: P.blueText}}>
					<div style={{fontFamily: F.cond, fontSize: s1, lineHeight: 1}}>
						<Unstable text={p.word} f={f} settle={99} seed={`g1${r}`} />
					</div>
					<div style={{fontFamily: F.wide, fontSize: s2, lineHeight: 1.1, transform: ITALIC}}>
						<Unstable text={p.word} f={f + 7} settle={99} seed={`g1b${r}`} />
					</div>
				</div>
			))}
		</AbsoluteFill>
	);
};

// Temps 2 (f4–19) : bleu nuit, mot géant blanc avec le logo incrusté, rangées qui filent vers le haut.
export const Navy2: React.FC<{p: JdmProps; f: number}> = ({p, f}) => {
	const s1 = fit(p.word, F.cond, 1000);
	const s2 = fit(p.word, F.wide, 940);
	const scale = interpolate(f, [5, 17], [1, 1.06], clamp);
	const ty = f >= 18 ? (f - 17) * -320 : 0;
	const blur = f === 4 ? 22 : f >= 18 ? 18 : 0;
	const logoW = 250;
	return (
		<AbsoluteFill>
			<Shards color={P.navy} f={f} light={0.14} dark={0.2} />
			{vblur('vb2', blur)}
			<AbsoluteFill style={{scale: `${scale}`, translate: `0 ${ty}px`, filter: blur ? 'url(#vb2)' : undefined}}>
				{[300, 960, 1620].map((y, r) => (
					<div key={y} style={{position: 'absolute', left: 0, right: 0, top: y - s1 * 0.62, textAlign: 'center', color: P.white}}>
						<div style={{position: 'relative', fontFamily: F.cond, fontSize: s1, lineHeight: 1}}>
							{p.word}
							<Img
								src={TEX.logo}
								style={{
									position: 'absolute',
									left: 540 - logoW / 2,
									top: s1 * 0.5 - (logoW * 1.163) / 2,
									width: logoW,
									filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.5))',
								}}
							/>
						</div>
						<div style={{fontFamily: F.wide, fontSize: s2, lineHeight: 1.15, transform: ITALIC}}>
							<Unstable text={p.word} f={f} settle={f % 3 === 0 ? 0 : 99} seed={`n2${r}`} alt={P.redHot} />
						</div>
					</div>
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// Temps 3 (f20–40) : rouge, grille de mots qui défile, silhouettes du lion, contour qui se dessine puis volet blanc.
export const Red3: React.FC<{p: JdmProps; f: number}> = ({p, f}) => {
	const s = fit(p.word, F.wide, 430);
	const k = f - 20;
	const draw = interpolate(f, [31, 36], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const filled = f >= 37;
	const grow = interpolate(f, [37, 40], [1, 2.4], {...clamp, easing: Easing.in(Easing.cubic)});
	const size = 1150;
	const hblur = f <= 21 ? 14 : 0;
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Shards color={P.red} f={f} light={0.18} dark={0.14} />
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="hb3" x="-20%" y="-10%" width="140%" height="120%">
					<feGaussianBlur stdDeviation={`${hblur} 0`} />
				</filter>
			</svg>
			<div style={{position: 'absolute', left: -60, top: -300, translate: `${-k * 4}px ${-k * 6}px`, filter: hblur ? 'url(#hb3)' : undefined}}>
				{Array.from({length: 15}).map((_, row) =>
					[0, 1].map((col) => {
						const idx = row * 2 + col;
						const sp = spring({frame: f - 22 - (idx % 6), fps: 24, config: {damping: 14}});
						return (
							<div key={idx} style={{position: 'absolute', left: 30 + col * 520, top: row * 165 + (col ? 82 : 0), width: 480, height: 160}}>
								<Silhouette src={TEX.lion} w={250} h={254} color={P.blue} style={{position: 'absolute', left: 40, top: -70, scale: `${0.4 + 0.6 * sp}`, opacity: f >= 22 ? 1 : 0}} />
								<div style={{position: 'relative', fontFamily: F.wide, fontSize: s, color: P.white, transform: ITALIC, whiteSpace: 'nowrap'}}>
									<Unstable text={p.word} f={f} settle={34} seed={`r3${idx}`} alt={P.blue} />
								</div>
							</div>
						);
					}),
				)}
			</div>
			{/* contour de l'emblème qui se dessine, puis rempli */}
			{f >= 31 && (
				<div style={{position: 'absolute', left: 540 - size / 2, top: 960 - size / 2, width: size, height: size, rotate: '-8deg', scale: `${grow}`}}>
					<EmblemPath size={size} draw={draw} fill={filled ? P.white : 'none'} stroke={P.white} width={9} />
				</div>
			)}
			{f >= 40 && <AbsoluteFill style={{background: P.white, opacity: 0.9}} />}
		</AbsoluteFill>
	);
};

// Temps 4 (f41–59) : gris clair, mots rouges qui se décodent, silhouettes bleues floues, poussée floue en sortie.
export const Grey4: React.FC<{p: JdmProps; f: number}> = ({p, f}) => {
	const s = fit(p.word, F.wide, 900);
	const push = interpolate(f, [55, 59], [1, 1.3], {...clamp, easing: Easing.in(Easing.quad)});
	const blur = interpolate(f, [55, 59], [0, 12], clamp);
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Shards color={P.grey} f={f} light={0.6} dark={0.04} />
			<AbsoluteFill style={{scale: `${push}`, translate: `0 ${(push - 1) * -300}px`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
				{[300, 950, 1600].map((y, r) => (
					<div key={y} style={{position: 'absolute', left: 0, right: 0, top: y}}>
						{f === 41 ? (
							<div style={{position: 'absolute', left: 290, top: -150, width: 480, height: 480, opacity: 0.5}}>
								<EmblemPath size={480} stroke="#8FA4D8" width={2} />
							</div>
						) : (
							<Silhouette src={TEX.lion} w={520} h={529} color={P.blue} style={{position: 'absolute', left: 240, top: -240, filter: 'blur(5px)', opacity: 0.9}} />
						)}
						<div style={{position: 'relative', textAlign: 'center', fontFamily: F.wide, fontSize: s, color: P.redHot, transform: ITALIC, whiteSpace: 'nowrap', top: -s * 0.55}}>
							<Unstable text={p.word} f={f} settle={53} seed={`g4${r}`} alt={P.white} />
						</div>
					</div>
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

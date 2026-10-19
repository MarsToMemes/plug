import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random} from 'remotion';
import {Backdrop, Grain, Pochoir} from '../fx';
import {GrungeProps} from '../props';
import {F, P, TEX, clamp, fit, textWidth} from '../theme';

const BW = 900;
const LOGO = 300;

// Mot révélé par lamelles verticales de largeurs inégales (chacune avec son retard).
const Strips: React.FC<{f: number; t0: number; dur: number; dir: 1 | -1; h: number; seed: string; children: React.ReactNode}> = ({
	f,
	t0,
	dur,
	dir,
	h,
	seed,
	children,
}) => {
	const n = 7;
	const raw = Array.from({length: n}).map((_, i) => 0.5 + random(`${seed}w${i}`));
	const sum = raw.reduce((a, b) => a + b, 0);
	let acc = 0;
	const bands = raw.map((r, i) => {
		const x0 = (acc / sum) * 100;
		acc += r;
		return {x0, x1: (acc / sum) * 100, delay: Math.floor(random(`${seed}d${i}`) * 6)};
	});
	if (f >= t0 + dur + 6) return <>{children}</>;
	if (f < t0) return <div style={{visibility: 'hidden'}}>{children}</div>;
	return (
		<div style={{position: 'relative'}}>
			<div style={{visibility: 'hidden'}}>{children}</div>
			{bands.map((b, i) => {
				const t = interpolate(f, [t0 + b.delay, t0 + b.delay + dur], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
				return (
					<div key={i} style={{position: 'absolute', inset: 0, clipPath: `inset(-20% ${100 - b.x1}% -20% ${b.x0}%)`, translate: `0 ${(1 - t) * -dir * h * 1.3}px`}}>
						{children}
					</div>
				);
			})}
		</div>
	);
};

// Temps 5–8 (f188–379) : ciel d'orage, slogan qui arrive, tenue au pochoir, plongée dans la lettre.
export const Slogan: React.FC<{p: GrungeProps; f: number}> = ({p, f}) => {
	if (f < 200) {
		return (
			<AbsoluteFill>
				<Backdrop src={TEX.orageBrun} dx={-(f - 188) * 6} dy={(f - 188) * 2} scale={1.1} />
				<Grain f={f} />
			</AbsoluteFill>
		);
	}
	const [w1, w2, w3] = p.slogan;
	const s1 = fit(w1, F.cond, BW - LOGO - 24);
	const s2 = Math.min(270, fit(w2, F.wide, BW * 0.7));
	const s3 = Math.min(520, fit(w3, F.cond, BW));
	const h1 = Math.max(LOGO, s1 * 1.0);
	// bloc centré dans le cadre
	const bw = Math.max(LOGO + 24 + textWidth(w1, F.cond, s1), textWidth(w2, F.wide, s2), textWidth(w3, F.cond, s3));
	const bh = h1 + 12 + s2 * 1.05 + 4 + s3;
	const X = Math.round((1080 - bw) / 2);
	const Y = Math.round((1350 - bh) / 2) - 10;
	// tournoiement du logo + mot du milieu
	const fly = interpolate(f, [200, 210], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const flyPrev = interpolate(f - 1, [200, 210], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const v = (fly - flyPrev) * 500;
	const settle = interpolate(f, [230, 237], [3, 0], clamp);
	// tenue puis plongée
	const hold = interpolate(f, [238, 349], [1, 1.06], clamp);
	const dive = interpolate(f, [350, 371], [1, 9], {...clamp, easing: Easing.in(Easing.exp)});
	const diveRot = interpolate(f, [350, 371], [0, 10], {...clamp, easing: Easing.in(Easing.quad)});
	const diveBlur = interpolate(f, [356, 371], [0, 14], clamp);
	// centre de la 2ᵉ lettre du mot du milieu (cible de la plongée)
	const firstW = textWidth(w2.slice(0, 1), F.wide, s2);
	const secondW = textWidth(w2.slice(0, 2), F.wide, s2) - firstW;
	const y2 = Y + h1 + 12;
	const cx = X + firstW + secondW / 2;
	const cy = y2 + s2 * 0.55;
	if (f >= 372) {
		return (
			<AbsoluteFill style={{background: P.ink, overflow: 'hidden'}}>
				<AbsoluteFill
					style={{
						backgroundImage: `url(${TEX.surpulv})`,
						backgroundSize: '1400px 1400px',
						backgroundPosition: '-300px -200px',
						filter: `blur(${interpolate(f, [372, 379], [5, 18])}px) brightness(0.3)`,
						mixBlendMode: 'multiply',
					}}
				/>
				<Grain f={f} />
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Backdrop src={TEX.orageGris} dx={-(f - 200) * 0.35} dy={-(f - 200) * 0.15} filter="brightness(0.62) contrast(1.15)" />
			<AbsoluteFill
				style={{
					transformOrigin: `${cx}px ${cy}px`,
					scale: `${hold * dive}`,
					rotate: `${diveRot}deg`,
					translate: `${interpolate(f, [238, 349], [0, 10], clamp)}px 0`,
					filter: settle + diveBlur > 0.3 ? `blur(${settle + diveBlur}px)` : undefined,
				}}
			>
				{/* ligne 1 : logo + mot 1 (lamelles depuis le haut) */}
				<div
					style={{
						position: 'absolute',
						left: X,
						top: Y,
						transformOrigin: '30% 120%',
						rotate: `${(1 - fly) * -35}deg`,
						translate: `${(1 - fly) * 260}px ${(1 - fly) * 420}px`,
						scale: `${0.8 + fly * 0.2}`,
						filter: v > 1 ? `blur(${Math.min(12, v * 0.2)}px)` : undefined,
					}}
				>
					<Pochoir id="slogo" f={f} rough={4} grainScale={380} overspray={0.55}>
						<Img src={TEX.logo} style={{width: LOGO, height: LOGO, display: 'block'}} />
					</Pochoir>
				</div>
				<div style={{position: 'absolute', left: X + LOGO + 24, top: Y + (h1 - s1 * 1.0) / 2}}>
					<Strips f={f} t0={210} dur={10} dir={1} h={s1} seed="m1">
						<Pochoir id="w1" f={f} rough={4} grainScale={320} overspray={0.7}>
							<div style={{fontFamily: F.cond, fontSize: s1, lineHeight: 1, color: P.white, whiteSpace: 'nowrap'}}>{w1}</div>
						</Pochoir>
					</Strips>
				</div>
				{/* ligne 2 : mot du milieu (police étendue, encre), arrive avec le logo */}
				<div
					style={{
						position: 'absolute',
						left: X,
						top: y2,
						transformOrigin: '30% -40%',
						rotate: `${(1 - fly) * -35}deg`,
						translate: `${(1 - fly) * 260}px ${(1 - fly) * 420}px`,
						scale: `${0.8 + fly * 0.2}`,
						filter: v > 1 ? `blur(${Math.min(12, v * 0.2)}px)` : undefined,
					}}
				>
					<Pochoir id="w2" f={f} rough={3} grainScale={300} overspray={0.7}>
						<div style={{fontFamily: F.wide, fontSize: s2, lineHeight: 1.05, color: P.ink, whiteSpace: 'nowrap'}}>{w2}</div>
					</Pochoir>
				</div>
				{/* ligne 3 : mot 3 (lamelles depuis le bas), dégradé blanc → gris */}
				<div style={{position: 'absolute', left: X, top: y2 + s2 * 1.05 + 4}}>
					<Strips f={f} t0={220} dur={10} dir={-1} h={s3} seed="m3">
						<Pochoir id="w3" f={f} rough={4} grainScale={320} overspray={0.7}>
							<div
								style={{
									fontFamily: F.cond,
									fontSize: s3,
									lineHeight: 1,
									whiteSpace: 'nowrap',
									color: 'transparent',
									backgroundImage: `linear-gradient(${P.white} 40%, ${P.whiteLow})`,
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text',
								}}
							>
								{w3}
							</div>
						</Pochoir>
					</Strips>
				</div>
			</AbsoluteFill>
			<Grain f={f} />
		</AbsoluteFill>
	);
};

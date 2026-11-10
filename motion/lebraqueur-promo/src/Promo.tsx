import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Html5Audio, Img, continueRender, delayRender, interpolate, interpolateColors, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, clamp, fontsLoaded, inOut, out} from './theme';
import {At, Dark, Kinetic, Light, Pill, World, cut} from './ui';

const FPS = 30;
// Musique : extrait de 18 s (46 s → 64 s du morceau). L'entrée de la rythmique tombe sur l'arrivée de la fiche (image 100).
const MUSIC_TRIM = 28;
const DROP = 100;
const musicVolume = (f: number) =>
	interpolate(f, [0, 6, DROP - 3, DROP, 428, 449], [0, 1, 1, 0.56, 0.56, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
type S = React.FC<{f: number}>;

const Shot: React.FC<{f: number; start: number; end: number; children: React.ReactNode}> = ({f, start, end, children}) => {
	const c = cut(f, start, end);
	return <AbsoluteFill style={{scale: `${c.scale}`, opacity: c.opacity, filter: c.blur > 0.3 ? `blur(${c.blur}px)` : undefined}}>{children}</AbsoluteFill>;
};

const center: React.CSSProperties = {position: 'absolute', left: 0, right: 0, textAlign: 'center'};

// 1 (0–60, écrit sur 80) : l'accroche, mot à mot, puis « ce soir ? » en grand ; étiquettes du site qui flottent en profondeur.
const CHIPS = [
	{t: 'NFL · touchdowns', x: 330, y: 230, z: -260},
	{t: 'Foot · buteurs', x: 1560, y: 300, z: -120},
	{t: 'NBA · 20 points ou plus', x: 1480, y: 840, z: -420},
	{t: 'NHL · buteurs', x: 380, y: 860, z: -60},
	{t: 'Braqueur Score', x: 960, y: 150, z: -620},
	{t: 'chance de réussite', x: 200, y: 560, z: -520},
	{t: 'écart avec les cotes', x: 1740, y: 590, z: -340},
];
const Hook: S = ({f}) => {
	const big = f >= 46;
	const pop = interpolate(f, [46, 56], [0, 1], out);
	return (
		<>
			<Dark f={f} />
			<World ry={interpolate(f, [0, 80], [-9, 9])} rx={interpolate(f, [0, 80], [4, -3])} z={interpolate(f, [0, 80], [-140, 160])}>
				{CHIPS.map((c, i) => {
					const a = interpolate(f, [10 + i * 5, 22 + i * 5], [0, 1], out);
					return (
						<At key={i} x={c.x} y={c.y + (1 - a) * 60 + Math.sin(f / 18 + i) * 10} z={c.z} style={{opacity: a * (0.9 + c.z / 900), filter: `blur(${-c.z / 110}px)`}}>
							<Pill size={34}>{c.t}</Pill>
						</At>
					);
				})}
			</World>
			{!big ? (
				<div style={{...center, top: 450}}>
					<Kinetic f={f} size={170} words={[{t: 'Qui', at: 6}, {t: 'va', at: 15}, {t: 'marquer', at: 24}]} style={{display: 'inline-block'}} />
				</div>
			) : (
				<div style={{...center, top: 380, scale: `${1.5 - 0.5 * pop + interpolate(f, [56, 80], [0, 0.06])}`, opacity: pop, filter: pop < 1 ? `blur(${(1 - pop) * 24}px)` : undefined}}>
					<div style={{fontFamily: FONT, fontWeight: 700, fontSize: 300, letterSpacing: '-0.03em', lineHeight: 1, color: interpolateColors(f, [50, 66], [C.teal, C.text]), textShadow: '0 0 90px rgba(63,216,200,0.35)'}}>
						ce soir ?
					</div>
				</div>
			)}
		</>
	);
};

// 2 (60–100) : fond clair, la phrase du site, puis « a sa fiche » en grand.
const Intro2: S = ({f}) => (
	<>
		<Light f={f} />
		<div style={{...center, top: 300}}>
			<Kinetic f={f} size={96} from="#128A7C" to={C.ink} words={[{t: 'Chaque', at: 62}, {t: 'joueur', at: 66}, {t: 'classé', at: 70}]} style={{display: 'inline-block'}} />
		</div>
		<div style={{...center, top: 420, scale: `${interpolate(f, [76, 84], [1.3, 1], out) + Math.max(0, f - 76) * 0.002}`}}>
			<Kinetic f={f} size={270} weight={700} from="#128A7C" to={C.ink} words={[{t: 'a', at: 76}, {t: 'sa', at: 78}, {t: 'fiche', at: 81}]} style={{display: 'inline-block'}} />
		</div>
	</>
);

// 3 (100–345) : la vraie fiche du site (2684 × 1860) posée dans l'espace ; la caméra s'y promène et isole chaque mesure.
const IW = 2684;
const IH = 1860;
// image, cx, cy (point de la fiche au centre de l'écran), échelle, rotX, rotY
const CAM: number[][] = [
	[100, 1342, 930, 0.22, 42, -32],
	[132, 1342, 930, 0.56, 8, -6],
	[138, 1342, 930, 0.57, 7, -5],
	[152, 700, 1540, 1.25, 5, 9],
	[182, 720, 1560, 1.32, 4, 7],
	[192, 640, 1690, 1.75, 3, 6],
	[206, 660, 1690, 1.8, 3, 5],
	[214, 960, 1690, 1.8, 3, -4],
	[228, 980, 1690, 1.85, 3, -5],
	[240, 1330, 900, 0.95, 12, -10],
	[275, 1330, 900, 1.05, 9, 10],
	[286, 2250, 400, 1.3, 4, -12],
	[299, 2260, 410, 1.35, 4, -11],
	[308, 2250, 890, 1.25, 4, -11],
	[322, 2260, 900, 1.3, 4, -10],
	[336, 1342, 930, 0.56, 6, 0],
	[345, 1342, 930, 0.6, 4, 2],
];
const cam = (f: number, k: number) => interpolate(f, CAM.map((c) => c[0]), CAM.map((c) => c[k]), inOut);
// zones mises en lumière : x, y, largeur, hauteur, rayon (coordonnées de l'image), images de début et de fin
const SPOTS = [
	{x: 78, y: 1630, w: 162, h: 162, r: 81, a: 152, b: 185},
	{x: 258, y: 1616, w: 192, h: 190, r: 26, a: 194, b: 211},
	{x: 868, y: 1616, w: 196, h: 190, r: 26, a: 216, b: 231},
	{x: 1955, y: 150, w: 686, h: 462, r: 34, a: 288, b: 303},
	{x: 1955, y: 622, w: 686, h: 532, r: 34, a: 310, b: 326},
];
// titres repris de la page d'accueil (« score, probabilité, minutes attendues, profil au poste, stade en 3D »)
const CAPS = [
	{t: 'La fiche du joueur', a: 112, b: 138},
	{t: 'Braqueur Score', a: 150, b: 186},
	{t: 'Chance de réussite', a: 192, b: 212},
	{t: 'Écart avec les cotes', a: 214, b: 232},
	{t: 'Le stade du match en 3D', a: 240, b: 278},
	{t: 'Minutes attendues', a: 286, b: 304},
	{t: 'Profil au poste', a: 307, b: 327},
];
const Fiche: S = ({f}) => {
	const cap = CAPS.find((c) => f >= c.a && f < c.b);
	return (
		<>
			<Dark f={f} glow={0.9} />
			<AbsoluteFill style={{perspective: 2000}}>
				<div
					style={{
						position: 'absolute',
						left: 960,
						top: 540,
						width: IW,
						height: IH,
						transformOrigin: '0 0',
						transformStyle: 'preserve-3d',
						transform: `rotateX(${cam(f, 4)}deg) rotateY(${cam(f, 5)}deg) scale(${cam(f, 3)}) translate(${-cam(f, 1)}px, ${-cam(f, 2)}px)`,
					}}
				>
					<div style={{position: 'absolute', inset: 0, borderRadius: 46, overflow: 'hidden', boxShadow: '0 80px 200px rgba(0,0,0,0.7), 0 0 160px rgba(63,216,200,0.22)', border: '2px solid rgba(63,216,200,0.25)'}}>
						<Img src={staticFile('fiche-celebrini.webp')} style={{width: IW, height: IH, display: 'block'}} />
						{SPOTS.map((sp, i) => {
							const o = interpolate(f, [sp.a, sp.a + 6, sp.b - 4, sp.b], [0, 1, 1, 0], clamp);
							if (o <= 0) return null;
							const g = interpolate(f, [sp.a, sp.a + 8], [26, 0], out);
							return (
								<div
									key={i}
									style={{
										position: 'absolute',
										left: sp.x - g,
										top: sp.y - g,
										width: sp.w + g * 2,
										height: sp.h + g * 2,
										borderRadius: sp.r + g,
										opacity: o,
										border: `4px solid ${C.teal}`,
										boxShadow: `0 0 0 5000px rgba(8,14,24,0.62), 0 0 50px rgba(63,216,200,0.75), inset 0 0 30px rgba(63,216,200,0.25)`,
									}}
								/>
							);
						})}
					</div>
				</div>
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'linear-gradient(rgba(8,14,24,0.92), rgba(8,14,24,0) 30%)', opacity: interpolate(f, [108, 116], [0, 1], clamp)}} />
			{cap && (
				<div style={{...center, top: 62, opacity: interpolate(f, [cap.b - 3, cap.b], [1, 0], clamp)}}>
					<Kinetic key={cap.t} f={f} size={96} weight={700} words={cap.t.split(' ').map((t, j) => ({t, at: cap.a + j * 3}))} style={{display: 'inline-block', textShadow: '0 6px 40px rgba(8,14,24,0.9)'}} />
				</div>
			)}
		</>
	);
};

// 5 (345–378) : fond clair, l'offre du site.
const Free: S = ({f}) => (
	<>
		<Light f={f} />
		<div style={{...center, top: 330}}>
			<Kinetic f={f} size={92} from="#128A7C" to={C.ink} words={[{t: 'Le', at: 346}, {t: 'n° 1', at: 349}, {t: 'du', at: 353}, {t: 'jour', at: 355}]} style={{display: 'inline-block'}} />
		</div>
		<div style={{...center, top: 450, scale: `${interpolate(f, [359, 367], [1.3, 1], out) + (f - 359) * 0.002}`}}>
			<Kinetic f={f} size={250} weight={700} from="#128A7C" to={C.ink} words={[{t: 'est', at: 359}, {t: 'gratuit', at: 362}]} style={{display: 'inline-block'}} />
		</div>
	</>
);

// 6 (378–450) : un disque lumineux devient la pastille « LB », puis la marque, l'accroche, le bouton et l'adresse.
const End: S = ({f}) => {
	const pop = spring({frame: f - 380, fps: FPS, config: {damping: 13}});
	const morph = interpolate(f, [392, 403], [0, 1], inOut);
	const up = interpolate(f, [402, 414], [0, 1], inOut);
	const size = 300 - up * 150;
	const click = 428;
	const pressed = f >= click;
	const cur = interpolate(f, [414, click - 1], [0, 1], inOut);
	const ripple = interpolate(f, [click, click + 12], [0, 1], out);
	const cta = interpolate(f, [412, 420], [0, 1], out);
	return (
		<>
			<Dark f={f} glow={0.7 + morph * 0.5} />
			<div
				style={{
					position: 'absolute',
					left: 960 - size / 2,
					top: 540 - up * 300 - size / 2,
					width: size,
					height: size,
					scale: `${pop}`,
					borderRadius: `${50 - morph * 25}%`,
					background: C.bg2,
					boxShadow: `0 0 ${170 - up * 90}px ${70 - up * 50}px rgba(63,216,200,${0.55 - up * 0.25})`,
					overflow: 'hidden',
					rotate: `${(1 - morph) * -90}deg`,
				}}
			>
				<AbsoluteFill style={{background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`, opacity: morph}} />
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 700, fontSize: size * 0.42, color: C.ink, opacity: morph}}>LB</AbsoluteFill>
			</div>
			<div style={{...center, top: 345}}>
				<Kinetic f={f} size={150} weight={700} words={[{t: 'Le', at: 406}, {t: 'Braqueur', at: 409}]} style={{display: 'inline-block'}} />
			</div>
			<div style={{...center, top: 530}}>
				<Kinetic f={f} size={54} weight={400} from={C.teal} to={C.accent2} words={'Qui va marquer ce soir ?'.split(' ').map((t, i) => ({t, at: 413 + i * 2}))} style={{display: 'inline-block'}} />
			</div>
			<div style={{...center, top: 690, opacity: cta, translate: `0 ${(1 - cta) * 30}px`}}>
				<div
					style={{
						display: 'inline-block',
						position: 'relative',
						fontFamily: FONT,
						fontWeight: 600,
						fontSize: 44,
						padding: '24px 58px',
						borderRadius: 999,
						color: pressed ? C.ink : C.text,
						background: pressed ? `linear-gradient(90deg, ${C.teal}, ${C.green})` : 'rgba(28,42,62,0.6)',
						border: `2px solid ${pressed ? 'transparent' : 'rgba(63,216,200,0.55)'}`,
						scale: `${f === click || f === click + 1 ? 0.95 : 1}`,
						boxShadow: pressed ? '0 0 70px rgba(63,216,200,0.5)' : 'none',
					}}
				>
					Essai gratuit 7 jours
					{pressed && ripple < 1 && <div style={{position: 'absolute', inset: -ripple * 40, borderRadius: 999, border: `3px solid rgba(63,216,200,${1 - ripple})`}} />}
				</div>
			</div>
			<div style={{...center, top: 850, fontFamily: FONT, fontSize: 40, color: C.muted, opacity: interpolate(f, [418, 426], [0, 1], clamp)}}>lebraqueur.fr</div>
			<svg width={46} height={46} viewBox="0 0 24 24" style={{position: 'absolute', left: 1500 - cur * 400, top: 1010 - cur * 255, opacity: interpolate(f, [414, 418], [0, 1], clamp), scale: `${f === click ? 0.85 : 1}`}}>
				<path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke={C.ink} strokeWidth={1.2} />
			</svg>
		</>
	);
};

// Le plan 1 est écrit sur 80 images ; il est joué en 60 (×4/3).
const Hook60: S = ({f}) => <Hook f={(f * 4) / 3} />;

const SCENES: {start: number; end: number; C: S}[] = [
	{start: 0, end: 60, C: Hook60},
	{start: 60, end: 100, C: Intro2},
	{start: 100, end: 345, C: Fiche},
	{start: 345, end: 378, C: Free},
	{start: 378, end: 450, C: End},
];

// Poussière lumineuse très discrète au premier plan, pour donner de la profondeur aux plans sombres.
const Dust: React.FC<{f: number}> = ({f}) => (
	<AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.5}}>
		{Array.from({length: 26}).map((_, i) => {
			const x = random(`dx${i}`) * 1920;
			const y = (random(`dy${i}`) * 1080 - f * (0.4 + random(`ds${i}`) * 0.9) + 2160) % 1080;
			const s = 2 + random(`dz${i}`) * 5;
			return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, background: C.teal, opacity: 0.25 + random(`do${i}`) * 0.4, filter: `blur(${s / 3}px)`}} />;
		})}
	</AbsoluteFill>
);

export const Promo: React.FC = () => {
	const f = useCurrentFrame();
	const [ready, setReady] = useState(false);
	const [handle] = useState(() => delayRender('polices'));
	useEffect(() => {
		fontsLoaded.then(() => {
			setReady(true);
			continueRender(handle);
		});
	}, [handle]);
	if (!ready) return null;
	const sc = SCENES.find((s) => f < s.end) ?? SCENES[SCENES.length - 1];
	const dark = sc.C !== Intro2 && sc.C !== Free;
	return (
		<AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
			<Shot f={f} start={sc.start} end={sc.end === 450 ? 9999 : sc.end}>
				<sc.C f={f} />
			</Shot>
			{dark && <Dust f={f} />}
			<Html5Audio src={staticFile('musique-zoo-extrait.mp3')} trimBefore={MUSIC_TRIM} volume={musicVolume} />
		</AbsoluteFill>
	);
};

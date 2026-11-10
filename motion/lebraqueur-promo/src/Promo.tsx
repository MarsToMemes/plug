import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, interpolateColors, random, spring, useCurrentFrame} from 'remotion';
import {C, FONT, PLAYERS, clamp, fontsLoaded, fr, inOut, out} from './theme';
import {At, Dark, Kinetic, Light, Pill, PlayerCard, World, cut} from './ui';

const FPS = 30;
type S = React.FC<{f: number}>;

const Shot: React.FC<{f: number; start: number; end: number; children: React.ReactNode}> = ({f, start, end, children}) => {
	const c = cut(f, start, end);
	return <AbsoluteFill style={{scale: `${c.scale}`, opacity: c.opacity, filter: c.blur > 0.3 ? `blur(${c.blur}px)` : undefined}}>{children}</AbsoluteFill>;
};

const center: React.CSSProperties = {position: 'absolute', left: 0, right: 0, textAlign: 'center'};

// 1 (0–80) : l'accroche, mot à mot, puis « ce soir ? » en grand ; étiquettes du site qui flottent en profondeur.
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

// 2 (80–160) : fond clair, la promesse, puis « joueur / par / joueur » en mots géants au milieu de cartes qui dérivent.
const MINI = [
	{i: 1, x: 150, y: 190, z: -200, ry: 24},
	{i: 2, x: 1800, y: 170, z: -420, ry: -22},
	{i: 0, x: 230, y: 960, z: -520, ry: 18},
	{i: 3, x: 1720, y: 930, z: -120, ry: -26},
];
const GIANT = [
	{t: 'joueur', at: 114},
	{t: 'par', at: 127},
	{t: 'joueur', at: 138},
];
const Promise2: S = ({f}) => {
	const g = [...GIANT].reverse().find((w) => f >= w.at);
	return (
		<>
			<Light f={f} />
			{f < 114 ? (
				<div style={{...center, top: 490}}>
					<Kinetic
						f={f}
						size={104}
						from="#128A7C"
						to={C.ink}
						words={[{t: 'Le', at: 84}, {t: 'classement', at: 88}, {t: 'statistique', at: 94}, {t: 'du', at: 100}, {t: 'jour', at: 103}]}
						style={{display: 'inline-block'}}
					/>
				</div>
			) : (
				<>
					<World ry={interpolate(f, [114, 160], [7, -7])} z={interpolate(f, [114, 160], [-80, 140])}>
						{MINI.map((m, k) => {
							const a = interpolate(f, [114 + k * 3, 126 + k * 3], [0, 1], out);
							return (
								<At key={k} x={m.x} y={m.y + (1 - a) * 120} z={m.z} ry={m.ry} s={0.62} style={{opacity: a, filter: `blur(${-m.z / 150}px)`}}>
									<PlayerCard p={PLAYERS[m.i]} light />
								</At>
							);
						})}
					</World>
					{g && (
						<div
							style={{
								...center,
								top: 300,
								fontFamily: FONT,
								fontWeight: 700,
								fontSize: 400,
								lineHeight: 1,
								letterSpacing: '-0.04em',
								scale: `${interpolate(f, [g.at, g.at + 7], [1.25, 1], out) + (f - g.at) * 0.003}`,
								filter: f - g.at < 5 ? `blur(${(5 - (f - g.at)) * 4}px)` : undefined,
								color: 'transparent',
								backgroundImage: `linear-gradient(${C.ink} 35%, rgba(11,20,32,0.28))`,
								WebkitBackgroundClip: 'text',
								backgroundClip: 'text',
							}}
						>
							{g.t}
						</div>
					)}
				</>
			)}
		</>
	);
};

// 3 (160–262) : les quatre sports ; la caméra glisse le long des cartes en 3D, le titre change avec la carte active.
const T3 = [165, 188, 211, 234, 256];
const Sports: S = ({f}) => {
	const pos = interpolate(f, [165, 184, 188, 207, 211, 230, 234, 262], [0, 0, 1, 1, 2, 2, 3, 3], inOut);
	const idx = Math.min(3, T3.findIndex((t, i) => f < T3[i + 1]) < 0 ? 3 : T3.findIndex((t, i) => f < T3[i + 1]));
	const lift = interpolate(f, [250, 262], [0, 1], {...clamp});
	const p = PLAYERS[idx];
	return (
		<>
			<Dark f={f} glow={0.8} />
			<World ry={interpolate(pos, [0, 3], [20, -20])} rx={6 + lift * 46} x={(1.5 - pos) * 400} y={60 - lift * 120} z={-30 - lift * 600}>
				{PLAYERS.map((pl, i) => {
					const act = Math.max(0, 1 - Math.abs(pos - i));
					const k = interpolate(f, [162 + i * 4, 190 + i * 4], [0, 1], out);
					const a = interpolate(f, [160 + i * 3, 172 + i * 3], [0, 1], out);
					return (
						<At key={i} x={960 + (i - 1.5) * 500} y={590 + (1 - a) * 200} z={act * 170 - 60} ry={(i - pos) * -9} style={{opacity: a * (0.55 + act * 0.45), filter: act < 0.5 ? `blur(${(0.5 - act) * 5}px)` : undefined}}>
							<PlayerCard p={pl} k={k} active={act} />
						</At>
					);
				})}
			</World>
			<div style={{...center, top: 70, opacity: 1 - lift}}>
				<Kinetic key={idx} f={f} size={96} weight={700} words={[{t: p.title, at: T3[idx]}]} style={{display: 'inline-block'}} />
				<Kinetic key={`s${idx}`} f={f} size={40} weight={400} from={C.teal} to={C.muted} words={[{t: p.sub, at: T3[idx] + 4}]} style={{marginTop: 4}} />
			</div>
		</>
	);
};

// 4 (262–345) : le Braqueur Score ; un anneau se trace et compte, les trois mesures du site s'affichent, puis on traverse l'anneau.
const R = 230;
const CIRC = 2 * Math.PI * R;
const Score: S = ({f}) => {
	const p = PLAYERS[1];
	const k = interpolate(f, [266, 304], [0, 1], out);
	const zoom = interpolate(f, [333, 345], [0, 1], {...clamp, easing: (t) => t * t * t});
	const rows = [
		{t: 'Braqueur Score', at: 280},
		{t: 'Chance de réussite', at: 294},
		{t: 'Écart avec les cotes', at: 308},
	];
	return (
		<AbsoluteFill style={{scale: `${1 + zoom * 16}`, transformOrigin: '590px 540px'}}>
			<Dark f={f} />
			<World ry={interpolate(f, [262, 345], [16, 4])} rx={interpolate(f, [262, 345], [5, 0])} z={interpolate(f, [262, 345], [240, 330])}>
				<At x={590} y={540} z={40}>
					<svg width={620} height={620} viewBox="-310 -310 620 620" style={{overflow: 'visible'}}>
						<defs>
							<linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
								<stop offset="0" stopColor={C.accent2} />
								<stop offset="1" stopColor={C.teal} />
							</linearGradient>
						</defs>
						<circle r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={30} />
						<circle
							r={R}
							fill="none"
							stroke="url(#ring)"
							strokeWidth={30}
							strokeLinecap="round"
							strokeDasharray={CIRC}
							strokeDashoffset={CIRC * (1 - (p.score / 100) * k)}
							transform="rotate(-90)"
							style={{filter: 'drop-shadow(0 0 24px rgba(63,216,200,0.55))'}}
						/>
					</svg>
					<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: C.text, opacity: 1 - zoom * 3}}>
						<div style={{fontSize: 24, color: C.muted}}>score</div>
						<div style={{fontSize: 168, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums'}}>{fr(p.score * k)}</div>
						<div style={{fontSize: 30, fontWeight: 600, marginTop: 6}}>{p.name}</div>
						<div style={{fontSize: 22, color: C.muted}}>{p.match}</div>
					</div>
				</At>
				<At x={1330} y={540} z={-40} style={{opacity: 1 - zoom * 3}}>
					<div style={{width: 760}}>
						{rows.map((r, i) => (
							<div key={i} style={{display: 'flex', alignItems: 'center', gap: 26, margin: '34px 0'}}>
								<div
									style={{
										width: 18,
										height: 18,
										borderRadius: 9,
										background: C.teal,
										boxShadow: '0 0 22px rgba(63,216,200,0.8)',
										scale: `${spring({frame: f - r.at, fps: FPS, config: {damping: 11}})}`,
									}}
								/>
								<Kinetic f={f} size={66} words={r.t.split(' ').map((t, j) => ({t, at: r.at + j * 3}))} />
							</div>
						))}
					</div>
				</At>
			</World>
		</AbsoluteFill>
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

const SCENES: {start: number; end: number; C: S}[] = [
	{start: 0, end: 80, C: Hook},
	{start: 80, end: 160, C: Promise2},
	{start: 160, end: 262, C: Sports},
	{start: 262, end: 345, C: Score},
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
	const dark = sc.C !== Promise2 && sc.C !== Free;
	return (
		<AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
			<Shot f={f} start={sc.start} end={sc.end === 450 ? 9999 : sc.end}>
				<sc.C f={f} />
			</Shot>
			{dark && <Dust f={f} />}
		</AbsoluteFill>
	);
};

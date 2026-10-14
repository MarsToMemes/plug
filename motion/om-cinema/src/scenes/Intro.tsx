import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {Brush, DarkBg, Dots, Grain, HBlur, Logo, Skyline, Topo} from '../fx';
import {CinemaGoalProps} from '../props';
import {FONT, P, clamp} from '../theme';

// Rangée de lettres espacées qui se complète une lettre par image, dans un ordre mélangé.
const LetterRow: React.FC<{text: string; y: number; f: number; start: number; seed: string}> = ({text, y, f, start, seed}) => {
	const chars = text.split('');
	const order = chars.map((_, i) => i).sort((a, b) => random(`${seed}${a}`) - random(`${seed}${b}`));
	const shown = Math.max(0, Math.floor((f - start) * 1.6));
	const visible = new Set(order.slice(0, shown));
	const step = 118;
	const x0 = 960 - ((chars.length - 1) * step) / 2;
	return (
		<>
			{chars.map((c, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: x0 + i * step - 40,
						width: 80,
						top: y - 34,
						textAlign: 'center',
						fontFamily: FONT.smallBold,
						fontWeight: 700,
						fontSize: 58,
						color: P.white,
						opacity: visible.has(i) ? 1 : 0,
					}}
				>
					{c}
				</div>
			))}
		</>
	);
};

// Temps 1 (f0–14) : logo qui s'assemble.
export const LogoBuild: React.FC<{p: CinemaGoalProps}> = ({p}) => {
	const f = useCurrentFrame();
	const line = interpolate(f, [1, 3.5], [0, 1], clamp);
	const logoSize = f < 10 ? 780 : interpolate(f, [10, 14], [780, 520], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<AbsoluteFill>
			<DarkBg drift={f * 0.8} />
			{/* panneau noir à bords déchirés, ville en filigrane */}
			{f >= 3 && (
				<Brush x={960 - 450} y={540 - 380} w={900} h={760} color="#060709" variant={1} rotate={90}>
					<div style={{position: 'absolute', inset: 0, rotate: '-90deg', scale: '1.2'}}>
						<Skyline color="#2C3038" style={{left: -60, top: 140, width: 1000, height: 420}} />
					</div>
				</Brush>
			)}
			{/* ligne fine qui se trace, puis bande pleine avec la ville en lettres contour géantes */}
			{f < 4 ? (
				<div style={{position: 'absolute', left: 0, top: 539, height: 2, width: 1920 * line, background: P.club}} />
			) : (
				<Brush x={-60} y={500} w={2040} h={80} color={P.club} variant={2}>
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: -150,
							whiteSpace: 'nowrap',
							fontFamily: FONT.black,
							fontWeight: 900,
							fontSize: 360,
							letterSpacing: 20,
							color: 'transparent',
							WebkitTextStroke: `3px ${P.clubDark}`,
							translate: `${-f * 6}px 0`,
						}}
					>
						{`${p.city} ${p.city}`}
					</div>
				</Brush>
			)}
			{f >= 5 && (
				<div style={{position: 'absolute', left: 960 - logoSize / 2, top: 540 - logoSize / 2}}>
					<Logo size={logoSize} color={P.white} kind="contour" style={{filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.6))'}} />
				</div>
			)}
			<LetterRow text={p.clubTop} y={92} f={f} start={2} seed="top" />
			<LetterRow text={p.clubBottom} y={990} f={f} start={3} seed="bot" />
			{f >= 10 && <Dots n={2} />}
			<Grain />
		</AbsoluteFill>
	);
};

// Ligne du slogan qui entre de la gauche avec flou de mouvement.
const SloganLine: React.FC<{text: string; f: number; start: number; y: number; id: string}> = ({text, f, start, y, id}) => {
	const pos = (t: number) => interpolate(t, [start, start + 9], [-700, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	const x = pos(f);
	const v = Math.abs(x - pos(f - 1));
	const style: React.CSSProperties = {
		position: 'absolute',
		left: 110,
		top: y,
		whiteSpace: 'nowrap',
		fontFamily: FONT.blackItalic,
		fontStyle: 'italic',
		fontWeight: 900,
		fontSize: 330,
		lineHeight: 1,
		letterSpacing: 4,
	};
	return (
		<HBlur id={id} amount={v * 0.35} style={{translate: `${x}px 0`, opacity: f < start ? 0 : 1}}>
			{/* ombre noire décalée + contour */}
			<div style={{...style, color: '#000', translate: '-14px 14px', WebkitTextStroke: '10px #000'}}>{text}</div>
			<div style={{...style, color: P.white, WebkitTextStroke: '2px #000'}}>{text}</div>
		</HBlur>
	);
};

// Rangée de logos sur la bande noire, qui se remplissent un par un.
export const LogoRow: React.FC<{f: number; start: number; y: number; size?: number; gap?: number; x0?: number}> = ({
	f,
	start,
	y,
	size = 80,
	gap = 160,
	x0 = 120,
}) => (
	<>
		{Array.from({length: 11}).map((_, i) => (
			<div key={i} style={{position: 'absolute', left: x0 + i * gap, top: y - size / 2}}>
				<Logo size={size} color={P.white} kind={f >= start + i * 0.7 ? 'plein' : 'contour'} />
			</div>
		))}
	</>
);

// Temps 2 (f15–36) : slogan du club.
export const Slogan: React.FC<{p: CinemaGoalProps; from: number}> = ({p, from}) => {
	const f = useCurrentFrame() + from;
	const band = interpolate(f, [30, 35], [-1900, 110], {...clamp, easing: Easing.out(Easing.cubic)});
	const linkIn = interpolate(f, [25, 29], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
	return (
		<AbsoluteFill style={{background: P.club}}>
			<Topo opacity={0.16} drift={-f} />
			{/* bande verticale claire */}
			<Brush x={850 - 640} y={540 - 400} w={1280} h={800} color={P.clubLight} variant={0} rotate={90} />
			{/* skyline en duotone */}
			<div style={{position: 'absolute', left: 1250, top: 0, width: 470, height: 1080, overflow: 'hidden', background: `linear-gradient(${P.clubDark}, ${P.deep})`}}>
				<Skyline color={P.night} style={{left: -900, top: 300, width: 1700, height: 780, opacity: 0.85}} />
				<AbsoluteFill style={{background: `linear-gradient(transparent 50%, ${P.club}55)`}} />
			</div>
			<Brush x={1810 - 640} y={540 - 130} w={1280} h={260} color={P.ink} variant={2} rotate={90} />
			<SloganLine text={p.slogan.top} f={f} start={15} y={150} id="sl1" />
			<SloganLine text={p.slogan.bottom} f={f} start={17} y={430} id="sl2" />
			<div
				style={{
					position: 'absolute',
					left: 920,
					top: 400,
					fontFamily: FONT.blackItalic,
					fontStyle: 'italic',
					fontWeight: 900,
					fontSize: 110,
					color: P.white,
					WebkitTextStroke: '6px #000',
					paintOrder: 'stroke',
					scale: `${linkIn}`,
					opacity: linkIn > 0.01 ? 1 : 0,
				}}
			>
				{p.slogan.link}
			</div>
			{f >= 30 && (
				<Brush x={band} y={470 - 130} w={1700} h={260} color="#050608" variant={1}>
					<LogoRow f={f} start={31} y={130} x0={60} />
				</Brush>
			)}
			<Grain />
		</AbsoluteFill>
	);
};

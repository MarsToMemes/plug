import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Brush, DarkBg, Grain, HBlur, Logo, Ticker} from '../fx';
import {CinemaGoalProps} from '../props';
import {FONT, P, clamp} from '../theme';
import {LogoRow} from './Intro';

type Cam = {x: number; y: number; s: number};

// Repli photo d'un rush : fond rebouché et joueur détouré sur deux calques, poussés à des vitesses différentes autour
// d'un point (le visage) pour donner une impression de mouvement de caméra. Étalonnage vers le bleu du club.
export const Parallax: React.FC<{
	plate: string;
	player: string;
	w: number;
	h: number;
	cam: Cam; // position du point d'intérêt de la photo (px source) → placé en (cam.x, cam.y) du cadre, échelle s
	focus: {x: number; y: number};
	plateCam?: Cam;
	push: number; // 0 → 1 sur la durée du plan
	plateBlur?: number;
	playerBlur?: number;
	tint?: number;
}> = ({plate, player, w, h, cam, focus, plateCam, push, plateBlur = 10, playerBlur = 0, tint = 0.55}) => {
	const layer = (c: Cam, k: number, src: string, blur: number, extra?: React.CSSProperties) => {
		const s = c.s * (1 + k * push);
		return (
			<Img
				src={staticFile(src)}
				style={{
					position: 'absolute',
					width: w * s,
					height: h * s,
					left: c.x - focus.x * s,
					top: c.y - focus.y * s,
					filter: `blur(${blur}px) contrast(1.1) saturate(1.05) brightness(0.92)`,
					...extra,
				}}
			/>
		);
	};
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: P.night}}>
			{layer(plateCam ?? cam, 0.04, plate, plateBlur)}
			{/* le fond passe dans le bleu du club (tue le rouge des tribunes) */}
			<AbsoluteFill style={{background: P.clubDark, mixBlendMode: 'color', opacity: tint}} />
			<AbsoluteFill style={{background: `linear-gradient(${P.night}cc, transparent 45%, ${P.night}99)`}} />
			{layer(cam, 0.1, player, playerBlur, {filter: `blur(${playerBlur}px) contrast(1.12) saturate(1.05) brightness(0.95)`})}
			<AbsoluteFill style={{background: P.club, mixBlendMode: 'soft-light', opacity: 0.3}} />
		</AbsoluteFill>
	);
};

// Temps 3 (f37–61) : rush 1 entre des bandes verticales déchirées.
export const Rush1: React.FC<{p: CinemaGoalProps; from: number}> = ({p, from}) => {
	const f = useCurrentFrame() + from;
	const push = interpolate(f, [38, 61], [0, 1], clamp);
	const wipe = interpolate(f, [38, 42], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const sideIn = interpolate(f, [41, 45], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const photo = (
		<Parallax
			plate={p.actionPlate}
			player={p.actionPhoto}
			w={1763}
			h={1753}
			focus={{x: 1040, y: 420}}
			cam={{x: 1010, y: 400, s: 1.45}}
			push={push}
			plateBlur={14}
			playerBlur={interpolate(f, [38, 50, 61], [9, 3, 2], clamp)}
		/>
	);
	return (
		<AbsoluteFill style={{background: P.ink}}>
			{f === 37 ? (
				<>
					<DarkBg />
					<Brush x={480} y={170} w={820} h={740} color={P.club} variant={2} />
					<Brush x={110} y={340} w={1700} h={260} color="#050608" variant={1}>
						<LogoRow f={99} start={0} y={130} x0={60} />
					</Brush>
				</>
			) : (
				<>
					{photo}
					{/* volets : bandes verticales qui balaient de droite à gauche */}
					{wipe < 1 &&
						[0, 1, 2].map((i) => (
							<Brush
								key={i}
								x={2100 - wipe * 3000 + i * 420 - 700}
								y={540 - 260}
								w={1400}
								h={520}
								color={i === 1 ? P.clubDark : P.club}
								variant={i}
								rotate={90}
							/>
						))}
					{/* bandes de cadre gauche et droite, avec logos */}
					{[350, 1680].map((cx, i) => (
						<Brush key={cx} x={cx - 660} y={540 - 75} w={1320} h={150} color={P.club} variant={i + 1} rotate={90} style={{opacity: sideIn}}>
							<div style={{position: 'absolute', left: 630, top: 45, rotate: '-90deg'}}>
								<Logo size={60} color={P.white} kind="plein" />
							</div>
						</Brush>
					))}
					{/* bord droit : bande noire et slogan vertical qui défile */}
					<div style={{position: 'absolute', left: 1860, top: 0, width: 60, height: 1080, background: '#050608', opacity: sideIn}}>
						<Ticker text={`${p.slogan.top} ${p.slogan.link} ${p.slogan.bottom}`} y={0} x={18} vertical speed={5} size={16} />
					</div>
				</>
			)}
			<Grain />
		</AbsoluteFill>
	);
};

// Temps 4 (f62–90) : « BUT » géant sur le rush de célébration.
export const GoalWord: React.FC<{p: CinemaGoalProps; from: number}> = ({p, from}) => {
	const f = useCurrentFrame() + from;
	const push = interpolate(f, [62, 90], [0, 1], clamp);
	const grow = interpolate(f, [70, 90], [1, 1.35], {...clamp, easing: Easing.in(Easing.quad)});
	const letters = p.goalWord.split('');
	const size = 800;
	const letterW = 390;
	const echo = interpolate(f, [76, 80], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<Parallax
				plate={p.celebPlate}
				player={p.celebPhoto}
				w={1200}
				h={1200}
				focus={{x: 560, y: 340}}
				cam={{x: 1430, y: 400, s: 1.3}}
				plateCam={{x: 1430, y: 400, s: 1.75}}
				push={push}
				plateBlur={12}
				playerBlur={interpolate(f, [62, 68], [6, 0], clamp)}
				tint={0.45}
			/>
			<AbsoluteFill style={{background: `linear-gradient(transparent 45%, ${P.club}bb)`, mixBlendMode: 'multiply'}} />
			{/* le mot */}
			<div style={{position: 'absolute', left: 60, bottom: 230, width: 1800, height: 600, scale: `${grow}`, transformOrigin: '0% 100%'}}>
				{/* écho au-dessus */}
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: -620,
						fontFamily: FONT.black,
						fontWeight: 900,
						fontSize: size,
						lineHeight: 1,
						color: 'transparent',
						WebkitTextStroke: `3px ${P.white}`,
						opacity: echo * 0.55,
						letterSpacing: 10,
					}}
				>
					{p.goalWord}
				</div>
				{letters.map((c, i) => {
					const t0 = 62 + i * 2;
					const pos = (t: number) => interpolate(t, [t0, t0 + 6], [-260, 0], {...clamp, easing: Easing.out(Easing.cubic)});
					const x = pos(f);
					const v = Math.abs(x - pos(f - 1));
					const white = interpolate(f, [70 + i * 3, 74 + i * 3], [0, 1], clamp);
					const op = f < t0 ? 0 : i === 0 ? 1 : interpolate(white, [0, 1], [0.55, 1]);
					const glyph = (extra: React.CSSProperties) => (
						<div
							style={{
								position: 'absolute',
								left: i * letterW,
								top: -140,
								fontFamily: FONT.black,
								fontWeight: 900,
								fontSize: size,
								lineHeight: 1,
								...extra,
							}}
						>
							{c}
						</div>
					);
					const col = i === 0 || white >= 1 ? P.white : white > 0 ? P.white : '#9CCBF2';
					return (
						<HBlur key={i} id={`but${i}`} amount={v * 0.4} style={{translate: `${x}px 0`, opacity: op}}>
							{white < 1 && glyph({color: col, opacity: 0.35 * (1 - white), translate: '-80px 0', filter: 'blur(6px)'})}
							{glyph({color: col, filter: white < 1 && i > 0 ? `blur(${(1 - white) * 4}px)` : undefined})}
						</HBlur>
					);
				})}
			</div>
			{/* bandes de pinceau haut et bas */}
			<Brush x={-80} y={-70} w={2080} h={130} color={P.club} variant={0} />
			<Brush x={-80} y={930} w={2080} h={190} color={P.club} variant={2} flip />
			<div style={{position: 'absolute', right: 70, top: 70, opacity: echo}}>
				<Logo size={90} color={P.white} kind="contour" />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 1000,
					textAlign: 'center',
					fontFamily: FONT.blackItalic,
					fontStyle: 'italic',
					fontWeight: 900,
					fontSize: 40,
					letterSpacing: 4,
					color: P.white,
					opacity: echo,
				}}
			>
				{`${p.slogan.top} ${p.slogan.link} ${p.slogan.bottom}`}
			</div>
			<Grain />
		</AbsoluteFill>
	);
};

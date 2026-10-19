import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stroke} from '../fx/Lines';
import {F, P, clamp} from '../theme';

// Rouleau de chiffres : colonne 0–9 répétée, translatée ; value continu (on voit deux chiffres coupés en défilant).
export const DigitReel: React.FC<{value: number; w: number; h: number; bg: string; fg: string; size: number}> = ({value, w, h, bg, fg, size}) => (
	<div style={{width: w, height: h, overflow: 'hidden', background: bg, position: 'relative'}}>
		<div style={{position: 'absolute', left: 0, right: 0, top: 0, translate: `0px ${-value * h}px`}}>
			{Array.from({length: 40}, (_, i) => (
				<div key={i} style={{height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.big, fontWeight: 700, fontSize: size, lineHeight: 1, color: fg}}>
					{i % 10}
				</div>
			))}
		</div>
	</div>
);

// Temps 5 (f57–75) : case(s) qui s'ouvrent, chiffres qui roulent jusqu'au numéro, flèche, sortie avec écho.
export const Reels: React.FC<{offset: number; number: string}> = ({offset, number}) => {
	const f = useCurrentFrame() + offset;
	const digits = number.split('').map(Number);
	const W = 390;
	const H = 600;
	const gap = 20;
	const total = digits.length * W + (digits.length - 1) * gap;
	const curtain = interpolate(f, [57, 60], [0, 100], clamp);
	const out = f >= 74 ? (f - 73) * 380 : 0;
	const box = (dx: number, opacity = 1) => (
		<div style={{position: 'absolute', left: 540 - total / 2 + dx, top: 260, display: 'flex', gap, opacity}}>
			{digits.map((d, i) => {
				const settle = 63 + i * 4;
				const v = interpolate(f, [58, settle, settle + 1, settle + 2], [d + 10 * (3 + i) - 26, d + 10 * (3 + i) + 0.15, d + 10 * (3 + i) - 0.06, d + 10 * (3 + i)], {...clamp, easing: Easing.out(Easing.cubic)});
				return (
					<div key={i} style={{position: 'relative', width: W, height: H}}>
						{f === 57 ? <div style={{position: 'absolute', left: 0, top: H / 4, width: W, height: H / 2, background: P.white}} /> : null}
						{f >= 58 ? (
							<div style={{clipPath: `inset(0 0 ${100 - curtain}% 0)`}}>
								<DigitReel value={v} w={W} h={H} bg={P.ink} fg={P.white} size={520} />
							</div>
						) : null}
						{f >= 58 && curtain < 100 ? <div style={{position: 'absolute', left: 0, top: `${curtain}%`, width: W, height: H / 3, background: P.white}} /> : null}
					</div>
				);
			})}
		</div>
	);
	const arrowP = interpolate(f, [71, 74], [0, 1], clamp);
	return (
		<AbsoluteFill style={{background: P.red}}>
			{f >= 74 ? box(out * 0.5, 0.45) : null}
			{box(out)}
			<svg viewBox="0 0 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0}}>
				{f >= 69 && f < 71 ? <Stroke id="rl-v" d="M60 210 V 120" len={90} p={1} color={P.ink} arrow /> : null}
				{f >= 71 ? <Stroke id="rl-h" d="M60 160 H 1000" len={940} p={arrowP} color={P.ink} arrow /> : null}
			</svg>
		</AbsoluteFill>
	);
};

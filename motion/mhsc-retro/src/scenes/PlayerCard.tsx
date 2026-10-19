import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../fx/Grain';
import {HalftonePatch} from '../fx/Halftone';
import {F, Palette, clamp} from '../theme';

// Scène 4 (f110–270) : la carte joueur s'assemble puis tient ≈ 5 s.
// Panneau : 16 sommets ; à f110 bord gauche dentelé (silhouette d'épaule), redressé image par image jusqu'à f117.
const PANEL: [number, number][] = [
	[600, 190], [1110, 190], [984, 1090], [540, 1090], [540, 980], [540, 860], [540, 740], [540, 620],
	[540, 500], [540, 400], [540, 300], [540, 250], [570, 250], [600, 250], [600, 220], [600, 200],
];
const JAG: [number, number][] = [
	[0, 60], [0, 0], [0, 0], [-120, 0], [-40, 0], [-160, 0], [-60, 0], [-180, 0],
	[-90, 0], [-200, 40], [-130, 80], [-60, 160], [-20, 120], [-40, 90], [-20, 60], [-10, 40],
];
// bande diagonale crème qui coupe le bord droit du panneau
const STRIPE = '1110,190 1170,190 1044,1090 984,1090';

export const PlayerCard: React.FC<{
	firstName: string;
	lastName: string;
	number: string;
	subtitle: string;
	ringText: string;
	photo: string;
	P: Palette;
}> = ({firstName, lastName, number, subtitle, ringText, photo, P}) => {
	const f = useCurrentFrame() + 110;
	const morph = Math.min(1, Math.floor(f - 110) / 7); // 1 étape par image
	const panel = PANEL.map(([x, y], i) => `${x + JAG[i][0] * (1 - morph)},${y + JAG[i][1] * (1 - morph)}`).join(' ');
	const typed = (text: string, start: number) => {
		const shown = Math.max(0, Math.floor((f - start) / 2));
		return (
			<>
				{text.slice(0, shown)}
				<span style={{visibility: 'hidden'}}>{text.slice(shown)}</span>
			</>
		);
	};
	const photoOn = f >= 116 && f !== 117;
	const push = interpolate(f, [118, 270], [1, 1.05], clamp);
	const drift = interpolate(f, [118, 270], [0, 20], clamp);
	const ringRot = f * 0.1;
	return (
		<AbsoluteFill style={{background: P.hot}}>
			{/* anneau d'écusson qui tourne, CHAUD foncé */}
			<svg viewBox="0 0 1200 1200" width={1200} height={1200} style={{position: 'absolute', inset: 0}}>
				<defs>
					<path id="ring-path" d="M150 380 m -330 0 a 330 330 0 1 1 660 0 a 330 330 0 1 1 -660 0" />
				</defs>
				<g transform={`rotate(${ringRot} 150 380)`} opacity={0.5}>
					<circle cx={150} cy={380} r={420} fill="none" stroke="#c4521a" strokeWidth={26} />
					<circle cx={150} cy={380} r={250} fill="none" stroke="#c4521a" strokeWidth={14} />
					<text fontFamily={F.cond} fontWeight={900} fontSize={110} fill="#c4521a" letterSpacing={10}>
						<textPath href="#ring-path">{`${ringText} · ${ringText} · `}</textPath>
					</text>
				</g>
			</svg>
			<HalftonePatch id="pc-tl" color={P.dark} x={0} y={50} w={420} h={300} from={[0, 0]} to={[0.6, 0.7]} opacity={0.35} />
			{/* panneau + bande diagonale */}
			<svg viewBox="0 0 1200 1200" width={1200} height={1200} style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="pc-panel-fade" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0.72" stopColor={P.hot} stopOpacity={0} />
						<stop offset="1" stopColor={P.hot} stopOpacity={0.75} />
					</linearGradient>
					<linearGradient id="pc-num" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0.35" stopColor={P.cream} />
						<stop offset="1" stopColor="#F4C7A2" />
					</linearGradient>
				</defs>
				<polygon points={panel} fill={P.dark} />
				{morph >= 1 ? <polygon points={panel} fill="url(#pc-panel-fade)" /> : null}
				<polygon points={STRIPE} fill={P.cream} />
				<text x={815} y={905} textAnchor="middle" fontFamily={F.cond} fontWeight={900} fontSize={600} fill="url(#pc-num)">
					{number}
				</text>
			</svg>
			<HalftonePatch id="pc-panel" color={P.hot} x={540} y={880} w={460} h={210} from={[0.5, 1]} to={[0.5, 0]} opacity={0.55} />
			{/* textes */}
			<div style={{position: 'absolute', left: 664, top: 286, fontFamily: F.small, fontWeight: 600, fontSize: 46, letterSpacing: '0.28em', color: P.hot, whiteSpace: 'nowrap'}}>
				{f >= 117 ? typed(firstName, 117) : null}
			</div>
			<div style={{position: 'absolute', left: 640, top: 352, width: 470, height: 86}}>
				{f >= 113 ? (
					<svg viewBox="0 0 470 86" width={470} height={86} style={{position: 'absolute', inset: 0}}>
						<polygon points="14,0 470,0 456,86 0,86" fill={P.hot} />
					</svg>
				) : null}
				<div style={{position: 'absolute', left: 26, top: 4, fontFamily: F.cond, fontWeight: 900, fontSize: 76, lineHeight: 1, letterSpacing: '0.03em', color: P.cream, whiteSpace: 'nowrap'}}>
					{f >= 115 ? typed(lastName, 115) : null}
				</div>
			</div>
			<div style={{position: 'absolute', left: 664, top: 930, fontFamily: F.small, fontWeight: 600, fontSize: 30, letterSpacing: '0.12em', color: P.cream}}>{subtitle}</div>
			<Img src={staticFile('club/ecusson.png')} style={{position: 'absolute', left: 925, top: 690, width: 140, height: 140}} />
			{/* joueur détouré, en stroboscope puis lente poussée */}
			<Img
				src={staticFile(photo)}
				style={{
					position: 'absolute',
					left: -130,
					top: 160,
					height: 930,
					opacity: photoOn ? 1 : 0,
					transformOrigin: '50% 100%',
					scale: String(push),
					translate: `${drift}px 0px`,
				}}
			/>
			{/* bandes du bas et du haut */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 50, background: P.dark}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 1090, height: 60, background: P.dark}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 1150, height: 50, background: P.cream}} />
			<Grain id="card" dark={P.dark} light={P.cream} />
		</AbsoluteFill>
	);
};

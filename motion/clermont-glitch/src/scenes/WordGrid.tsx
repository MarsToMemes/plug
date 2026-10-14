import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {F, P} from '../theme';

// Temps 4 (f36–56) : 5 lignes du mot sur fond sombre, puis sur le portrait ; les lettres s'écartent en colonnes
// par paliers, puis le portrait et les colonnes se découpent en bandes verticales décalées.
const ROWS = [90, 300, 510, 720, 930];

export const WordGrid: React.FC<{offset: number; word: string; portrait: string}> = ({offset, word, portrait}) => {
	const f = useCurrentFrame() + offset;
	const n = word.length;
	const colW = 1080 / n;
	if (f <= 37) {
		return (
			<AbsoluteFill style={{background: f === 36 ? P.ink : P.red}}>
				{ROWS.map((y, i) => (
					<div
						key={y}
						style={{position: 'absolute', left: '50%', top: y + 30, translate: '-50% -50%', fontFamily: F.big, fontWeight: 700, fontSize: 290, lineHeight: 0.8, color: P.white, whiteSpace: 'nowrap', clipPath: i === 0 ? 'inset(50% 0 0 0)' : i === 4 ? 'inset(0 0 50% 0)' : undefined}}
					>
						{word}
					</div>
				))}
			</AbsoluteFill>
		);
	}
	// écart des lettres : la ligne i commence à s'écarter à l'image 40 + i, en 2 paliers
	const spread = (row: number) => (f < 39 ? 0 : Math.min(1, Math.max(0, Math.floor((f - 40 - row) / 2 + 1) / 2)));
	const tight = 92; // écart entre lettres serrées (px)
	const letters = (
		<>
			{ROWS.map((y, row) =>
				word.split('').map((ch, i) => {
					const xTight = 540 + (i - (n - 1) / 2) * tight;
					const xCol = colW * (i + 0.5);
					const s = spread(row);
					return (
						<div key={`${row}-${i}`} style={{position: 'absolute', left: xTight + (xCol - xTight) * s, top: y, translate: '-50% -50%', fontFamily: F.big, fontWeight: 700, fontSize: 150, lineHeight: 0.8, color: P.white}}>
							{ch}
						</div>
					);
				}),
			)}
		</>
	);
	const scene = (
		<AbsoluteFill style={{background: f === 38 ? P.ink : P.red}}>
			{f >= 39 ? <Img src={staticFile(portrait)} style={{position: 'absolute', left: -60, top: -20, width: 1200, height: 1200, objectFit: 'cover'}} /> : null}
			{letters}
		</AbsoluteFill>
	);
	if (f < 48) return scene;
	// bandes verticales décalées, nouvelles valeurs toutes les 2 images
	const tick = Math.floor(f / 2);
	return (
		<AbsoluteFill style={{background: P.red}}>
			{Array.from({length: n}).map((_, c) => (
				<AbsoluteFill key={c} style={{clipPath: `inset(0 ${1080 - colW * (c + 1)}px 0 ${colW * c}px)`, translate: `0px ${(random(`dy-${c}-${tick}`) - 0.45) * 300}px`}}>
					{scene}
				</AbsoluteFill>
			))}
		</AbsoluteFill>
	);
};

import {loadFont} from '@remotion/fonts';
import {random, staticFile} from 'remotion';

// Clermont Foot 63 : rouge et bleu relevés sur l'écusson fourni (#C4053F, #0C2C65), proches des valeurs publiées
// par les sites de couleurs d'équipes (pas de charte officielle trouvée). Le bleu tient le rôle du « noir » du style.
export const P = {
	red: '#C4053F',
	redDark: '#5C0220',
	white: '#FFFFFF',
	dark: '#0C2C65', // cases, lettres sombres, lignes techniques
	ink: '#061A3D', // fonds « noirs »
	grey: '#D9D9D9', // blocs de mosaïque
};

export const F = {big: 'Chakra Petch', small: 'Saira Semi Condensed'};
loadFont({family: F.big, url: staticFile('fonts/ChakraPetch-Bold.ttf'), weight: '700'});
loadFont({family: F.small, url: staticFile('fonts/SairaSemiCondensed-Medium.ttf'), weight: '500'});

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const CELL = 45; // grille commune (24 × 24 cellules)

export type Rect = {x: number; y: number; w: number; h: number; k: number};

// Blocs de mosaïque alignés sur la grille, nouveau tirage à chaque image (déterministe).
export const blocks = (frame: number, density: number, key: string, count = 80): Rect[] => {
	const out: Rect[] = [];
	for (let i = 0; i < count; i++) {
		const s = `${key}-${i}-${frame}`;
		if (random(`on-${s}`) > density) continue;
		const w = 1 + Math.floor(random(`w-${s}`) * 4);
		const h = 1 + Math.floor(random(`h-${s}`) * 6);
		out.push({
			x: Math.floor(random(`x-${s}`) * (24 - w + 1)) * CELL,
			y: Math.floor(random(`y-${s}`) * (24 - h + 1)) * CELL,
			w: w * CELL,
			h: h * CELL,
			k: random(`k-${s}`),
		});
	}
	return out;
};

// clip-path qui ne laisse voir que l'intérieur des rectangles
export const clipRects = (rects: Rect[]) =>
	rects.length ? `path('${rects.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}Z`).join(' ')}')` : 'inset(100%)';

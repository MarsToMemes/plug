import {loadFont} from '@remotion/fonts';
import {fitText} from '@remotion/layout-utils';
import {staticFile} from 'remotion';

// OL : couleurs relevées sur le logo fourni (rouge #E5202E, bleu #0F23AA), cf. motion/ol-victoire. Les trois fonds de
// la référence (gris clair, bleu nuit, rouge) gardent leur rôle ; les silhouettes de l'emblème sont bleu OL.
export const P = {
	grey: '#D9D9D9',
	navy: '#0B1748',
	navyLight: '#1E3478',
	red: '#C8102E',
	redHot: '#E5202E',
	blue: '#0F23AA',
	blueText: '#0B1748',
	pink: '#F6D9E2',
	white: '#FFFFFF',
};

export const F = {
	cond: 'Anton',
	wide: 'Archivo Expanded Black',
	wideBold: 'Archivo Expanded Bold',
};

export const fontsLoaded = Promise.all([
	loadFont({family: F.cond, url: staticFile('fonts/Anton-Regular.ttf'), weight: '400'}),
	loadFont({family: F.wide, url: staticFile('fonts/ArchivoExpanded-Black.ttf'), weight: '900'}),
	loadFont({family: F.wideBold, url: staticFile('fonts/ArchivoExpanded-Bold.ttf'), weight: '700'}),
]);

const WEIGHT: Record<string, string> = {[F.cond]: '400', [F.wide]: '900', [F.wideBold]: '700'};
export const fit = (text: string, family: string, width: number) =>
	fitText({text, fontFamily: family, fontWeight: WEIGHT[family], withinWidth: width, validateFontIsLoaded: true}).fontSize;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const TEX = {
	logo: staticFile('club/logo.png'),
	silhouette: staticFile('club/logo-silhouette.png'),
	lion: staticFile('club/lion.png'),
	carte: staticFile('images/carte-logo-relief.png'),
};

// Italique simulée (Archivo n'a pas d'italique dans nos instances statiques).
export const ITALIC = 'skewX(-12deg)';

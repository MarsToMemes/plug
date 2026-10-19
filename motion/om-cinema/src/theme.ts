import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Palette OM : « Bleu Marseille » relevé sur le logo fourni (#0E68AC, identité d'avril 2026), « Or Marseille »
// relevé sur le col du maillot (accent rare : points). Le bleu tient le rôle de l'orange de la référence.
export const P = {
	club: '#0E68AC',
	clubLight: '#2B8FD8',
	clubDark: '#0A3E6E',
	deep: '#041A33',
	ink: '#17191D',
	ink2: '#0F1114',
	night: '#060B13',
	glow: '#EAF6FF',
	gold: '#D8B73B',
	white: '#F3F3F3',
	grey: '#8E949C',
};

export const W = 1920;
export const H = 1080;

export const FONT = {
	black: 'Barlow Condensed Black',
	blackItalic: 'Barlow Condensed Black Italic',
	small: 'Barlow SemiBold',
	smallBold: 'Barlow Bold',
};

loadFont({family: FONT.black, url: staticFile('fonts/BarlowCondensed-Black.ttf'), weight: '900'});
loadFont({family: FONT.blackItalic, url: staticFile('fonts/BarlowCondensed-BlackItalic.ttf'), weight: '900', style: 'italic'});
loadFont({family: FONT.small, url: staticFile('fonts/Barlow-SemiBold.ttf'), weight: '600'});
loadFont({family: FONT.smallBold, url: staticFile('fonts/Barlow-Bold.ttf'), weight: '700'});

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const TEX = {
	topo: staticFile('textures/topo.png'),
	grain: staticFile('textures/grain.png'),
	platre: staticFile('textures/platre.jpg'),
	brush: [1, 2, 3].map((i) => staticFile(`textures/pinceau-${i}.png`)),
	logoPlein: staticFile('club/logo-plein.png'),
	logoContour: staticFile('club/logo-contour.png'),
};

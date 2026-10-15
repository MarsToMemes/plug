import {loadFont} from '@remotion/fonts';
import {fitText, measureText} from '@remotion/layout-utils';
import {staticFile} from 'remotion';

// OM : le rôle du « jaune » (encre vive) est tenu par le bleu ciel historique du club, plus lumineux que le Bleu
// Marseille du logo (#0E68AC), pour ressortir sur les fonds gris. Le logo garde ses couleurs.
export const P = {
	ink: '#3AA8F0',
	inkHot: '#9AD8FF',
	inkWash: '#BFE6FF',
	white: '#F2F2F2',
	whiteLow: '#B4B6BA',
	shadow: 'rgba(0,0,0,0.35)',
};

export const F = {
	cond: 'Anton',
	wide: 'Archivo Expanded Black',
};

export const fontsLoaded = Promise.all([
	loadFont({family: F.cond, url: staticFile('fonts/Anton-Regular.ttf'), weight: '400'}),
	loadFont({family: F.wide, url: staticFile('fonts/ArchivoExpanded-Black.ttf'), weight: '900'}),
]);

const W = (family: string) => (family === F.cond ? '400' : '900');
export const fit = (text: string, family: string, width: number) =>
	fitText({text, fontFamily: family, fontWeight: W(family), withinWidth: width, validateFontIsLoaded: true}).fontSize;
export const textWidth = (text: string, family: string, fontSize: number) =>
	measureText({text, fontFamily: family, fontWeight: W(family), fontSize, validateFontIsLoaded: true}).width;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const TEX = {
	beton: staticFile('textures/beton.jpg'),
	toile: staticFile('textures/toile.jpg'),
	orageGris: staticFile('textures/orage-gris.jpg'),
	orageBrun: staticFile('textures/orage-brun.jpg'),
	grainBombe: staticFile('textures/grain-bombe.png'),
	surpulv: staticFile('textures/surpulverisation.png'),
	coulure: staticFile('textures/coulure.png'),
	grain: staticFile('textures/grain.png'),
	logo: staticFile('club/logo-source.webp'),
};

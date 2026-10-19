import type React from 'react';
import {loadFont} from '@remotion/fonts';
import {fitText} from '@remotion/layout-utils';
import {staticFile} from 'remotion';

// Olympique lyonnais : couleurs relevées sur le logo fourni (rouge #E5202E, bleu #0F23AA, or #C88C28), cohérentes
// avec les relevés publiés (TeamColorCodes : rouge #DA0812, bleu #14387F, or #D29D46 — estimations, pas de charte
// officielle trouvée). Le rouge tient le rôle du rouge de la référence ; le bleu nuit teinte le carbone.
export const P = {
	red: '#E5202E',
	redDeep: '#7E0B16',
	blue: '#0F23AA',
	navy: '#0A1660',
	night: '#05081E',
	gold: '#C88C28',
	ink: '#0A0E26',
	paper: '#E9E9EB',
	white: '#FFFFFF',
};

export const F = {
	wide: 'Archivo Expanded Black',
	wideBold: 'Archivo Expanded Bold',
	wideMed: 'Archivo Expanded Medium',
	black: 'Archivo Black',
};

export const fontsLoaded = Promise.all([
	loadFont({family: F.wide, url: staticFile('fonts/ArchivoExpanded-Black.ttf'), weight: '900'}),
	loadFont({family: F.wideBold, url: staticFile('fonts/ArchivoExpanded-Bold.ttf'), weight: '700'}),
	loadFont({family: F.wideMed, url: staticFile('fonts/ArchivoExpanded-Medium.ttf'), weight: '500'}),
	loadFont({family: F.black, url: staticFile('fonts/Archivo-Black.ttf'), weight: '900'}),
]);

// Taille de police pour qu'un texte tienne dans une largeur (à appeler une fois les polices chargées).
export const fit = (text: string, fontFamily: string, withinWidth: number, letterSpacing = 0) =>
	fitText({text, fontFamily, fontWeight: '900', withinWidth, letterSpacing: `${letterSpacing}px`, validateFontIsLoaded: true}).fontSize;

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const TEX = {
	carbone: staticFile('textures/carbone.png'),
	zigzag: staticFile('textures/zigzag.png'),
	grain: staticFile('textures/grain.png'),
	logo: staticFile('club/logo.png'),
	silhouette: staticFile('club/logo-silhouette.png'),
	lion: staticFile('icones/lion.png'),
};

// Dégradé chrome (texte découpé) ; `pos` (0–100) fait glisser le reflet.
export const chrome = (pos: number): React.CSSProperties => ({
	color: 'transparent',
	backgroundImage: 'linear-gradient(176deg, #FDFDFE 0%, #D2D3D9 30%, #73737E 47%, #F5F5F8 58%, #ABACB4 78%, #E9E9EE 100%)',
	backgroundSize: '100% 240%',
	backgroundPosition: `0 ${pos}%`,
	WebkitBackgroundClip: 'text',
	backgroundClip: 'text',
});

import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Palette de travail FC Metz (fournie par l'utilisateur, pas la charte certifiée).
export const C = {
	grenat: '#74070B',
	grenatDeep: '#3B0509',
	grenatAlt: '#9B1C2C',
	gold: '#D4AF37',
	ivory: '#F5F2ED',
	black: '#101010',
	grey: '#777777',
} as const;

// Police des néons (Michroma, licence OFL, fichier local) : large et carrée, sans italique, d'où le skew appliqué partout.
export const fontFamily = 'Michroma';
loadFont({family: fontFamily, url: staticFile('fonts/Michroma-Regular.ttf'), weight: '400'});

// Police grasse (Unbounded, licence OFL, variable 200–900) pour le mot club, le numéro et le nom.
export const fontHeavy = 'Unbounded';
loadFont({family: fontHeavy, url: staticFile('fonts/Unbounded-Variable.ttf'), weight: '200 900'});
export const SKEW = 'skewX(-12deg)';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

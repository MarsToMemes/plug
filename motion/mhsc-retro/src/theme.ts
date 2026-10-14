import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Palette « encre » du MHSC : orange et bleu marine relevés sur l'écusson (#F06600, #00377B),
// légèrement vieillis pour l'aspect sérigraphie, + une crème (jamais de blanc pur).
export type Palette = {hot: string; dark: string; cream: string};
export const MHSC: Palette = {hot: '#E2621F', dark: '#102B5E', cream: '#EFE5CF'};

// Polices libres (OFL), fichiers locaux dans public/fonts.
export const F = {
	wide: 'Bungee', // mot géant (étendu, angles arrondis carrés)
	cond: 'Big Shoulders Display', // mot centré, numéro, nom (instance Black sans chevauchements)
	small: 'Barlow Condensed', // petites capitales espacées
	script: 'Kaushan Script', // surnom manuscrit (le MHSC n'a pas de logo-script)
};
loadFont({family: F.wide, url: staticFile('fonts/Bungee-Regular.ttf'), weight: '400'});
loadFont({family: F.cond, url: staticFile('fonts/BigShouldersDisplay-Black.ttf'), weight: '900'});
loadFont({family: F.small, url: staticFile('fonts/BarlowCondensed-SemiBold.ttf'), weight: '600'});
loadFont({family: F.script, url: staticFile('fonts/KaushanScript-Regular.ttf'), weight: '400'});

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Choisit a ou b selon que l'image fait partie d'une table de flashs (tables écrites en dur, cf. timeline.md).
export const pick = <T,>(frame: number, set: ReadonlySet<number>, a: T, b: T): T => (set.has(frame) ? a : b);

import {loadFont} from '@remotion/fonts';
import {Easing, staticFile} from 'remotion';

// Couleurs et police relevées sur lebraqueur.fr (variables CSS du site, police Outfit).
export const C = {
	bg: '#080E18',
	bg2: '#0D1522',
	ink: '#0B1420',
	text: '#EEF4F5',
	muted: '#8FA0B4',
	teal: '#3FD8C8',
	accent: '#7F9CC0',
	accent2: '#DBE8F7',
	amber: '#F2C063',
	green: '#46D39A',
};

export const FONT = 'Outfit';

export const fontsLoaded = Promise.all(
	[400, 600, 700].map((w) => loadFont({family: FONT, url: staticFile(`fonts/outfit-latin-${w}-normal.woff2`), weight: String(w)})),
);

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const out = {...clamp, easing: Easing.out(Easing.cubic)};
export const inOut = {...clamp, easing: Easing.inOut(Easing.cubic)};

// Chiffres à la française : 83,7 ; 76 (sans décimale nulle).
export const fr = (n: number) => n.toFixed(1).replace('.', ',').replace(',0', '');

// Les quatre cartes affichées sur la page d'accueil du site.
export const PLAYERS = [
	{tag: 'NFL · TD', title: 'NFL', sub: 'touchdowns', score: 65.7, name: 'James Cook', match: 'BUF vs MIN', chance: 46.9},
	{tag: 'FOOT · BUT', title: 'Foot', sub: 'buteurs', score: 83.7, name: 'Raphinha', match: 'BAR vs ATM', chance: 40.4},
	{tag: 'NBA · 20+', title: 'NBA', sub: '20 points ou plus', score: 83.4, name: 'Shai Gilgeous-Alexander', match: 'OKC @ POR', chance: 76},
	{tag: 'NHL · BUT', title: 'NHL', sub: 'buteurs', score: 77.5, name: 'Nathan MacKinnon', match: 'COL @ TOR', chance: 42},
];

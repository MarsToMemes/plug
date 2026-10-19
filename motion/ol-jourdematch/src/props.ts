import {z} from 'zod';

export const jdmSchema = z.object({
	word: z.string(), // mot répété (temps 1–4)
	club: z.string(), // affiche : nom complet du club
	adversary: z.string(), // affiche : nom complet de l'adversaire
	adversaryShort: z.string(), // affiche : nom court en contour (à défaut de logo)
	short: z.string(), // carte : nom géant du club
	versus: z.string(), // carte : ligne sous le nom géant
	info: z.array(z.string()), // date / stade / heure
	info2: z.array(z.string()), // compétition (diffuseur non confirmé)
});
export type JdmProps = z.infer<typeof jdmSchema>;

// OL – Nice : dimanche 18 octobre 2026, 20 h 45, Groupama Stadium, Ligue 1 J7 (calendrier officiel de l'OL).
export const defaultJdmProps: JdmProps = {
	word: 'JOUR DE MATCH',
	club: 'OLYMPIQUE LYONNAIS',
	adversary: 'OGC NICE',
	adversaryShort: 'NICE',
	short: 'LYON',
	versus: 'VS OGC NICE',
	info: ['DIMANCHE 18 OCTOBRE', 'GROUPAMA STADIUM', '20 H 45'],
	info2: ['LIGUE 1 · 7E JOURNÉE'],
};

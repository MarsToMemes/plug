import {z} from 'zod';

export const victoireSchema = z.object({
	club: z.string(), // nom court en chrome (carte sombre)
	word: z.string(), // mot de victoire
	name: z.string(), // nom du club (lettres géantes, petites capitales)
	fullName: z.string(), // nom complet (cadre de la carte blanche, bloc club)
	signature: z.string(),
	founded: z.string(),
	dept: z.string(),
});
export type VictoireProps = z.infer<typeof victoireSchema>;

export const defaultVictoireProps: VictoireProps = {
	club: 'LYON',
	word: 'VICTOIRE',
	name: 'LYONNAIS',
	fullName: 'OLYMPIQUE LYONNAIS',
	signature: "VICTOIRE DE L'OL",
	founded: '1950',
	dept: '69',
};

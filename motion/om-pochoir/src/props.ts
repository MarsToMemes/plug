import {z} from 'zod';

export const grungeSchema = z.object({
	club: z.string(), // 1ʳᵉ ligne du bloc (nom du club)
	word: z.string(), // mot de victoire
	slogan: z.tuple([z.string(), z.string(), z.string()]), // slogan / devise en 3 mots (le 2ᵉ en police étendue)
});
export type GrungeProps = z.infer<typeof grungeSchema>;

export const defaultGrungeProps: GrungeProps = {
	club: 'MARSEILLE',
	word: 'VICTOIRE',
	// Devise historique du club.
	slogan: ['DROIT', 'AU', 'BUT'],
};

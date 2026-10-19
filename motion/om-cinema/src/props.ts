import {z} from 'zod';

export const cinemaGoalSchema = z.object({
	goalWord: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	number: z.string(),
	position: z.string(),
	city: z.string(),
	clubTop: z.string(),
	clubBottom: z.string(),
	season: z.string(),
	slogan: z.object({top: z.string(), link: z.string(), bottom: z.string()}),
	// Repli photos (pas de rushes vidéo) : joueur détouré + fond rebouché pour la parallaxe.
	actionPhoto: z.string(),
	actionPlate: z.string(),
	celebPhoto: z.string(),
	celebPlate: z.string(),
	facePhoto: z.string(),
});
export type CinemaGoalProps = z.infer<typeof cinemaGoalSchema>;

export const defaultCinemaGoalProps: CinemaGoalProps = {
	goalWord: 'BUT',
	firstName: 'KEYLIANE',
	lastName: 'ABDALLAH',
	number: '48',
	position: 'ATTAQUANT',
	city: 'MARSEILLE',
	clubTop: 'OLYMPIQUE',
	clubBottom: 'DE MARSEILLE',
	season: 'SAISON 2026-27',
	// Devise historique du club (pas un slogan inventé).
	slogan: {top: 'DROIT', link: 'AU', bottom: 'BUT'},
	actionPhoto: 'joueurs/abdallah-action.png',
	actionPlate: 'joueurs/abdallah-action-fond.jpg',
	celebPhoto: 'joueurs/abdallah-celeb.png',
	celebPlate: 'joueurs/abdallah-celeb-fond.jpg',
	facePhoto: 'joueurs/abdallah-dodo.png',
};

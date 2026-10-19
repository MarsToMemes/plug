import React from 'react';
import {Img, staticFile} from 'remotion';

// « METZ » en objet (grenat taillé : tools/gemme3d.py ; écailles du Graoully : tools/lettres3d.py ;
// vitrail : tools/vitrail3d.py) : image RGBA (relief, flanc,
// ombre portée déjà calculés). Posée telle quelle, sans halo ni contour.
// une image par ligne (graines différentes) pour éviter une répétition visible
const SRCS = {
	// écailles : la lumière bouge, une image par frame de la scène (0–21), voir srcFor()
	ecailles: ['matieres/ecailles/ligne-1', 'matieres/ecailles/ligne-2', 'matieres/ecailles/ligne-3'],
	vitrail: ['matieres/metz-vitrail-3d-1.png', 'matieres/metz-vitrail-3d-2.png', 'matieres/metz-vitrail-3d-3.png'],
	'grenat-relief': ['matieres/metz-grenat-3d-1.png', 'matieres/metz-grenat-3d-2.png', 'matieres/metz-grenat-3d-3.png'],
};

export type ObjectMaterial = keyof typeof SRCS;
const LIGHT_FRAMES = 22;

const srcFor = (material: ObjectMaterial, row: number, frame: number) =>
	material === 'ecailles'
		? `${SRCS.ecailles[row % 3]}-${String(Math.min(Math.max(Math.round(frame), 0), LIGHT_FRAMES - 1)).padStart(2, '0')}.webp`
		: SRCS[material][row % 3];
const SRC_W = 2630; // proportions communes à toutes les images (1300 × 361 pour les écailles)
const SRC_H = 731;
const WIDTH = 1300; // même encombrement que le mot en police 300 px

export const ScaledLetters: React.FC<{
	y: number;
	row: number;
	material: ObjectMaterial;
	frame?: number; // image de lumière (écailles seulement)
	dx?: number;
	brightness?: number;
}> = ({y, row, material, frame = LIGHT_FRAMES - 1, dx = 0, brightness = 1}) => (
	<Img
		src={staticFile(srcFor(material, row, frame))}
		style={{
			position: 'absolute',
			left: 540 - WIDTH / 2 + dx,
			top: y - (WIDTH * SRC_H) / SRC_W / 2,
			width: WIDTH,
			height: (WIDTH * SRC_H) / SRC_W,
			filter: brightness === 1 ? undefined : `brightness(${brightness})`,
		}}
	/>
);

import React from 'react';
import {Img, staticFile} from 'remotion';

// « METZ » en objet (grenat taillé : tools/gemme3d.py ; écailles du Graoully : tools/lettres3d.py ;
// vitrail : tools/vitrail3d.py) : image RGBA (relief, flanc,
// ombre portée déjà calculés). Posée telle quelle, sans halo ni contour.
// une image par ligne (graines différentes) pour éviter une répétition visible
const SRCS = {
	ecailles: ['matieres/metz-ecailles-3d-1.png', 'matieres/metz-ecailles-3d-2.png', 'matieres/metz-ecailles-3d-3.png'],
	vitrail: ['matieres/metz-vitrail-3d-1.png', 'matieres/metz-vitrail-3d-2.png', 'matieres/metz-vitrail-3d-3.png'],
	'grenat-relief': ['matieres/metz-grenat-3d-1.png', 'matieres/metz-grenat-3d-2.png', 'matieres/metz-grenat-3d-3.png'],
};

export type ObjectMaterial = keyof typeof SRCS;
const SRC_W = 2630;
const SRC_H = 731;
const WIDTH = 1300; // même encombrement que le mot en police 300 px

export const ScaledLetters: React.FC<{y: number; row: number; material: ObjectMaterial; dx?: number; brightness?: number}> = ({
	y,
	row,
	material,
	dx = 0,
	brightness = 1,
}) => (
	<Img
		src={staticFile(SRCS[material][row % 3])}
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

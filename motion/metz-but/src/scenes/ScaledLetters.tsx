import React from 'react';
import {Img, staticFile} from 'remotion';

// « METZ » sculpté en écailles du Graoully : image RGBA rendue par tools/lettres3d.py (relief, flanc,
// ombre portée déjà calculés). Posée telle quelle, sans halo ni contour.
// une image par ligne (graines différentes) pour éviter une répétition visible
const SRCS = ['matieres/metz-ecailles-3d-1.png', 'matieres/metz-ecailles-3d-2.png', 'matieres/metz-ecailles-3d-3.png'];
const SRC_W = 2630;
const SRC_H = 731;
const WIDTH = 1300; // même encombrement que le mot en police 300 px

export const ScaledLetters: React.FC<{y: number; row: number; dx?: number; brightness?: number}> = ({y, row, dx = 0, brightness = 1}) => (
	<Img
		src={staticFile(SRCS[row % SRCS.length])}
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

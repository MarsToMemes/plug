import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {P, blocks, clamp, clipRects} from '../theme';

// Mosaïque : blocs alignés sur la grille, aplats (gris/blanc ou rouges) et fenêtres sur la scène suivante.
// base / next : scènes déjà montées ; switchAt : image où la base devient la scène suivante (sous les blocs).
export const Mosaic: React.FC<{
	offset: number;
	start: number;
	end: number;
	base: React.ReactNode;
	next?: React.ReactNode;
	switchAt?: number;
	flat: [string, string];
	keyName: string;
}> = ({offset, start, end, base, next, switchAt = 999, flat, keyName}) => {
	const f = useCurrentFrame() + offset;
	const mid = (start + end) / 2;
	const density = interpolate(f, [start, mid, end], [0.12, 0.5, 0.1], clamp);
	const rects = blocks(f, density, keyName);
	const nextShare = next ? interpolate(f, [start, end], [0.1, 0.9], clamp) : 0;
	const windows = rects.filter((r) => r.k < nextShare);
	const flats = rects.filter((r) => r.k >= nextShare);
	const showNextAsBase = f >= switchAt && next;
	return (
		<AbsoluteFill>
			{showNextAsBase ? next : base}
			{next ? <AbsoluteFill style={{clipPath: clipRects(windows)}}>{showNextAsBase ? base : next}</AbsoluteFill> : null}
			{flats.map((r, i) => (
				<div key={i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, background: r.k > 0.8 ? flat[1] : flat[0]}} />
			))}
		</AbsoluteFill>
	);
};

// Tranches horizontales qui glissent (sortie de la carte, casse du logotype).
export const Slices: React.FC<{offset: number; children: React.ReactNode; amp: number; bands?: number; keyName: string}> = ({offset, children, amp, bands = 8, keyName}) => {
	const f = useCurrentFrame() + offset;
	const h = 1080 / bands;
	return (
		<AbsoluteFill style={{background: P.red}}>
			{Array.from({length: bands}).map((_, i) => (
				<AbsoluteFill key={i} style={{clipPath: `inset(${i * h}px 0 ${1080 - (i + 1) * h}px 0)`, translate: `${(random(`${keyName}-${i}-${f}`) - 0.5) * 2 * amp}px 0px`}}>
					{children}
				</AbsoluteFill>
			))}
		</AbsoluteFill>
	);
};

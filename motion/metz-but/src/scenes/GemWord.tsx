import React from 'react';
import {staticFile} from 'remotion';
import {fontHeavy} from '../theme';

export const GEM_TEXTURE = 'matieres/grenat-gemme-large.png';

// Mot en matière (grenat taillé par défaut, ou écailles) : texture calculée (tools/gemme.py, tools/ecailles.py) découpée dans le texte, liseré de lumière
// sur les bords, ombre interne, halo rouge, et un reflet qui balaie les facettes (sweepX, en px).
export const GemWord: React.FC<{
	id: string;
	word: string;
	y: number;
	fontSize: number;
	dx?: number;
	texX?: number;
	brightness?: number;
	sweepX?: number;
	glow?: number;
	texture?: string;
	texAspect?: number; // largeur / hauteur du fichier de texture
	texScale?: number; // hauteur de la texture en multiples de fontSize
}> = ({id, word, y, fontSize, dx = 0, texX = -160, brightness = 1, sweepX, glow = 0.55, texture = GEM_TEXTURE, texAspect = 3.25, texScale = 1.4}) => {
	const tf = `translate(${540 + dx} ${y}) skewX(-12) translate(${-540 - dx} ${-y})`;
	const text = (props: React.SVGProps<SVGTextElement>) => (
		<text
			x={540 + dx}
			y={y}
			textAnchor="middle"
			dominantBaseline="central"
			fontFamily={fontHeavy}
			fontWeight={900}
			fontSize={fontSize}
			letterSpacing={-fontSize * 0.01}
			transform={tf}
			{...props}
		>
			{word}
		</text>
	);
	const texH = fontSize * texScale;
	return (
		<svg viewBox="0 0 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<defs>
				<clipPath id={`${id}-clip`}>{text({})}</clipPath>
				<linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0.4" y2="1">
					<stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
					<stop offset="0.45" stopColor="#ff9aa6" stopOpacity="0.35" />
					<stop offset="1" stopColor="#ff9aa6" stopOpacity="0.05" />
				</linearGradient>
				<linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#ffffff" stopOpacity="0" />
					<stop offset="0.5" stopColor="#ffc7cf" stopOpacity="0.42" />
					<stop offset="1" stopColor="#ffffff" stopOpacity="0" />
				</linearGradient>
				<filter id={`${id}-inner`} x="-5%" y="-10%" width="110%" height="120%">
					<feOffset in="SourceAlpha" dx="-3" dy="-8" result="o" />
					<feGaussianBlur in="o" stdDeviation="7" result="ob" />
					<feComposite in="SourceAlpha" in2="ob" operator="out" result="edge" />
					<feFlood floodColor="#1a0005" floodOpacity="0.85" />
					<feComposite in2="edge" operator="in" />
				</filter>
				<filter id={`${id}-glow`} x="-10%" y="-30%" width="120%" height="160%">
					<feGaussianBlur in="SourceAlpha" stdDeviation="24" result="b" />
					<feFlood floodColor="#c01530" floodOpacity={glow} />
					<feComposite in2="b" operator="in" />
				</filter>
			</defs>
			{text({fill: '#000', filter: `url(#${id}-glow)`})}
			<g clipPath={`url(#${id}-clip)`}>
				<g style={{filter: brightness === 1 ? undefined : `brightness(${brightness})`}}>
					<image href={staticFile(texture)} x={texX} y={y - texH / 2} width={texH * texAspect} height={texH} preserveAspectRatio="none" />
				</g>
				{sweepX === undefined ? null : (
					<rect
						x={sweepX}
						y={y - fontSize}
						width={fontSize * 1.1}
						height={fontSize * 2}
						fill={`url(#${id}-sweep)`}
						transform={`rotate(18 ${sweepX + fontSize * 0.55} ${y})`}
						style={{mixBlendMode: 'screen'}}
					/>
				)}
				{text({fill: '#000', filter: `url(#${id}-inner)`})}
				{text({fill: 'none', stroke: `url(#${id}-rim)`, strokeWidth: fontSize * 0.022})}
			</g>
			{text({fill: 'none', stroke: '#2a0008', strokeWidth: 1.5})}
		</svg>
	);
};

// Éclat en étoile à 4 branches (scintillement sur une facette).
export const Glint: React.FC<{x: number; y: number; size: number; opacity: number}> = ({x, y, size, opacity}) =>
	opacity <= 0.01 ? null : (
		<svg viewBox="0 0 1080 1080" width={1080} height={1080} style={{position: 'absolute', inset: 0, opacity, mixBlendMode: 'screen'}}>
			<g transform={`translate(${x} ${y}) scale(${size})`}>
				<path d="M0 -1 L0.09 -0.09 L1 0 L0.09 0.09 L0 1 L-0.09 0.09 L-1 0 L-0.09 -0.09 Z" fill="#fff6f0" />
				<circle r="0.16" fill="#ffffff" />
			</g>
		</svg>
	);

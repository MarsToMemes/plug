import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random} from 'remotion';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import logo from '../../public/club/logo-3d.json';
import {Grain} from '../fx';
import {VictoireProps} from '../props';
import {F, P, clamp, fit} from '../theme';

type Pt = number[];
type ShapeData = {outer: Pt[]; holes: Pt[][]};

const toShape = (s: ShapeData) => {
	const shape = new THREE.Shape(s.outer.map(([x, y]) => new THREE.Vector2(x, y)));
	shape.holes = s.holes.map((h) => new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
	return shape;
};

const MATERIALS: Record<string, () => THREE.Material> = {
	gold: () => new THREE.MeshPhysicalMaterial({color: '#B87818', metalness: 0.95, roughness: 0.3, clearcoat: 0.2}),
	white: () => new THREE.MeshPhysicalMaterial({color: '#E7E7EC', metalness: 0.35, roughness: 0.38, clearcoat: 0.5}),
	rouge: () => new THREE.MeshPhysicalMaterial({color: '#D81A28', metalness: 0.05, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35}),
	bleu: () => new THREE.MeshPhysicalMaterial({color: '#0F23AA', metalness: 0.05, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.35}),
};

// Logo extrudé en couches (socle doré, face blanche, panneaux, lettres, lion), biseau léger.
const LogoMesh: React.FC = () => {
	const meshes = useMemo(
		() =>
			logo.layers.map((l) => {
				const bevel = 0.012;
				const geo = new THREE.ExtrudeGeometry(
					(l.shapes as ShapeData[]).map(toShape),
					{depth: Math.max(0.005, l.z1 - l.z0 - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: 0.008, bevelSegments: 2, curveSegments: 4},
				);
				return {geo, mat: MATERIALS[l.color](), z: l.z0 + bevel, name: l.name};
			}),
		[],
	);
	return (
		<group>
			{meshes.map((m) => (
				<mesh key={m.name} geometry={m.geo} material={m.mat} position={[0, 0, m.z]} />
			))}
		</group>
	);
};

// Environnement d'éclairage procédural (pas de téléchargement) + caméra pilotée par l'image.
const Rig: React.FC<{f: number}> = ({f}) => {
	const {gl, scene, camera} = useThree();
	useLayoutEffect(() => {
		const pm = new THREE.PMREMGenerator(gl);
		scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.environmentIntensity = 0.32;
		gl.toneMapping = THREE.ACESFilmicToneMapping;
		gl.toneMappingExposure = 0.95;
		return () => pm.dispose();
	}, [gl, scene]);
	useLayoutEffect(() => {
		const t = interpolate(f, [110, 175], [0, 1], clamp);
		const e = Easing.inOut(Easing.quad)(t);
		camera.position.set(-1.5 + e * 1.8, -3.3 + e * 0.5, 4.6 - e * 0.5);
		camera.up.set(0.12 - e * 0.1, 1, 0);
		camera.lookAt(-0.15 + e * 0.6, -0.45, 0.1);
		camera.updateProjectionMatrix();
	}, [f, camera]);
	return null;
};

// Surface rouge texturée (petites alvéoles) sous le logo : texture dessinée en canvas, donc disponible tout de suite.
const Floor: React.FC = () => {
	const tex = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 64;
		c.height = 74;
		const g = c.getContext('2d')!;
		g.fillStyle = '#B9B9B9';
		g.fillRect(0, 0, 64, 74);
		const hex = (cx: number, cy: number) => {
			const grad = g.createRadialGradient(cx - 4, cy - 5, 2, cx, cy, 15);
			grad.addColorStop(0, '#FFFFFF');
			grad.addColorStop(1, '#C8C8C8');
			g.fillStyle = grad;
			g.beginPath();
			for (let k = 0; k < 6; k++) {
				const an = (Math.PI / 3) * k + Math.PI / 6;
				g.lineTo(cx + Math.cos(an) * 15, cy + Math.sin(an) * 15);
			}
			g.closePath();
			g.fill();
		};
		for (const [x, y] of [[16, 18.5], [48, 18.5], [0, 55.5], [32, 55.5], [64, 55.5], [0, -18.5], [32, -18.5], [64, -18.5], [16, 92.5], [48, 92.5]]) hex(x, y);
		const t = new THREE.CanvasTexture(c);
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set(70, 60);
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	}, []);
	return (
		<mesh position={[0, 0, -0.005]}>
			<planeGeometry args={[16, 16]} />
			<meshPhysicalMaterial color="#C8121F" map={tex} roughness={0.6} clearcoat={0.2} />
		</mesh>
	);
};

// Temps 3 (f110–175) : logo en relief, mot en contour, nom qui s'assemble, anneau lumineux.
export const Logo3D: React.FC<{p: VictoireProps; f: number}> = ({p, f}) => {
	const wordSize = fit(p.word, F.black, 1500);
	const lines = interpolate(f, [110, 116, 128, 132], [0, 1, 1, 0], clamp);
	const word = interpolate(f, [132, 135], [0, 1], clamp);
	const ring = interpolate(f, [157, 167], [0, 1], clamp);
	const blur = interpolate(f, [167, 175], [0, 14], {...clamp, easing: Easing.in(Easing.quad)});
	const name = p.name.split('');
	const order = name.map((_, i) => i).sort((a, b) => random(`n${a}`) - random(`n${b}`));
	const shown = new Set(order.slice(0, Math.floor(interpolate(f, [135, 150], [0, name.length], clamp))));
	const flicker = f >= 159 && f <= 162 && f % 2 === 1;
	const drift = interpolate(f, [110, 175], [60, -60]);
	return (
		<AbsoluteFill style={{background: P.redDeep, overflow: 'hidden'}}>
			<AbsoluteFill style={{filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
				<ThreeCanvas width={1080} height={1080} camera={{fov: 34, near: 0.1, far: 50, position: [0, -2.5, 3]}} gl={{antialias: true}}>
					<Rig f={f} />
					<ambientLight intensity={0.15} />
					<directionalLight position={[-3, 4, 5]} intensity={1.6} />
					<directionalLight position={[4, -2, 2]} intensity={0.6} color="#FFD9D9" />
					<Floor />
					<LogoMesh />
				</ThreeCanvas>
				<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(5,8,30,0.55) 100%)'}} />
				{/* tracés blancs fins (contours de lettres) */}
				<div
					style={{
						position: 'absolute',
						left: -120 + drift,
						top: 140,
						fontFamily: F.black,
						fontSize: 900,
						lineHeight: 1,
						color: 'transparent',
						WebkitTextStroke: '1.2px rgba(255,255,255,0.8)',
						opacity: lines,
						whiteSpace: 'nowrap',
					}}
				>
					{p.word.slice(0, 3)}
				</div>
				{/* mot en contour translucide */}
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 540 - wordSize * 0.52,
						textAlign: 'center',
						fontFamily: F.black,
						fontSize: wordSize,
						lineHeight: 1,
						whiteSpace: 'nowrap',
						color: 'rgba(255,255,255,0.16)',
						WebkitTextStroke: '2px rgba(255,255,255,0.95)',
						opacity: word,
						translate: `${drift * 0.6}px 0`,
					}}
				>
					{p.word}
				</div>
				{/* nom en petites capitales qui s'assemble */}
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 520,
						textAlign: 'center',
						fontFamily: F.wideMed,
						fontSize: 34,
						letterSpacing: '1.1em',
						paddingLeft: '1.1em',
						color: P.ink,
						opacity: flicker ? 0.2 : 1,
						textShadow: '0 0 12px rgba(255,255,255,0.5)',
					}}
				>
					{name.map((c, i) => (
						<span key={i} style={{opacity: shown.has(i) ? 1 : 0}}>
							{c}
						</span>
					))}
				</div>
				{ring > 0 && ring < 1 && (
					<div
						style={{
							position: 'absolute',
							left: 540 - (280 + ring * 420),
							top: 540 - (280 + ring * 420),
							width: (280 + ring * 420) * 2,
							height: (280 + ring * 420) * 2,
							borderRadius: '50%',
							border: '2px solid rgba(255,255,255,0.9)',
							opacity: 1 - ring,
							boxShadow: '0 0 18px rgba(255,255,255,0.5)',
						}}
					/>
				)}
			</AbsoluteFill>
			<Grain f={f} opacity={0.06} />
		</AbsoluteFill>
	);
};

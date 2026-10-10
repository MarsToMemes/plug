import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import opentype from 'opentype.js';

/**
 * ShopOne — « 1 € » : make the price feel incoherent before explaining it.
 *
 * 0–1.5 s  a real gadget (a plastic fidget spinner, photo) floats in the dark, raking orange light.
 * 1.5–2.5  « 1 € », an extruded typographic slab (Geist ExtraBold glyphs, real 3D), comes out of
 *          the depth: hard acceleration, heavy braking, true motion blur (sub-frames accumulated).
 * 2.5–4    it settles; a lateral travelling shows its thickness and the absurd scale against the gadget.
 * 4–6      the « 1 » splits into physical layers (surface, contour, shadow, hollow walls), then a slit
 *          opens down its middle: inside, a real industrial machine (heated plastic preforms), whose
 *          orange glow lights the slit's walls.
 * 6–8      the camera goes through the slit: the machine footage — a plane deep inside the scene, seen
 *          through a stencil portal — fills the frame, and hands over to the full-resolution video.
 *
 * Media: spinner photo « Fidget spinner », Gpkp, CC BY-SA 4.0 (Wikimedia Commons); machine footage
 * « Plastic Bottle Factory », Pexels (licence Pexels). Credits in public/photos/CREDITS.md.
 */
export const ONE = { fps: 30, seconds: 8.6 };
const T_FLY = [1.5, 2.45] as const, T_TRAVEL = [2.5, 4.0] as const, T_LAYERS = [4.0, 4.9] as const, T_SLIT = [4.9, 5.9] as const, T_DIVE = [5.95, 7.3] as const;
const HANDOFF = 7.3, VIDEO_T0 = 5.0; // the footage's clock starts when the slit opens

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const slam = bez(0.42, 0, 0.0, 1), move = bez(0.55, 0, 0.25, 1), dive = bez(0.5, 0, 0.35, 1);
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const lerp3 = (a: THREE.Vector3, b: THREE.Vector3, u: number) => a.clone().lerp(b, u);

// ---------------------------------------------------------------- the plate, in world units
const SIZE = 10, DEPTH = 1.6, BEVEL = 0.12;
const PLATE_Z = -9, VIDEO_Z = -34, VIDEO_W = 16, VIDEO_H = 9;

type Scene = {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  plate: THREE.Group; halves: [THREE.Group, THREE.Group]; planes: THREE.Plane[]; portalPlanes: THREE.Plane[];
  layers: { surface: THREE.Mesh[]; contour: THREE.LineSegments[]; shadow: THREE.Mesh[]; capMats: THREE.MeshStandardMaterial[] };
  cutX: number; glyphCY: number; gadget: THREE.Mesh; video: THREE.Mesh; videoMat: THREE.MeshBasicMaterial; videoTex: THREE.Texture;
  inner: THREE.PointLight; portal: THREE.Mesh;
};
const veilOf = (S: Scene) => S.video.children[0] as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

function glyphShapes(font: opentype.Font, ch: string, x: number) {
  const path = font.getPath(ch, x, 0, SIZE);
  const sp = new THREE.ShapePath();
  for (const c of path.commands) {
    if (c.type === 'M') sp.moveTo(c.x, -c.y);
    else if (c.type === 'L') sp.lineTo(c.x, -c.y);
    else if (c.type === 'Q') sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === 'C') sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  return sp.toShapes(false);
}

function build(font: opentype.Font, spinner: THREE.Texture, canvas: HTMLCanvasElement): Scene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, preserveDrawingBuffer: true, alpha: false });
  renderer.setSize(1920, 1080, false); renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#050505');
  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.02, 400);

  // Light: a raking orange key from the left, a faint warm rim, almost no ambient.
  const key = new THREE.SpotLight('#ff7a2e', 2600, 0, Math.PI / 4.5, 0.7, 2);
  key.position.set(-22, 3, PLATE_Z + 3.2); key.target.position.set(4, 0, PLATE_Z + 1); // grazing the face: a gradient across it
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0015; key.shadow.normalBias = 0.06; key.shadow.camera.near = 2; key.shadow.camera.far = 60;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#ffb27a', 0.35); rim.position.set(8, 6, 6); scene.add(rim);
  scene.add(new THREE.AmbientLight('#2a1d14', 0.12));

  // The glyphs: « 1 » (split later) and « € » (stays whole), centred on the origin of the plate group.
  const one = glyphShapes(font, '1', 0), adv = font.getAdvanceWidth('1', SIZE) + SIZE * 0.08;
  const euro = glyphShapes(font, '€', adv);
  const bbox = new THREE.Box3();
  [...one, ...euro].forEach((s) => s.getPoints(12).forEach((p) => bbox.expandByPoint(v3(p.x, p.y, 0))));
  const cx0 = (bbox.min.x + bbox.max.x) / 2, cy0 = (bbox.min.y + bbox.max.y) / 2;
  const oneBox = new THREE.Box3(); one.forEach((s) => s.getPoints(12).forEach((p) => oneBox.expandByPoint(v3(p.x, p.y, 0))));
  const cutLocal = (oneBox.min.x + oneBox.max.x) / 2 - cx0 + 0.35; // through the stem of the « 1 »
  const plate = new THREE.Group(); scene.add(plate);
  const faceColor = '#e6ded1', sideColor = '#7d7366';
  const extrude = { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: 0.07, bevelSegments: 3, curveSegments: 24 };
  const centred = (g: THREE.BufferGeometry) => { g.translate(-cx0, -cy0, 0); return g; };

  // « € »: one solid.
  const euroMesh = new THREE.Mesh(centred(new THREE.ExtrudeGeometry(euro, extrude)), [new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.5, metalness: 0.05 }), new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.7 })]);
  euroMesh.castShadow = euroMesh.receiveShadow = true; plate.add(euroMesh);

  // « 1 »: two halves (clipping planes), each made of physical layers.
  const planes = [new THREE.Plane(v3(-1, 0, 0), 0), new THREE.Plane(v3(1, 0, 0), 0)];
  const portalPlanes = [new THREE.Plane(v3(1, 0, 0), 0), new THREE.Plane(v3(-1, 0, 0), 0)];
  const layers: Scene['layers'] = { surface: [], contour: [], shadow: [], capMats: [] };
  const oneDepthGeo = centred(new THREE.ExtrudeGeometry(one, extrude));
  const oneFaceGeo = centred(new THREE.ShapeGeometry(one, 24));
  const halves: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()];
  halves.forEach((h, i) => {
    const clip = [planes[i]!];
    const capMat = new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.5, metalness: 0.05, clippingPlanes: clip, transparent: true, side: THREE.DoubleSide });
    const sideMat = new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.7, clippingPlanes: clip, side: THREE.DoubleSide });
    const depth = new THREE.Mesh(oneDepthGeo, [capMat, sideMat]); depth.castShadow = depth.receiveShadow = true; h.add(depth);
    layers.capMats.push(capMat);
    const surface = new THREE.Mesh(oneFaceGeo, new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.45, metalness: 0.05, clippingPlanes: clip, side: THREE.DoubleSide, transparent: true, opacity: 0 }));
    surface.position.z = DEPTH + BEVEL + 0.002; surface.receiveShadow = true; h.add(surface); layers.surface.push(surface);
    const edges = new THREE.EdgesGeometry(oneFaceGeo, 20);
    const contour = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#ffb070', transparent: true, opacity: 0, clippingPlanes: clip }));
    for (const [dx, dy] of [[0.012, 0], [-0.012, 0], [0, 0.012], [0, -0.012]]) { const c = new THREE.LineSegments(edges, contour.material); c.position.set(dx, dy, 0); contour.add(c); } // a thicker line
    contour.position.z = DEPTH + BEVEL + 0.004; h.add(contour); layers.contour.push(contour);
    const shadow = new THREE.Mesh(oneFaceGeo, new THREE.MeshBasicMaterial({ color: '#1a0d06', transparent: true, opacity: 0, clippingPlanes: clip, side: THREE.DoubleSide, depthWrite: false }));
    shadow.position.set(0.18, -0.12, -0.01); h.add(shadow); layers.shadow.push(shadow);
    plate.add(h);
  });

  // The portal: the « 1 »'s face, restricted to the slit, written to the stencil only.
  const portal = new THREE.Mesh(oneFaceGeo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, clippingPlanes: portalPlanes, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp, side: THREE.DoubleSide }));
  portal.position.z = DEPTH + BEVEL + 0.01; portal.renderOrder = -10; plate.add(portal);

  // The footage, deep behind the plate, only visible through the portal (until the camera is through).
  const videoTex = new THREE.Texture(); videoTex.colorSpace = THREE.SRGBColorSpace;
  const videoMat = new THREE.MeshBasicMaterial({ map: videoTex, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc, stencilZPass: THREE.KeepStencilOp, toneMapped: false });
  const video = new THREE.Mesh(new THREE.PlaneGeometry(VIDEO_W, VIDEO_H), videoMat); video.renderOrder = 1; scene.add(video);
  // Seen through the slit, the footage is a glow deep inside: its edges dissolve into the dark (a radial
  // veil just in front of it), until it fills the frame.
  const vc = document.createElement('canvas'); vc.width = 512; vc.height = 512; const g2 = vc.getContext('2d')!; // square: stretched to 16:9 by the UVs, the veil is elliptical
  const grad = g2.createRadialGradient(256, 256, 30, 256, 256, 256); grad.addColorStop(0, 'rgba(5,5,5,0)'); grad.addColorStop(0.55, 'rgba(5,5,5,0)'); grad.addColorStop(0.82, 'rgba(5,5,5,0.75)'); grad.addColorStop(1, 'rgba(5,5,5,1)');
  g2.fillStyle = grad; g2.fillRect(0, 0, 512, 512);
  const veilMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(vc), transparent: true, depthWrite: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc, toneMapped: false });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(VIDEO_W, VIDEO_H), veilMat); veil.position.z = 0.02; veil.renderOrder = 2; video.add(veil);
  // The machine's glow, coming out of the slit.
  const inner = new THREE.PointLight('#ff8a3a', 0, 0, 2); scene.add(inner);

  // The gadget: a real photo on a plane, alpha-cut, lit by the same key, casting its shadow on the plate.
  spinner.colorSpace = THREE.SRGBColorSpace;
  const gadget = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3 * 703 / 1024), new THREE.MeshBasicMaterial({ map: spinner, alphaTest: 0.5, side: THREE.DoubleSide, color: '#f2b98f' }));
  gadget.castShadow = true; scene.add(gadget);
  return { renderer, scene, camera, plate, halves, planes, portalPlanes, layers, cutX: cutLocal, glyphCY: 0, gadget, video, videoMat, videoTex, inner, portal };
}

// ---------------------------------------------------------------- the state of the world at t
function pose(S: Scene, t: number) {
  // Plate: from far in the depth, slammed into place, a heavy settle.
  const f = slam((t - T_FLY[0]) / (T_FLY[1] - T_FLY[0]));
  const settle = t > T_FLY[1] ? 0.35 * Math.exp(-(t - T_FLY[1]) * 7) * Math.sin((t - T_FLY[1]) * 16) : 0;
  const pz = t < T_FLY[0] ? -400 : lerp(-170, PLATE_Z, f) + settle;
  S.plate.position.set(0, 0.25, pz);
  S.plate.visible = t >= T_FLY[0];
  // Layers: surface forward, contour further, shadow back; the caps of the solid vanish (hollow walls).
  const L = move((t - T_LAYERS[0]) / (T_LAYERS[1] - T_LAYERS[0]));
  S.layers.surface.forEach((m) => { m.position.z = DEPTH + BEVEL + 0.002 + 1.8 * L; (m.material as THREE.MeshStandardMaterial).opacity = L > 0 ? 1 : 0; });
  S.layers.contour.forEach((m) => { m.position.z = DEPTH + BEVEL + 0.004 + 3.2 * L; (m.material as THREE.LineBasicMaterial).opacity = clamp(L * 3); });
  S.layers.shadow.forEach((m) => { m.position.z = -0.01 - 2.4 * L; (m.material as THREE.MeshBasicMaterial).opacity = 0.55 * clamp(L * 2); });
  S.layers.capMats.forEach((m) => { m.opacity = 1 - clamp(L * 1.5); m.depthWrite = m.opacity > 0.5; });
  // The slit: the halves part along x.
  const g = move((t - T_SLIT[0]) / (T_SLIT[1] - T_SLIT[0])), gap = 1.7 * g;
  S.halves[0].position.x = -gap / 2; S.halves[1].position.x = gap / 2;
  const cutW = S.plate.position.x + S.cutX;
  S.planes[0]!.constant = cutW - gap / 2 + 0.0001 + gap / 2; // left half keeps x ≤ cut (moved with its half)
  S.planes[0]!.constant = cutW - gap / 2; S.planes[1]!.constant = -(cutW + gap / 2);
  // Portal = the gap, in world x.
  S.portalPlanes[0]!.constant = -(cutW - gap / 2); S.portalPlanes[1]!.constant = cutW + gap / 2;
  S.portal.visible = gap > 0.01;
  S.video.position.set(cutW, S.plate.position.y, VIDEO_Z);
  S.video.visible = gap > 0.01;
  S.inner.position.set(cutW, S.plate.position.y, PLATE_Z - 1.5); S.inner.intensity = 60 * g;
  // Gadget: floats, turns a little.
  S.gadget.position.set(0, 0.06 * Math.sin(t * 1.3), 0); S.gadget.rotation.set(0.18 + 0.04 * Math.sin(t * 0.9), -0.25 + 0.12 * Math.sin(t * 0.6), 0.05 * Math.sin(t * 0.8));
  // Camera.
  const slitView = v3(cutW, S.plate.position.y, -2.2), through = v3(cutW, S.plate.position.y, VIDEO_Z + VIDEO_H / 2 / Math.tan(THREE.MathUtils.degToRad(16)));
  const p0 = lerp3(v3(0, 0.05, 4.2), v3(0, 0.05, 3.75), clamp(t / T_FLY[0]));
  const p1 = v3(0, 0.05, 3.75 - 0.15 * clamp((t - T_FLY[0]) / 1.0));
  const travel = move((t - T_TRAVEL[0]) / (T_TRAVEL[1] - T_TRAVEL[0])), toSlit = move((t - T_SLIT[0]) / (T_SLIT[1] - T_SLIT[0] + 0.05)), d = dive((t - T_DIVE[0]) / (T_DIVE[1] - T_DIVE[0]));
  let pos = lerp3(t < T_FLY[0] ? p0 : p1, v3(4.4, 1.0, 4.3), travel);
  pos = lerp3(pos, slitView, toSlit); pos.y += 1.7 * Math.sin(Math.PI * toSlit); // an arc over the gadget
  pos = lerp3(pos, through, d);
  let look = lerp3(v3(0, 0, 0), v3(0.7, 0.15, -4.2), travel);
  look = lerp3(look, v3(cutW, S.plate.position.y, PLATE_Z), toSlit); look = lerp3(look, v3(cutW, S.plate.position.y, VIDEO_Z), Math.max(d, toSlit > 0.99 ? 1 : 0));
  S.camera.position.copy(pos); S.camera.lookAt(look);
  // Once the camera is through the portal's plane, the footage no longer needs the stencil.
  const portalZ = S.plate.position.z + DEPTH + BEVEL + 0.01;
  const stencil = pos.z < portalZ - 0.02 ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc;
  S.videoMat.stencilFunc = stencil; veilOf(S).material.stencilFunc = stencil;
  veilOf(S).material.opacity = 1 - clamp((d - 0.55) / 0.4); // the veil lifts as the frame fills
  return { speed: t > T_FLY[0] && t < T_FLY[1] + 0.05 };
}

// ---------------------------------------------------------------- loading (cached) and drawing
let fontP: Promise<opentype.Font> | null = null;
const imgCache = new Map<string, Promise<HTMLImageElement>>();
const loadImg = (src: string) => { let p = imgCache.get(src); if (!p) { p = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); imgCache.set(src, p); } return p; };
let S0: Scene | null = null;
const glCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

export const ShopOne: React.FC = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(!!S0);
  const [h0] = useState(() => (S0 ? null : delayRender('ShopOne: font, textures, WebGL')));
  useEffect(() => {
    if (S0) return;
    fontP ??= fetch(staticFile('shop/Geist-ExtraBold-static.ttf')).then((r) => r.arrayBuffer()).then((b) => opentype.parse(b));
    Promise.all([fontP, loadImg(staticFile('shop/spinner.png'))]).then(([font, img]) => {
      const tex = new THREE.Texture(img); tex.needsUpdate = true;
      S0 = build(font, tex, glCanvas!); setReady(true); if (h0 !== null) continueRender(h0);
    });
  }, [h0]);
  useLayoutEffect(() => {
    if (!ready || !S0 || !ref.current || t >= HANDOFF + 0.2) return;
    const S = S0, ctx = ref.current.getContext('2d')!;
    const h = delayRender(`ShopOne frame ${frame}`);
    const vf = clamp(Math.floor((t - VIDEO_T0) * 30), 0, 119);
    loadImg(staticFile(`shop/factory/f${String(vf + 1).padStart(3, '0')}.jpg`)).then((img) => {
      if (S.videoTex.image !== img) { S.videoTex.image = img; S.videoTex.needsUpdate = true; }
      const { speed } = pose(S, t);
      // Motion blur: during the slam, average sub-frames spread over the shutter (180°).
      const n = speed ? 8 : 1;
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      for (let k = 0; k < n; k++) {
        if (n > 1) pose(S, t - (k / n) * (0.5 / fps));
        S.renderer.render(S.scene, S.camera);
        ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(glCanvas!, 0, 0);
      }
      ctx.globalAlpha = 1;
      continueRender(h);
    });
  }, [t, ready, frame, fps]);
  // Hand-over: the full-resolution footage takes the frame at the exact moment the plane fills it.
  const ho = clamp((t - HANDOFF) / 0.15);
  return (
    <AbsoluteFill style={{ background: '#050505' }}>
      <canvas ref={ref} width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} />
      <Sequence from={Math.round(VIDEO_T0 * fps)}>
        {t >= HANDOFF - 0.05 && (
          <AbsoluteFill style={{ opacity: ho, transform: `scale(${1 + 0.035 * clamp((t - HANDOFF) / 1.3)})` }}>
            <OffthreadVideo src={staticFile('shop/factory.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </AbsoluteFill>
        )}
      </Sequence>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

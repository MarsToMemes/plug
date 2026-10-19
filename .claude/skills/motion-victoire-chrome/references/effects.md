# Recettes Remotion des effets

30 i/s, 1080×1080. Palette `P = {red, redDark, ink, paper, white}`. Textures générées une fois en Python
(`tools/*.py` du projet), comme dans les autres projets.

## 1. Fibre de carbone (temps 1 et 6)

Tuile 64 × 64 générée en Python : losanges en relief (pyramides) éclairés en haut à gauche, gris très sombre
(`#2A2A2E` → `#0C0C0E`), tissage alterné (une rangée sur deux décalée d'une demi-tuile). Poser en `backgroundImage`
répété, puis :
- perspective : `transform: perspective(900px) rotateX(18deg)` sur un calque plus grand que le cadre (le motif se
  resserre vers le haut) ;
- vignettage rouge sombre : `radial-gradient(ellipse at 50% 40%, transparent 30%, ${P.redDark} 90%)` en `multiply` ;
- reflet : bande claire diagonale à 8 % en `screen` qui glisse lentement.

## 2. Texte chrome (nom du club, lettres de la macro)

```tsx
<div style={{
  fontFamily: F.wide, fontWeight: 900, fontSize: 130, color: 'transparent',
  backgroundImage: `linear-gradient(175deg, #FDFDFE 0%, #C9CAD0 38%, #6E6E78 50%, #F2F2F5 62%, #A2A3AB 100%)`,
  backgroundSize: '100% 260%', backgroundPosition: `0 ${interpolate(f, [0, 38], [0, 40])}%`,
  WebkitBackgroundClip: 'text', backgroundClip: 'text',
  filter: 'drop-shadow(0 3px 0 #3a3a40) drop-shadow(0 8px 14px rgba(0,0,0,.6))',
}}>{club}</div>
```
Le `backgroundPosition` animé fait glisser le reflet. Mot rouge : `color: P.red` + `textShadow: 0 0 18px ${P.red}88`.

## 3. Lettres chromées extrudées (temps 2)

Chaque lettre dans son propre conteneur (elles bougent séparément) :
- **tranche** : 14 copies empilées, décalées de (0,6 px, 1,2 px) chacune, couleur `#55555C` → `#2A2A30` ;
- **face** : la lettre en chrome (§2) par-dessus ; liseré clair en haut (`WebkitTextStroke: 1px #fff8`) ;
- **ombre** sur la bande : copie noire floue (12 px) décalée de (10, 16) à 45 %.
Rangement f56–80 : `translateY` de ±120 px → 0 avec `spring({damping: 14})`, départ décalé de 3 images par lettre ;
la bande les **découpe** (`overflow: hidden` sur la bande étendue de 60 px vers le haut) pour qu'une lettre « sorte »
du bord cranté.

## 4. Bande rouge à bord cranté et épure technique

- Bande : `div` rouge + bord haut fait d'un SVG de créneaux (`<pattern>` 16 × 8 : rectangle blanc 8 × 8) ; légère
  texture de papier (grain à 6 % en `multiply`).
- Épure : un seul SVG 1080 × 1080 : grand `<circle>` (stroke `#1E0004` à 40 %, 1,5 px), rayons fins de l'emblème
  (40 `<line>` à 12 %), réticules (`<line>` de 40 px), pointillés (`strokeDasharray="14 10"`), croix de visée (`+`
  pleines 30 × 30 px, noire / rose `#F08A9A` / rouge à 50 %) pour la macro. L'emblème gravé = logo du club en
  contour très pâle (`opacity: .08`).
- Macro f47–52 : tout le groupe (bande + épure) dans un conteneur `scale` 6 → 1,4 (Easing.out(Easing.expo)) centré sur
  la lettre du milieu.

## 5. Logo du club en relief 3D (temps 3 et 4)

**Méthode recommandée — `@remotion/three`** (voir `remotion-markup/3d.md`) :
- logo en SVG → `SVGLoader` → `ExtrudeGeometry` (`depth` 40, `bevelEnabled`, `bevelThickness` 6, `bevelSize` 4) une
  forme par couleur, chacune avec son `MeshPhysicalMaterial` (rouge : `roughness .45`, `clearcoat .6` ; noir :
  `roughness .7` + carte de rayures ; blanc/argent : `metalness .9, roughness .25`) ;
- lumière : `Environment` (preset `studio`) + `directionalLight` rasante pour le biseau ;
- sol : plan rouge avec texture hexagonale (tuile générée en Python) ;
- caméra : `position` qui dérive sur f110–175, `fov` 30, légère plongée ; `useCurrentFrame()` pour tout (jamais
  `useFrame`).
Si le logo n'existe qu'en PNG : le vectoriser (potrace / `potracer` en Python, une passe par couleur) avant d'extruder.

**Repli sans 3D** (à dire à l'utilisateur : moins crédible) : 20 calques du logo PNG empilés en `translateZ` dans un
conteneur `perspective: 1200px; transformStyle: preserve-3d`, calques arrière assombris (`brightness(.35)`) pour la
tranche, `rotateX(28deg) rotateZ(-8deg)` qui dérive.

Retournement du temps 4 : même logo (2D suffit, il est petit), `rotateX` 85° → 0° sur f176–183 avec
`spring({damping: 11})`, tranche = 6 copies décalées en y de 1 px, chromées.

## 6. Glitch en zigzag (temps 1, f13–16)

Carte de déplacement en dents de scie (PNG 1080 × 1080 généré en Python : canal R = sawtooth vertical de pas 14 px,
canal G = 128) et filtre SVG :
```tsx
<filter id="zig"><feImage href={staticFile('textures/zigzag.png')} result="m" />
  <feDisplacementMap in="SourceGraphic" in2="m" scale={zig} xChannelSelector="R" yChannelSelector="G" /></filter>
```
`zig` = 0, 22, 30, 18, 0 sur f12–16, appliqué à tout le calque de la carte (pas au fond).

## 7. Lavis rouge qui clignote (temps 1, f39–46)

Calque `P.red` en `mixBlendMode: 'multiply'` (images paires) / `'screen'` à 40 % (images impaires), plus
`filter: blur(${v}px)` vertical léger ; poussée `scale` 1,08 → 1,35 avec `Easing.in(Easing.cubic)`.

## 8. Transitions en blocs (f104–113, f172–175, f340–347)

Reprendre `Mosaic` de `motion/clermont-glitch/src/scenes/Transitions.tsx` en changeant la grille : 6 à 10 grands
rectangles (pas une grille régulière : tailles 200–600 px, positions tirées par `random(seed)`), chacun montre soit un
morceau de la **scène suivante** (`clipPath: inset(...)` sur une copie de la scène), soit un **aplat** (rouge, rouge
sombre, blanc, noir) ; apparition échelonnée sur 4–8 images, un ou deux blocs avec flou de mouvement horizontal.

## 9. Texte qui se décode (signature, nom)

`Decode` de `motion/clermont-glitch/src/scenes/PlayerCard.tsx` : chaque lettre passe par 2–4 caractères aléatoires
(`random(seed + f)`), lettres absentes au début (espaces), ordre de résolution mélangé. Variante « pixelisée » du
temps 5 : pendant le décodage, la lettre est doublée (copie décalée de 6 px vers le bas, coupée à moitié par
`clipPath`).

## 10. Le nom qui roule dans son cadre (temps 5)

Cadre `overflow: hidden` ; à l'intérieur, une colonne de 5 copies du NOM (alternance droit / italique `skewX(-12deg)`,
tailles 100 % / 80 %) ; `translateY` de la colonne : 0 → −4 hauteurs en 12 images (Easing.inOut(Easing.cubic)) avec
flou vertical pendant le mouvement, puis retour net sur la copie droite. Trois passages (f232, f288, f304).

## 11. Lettres géantes une par image (temps 4)

`const letters = name.split('').reverse()` ; à l'image `f`, afficher `letters[f - 176]` en très grand
(`fontSize: 1100`, couleur alternée `P.red` / `P.redDark`, fond inverse) ; le MOT géant en bas reste fixe.
Changement **sec** à chaque image (pas d'interpolation). À partir de f184, alterner aussi fond blanc / gris.

## 12. Mise au point qui glisse et respiration

`filter: blur()` sur le calque de fond seulement : 0 → 18 px sur f192–198 (temps 4) ; respiration du temps 5 :
0 → 4 → 0 px sur f234–238 sur toute la carte.

## 13. Boucle

Le temps 6 se termine exactement sur l'état de f0 (même échelle, même position du reflet chrome : `backgroundPosition`
remis à 0 sur f359). Vérifier par différence d'images.

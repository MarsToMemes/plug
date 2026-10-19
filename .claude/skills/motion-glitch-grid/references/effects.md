# Recettes Remotion des effets

24 i/s : tout le timing se compte en images de 1/24 s. Palette `P = {red, redDark, white, black, grey}`.
Aléatoire uniquement par `random(\`clé-${tick}\`)` (déterministe).

## 1. Mosaïque de blocs (transitions f8–16, f89–99, f159–166)

Calque plein cadre au-dessus des deux scènes reliées. Grille de 45 px (24 × 24 cellules sur 1080).
```tsx
const CELL = 45;
const blocks = (frame: number, density: number) => {
  const out = [];
  for (let i = 0; i < 70; i++) {
    const k = `${i}-${frame}`;                     // nouveau tirage à chaque image
    if (random(`on-${k}`) > density) continue;
    const w = 1 + Math.floor(random(`w-${k}`) * 4), h = 1 + Math.floor(random(`h-${k}`) * 6);
    const x = Math.floor(random(`x-${k}`) * (24 - w)) * CELL, y = Math.floor(random(`y-${k}`) * (24 - h)) * CELL;
    out.push({x, y, w: w * CELL, h: h * CELL, kind: random(`k-${k}`)});
  }
  return out;
};
```
- `density` suit une courbe en cloche sur la transition (0 → 0,45 → 0).
- Chaque bloc est soit un aplat (gris clair, blanc, rouge sombre), soit une **fenêtre** sur la scène suivante :
  `<div style={{clipPath: \`inset(...)\`}}><NextScene/></div>` (même scène montée une fois, découpée par un
  `clipPath` composé de tous les rectangles : `polygon()` à plusieurs sous-rectangles, ou un SVG `<clipPath>`
  contenant les `<rect>`).
- Proportion « fenêtres sur la scène suivante » qui monte de 0 à 1 pendant la transition.

## 2. Lettres qui claquent (f17–27)

Table d'images écrite en dur, une entrée par image :
```tsx
const STEPS: Record<number, {chars: string; size: number; color: 'white' | 'black'; dx?: number}> = {
  17: {chars: 'G', size: 860, color: 'white'}, 18: {chars: 'G', size: 390, color: 'white'},
  19: {chars: 'G', size: 280, color: 'black'}, 20: {chars: 'O', size: 860, color: 'white'}, ...
};
```
`size` = taille de police (hauteur de capitale ≈ 0,72 × size). **Aucune interpolation** entre deux images.

## 3. Mot en tranches (f28–37)

Le mot est rendu N fois (N = 2 à 3), chaque copie limitée à une bande horizontale par `clipPath: inset(top 0 bottom 0)`,
avec sa couleur et son décalage `translate` propres. Pour la ligne bicolore : une copie BLANCHE `clipPath: inset(0 X 0 0)`
et une NOIRE `inset(0 0 0 X)` (coupe verticale à X).

## 4. Grille de mots sur portrait (f38–56)

- 5 lignes du mot ; chaque ligne a son `letterSpacing` animé par paliers (ligne i commence à s'écarter à l'image
  40 + i) jusqu'à placer les lettres sur 4 colonnes fixes. Plus simple et plus juste : rendre **chaque lettre** dans
  une colonne absolue (x = 25 + c × 275) et interpoler par paliers entre la position « mot serré » et la colonne.
- Bandes verticales (f48–56) : 4 copies de [portrait + lettres] chacune coupée à une colonne
  (`clipPath: inset(0 ${1080 - x1}px 0 ${x0}px)`), décalée en y de `(random(\`dy-${col}-${Math.floor(frame / 2)}\`) - 0.45) * 270`.

## 5. Compteur à rouleaux (f57–70 et f105–124)

```tsx
// une colonne de chiffres empilés, translatée verticalement ; la case masque (overflow: hidden)
const Reel: React.FC<{value: number; size: number}> = ({value, size}) => (
  <div style={{height: size, overflow: 'hidden', background: P.black}}>
    <div style={{translate: `0px ${-value * size}px`}}>
      {Array.from({length: 30}, (_, i) => <div key={i} style={{height: size, lineHeight: `${size}px`}}>{i % 10}</div>)}
    </div>
  </div>
);
```
- `value` est **continu** (on voit deux chiffres coupés pendant le défilement) : `interpolate(frame, [t0, t1],
  [start, target + 10k], {easing: Easing.out(Easing.cubic)})` ; un dépassement de 0,15 puis retour donne le rebond.
- Ouverture f57–60 : la case est d'abord un aplat BLANC de demi-hauteur ; un rideau NOIR descend
  (`clipPath: inset(0 0 ${100 - p}% 0)`) en révélant le rouleau.
- Carte joueur : comptage NUM−9 → NUM, une valeur toutes les 2 images (palier, pas de défilement continu).

## 6. Écho de sortie (f74–75)

Deux copies de NUM : l'originale déplacée de +Δ, une copie à 50 % d'opacité déplacée de +Δ/2 (ou `mixBlendMode:
'difference'` pour l'effet de surimpression). Δ = 400 px par image.

## 7. Photo noir et blanc cadrée (f76–91)

`<Img style={{filter: 'grayscale(1) contrast(1.1) brightness(1.05)'}}>` dans un cadre `overflow: hidden`, bandes
noires haut/bas avec textes minuscules (`fontSize: 14`, `letterSpacing: '0.6em'`). Zoom lent `scale` 1 → 1,06.

## 8. Duotone rouge (photo de ville, fonds)

```tsx
<svg width={0} height={0}><filter id="duo"><feColorMatrix type="matrix" values="
  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" />
  <feComponentTransfer>
    <feFuncR type="table" tableValues={`${r0} ${r1}`} /> <feFuncG type="table" tableValues={`${g0} ${g1}`} />
    <feFuncB type="table" tableValues={`${b0} ${b1}`} />
  </feComponentTransfer></filter></svg>
```
(r0, g0, b0) = ROUGE SOMBRE, (r1, g1, b1) = ROUGE, en 0–1. Appliquer `filter: url(#duo)` à l'image.

## 9. Nom qui se décode (f99–118 et logotype f167–186)

Pour chaque lettre i : instant de fixation `tᵢ = start + i × 1,2 + random(i) × 3` (images). Avant `tᵢ`, afficher un
glyphe parasite changé à chaque image : autre lettre du mot, lettre retournée (`scale: '-1 1'`), moitié de lettre
(`clipPath: inset(0 0 50% 0)`), ou bloc noir de la largeur de la lettre. Largeur de chaque lettre fixe (span à
largeur mesurée) pour que le mot ne bouge pas.

## 10. Tranches de sortie (f155–158)

6–10 bandes horizontales de la carte, chacune `clipPath: inset(...)` + `translate` x aléatoire (±60–200 px) changé
chaque image, avec une copie du joueur légèrement décalée (dédoublement).

## 11. Lignes techniques

SVG `stroke` 2 px (BLANC sur ROUGE dans le logotype, NOIR sur la carte). Tracé progressif par `strokeDasharray =
L` / `strokeDashoffset = L × (1 − p)`. Flèches = `marker-end` triangle de 10 px. Croix = deux traits de 16 px.

## 12. Vagues (motif du club)

Chemins SVG BLANCS : 4–5 bandes courbes parallèles (Bézier cubiques) d'épaisseur décroissante, du bas gauche vers la
droite. **À redessiner à partir d'un motif du club** (bandes du maillot, forme de l'écusson), jamais l'aile de la référence.

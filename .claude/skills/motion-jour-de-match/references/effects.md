# Recettes Remotion des effets

24 i/s, 1080×1920. Palette `P = {grey, navy, red, redHot, blue, blueText, white}`.

## 1. Éclats de lumière (tous les fonds)

Un SVG 1080×1920 par fond : 4–6 **triangles longs** (`<polygon>`) partant du bord droit en diagonale, remplis d'un
`linearGradient` blanc 0 → 18 % d'opacité ; une 2ᵉ couche d'éclats plus sombres (noir 10 %) ; dégradé radial clair au
centre. Dérive : `rotate` ±1° et `translate` ±20 px sur la scène. Même composant pour gris, bleu nuit et rouge (seules
les couleurs changent).

## 2. Rangées répétées (temps 1, 2, 4)

Un composant `Row` (mot principal + mot secondaire + éventuellement logo) rendu 3 fois à y fixes ; tout le groupe dans
un conteneur « caméra » (`scale`, `translateY`). Sortie qui file : `translateY` −300 px/image + filtre SVG
`feGaussianBlur stdDeviation="0 18"` (flou vertical) sur 2 images.

## 3. Lettres instables

Chaque lettre dans un `<span>` ; par image, `random(\`${seed}-${i}-${f}\`)` décide : visible (70 %), absente (15 %),
en **contour** (`color: transparent; WebkitTextStroke: 2px currentColor`, 10 %), en couleur décalée (5 %). Après
l'image de pose, toutes visibles. Le hasard est déterministe (pas de `Math.random`).

## 4. Logo incrusté dans le mot (temps 2)

`<Img>` du logo (PNG détouré) en `position: absolute` centré sur le mot, au-dessus, avec `drop-shadow` sombre léger ;
le mot reste lisible de part et d'autre (choisir une taille de logo ≈ 45 % de la largeur du mot).

## 5. Grille qui défile + silhouettes (temps 3)

Grille 2 colonnes × 12 rangées plus grande que le cadre, `translate` linéaire (−4 px, −6 px par image), colonne droite
décalée. Derrière chaque mot, une **silhouette** de l'emblème (PNG blanc recoloré par `WebkitMaskImage`, couleur
`P.blue`) qui grandit avec `spring` décalé par mot.

## 6. Contour de l'emblème qui se dessine, puis volet plein (temps 3)

Emblème vectorisé en Python (OpenCV `findContours` sur la silhouette, simplifié) → `path d` dans un SVG :
```tsx
<path d={EMBLEM} fill="none" stroke="#fff" strokeWidth={8} pathLength={1}
      strokeDasharray={1} strokeDashoffset={1 - draw} />
```
`draw` 0 → 1 sur f31–36 (`Easing.inOut(Easing.cubic)`). Puis f37–40 : même `path` avec `fill="#fff"`, `scale`
1 → 1,6 autour de son centre, flou de mouvement ; à f40 il couvre le cadre.

## 7. Étoiles en perspective (temps 5)

Étoile à 5 branches en SVG (`<polygon>` calculé), 2–3 instances très grandes, chacune dans un conteneur
`perspective(1200px) rotateX(55deg) rotateZ(…)` ; couleur `#1C3A66` à 50 %, dégradé linéaire vers transparent. Lente
rotation (0,2°/image).

## 8. Noms qui s'écartent + logos en silhouette (temps 5)

Trois lignes centrées ; `translateY` de CLUB 0 → −290 px et d'ADVERSAIRE 0 → +30 px avec `spring({damping: 15})` ;
logos des deux clubs en **silhouette** (masque PNG, couleur `P.redHot`), `opacity` 0 → 1 et `scale` 0,9 → 1 sur
f62–68, posés **derrière** le texte (z-index inférieur).

## 9. Trait qui devient bande (temps 5 → 6)

Un `div` pleine largeur `P.redHot` : `height` 4 px (f104–105) → 120 px (f111) → 1920 px (f112, coupe) ;
f112–114 : fond rose clair, textes dédoublés (2 copies décalées de 10 px, opacité 0,6 et 0,3).

## 10. Photo en négatif qui clignote (temps 7)

`<Img>` de la photo dans un conteneur `borderRadius: 40, overflow: hidden` ; f115–118 `scale` 0,3 → 1 ;
filtre selon l'image : négatif = `invert(1) sepia(1) saturate(3) hue-rotate(300deg) brightness(1.1)` (rose),
positif = aucun ; séquence f115 nég., f116 nég., f117 pos., f118 nég., f119+ pos. Rayons de lumière : 3 bandes
blanches floues (`linear-gradient`, `mixBlendMode: screen`, 25 %) depuis le coin haut gauche.

## 11. Nom géant qui s'assemble (temps 7)

Lettres du NOM en étendue italique (`transform: skewX(-12deg)` si la police n'a pas d'italique) ; lettre *i* apparaît à
f115 + 3*i* en **contour** (`WebkitTextStroke: 3px #fff`, remplissage transparent) puis devient pleine 3 images plus
tard ; remplissage : `backgroundImage: linear-gradient(90deg, #176AA7, #0B2A55)` + `backgroundClip: text`.

## 12. Texte tapé à la machine (temps 7)

`text.slice(0, Math.floor((f - t0) * cps))` avec `cps` ≈ 1,2 caractère par image ; un curseur n'est pas nécessaire
(la référence n'en a pas) ; lignes en cascade (chaque ligne commence quand la précédente est à moitié).

## 13. Barre blanche de fin

`div` blanc pleine largeur centré à y ≈ 1000 : `height` interpolée 2 → 200 px sur f221–232 (`Easing.in(Easing.cubic)`).

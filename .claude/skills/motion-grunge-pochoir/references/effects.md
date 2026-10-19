# Recettes Remotion des effets

60 i/s, 1080×1350. Palette `P = {yellow, yellowHot, navy, white, concrete, canvas, storm, stormBrown}`. Textures
générées une fois en Python (`tools/textures.py` du projet, numpy + Pillow + scipy, comme dans les autres projets).

## 1. Textures de fond (Python)

- **Béton** : bruit fractal 6 octaves en gris (`#474847` ± 18), quelques taches sombres (seuil sur une 2ᵉ couche de
  bruit basse fréquence, flou 30 px), micro-grain. 1080×1350, poser en `cover`.
- **Toile** : tissage diagonal = deux sinusoïdes croisées à 45° (pas 6 px) en relief léger, teinte `#3D3F4A`, plus un
  bruit basse fréquence pour l'irrégularité.
- **Ciel d'orage** : bruit fractal « nuageux » (|bruit| cumulé, 7 octaves), courbe de contraste en S forte, 2160×2700
  pour pouvoir dériver ; version grise (temps 6–7) et version brun-noir (temps 5, multipliée par `#2A231C`).
  Si le club fournit une vraie photo de ciel ou de stade en noir et blanc, elle sera meilleure : la proposer.
- Dérive : `translate` lent (± 40 px sur la scène) et `scale` 1,00 → 1,04.

## 2. Pochoir / sérigraphie (lettres et logo)

Deux ingrédients, à appliquer à un conteneur (texte ou logo) :
1. **Bords rugueux** : filtre SVG `feTurbulence` (`baseFrequency 0.9`, `numOctaves 2`, `seed` qui change toutes les
   4 images) → `feDisplacementMap` `scale 3–5`.
2. **Grain de bombe** : masque PNG de mouchetures (bruit blanc seuillé + petites taches) en `WebkitMaskImage`
   (`mask-composite` : on garde 92 % de la matière, des trous au hasard) ; **surpulvérisation** : une copie du texte
   floutée 6–10 px, masquée par un PNG de points épars, à 70 % → les points de peinture autour des bords.
Pour le logo : appliquer les mêmes masques au PNG du logo (ou générer en Python une version « imprimée » du logo).

## 3. Lettre qui ondule en naissant (temps 2)

Une lettre = un `<span>` dans son conteneur avec son propre filtre :
```tsx
<filter id={`wave${i}`}><feTurbulence type="fractalNoise" baseFrequency="0.004 0.03" numOctaves={1} seed={i} />
  <feDisplacementMap in="SourceGraphic" scale={amp} xChannelSelector="R" yChannelSelector="G" /></filter>
```
`amp = interpolate(f, [t0, t0 + 4], [36, 0])`, `scaleY` 1,4 → 1 (origine bas), opacité 0 → 1 en 1 image.
**Fantôme** : même lettre, `opacity 0.4`, `filter: brightness(0.75)`, décalée de (+45, +30) px → (0, 0) sur 4 images,
apparaît 2 images avant la vraie lettre.

## 4. Coulure du logo (temps 1, f26–36)

Carte de déplacement PNG (Python) : colonnes verticales de largeur 2–8 px, valeur aléatoire par colonne, **nulle en haut
et forte en bas** (dégradé vertical) → `feDisplacementMap` canal Y seulement, `scale` 0 → 60 ; ajouter sous le logo
quelques coulures (rectangles arrondis 3–6 px de large, 20–60 px de haut, couleur du contour) qui s'allongent.

## 5. Saturation et flashs

- Saturation f38–46 : `filter: brightness(1.0 → 1.35) saturate(1.4)` + halo (`drop-shadow(0 0 10px yellowHot)`) +
  tremblement `translate(random ±6 px)` par image.
- Flash jaune f48 : calque `#E8E070` en `screen` à 0,7 une image.
- Flash blanc du temps 3 : couleur du texte → blanc, `filter: blur()` 6 → 12 → 4 px, fond `brightness(1.15)`.
- Pop jaune du temps 4 : couleur `yellowHot`, `filter: blur(16px → 0) drop-shadow(0 0 24px yellowHot)`.

## 6. Texte géant en diagonale (fond des temps 2–4)

Un conteneur 2400×2400 tourné de −25°, 8 lignes de « CLUB MOT CLUB MOT … » (condensée grasse, 180 px, couleur
`rgba(0,0,0,0.28)`, `mixBlendMode: multiply`), lignes alternées décalées ; translation lente le long de la diagonale.

## 7. Mots révélés par lamelles (temps 6)

Le mot est rendu N fois (N = 7), chaque copie coupée à sa bande : `clipPath: inset(0 ${100 - x1}% 0 ${x0}%)` avec des
largeurs de bande irrégulières (tirées par `random(seed)`), chaque copie translatée en Y de −hauteur → 0
(`Easing.out(Easing.cubic)`), départ décalé de 1–3 images par bande. Bords nets (pas de flou).

## 8. Logo + mot qui tournoient (temps 6)

Conteneur `transformOrigin: 30% 60%` : `rotate` −35° → 0°, `translate` (+260, +420) → (0, 0), `scale` 0,8 → 1 sur
10 images (`Easing.out(Easing.cubic)`) ; flou de mouvement : filtre SVG `feGaussianBlur stdDeviation={`${v} ${v*0.4}`}`
proportionnel à la vitesse.

## 9. Dégradé du mot blanc

`backgroundImage: linear-gradient(#F2F2F2 40%, #B8B8B8)`, `WebkitBackgroundClip: text` sur MOT 3 ; le grain de pochoir
s'applique au conteneur (le masque fonctionne aussi avec le texte découpé).

## 10. Plongée finale (temps 8)

Tout le bloc du slogan dans un conteneur `transformOrigin` = centre de la lettre cible (mesuré avec `measureText` ou
fixé) : `scale` 1 → 9 avec `Easing.in(Easing.exp)` sur f350–371, `rotate` 0 → 10° ; flou croissant (0 → 20 px) ;
f372–379 : plan fixe de la texture jaune granuleuse (le grain de bombe agrandi) floue. Coupe franche sur f0.

## 11. Mouvements de caméra

Un seul conteneur « caméra » par temps : `scale`, `rotate`, `translate` interpolés + un léger bruit (`random(seed + f)`
± 2 px) pour l'effet caméra à la main. Les coupes sèches (f14, f50, f54, f114, f188, f200) changent d'un coup le
cadrage, jamais de fondu sauf le fondu de 2 images f50–53.

## 12. 60 i/s

Travailler à **60 i/s** (la référence en a besoin pour la fluidité des tournoiements et de la plongée). Les effets
« une image » (flash) restent d'une seule image à 60 i/s. Rendu : concurrence 4, prévoir ≈ 2× le temps d'un 30 i/s.

---
name: motion-glitch-grid
description: Annonce de but « glitch numérique » pour les réseaux d'un club (carré, ~8 s, 24 i/s) — carte logotype du club, transitions en mosaïque de blocs, lettres du mot qui claquent une par image, mot découpé en tranches, grille de mots sur portrait, compteur à rouleaux pour le numéro, photo d'action noir et blanc cadrée, carte joueur avec nom qui se décode, retour en boucle sur le logotype. Charger pour créer, modifier ou rendre une vidéo dans ce style.
---

# Annonce de but « glitch numérique »

Style relevé image par image sur une annonce de but NHL (1080×1080, **24 i/s**, 187 images, 7,79 s, **sans audio**).
Ce skill garde **le rythme, la mise en page et les techniques**. Tout le contenu (logotype, emblème, polices, couleurs,
photos, nom) vient du club pour lequel on produit : on ne réutilise ni le logo, ni l'aile, ni la police, ni les photos de
la vidéo de référence.

Avant de coder, charger `remotion-best-practices` puis `remotion-markup` (et `remotion-render` pour l'export).
Détourage et analyse d'une nouvelle référence : méthodes de `motion-goal-card` (`references/adaptation-club.md`,
`references/analyse-reference.md`). Calage de musique : méthode de `motion-retro-print/references/adaptation.md`.

## Fichiers de référence

- [references/timeline.md](references/timeline.md) — découpage à l'image près (24 i/s), positions, couleurs. **Source de vérité.**
- [references/effects.md](references/effects.md) — recettes Remotion de chaque effet.
- [references/adaptation.md](references/adaptation.md) — paramètres, assets à demander (dont **3 photos**), pièges.

## Structure en 8 temps (24 i/s, 187 images)

| # | Images | Temps | Ce qu'on voit |
|---|--------|-------|---------------|
| 1 | 0–7 | 0,00–0,33 s | **Carte logotype** : fond rouge, emblème du club géant coupé en haut à gauche, logotype du club centré, lignes techniques (crochets + flèches), photo de la ville en duotone rouge en bas. |
| 2 | 8–16 | 0,33–0,71 s | **Mosaïque de blocs** : des rectangles gris clair alignés sur une grille envahissent puis quittent l'image. |
| 3 | 17–35 | 0,71–1,50 s | **Lettres qui claquent** : G énorme blanc → moyen → petit noir, puis O pareil (une taille par image) ; puis le mot s'écrit **découpé en tranches horizontales** (moitiés blanches/noires décalées), en 1 puis 3 lignes. |
| 4 | 36–56 | 1,50–2,37 s | **Grille de mots** : fond noir, 5 lignes « GOAL » serrées ; coupe sur un **portrait serré** du joueur, les lettres s'écartent en 4 colonnes ; puis le portrait se **découpe en bandes verticales décalées**. |
| 5 | 57–75 | 2,37–3,17 s | **Compteur à rouleaux** : deux cases noires, les chiffres défilent verticalement jusqu'au numéro ; une ligne fléchée traverse, le numéro sort à gauche avec écho. |
| 6 | 76–91 | 3,17–3,83 s | **Photo d'action noir et blanc** vue du dessus, cadrée par deux bandes noires portant de tout petits textes (ville / poste) ; numéro en cases blanches au centre ; les chiffres tombent un à un. |
| 7 | 89–155 | 3,71–6,46 s | **Mosaïque** vers la **carte joueur** : fond rouge, joueur en grand, vagues blanches (motif du club) en bas à gauche, bande rouge sombre derrière le nom, **nom qui se décode** lettre par lettre, compteur du numéro qui roule en haut, lignes techniques (arc, croix, flèches) qui se dessinent. |
| 8 | 155–186 | 6,46–7,79 s | **Sortie glitch** (tranches + blocs) puis **retour sur la carte logotype**, dont le nom de ville se recompose lettre par lettre : la vidéo boucle. |

## Règles qui font le style (à ne pas trahir)

1. **Rouge + blanc + noir**, et le gris uniquement pour la photo d'action et les blocs de mosaïque. Les photos en couleur
   sont **poussées vers la couleur du club** (fonds rouges, duotone), jamais naturelles.
2. **Tout se fait image par image** : changements de taille par paliers (pas d'interpolation douce), lettres qui
   apparaissent une par image, blocs qui sautent. Les seules animations continues sont les lents zooms des photos et
   le tracé des lignes techniques.
3. **Grille** : blocs, cases de chiffres, colonnes de lettres et bandes de photo sont alignés sur une même grille
   (pas de 45 px sur 1080).
4. **Typo** : une seule famille linéale grasse, large et carrée (style « athletic »), en capitales ; petits textes très
   espacés ; chiffres en cases noires (ou blanches) comme un compteur mécanique.
5. **Boucle** : la fin reprend la première image à l'identique (le logotype se recompose), pour que la vidéo tourne en
   boucle sur les réseaux.

## Mise en œuvre

- Projet Remotion dédié : `motion/<club>-glitch/` (Remotion **4.0.534**). Composition `GlitchGoal` 1080×1080,
  **24 i/s**, 187 images, props typées (zod) décrites dans `adaptation.md`. Une scène = un composant dans
  `<Sequence from durationInFrames premountFor={fps}>`.
- Les transitions (mosaïque, tranches) sont des **calques par-dessus** les scènes qu'elles relient : elles montrent des
  morceaux de la scène suivante dans les blocs, donc les deux scènes sont montées en même temps pendant la transition.
- Aléatoire (blocs, ordre de décodage, décalages) uniquement par `random(seed)` de `remotion` : rendu identique à chaque fois.
- Pas d'audio dans la référence : impacts sur f17, f20, f36, f57, f68, f76, f99 ; petits « clics » numériques sur les
  rouleaux et le décodage du nom.

## Vérification avant de montrer

1. Images fixes : 0, 10, 14, 17, 18, 19, 20, 27, 31, 36, 38, 44, 52, 60, 66, 70, 74, 80, 89, 94, 100, 110, 118, 130,
   157, 163, 170, 178, 186 — et **f186 identique à f0** (boucle).
2. Planche contact image par image (8 × 6 par planche) des images 0–186, comparée à `timeline.md` : mêmes coupes
   (±1 image), mêmes paliers de taille, même mise en page (±2 %).
3. Contrôler : palette tenue, nom lisible quand il est posé (≥ f118), numéro lisible dans ses cases, textes minuscules
   assumés comme décor (ils ne portent aucune info indispensable).
4. Ne rendre le MP4 que si l'utilisateur le demande.

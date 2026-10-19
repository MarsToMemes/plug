---
name: motion-cinema-brush
description: Annonce de but « cinématique coups de pinceau » (16:9, ~9,5 s, 30 i/s, avec musique) — logo du club qui s'assemble sur fond texturé, slogan de campagne en lettres grasses, bandes de pinceau orange et noires, rushes vidéo du joueur cadrés entre des bandes déchirées, « BUT » géant qui grossit sur la vidéo, numéro lumineux qui irradie, poste du joueur dans une bande de pinceau, gros plan visage, nom géant texturé, plan final avec traînée stroboscopique. Charger pour créer, modifier ou rendre une vidéo dans ce style.
---

# Annonce de but « cinématique coups de pinceau »

Style relevé image par image sur une annonce de but NHL (**1920×1080, 30 i/s, 283 images, 9,47 s, avec musique**).
Contrairement aux trois autres templates (carrés, à base de photos), celui-ci est **horizontal** et repose sur des
**séquences vidéo du joueur** sur lesquelles se posent les graphismes. Ce skill garde le rythme, la mise en page et les
techniques ; tout le contenu (logo, slogan, couleurs, rushes, nom) vient du club pour lequel on produit.

Avant de coder, charger `remotion-best-practices`, `remotion-markup` (vidéo : `video-editing.md`, `embedding-videos.md`,
`timing-props.md`) et `remotion-render`. Détourage / analyse : méthodes de `motion-goal-card` ; calage musique :
`motion-retro-print/references/adaptation.md`.

## Fichiers de référence

- [references/timeline.md](references/timeline.md) — découpage à l'image près, positions, couleurs. **Source de vérité.**
- [references/effects.md](references/effects.md) — recettes Remotion (pinceaux, texture topographique, flou de
  mouvement, halo lumineux, traînée stroboscopique, texte qui défile…).
- [references/adaptation.md](references/adaptation.md) — rushes et assets à demander, solutions de repli avec photos.

## Structure en 9 temps (30 i/s, 283 images)

| # | Images | Temps | Ce qu'on voit |
|---|--------|-------|---------------|
| 1 | 0–14 | 0,0–0,5 s | **Logo qui s'assemble** : fond gris anthracite à lignes topographiques, une ligne orange se trace puis devient bande, panneau noir avec la ville en filigrane, logo du club en contour blanc, nom du club en lettres espacées dessus/dessous. |
| 2 | 15–36 | 0,5–1,2 s | **Slogan** : coupe sur orange (bande de pinceau claire + skyline en duotone), slogan du club en italique très gras blanc à contour noir qui entre en glissant avec flou de mouvement ; une **bande de pinceau noire** chargée de logos le recouvre. |
| 3 | 37–61 | 1,2–2,0 s | **Rush 1** (joueur qui avance vers la caméra, flou) entre deux **bandes verticales orange déchirées** ; bande de texte vertical sur le bord droit. |
| 4 | 62–90 | 2,1–3,0 s | **« BUT » géant** sur le rush : lettres translucides puis blanches, flou de mouvement, grossissement continu, écho du mot au-dessus ; bandes de pinceau orange haut et bas. |
| 5 | 91–111 | 3,0–3,7 s | **Numéro qui irradie** : sur fond sombre texturé, le numéro géant brûle de lumière (halo crème-orange surexposé, flou) avec un contour fin net par-dessus ; nom de la ville en italique contour, empilé. |
| 6 | 112–124 | 3,7–4,1 s | **Poste du joueur** (« ATTAQUANT ») en lettres espacées dans une **bande de pinceau** remplie de vidéo orange ; ville en noir et blanc derrière ; flash surexposé à l'entrée. |
| 7 | 125–166 | 4,2–5,5 s | **Gros plan visage** (rush 2) révélé par des **entailles diagonales orange** ; numéro lumineux en bas à droite ; à la fin, une lumière orange balaie le visage. |
| 8 | 167–187 | 5,6–6,2 s | **Nom géant texturé** (blanc plâtre en relief) en panoramique sur fond rouge-orange ; puis coupe : nom moitié plein, moitié contour, sur photo de ville + emblème géant + slogan. |
| 9 | 188–282 | 6,3–9,4 s | **Plan final** (rush 3, action) avec **traînée stroboscopique** (copies fantômes du joueur), nom en contour derrière, barres latérales type HUD, slogan en bas ; flash rouge puis mise au point ; tenue 3 s. |

## Règles qui font le style (à ne pas trahir)

1. **Noir anthracite + couleur du club + blanc**, avec des textures : lignes topographiques sur les fonds, bords
   **déchirés / pinceau sec** sur toutes les bandes. Aucune forme à bord net hors du texte.
2. **Les graphismes sont posés sur de la vidéo** : chaque temps fort a son rush. Les rushes sont étalonnés vers la
   couleur du club (ombres profondes, hautes lumières chaudes).
3. **Flou de mouvement partout** : lettres qui entrent floues, rushes qui passent d'un flou de profondeur au net.
4. **Lumière** : le numéro « brûle » (surexposition + halo), des flashs surexposés servent de transitions.
5. **Typo** : italique très grasse à contour (slogan), linéale condensée très grasse (BUT, numéro, nom), petites
   capitales très espacées (nom du club, poste, ville), texte en contour pour les échos.
6. **Le slogan du club** (sa campagne de saison, ou sa devise) est la signature : il revient en bandeau, en
   texte défilant et en bloc final.

## Mise en œuvre

- Projet Remotion dédié : `motion/<club>-cinema/` (Remotion 4.0.534). Composition `CinemaGoal` **1920×1080, 30 i/s,
  283 images**. Variantes : 1080×1080 et 1080×1920 en recadrant chaque scène autour de son centre d'intérêt (même timing).
- Rushes en `<OffthreadVideo>` (ou `<Video>` de `@remotion/media` si le rendu tient) avec `trimBefore`, `muted`,
  `playbackRate` (ralenti 0,5 sur le rush 1 et 3). Préparer les rushes en H.264 1080p, durée utile seulement.
- Musique fournie par l'utilisateur, calée par énergie RMS : temps forts sur f15, f62, f91, f125, f167, f188.

## Vérification avant de montrer

1. Images fixes : 0, 5, 10, 15, 24, 32, 38, 45, 62, 75, 88, 92, 100, 110, 114, 120, 126, 140, 163, 168, 180, 185,
   188, 195, 230, 282.
2. Planches contact (6 × 8) de 0 à 282, comparées à `timeline.md`.
3. Contrôler : rushes nets là où ils doivent l'être, étalonnage cohérent, aucun bord net sur les bandes, textes
   lisibles en miniature (BUT, numéro, nom), mixage ≈ −14 LUFS sans saturation.
4. Ne rendre le MP4 que si l'utilisateur le demande.

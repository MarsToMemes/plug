---
name: motion-victoire-chrome
description: Annonce de victoire « chrome et carbone » pour les réseaux d'un club (carré 1080×1080, 12 s, 30 i/s, boucle) — carte sombre en fibre de carbone avec nom du club en chrome et mot de victoire rouge, glitch en zigzag et lavis rouge, bande rouge crantée avec lettres chromées en 3D sur épure technique blanche, logo du club en relief 3D avec mot en contour, fond de lettres géantes qui défilent une par image et logo qui se retourne, carte blanche éditoriale avec mot blanc sur bloc rouge et nom qui roule, transitions en blocs, retour en boucle. Charger pour créer, modifier ou rendre une annonce de victoire (ou de résultat) dans ce style.
---

# Annonce de victoire « chrome et carbone »

Style relevé image par image sur une annonce de victoire NHL (**1080×1080, 29,97 i/s, 361 images, 12,05 s, piste son
muette**, boucle : f360 ≈ f0). Ce skill garde **le rythme, la mise en page et les techniques**. Tout le contenu
(logo, nom, couleurs, petits logos, polices) vient du club pour lequel on produit, **et le texte est en français**.

Avant de coder, charger `remotion-best-practices`, puis `remotion-markup` (`3d.md` pour le logo en relief,
`measuring-text.md` pour caler le mot, `transitions.md`) et `remotion-render`. Méthodes déjà au point dans les autres
projets : mosaïque de blocs et texte qui se décode (`motion/clermont-glitch/`), détourage et calage musique
(`motion-goal-card`, `motion-retro-print`).

## Fichiers de référence

- [references/timeline.md](references/timeline.md) — découpage à l'image près, positions, couleurs. **Source de vérité.**
- [references/effects.md](references/effects.md) — recettes Remotion (carbone, chrome, lettres extrudées, logo 3D,
  zigzag, blocs, décodage, mot qui roule, lettres géantes).
- [references/adaptation.md](references/adaptation.md) — textes en français, assets à demander, polices, pièges.

## Structure en 6 temps (30 i/s, 360 images, boucle)

| # | Images | Temps | Ce qu'on voit |
|---|--------|-------|---------------|
| 1 | 0–46 | 0,0–1,5 s | **Carte sombre** : fond fibre de carbone noir-rouge, barres rouges en haut et en bas, 3 petits logos, NOM DU CLUB en chrome, MOT DE VICTOIRE en rouge, petite signature ; lente poussée. Glitch en **zigzag** (f13–16), mot qui clignote plein/contour (f13–19), puis **lavis rouge** qui clignote et poussée accélérée (f39–46). |
| 2 | 47–109 | 1,6–3,6 s | **Bande rouge 3D** : fond blanc avec **épure technique** (grand cercle, emblème gravé, réticules, pointillés) ; macro sur une lettre chromée avec croix de visée (f47–52), recul : le mot en **lettres chromées extrudées** sur une **bande rouge à bord cranté**, lettres décalées en hauteur qui se rangent (f53–80), signature qui **se décode** ; transition en **blocs** (f104–113). |
| 3 | 110–175 | 3,7–5,8 s | **Logo en relief 3D** sur surface rouge texturée, caméra proche qui dérive ; tracés blancs fins ; **mot en contour** blanc translucide + nom du club en petites capitales très espacées qui s'assemble lettre par lettre ; anneau lumineux (f157–167) ; sortie en flou et blocs (f170–175). |
| 4 | 176–198 | 5,9–6,6 s | **Lettres géantes** du nom du club, **une par image** (à l'envers), sur fond rouge/noir, le mot de victoire géant en bas ; le **logo se retourne** (de profil à de face) au centre ; f186–198 fond qui passe au blanc/gris, mise au point qui glisse. |
| 5 | 199–339 | 6,6–11,3 s | **Carte blanche éditoriale** : papier gris clair quadrillé, logo rouge rogné en haut, swoosh argent en bas ; NOM DU CLUB noir dans un **cadre fin**, MOT DE VICTOIRE **blanc sur bloc rouge**, petit bloc club en bas à gauche, 3 petits logos en haut à droite. Entrée en glitch (bloc rose, lettres qui se décodent, f199–222) ; le nom **roule** (copies qui défilent dans le cadre, 3 fois) ; respiration de mise au point. |
| 6 | 340–359 | 11,3–12,0 s | **Blocs** (rouge, noir, lettre chromée floue) qui ramènent la carte sombre ; le nom du club se resserre (lettres espacées → normales) : **f359 enchaîne sur f0** (boucle). |

## Règles qui font le style (à ne pas trahir)

1. **Trois matières qui alternent** : carbone sombre (temps 1 et 6), blanc technique (temps 2 et 5), rouge du club en
   relief (temps 3 et 4). Le changement de matière est le rythme de la vidéo.
2. **Chrome** pour le nom du club et les lettres en relief (dégradé argent à reflets), **rouge plein** pour le mot de
   victoire (ou blanc sur bloc rouge sur fond clair).
3. Typo **linéale étendue très grasse** (large, carrée) partout ; petits textes en capitales très espacées.
4. **Transitions en blocs rectangulaires** (morceaux de la scène suivante + aplats rouge/noir/blanc), jamais de fondu.
5. **Accidents numériques courts** (zigzag, décodage, mot qui roule) : 2 à 6 images, puis l'image se pose.
6. **Boucle parfaite** : la dernière image enchaîne sur la première.

## Mise en œuvre

- Projet Remotion dédié : `motion/<club>-victoire/` (Remotion 4.0.534). Composition `VictoireChrome` **1080×1080,
  30 i/s, 360 images** (la référence est à 29,97 i/s : mêmes numéros d'images). Variante 1080×1920 possible.
- Logo 3D : `@remotion/three` avec le logo SVG extrudé (biseau, matière rouge satinée + tranche argent), à défaut
  empilement de calques (voir `effects.md` §5) — le dire à l'utilisateur, c'est le point le plus difficile.
- Référence muette : musique fournie par l'utilisateur, coupes f47, f110, f176, f199, f340 calées sur des temps forts.

## Vérification avant de montrer

1. Images fixes : 0, 14, 40, 47, 56, 75, 95, 108, 120, 140, 160, 174, 178, 184, 192, 205, 222, 240, 300, 345, 352, 359.
2. Planches contact (8 × 6) de 0 à 359, comparées à `timeline.md`.
3. Boucle : différence f359 → f0 sans saut (comparer f0 et l'image qui suivrait f359).
4. Lisibilité en miniature : mot de victoire et nom du club lisibles à 270 px de large.
5. Ne rendre le MP4 que si l'utilisateur le demande.

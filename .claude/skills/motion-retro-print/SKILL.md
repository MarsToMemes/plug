---
name: motion-retro-print
description: Annonce de but « affiche sérigraphiée rétro » pour les réseaux d'un club (carré, ~9 s) — mot géant qui défile entre deux bandeaux, badge penché qui clignote, palette de 3 couleurs qui s'inverse image par image, mot centré sur écusson en filigrane, numéro + signature manuscrite qui s'écrit, carte joueur qui s'assemble. Charger pour créer, modifier ou rendre une vidéo dans ce style.
---

# Annonce de but « sérigraphie rétro »

Style relevé image par image sur une annonce de but NHL (1200×1200, 30 i/s, 271 images, 9,03 s, **sans piste audio**).
Ce skill garde **le rythme, la mise en page et les techniques**. Tout le contenu (mots, polices, couleurs, écusson,
signature, photo, sponsor) vient du club pour lequel on produit : on ne réutilise ni les logos, ni la police, ni le
lettrage manuscrit, ni la photo de la vidéo de référence.

Avant de coder, charger `remotion-best-practices` puis `remotion-markup` (et `remotion-render` pour l'export).
Pour le détourage du joueur et l'analyse d'une nouvelle référence, réutiliser les méthodes de
`motion-goal-card` (`references/adaptation-club.md` § détourage, `references/analyse-reference.md`).

## Fichiers de référence

- [references/timeline.md](references/timeline.md) — découpage à l'image près, positions et couleurs mesurées. **Source de vérité.**
- [references/effects.md](references/effects.md) — recettes Remotion de chaque effet.
- [references/adaptation.md](references/adaptation.md) — paramètres à remplir pour un club, assets à demander, pièges.

## Structure en 4 scènes (30 i/s, 271 images)

| # | Images | Temps | Ce qu'on voit |
|---|--------|-------|---------------|
| 1 | 0–39 | 0,00–1,30 s | **Mot géant qui défile** (« GOAL » → « BUT ») en très large, crème, entre deux bandeaux où le nom du buteur défile en boucle. Un **badge penché** au centre porte le mot en petit et clignote ; toute l'image **s'inverse** (orange ↔ bleu nuit) une image sur deux pendant 8 images. |
| 2 | 40–74 | 1,33–2,47 s | **Coupe** sur fond bleu nuit avec l'écusson en filigrane ton sur ton. Le mot apparaît **lettre par lettre** (une par image, le fond flashe), puis grossit lentement ; certaines images le passent en orange (**stroboscope de couleur**). Petits textes ville/club au-dessus et en dessous. Sortie par glissement à gauche. |
| 3 | 75–109 | 2,50–3,63 s | **Numéro géant** du buteur. Le fond flashe 5 images, puis se fige en orange avec le numéro bleu nuit ; la **signature manuscrite du club s'écrit** en travers du numéro (≈ 25 images). Nom en bandeau défilant en bas. Sortie : une **bande crème monte** du bas. |
| 4 | 110–270 | 3,67–9,03 s | **Carte joueur** qui s'assemble : panneau bleu nuit à droite (silhouette découpée qui se redresse), grand numéro crème en dégradé, nom tapé **lettre par lettre** dans une étiquette penchée, ville d'origine, pastille du club ; **photo du joueur en stroboscope** (allumée / éteinte / allumée) puis lente poussée. Anneau d'écusson qui tourne en fond. Tenue ≈ 5 s. |

## Règles qui font le style (à ne pas trahir)

1. **Trois couleurs, pas une de plus** : une couleur chaude (fond principal), une couleur sombre (bandeaux, panneau,
   numéro), une crème (texte). Toutes les images sont des combinaisons de ces trois aplats ; la photo du joueur est
   le seul élément « naturel ».
2. **Aspect imprimé** : grain de poussière (petits points sombres et clairs), trame de demi-teintes (points de tailles
   décroissantes) en coin des aplats et en ombre portée des lettres, lettres légèrement usées. Jamais de dégradé lisse
   sauf le numéro final et le bas du panneau.
3. **Coupes sèches et flashs** : aucun fondu enchaîné. Les transitions sont des coupes, des inversions de palette
   une image sur deux, des volets d'aplat (bande qui monte) ou des glissements.
4. **Tout bouge en permanence mais en ligne droite** : défilements linéaires (mot géant, bandeaux), lente poussée
   pendant les tenues, rotation lente de l'anneau. Les apparitions sont image par image (une lettre par image,
   machine à écrire), pas des fondus.
5. **Typo** : une police d'affichage très grasse aux angles arrondis et carrés (étendue pour le mot géant, condensée
   pour le mot centré et le numéro), une petite capitale très espacée pour les textes secondaires, et la signature
   manuscrite **du club** (son logo-script), jamais une écriture inventée qui imiterait un autre club.

## Mise en œuvre

- Projet Remotion dédié : `motion/<club>-retro/` (Remotion **4.0.534**). Composition `RetroGoal` 1200×1200 (ou
  1080×1080 : diviser toutes les positions par 1,111), 30 i/s, 271 images, props typées (zod) décrites dans
  `adaptation.md`. Une scène = un composant dans `<Sequence from durationInFrames premountFor={fps}>`.
- Timing en images dérivées de `fps`, animations par `interpolate()` / `Easing`, jamais de CSS `transition`.
- Les flashs et clignotements sont **déterministes** : tables d'images écrites en dur (voir `timeline.md`), pas de
  `random()` pour la couleur. Le grain utilise `random(seed)` par image.
- Pas d'audio dans la référence : proposer une musique (fournie par l'utilisateur) et des impacts calés sur les coupes
  f40, f75, f110 et sur chaque inversion de palette, comme dans `motion-goal-card` (`tools/sfx.py`).

## Vérification avant de montrer

1. Images fixes aux frames clés : 0, 5, 10, 11, 20, 30, 36, 39, 40, 41, 42, 43, 50, 64, 74, 75, 77, 81, 90, 101, 108,
   110, 114, 116, 117, 118, 125, 140, 270.
2. Planche contact image par image de 0 à 130 (méthode `motion-goal-card/references/analyse-reference.md`) et
   comparaison avec `timeline.md` : mêmes coupes (±1 image), mêmes images de flash, même mise en page (±2 %).
3. Contrôler : trois couleurs seulement (hors photo), aucun fondu, textes secondaires lisibles à 360 px de large,
   la carte finale lisible en miniature (nom + numéro).
4. Ne rendre le MP4 que si l'utilisateur le demande.

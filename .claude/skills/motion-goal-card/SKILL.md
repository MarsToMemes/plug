---
name: motion-goal-card
description: Carte « BUT » animée pour les réseaux d'un club (format carré 10 s) — mot du club répété, « BUT » en néon, numéro du buteur, zoom traversant vers la photo du joueur, nom en chrome, emblème final. Charger pour créer, modifier ou rendre une annonce de but, de joueur ou de score dans ce style.
---

# Carte de but animée (style « neon goal card »)

Choréographie relevée image par image sur une annonce de but NHL (1080×1080, 30 i/s, 10 s, sans son).
Ce skill en garde **le rythme, la mise en page et les techniques**. Tout le contenu visible
(mots, police, couleurs, photo, emblème, sponsor) vient de l'identité du club pour lequel on
produit : on ne réutilise ni les logos, ni la police, ni les photos, ni l'emblème final de la vidéo
de référence.

Avant de coder, charger `remotion-best-practices` puis `remotion-markup`
(et `remotion-render` pour l'export). Ce skill s'y ajoute, il ne les remplace pas.

## Fichiers de référence

- [references/timeline.md](references/timeline.md) — découpage au frame près, positions et couleurs mesurées. **Source de vérité.**
- [references/effects.md](references/effects.md) — recettes Remotion de chaque effet (smear, glitch par tranches, néon, chrome, zoom traversant, flou radial, orbite).
- [references/adaptation-club.md](references/adaptation-club.md) — paramètres à remplir pour un club, avec la fiche FC Metz.
- [references/analyse-reference.md](references/analyse-reference.md) — méthode pour décortiquer une nouvelle vidéo de référence (ffmpeg, planches).

## Structure en 9 temps (30 i/s, 300 frames)

| # | Frames | Temps | Ce qu'on voit |
|---|--------|-------|---------------|
| 1 | 0–14 | 0,00–0,47 s | Fond nuit + halo flou. Le **mot du club** ×3 lignes entre par la droite, lettre par lettre, en traînées horizontales. |
| 2 | 15–21 | 0,50–0,70 s | **Coupe sèche** : mot du club ×3 plein cadre, couleur primaire vive, débordant des deux côtés, qui s'assombrit. |
| 3 | 22–36 | 0,73–1,20 s | **Glitch par tranches** → le mot « BUT » ×5 lignes en contour, traînée horizontale qui se résorbe. |
| 4 | 37–49 | 1,23–1,63 s | « BUT » ×5 en **néon** net, halo de lumière qui monte du bas-gauche. |
| 5 | 50–57 | 1,67–1,90 s | Les mots **s'étirent vers la droite** (smear) et se dissolvent ; fond qui bascule au sombre primaire. |
| 6 | 58–83 | 1,93–2,77 s | **Numéro** du buteur en néon dégradé, centré, lente poussée (×1,00 → ×1,12). Coups de pinceau diagonaux au fond. |
| 7 | 84–96 | 2,80–3,20 s | **Zoom traversant** : on plonge dans le numéro, tout fond en flou coloré, on ressort d'un gros plan sur l'écusson du maillot et on dézoome. |
| 8 | 97–254 | 3,23–8,47 s | **Photo joueur** plein cadre, push-in lent (+3 %). Prénom + nom en **chrome** qui se resserrent (tracking) de f108 à f130, puis tenue. |
| 9 | 255–299 | 8,50–10,00 s | Zoom rapide dans l'écusson → aplat primaire = **emblème géant** qui rétrécit avec flou radial, tourne, se pose. Tenue finale ~0,5 s. |

Élément permanent : **languette sponsor** blanche collée en haut à droite (x 833→1080, y 0→104 sur 1080), jamais animée.
Facultative : on ne l'affiche que si le club fournit un logo sponsor et l'autorisation.

## Règles qui font le style (à ne pas trahir)

1. **Deux couleurs qui s'opposent** : une primaire chaude pour le club (mot, fonds, emblème),
   une couleur d'accent froide et lumineuse pour le néon (« BUT », numéro, nom). Sans ce contraste,
   l'effet néon s'éteint. Voir `adaptation-club.md` pour le choix chez un club monochrome.
2. **Coupes sèches, pas de fondus** : les changements de scène se font par coupe, glitch, smear ou
   zoom. Aucun cross-fade d'opacité entre deux scènes.
3. **Le texte déborde du cadre** (scènes 2 à 5) : lignes centrées, plus larges que 1080 px, rognées des deux côtés.
4. **Mouvement toujours présent mais lent** pendant les tenues (poussée, dérive) ; tout ce qui est rapide
   dure 3 à 6 frames.
5. **Les traînées sont horizontales** (scènes 1, 3, 5), les zooms sont centrés sur un point précis
   (numéro, puis écusson du maillot).
6. **Une seule police display**, très large (étendue), grasse, italique ou penchée (~−12°),
   formes carrées aux angles arrondis. Les néons sont en **contour**, le nom final est **plein (chrome)**.
7. Grain/bruit léger et scanlines discrètes sur les fonds sombres (opacité 6–10 %).

## Mise en œuvre

- Projet Remotion dédié : `motion/<club>-but/` (Remotion **4.0.534**, la version des skills ;
  ne pas réutiliser le projet `motion/planches/` qui est en 4.0.528).
- Une composition `GoalCard` 1080×1080, 30 i/s, 300 frames, props typées (schéma zod) décrites dans
  `adaptation-club.md`. Variantes 1080×1350 et 1080×1920 : recalculer les positions en
  proportion de la hauteur, garder le timing identique.
- Une scène = un composant, posé avec `<Sequence from durationInFrames premountFor={fps}>`
  sur les frames du tableau. Les coupes sèches = fin d'une Sequence / début de la suivante,
  pas de `TransitionSeries` avec fondu.
- Tout timing en frames dérivées de `fps` (`useVideoConfig()`), animations par `interpolate()`
  et `Easing`, jamais de CSS `transition`/`animation`.
- Aléatoire (glitch, grain) uniquement via `random(seed)` de `remotion` : un rendu doit être
  identique d'une fois sur l'autre.

## Vérification avant de montrer

1. `npx remotion still` aux frames clés : 3, 16, 25, 40, 53, 70, 86, 94, 100, 115, 135, 257, 266, 272, 280, 295.
2. Planche contact de tout le rendu (méthode dans `analyse-reference.md`) et comparaison scène par scène
   avec le tableau de `timeline.md` : mêmes frames de coupe (±1), même placement (±2 % du cadre).
3. Contrôler : aucun fondu entre scènes, texte qui déborde bien en 2–5, numéro et nom lisibles
   sur mobile (regarder la planche à 300 px de large).
4. Ne rendre le MP4 que si l'utilisateur le demande explicitement (règle `remotion-best-practices`).

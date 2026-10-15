---
name: motion-grunge-pochoir
description: Annonce de victoire / slogan « grunge pochoir » pour les réseaux d'un club (portrait 1080×1350, 60 i/s, boucle de 6,3 s jouée deux fois) — logo imprimé sur fond béton qui coule et sature puis flash jaune, mot du club + mot de victoire qui se construisent lettre par lettre en ondulant avec un fantôme décalé, flash blanc flou, pop jaune surexposé, fond de texte en diagonale, passage par un ciel d'orage, logo + slogan qui arrivent en tournoyant et en lamelles, lettres au pochoir (grain de bombe), plongée dans une lettre jusqu'à la texture puis retour au logo. Charger pour créer, modifier ou rendre une vidéo dans ce style.
---

# Annonce de victoire « grunge pochoir »

Style relevé image par image sur une annonce de victoire MLB (**1080×1350, 59,94 i/s, 764 images, 12,75 s, piste son
muette**). La vidéo est **une boucle de 380 images (6,34 s) jouée deux fois**. Ce skill garde **le rythme, la mise en
page et les techniques** ; tout le contenu (logo, textes, couleurs, slogan) vient du club, **et le texte est en
français**.

Avant de coder, charger `remotion-best-practices`, puis `remotion-markup` (`effects.md`, `measuring-text.md`,
`timing.md`) et `remotion-render`. Déjà au point ailleurs : texte qui se décode et blocs (`motion/clermont-glitch/`),
`fitText` après chargement des polices (`motion/ol-victoire/`), calage musique par image vidéo (`motion-cinema-brush`,
`references/adaptation.md`).

## Fichiers de référence

- [references/timeline.md](references/timeline.md) — découpage à l'image près (60 i/s), positions, couleurs. **Source de vérité.**
- [references/effects.md](references/effects.md) — recettes Remotion (textures béton / toile / orage, pochoir et grain de
  bombe, ondulation des lettres, fantôme, coulure du logo, flashs, texte en diagonale, lamelles, tournoiement, plongée).
- [references/adaptation.md](references/adaptation.md) — textes en français, slogan, assets, polices, pièges.

## Structure d'une boucle (60 i/s, 380 images ; la vidéo = 2 boucles)

| # | Images | Temps | Ce qu'on voit |
|---|--------|-------|---------------|
| 1 | 0–53 | 0,0–0,9 s | **Logo imprimé** sur fond béton gris : poussée, coupe sèche en plus gros (f14), le bas du logo **coule** (traînées verticales), le logo **sature** (contour jaune qui brille, balle brûlée), **flash jaune** (f48), coupe très serrée (f50–53). |
| 2 | 54–73 | 0,9–1,2 s | **Construction du mot** sur fond toile : CLUB / MOT apparaissent **lettre par lettre**, chaque lettre **ondule** (déformation liquide) avec un **fantôme translucide décalé** qui la rejoint ; le fond passe au gris nuageux avec **texte géant en diagonale** ton sur ton. |
| 3 | 74–113 | 1,2–1,9 s | **Flash blanc flou** (f74–82 : texte blanc, flou de mise au point), puis texte jaune net qui **pivote** lentement ; écrasement vertical (f110–112). |
| 4 | 114–187 | 1,9–3,1 s | **Pop jaune** : texte plus grand, jaune surexposé, très flou puis net (f114–132), rotation, grossissement jusqu'à remplir la largeur ; sortie par la gauche (f184–187). |
| 5 | 188–199 | 3,1–3,3 s | **Ciel d'orage** brun-noir plein cadre (transition). |
| 6 | 200–237 | 3,3–4,0 s | **Slogan** : logo + mot du milieu (jaune, police étendue) arrivent **en tournoyant** depuis le bas-droite avec flou ; les mots blancs se révèlent par **lamelles verticales** (en haut à droite, puis en bas). |
| 7 | 238–349 | 4,0–5,8 s | **Tenue** : [logo][MOT 1] / MOT 2 / MOT 3 sur ciel d'orage gris, lettres **au pochoir** (grain de bombe sur les bords), lente poussée, grain qui vit. |
| 8 | 350–379 | 5,8–6,3 s | **Plongée** accélérée dans une lettre du mot jaune jusqu'à la texture de bombe floue → **coupe sur l'image 0** (boucle). |

## Règles qui font le style (à ne pas trahir)

1. **Tout est imprimé** : logo et lettres ont une texture de sérigraphie / pochoir (grain, manques, bords qui bavent) ;
   aucun aplat vectoriel propre.
2. **Fonds texturés monochromes** : béton, toile, ciel d'orage en noir et blanc ; seules les couleurs du club sont vives.
3. **Deux couleurs de texte** : jaune (couleur vive du club) et blanc ; le logo garde ses couleurs.
4. **Mouvements « caméra à la main »** : poussées, petites rotations, coupes sèches sur le temps fort, flous de mise au point.
5. **Accidents d'impression animés** : ondulation, fantôme décalé, coulure, flash surexposé — 2 à 8 images chacun.
6. **Boucle** : la plongée finale coupe sur l'image 0.

## Mise en œuvre

- Projet Remotion dédié : `motion/<club>-pochoir/` (Remotion 4.0.534). Composition `GrungePochoir` **1080×1350,
  60 i/s** ; une boucle = 380 images ; la vidéo livrée = 760 images (2 boucles, comme la référence) via `<Loop>`.
  Variante 1080×1920 : même timing, marges haut/bas agrandies.
- Toutes les textures (béton, toile, nuages, grain de bombe, carte de coulure) sont **générées en Python** dans
  `tools/` (aucune photo de la référence).
- Référence muette : musique fournie par l'utilisateur, temps forts sur f14, f48, f54, f114, f188, f200, f350 (une
  boucle) — le morceau ne boucle pas : fondu de sortie sur la fin de la 2ᵉ boucle.

## Vérification avant de montrer

1. Images fixes : 0, 14, 30, 44, 48, 52, 58, 66, 72, 78, 96, 116, 140, 186, 192, 204, 214, 226, 240, 300, 360, 376, 379.
2. Planches contact (8 × 6, une image sur deux) de 0 à 379, comparées à `timeline.md`.
3. Boucle : f379 → f0 (coupe franche voulue, mais même cadrage du logo à f0 qu'au début).
4. Lisibilité en miniature (270 px) du mot de victoire et du slogan.
5. Ne rendre le MP4 que si l'utilisateur le demande.

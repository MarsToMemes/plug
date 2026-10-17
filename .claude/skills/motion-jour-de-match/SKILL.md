---
name: motion-jour-de-match
description: Annonce « jour de match » pour les réseaux d'un club (story verticale 1080×1920, 24 i/s, ~9,7 s) — mot JOUR DE MATCH répété en rangées sur fonds gris, bleu nuit puis rouge, logo du club incrusté dans le mot, lettres qui clignotent, grille de mots qui défile avec silhouettes de l'emblème, contour de l'emblème qui se dessine puis se remplit (volet blanc), affiche « club vs adversaire » sur étoiles en perspective avec logos en silhouette, trait qui devient bande, carte finale avec photo du joueur (flash négatif), nom du club géant qui s'assemble et infos du match tapées à la machine. Charger pour créer, modifier ou rendre une vidéo dans ce style.
---

# Annonce « jour de match »

Style relevé image par image sur une story « GAMEDAY » NHL (**1080×1920, 23,976 i/s, 233 images, 9,72 s, sans piste
son**, pas de boucle : la vidéo se termine sur la carte d'infos). Ce skill garde **le rythme, la mise en page et les
techniques** ; tout le contenu (logos, emblème, photo, couleurs, infos du match) vient du club, **et le texte est en
français**.

Avant de coder, charger `remotion-best-practices`, puis `remotion-markup` (`text-highlights.md`, `measuring-text.md`,
`timing.md`) et `remotion-render`. Déjà au point ailleurs : vectorisation d'un logo en contours (OpenCV,
`motion/ol-victoire/tools/prepare.py`), détourage (`motion-goal-card`), `fitText` après chargement des polices
(`motion/ol-victoire/`), calage musique par image vidéo (`motion-cinema-brush`, `references/adaptation.md`).

## Fichiers de référence

- [references/timeline.md](references/timeline.md) — découpage à l'image près (24 i/s), positions, couleurs. **Source de vérité.**
- [references/effects.md](references/effects.md) — recettes Remotion (éclats de lumière, rangées répétées, lettres qui
  clignotent, grille qui défile, contour qui se dessine, étoiles en perspective, trait → bande, photo en négatif,
  assemblage du nom, texte tapé).
- [references/adaptation.md](references/adaptation.md) — textes en français, infos du match, assets, polices, pièges.

## Structure en 7 temps (24 i/s, 233 images)

| # | Images | Temps | Ce qu'on voit |
|---|--------|-------|---------------|
| 1 | 0–3 | 0,0–0,2 s | **Gris clair** à éclats de lumière : 3 rangées « MOT / mot » bleu nuit, lettres qui manquent. |
| 2 | 4–19 | 0,2–0,8 s | **Bleu nuit** : 3 rangées du MOT géant blanc avec le **logo du club incrusté** au milieu, mot étendu en dessous ; entrée floue, lettres qui clignotent ; les rangées filent vers le haut. |
| 3 | 20–40 | 0,8–1,7 s | **Rouge** : grille décalée de petits mots blancs qui défile en diagonale, **silhouettes bleues de l'emblème** qui grandissent derrière ; le **contour de l'emblème se dessine** (f31–36) puis **se remplit de blanc** et couvre l'écran (f37–40). |
| 4 | 41–59 | 1,7–2,5 s | **Gris clair** : 3 rangées du mot étendu en rouge, silhouettes bleues floues derrière, lettres qui se décodent ; poussée floue en sortie. |
| 5 | 60–111 | 2,5–4,6 s | **Affiche du match** sur bleu nuit avec **grandes étoiles en perspective** : CLUB / VS / ADVERSAIRE (petites capitales étendues blanches) qui s'écartent, **logos des deux clubs en silhouette rouge** derrière les noms, ★★★ en haut et en bas ; un **trait rouge** apparaît (f104) et grossit en **bande** (f108–111). |
| 6 | 112–114 | 4,7–4,8 s | La bande remplit le cadre : **lavis rose** clair, textes qui se dédoublent (transition). |
| 7 | 115–232 | 4,8–9,7 s | **Carte d'infos** sur rouge à éclats : **photo du joueur** dans un rectangle arrondi (entrée en **négatif rose** qui clignote, puis couleur, rayons de lumière, lente poussée) ; **NOM DU CLUB géant** étendu italique en dégradé bleu qui **s'assemble lettre par lettre** ; « VS ADVERSAIRE », date / stade / heure, diffusion **tapés à la machine** ; ★★★ verticales ; partenaire en bas à droite ; f221–232 **barre blanche** qui grossit (volet de fin). |

## Règles qui font le style (à ne pas trahir)

1. **Trois fonds qui alternent par coupes sèches** (gris clair, bleu nuit, rouge), tous avec des **éclats de lumière
   diagonaux** (triangles blancs translucides) ; jamais de fondu.
2. **Le mot est répété** (3 rangées, ou grille) : c'est un motif, pas un titre isolé.
3. **Lettres instables** : des lettres manquent, passent en contour ou en couleur décalée, image par image, puis le mot
   se pose.
4. **L'emblème du club** sert de motif (silhouettes, contour qui se dessine, volet plein).
5. **Typo** : linéale condensée très grasse (mot géant) + linéale **étendue italique** (mots secondaires, nom du club
   final), petites capitales étendues pour les infos.
6. **L'info finale reste lisible longtemps** (≈ 4,5 s) : c'est le message.

## Mise en œuvre

- Projet Remotion dédié : `motion/<club>-jourdematch/` (Remotion 4.0.534). Composition `JourDeMatch` **1080×1920,
  24 i/s, 233 images** (la référence est à 23,976 : mêmes numéros d'images). Variante 1080×1350 : rangées et carte
  recadrées, même timing.
- Emblème vectorisé en Python (contour pour le tracé, silhouette pour les motifs) ; photo du joueur fournie.
- Référence muette : musique fournie par l'utilisateur, coupes f4, f20, f41, f60, f112, f115 sur des temps forts.

## Vérification avant de montrer

1. Images fixes : 0, 4, 8, 18, 20, 26, 33, 37, 40, 42, 50, 58, 62, 70, 104, 110, 113, 115, 117, 125, 140, 160, 200, 230.
2. Planches contact (10 × 4) de 0 à 232, comparées à `timeline.md`.
3. Infos du match relues (date, heure, stade, diffuseur) : **les demander, ne jamais les inventer**.
4. Lisibilité en miniature (270 px de large) du mot et des infos.
5. Ne rendre le MP4 que si l'utilisateur le demande.

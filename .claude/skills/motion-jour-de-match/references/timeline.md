# Découpage à l'image près

Référence : 1080×1920, 23,976 i/s, 233 images (9,72 s), **sans son**, pas de boucle. Positions en pixels sur 1080×1920.

| Rôle | Référence | Remarque |
|------|-----------|----------|
| GRIS CLAIR | `#D9D9D9` (éclats `#EFEFEF`) | fonds des temps 1 et 4 |
| BLEU NUIT | `#12203D` → `#102341` | fonds des temps 2 et 5 |
| ROUGE | `#B20B3C` / `#B60F44` | fonds des temps 3 et 7 |
| ROUGE VIF | `#C61051` | logos en silhouette, trait, mots rouges |
| BLEU | `#145291` / `#176AA7` | silhouettes de l'emblème, dégradé du nom final |
| BLEU TEXTE | `#1A3B5D` | mots sur gris |
| BLANC | `#FFFFFF` | mots, infos, volets |

MOT = « GAMEDAY » (en français : « JOUR DE MATCH », voir `adaptation.md`) ; EMBLÈME = forme forte du logo (l'aigle) ;
CLUB / ADVERSAIRE = noms complets ; NOM = nom court du club (« CAPS ») ; INFOS = date, stade, heure, diffusion.

## Temps 1 — Gris clair (f0–3)

- Fond gris clair, grands **éclats** blancs translucides (triangles longs en diagonale, bord droit).
- 3 rangées identiques centrées (y ≈ 330, 1000, 1660) : MOT en condensée très grasse bleu nuit (≈ 120 px) + MOT en
  étendue italique (≈ 55 px) juste dessous ; 1–2 lettres **absentes** qui changent à chaque image.

## Temps 2 — Bleu nuit, logo dans le mot (f4–19)

- f4 : **coupe** sur bleu nuit + éclats ; 3 rangées (y ≈ 300, 960, 1620) : MOT blanc géant (condensée, ≈ 260 px,
  largeur ≈ 960) avec le **logo du club** (≈ 420 px) posé en travers du milieu du mot ; dessous, MOT en étendue
  italique blanc (≈ 110 px). f4 : tout est **flou vertical** (entrée), net à f5.
- f5–17 : poussée lente ×1,00 → ×1,06 ; la dernière lettre du mot étendu **clignote** (pleine / contour / absente).
- f18–19 : les rangées **filent vers le haut** (−300 px par image, flou vertical) → coupe.

## Temps 3 — Rouge, grille, emblème (f20–40)

- Fond rouge + éclats. **Grille décalée** de mots étendus italiques blancs (≈ 70 px) : 2 colonnes (x ≈ 30 et 520),
  rangées tous les 165 px, colonne droite décalée d'une demi-rangée ; la grille **défile en diagonale** (vers le haut
  et la gauche, ≈ 6 px par image).
- f20–21 : mots flous (flou de mouvement horizontal) ; f22–30 : derrière chaque mot, une **silhouette bleue de
  l'emblème** (≈ 300 px) grandit (×0,4 → ×1) ; dans chaque mot, une lettre manque ou passe en contour, image par image.
- f31–36 : le **contour blanc de l'emblème** (trait 8 px, ≈ 1100 px de haut, en diagonale) **se dessine** sur la grille.
- f37–39 : l'emblème **se remplit de blanc** et grossit (×1 → ×1,6) ; f40 : le blanc couvre l'écran avec un flou de
  mouvement (bords rouges et bleus qui filent) → coupe.

## Temps 4 — Gris clair, mots rouges (f41–59)

- Fond gris clair + éclats ; 3 rangées (y ≈ 300, 950, 1600) du MOT étendu italique **rouge vif** (≈ 110 px).
- f41 : contours fins (bleu pâle) de l'emblème derrière chaque mot ; f42–59 : **silhouettes bleues floues** de
  l'emblème (≈ 500 px) derrière, légère dérive.
- Lettres qui **se décodent** : absentes, en contour blanc, en couleur décalée (f42–52), puis mot complet (f53).
- f55–59 : poussée ×1 → ×1,3 avec **flou** croissant ; les rangées montent → coupe.

## Temps 5 — Affiche du match (f60–111)

- Fond bleu nuit avec **grandes étoiles** à 5 branches bleu plus clair (`#1C3A66`, opacité 0,5) vues en perspective
  (2–3 étoiles, ≈ 900 px, coupées par le cadre), dégradé radial plus clair au centre.
- f60 : CLUB / VS / ADVERSAIRE en petites capitales **étendues** blanches (≈ 34 px), serrées au centre (y ≈ 960).
- f61–66 : les trois lignes **s'écartent** (CLUB monte à y ≈ 780, ADVERSAIRE descend à y ≈ 1170, VS au milieu ≈ 990) ; texte ≈ 48 px (le nom du club couvre ≈ 70 % de la largeur).
- f62–68 : **logos des deux clubs en silhouette rouge vif** (≈ 300 px) apparaissent derrière les noms (le club derrière
  CLUB, l'adversaire derrière ADVERSAIRE), par fondu + léger grossissement.
- ★★★ verticales (petites étoiles blanches, 14 px) en haut (y ≈ 230) et en bas (y ≈ 1640), qui s'allument une par une.
- f104 : **trait rouge** horizontal (4 px) pleine largeur à y ≈ 905 (entre CLUB et VS) ; f106–111 il grossit en **bande** (4 → 120 px)
  qui recouvre VS.

## Temps 6 — Lavis rose (f112–114)

- La bande remplit tout : fond **rose très clair** (`#F6D9E2` → `#E9A9BE`), CLUB / ADVERSAIRE **dédoublés** en rouge
  (deux copies décalées de 10 px), bande rouge pâle au centre qui se resserre → coupe sur la carte.

## Temps 7 — Carte d'infos (f115–232)

- Fond rouge + éclats ; **photo du joueur** dans un rectangle aux coins arrondis (≈ 40 px), x ≈ 30–1050, y ≈ 50–1060 (≈ 1020 × 1010, mesuré sur les images 125–230),
  avec une lueur / des **rayons de lumière** en haut à gauche.
- f115–118 : la photo **arrive en négatif** (inversée, teinte rose) en grandissant depuis le centre (×0,3 → ×1) ;
  f117 couleur, f118 négatif, f119 couleur (clignotement), puis couleur ; lente poussée ×1,00 → ×1,06 jusqu'à la fin.
- NOM (étendue italique très grasse, ≈ 260 px, **dégradé bleu** `#176AA7` → bleu nuit), x ≈ 0–1080, y ≈ 1100–1300 :
  **s'assemble** lettre par lettre (f115–130), chaque lettre d'abord en **contour** blanc / rose puis pleine.
- « VS ADVERSAIRE » (étendue, blanc, ≈ 34 px) sous le NOM, **tapé** (≈ 1 caractère par image, f115–158).
- Bloc INFOS (étendue, blanc, ≈ 38 px, interligne 1,3), x ≈ 90, y ≈ 1450 : date / stade / heure (tapés f116–132),
  puis diffusion TV / radio (tapés f133–160) ; **★★★ verticales** rouges à gauche du bloc (f134).
- Filet fin en bas (y ≈ 1830) et **logo partenaire** en bas à droite (≈ 120 px).
- f221–232 : **barre blanche** horizontale à y ≈ 1000 : trait (f221) qui s'épaissit jusqu'à ≈ 200 px (f232) : début du
  volet de sortie (la vidéo se coupe là).

# Découpage à l'image près

Référence : 1920×1080, 30 i/s, 283 images (9,47 s), musique présente. Positions en pixels sur 1920×1080.

| Rôle | Référence | Remarque |
|------|-----------|----------|
| COULEUR (club) | `#C52702` – `#CF2E0C` | orange vif, bandes de pinceau, fonds |
| COULEUR SOMBRE | `#A52306` / `#3A0400` | variations des bandes, duotone de la ville |
| ANTHRACITE | `#202020` / `#141414` | fonds texturés |
| NOIR BLEUTÉ | `#0B1016` | fond du plan final |
| CRÈME LUMIÈRE | `#FCEEDE` – `#FCF0E4` | cœur du numéro qui irradie |
| BLANC | `#F3F3F3` | texte, nom texturé |

MOT = « BUT » ; NUM = numéro ; NOM / PRÉNOM ; CLUB = nom du club en lettres espacées ; VILLE ; SLOGAN = slogan de
campagne du club (2 mots + petit mot de liaison, ex. « PIERRE PAR PIERRE ») ; POSTE = « ATTAQUANT »…

## Temps 1 — Logo qui s'assemble (f0–14)

- Fond ANTHRACITE avec **lignes topographiques** très discrètes (+5 % de luminosité).
- f1 : une ligne orange fine (2 px) apparaît à y ≈ 540 et se trace vers la droite (f1–3) ; f2–3 : quelques lettres
  du CLUB apparaissent (x ≈ 1170, y ≈ 210 et 880), espacées de ≈ 120 px.
- f3 : **panneau noir** (x ≈ 520–1240, y ≈ 130–960) avec la skyline de la VILLE en filigrane gris foncé ; f4 : la
  ligne devient une **bande orange** de ≈ 60 px (y ≈ 510–570) qui traverse tout l'écran, VILLE en lettres contour
  orange foncé géantes dedans.
- f5 : **logo** du club en contour blanc épais, grand (≈ 780 px de large), centré sur la bande.
- f6–9 : les lettres du CLUB complètent leurs rangées (au-dessus y ≈ 210, au-dessous y ≈ 880), une par image.
- f10–14 : le logo **rétrécit** (≈ 780 → 520 px) ; deux petits points orange en haut à droite.

## Temps 2 — Slogan (f15–36)

- f15 : **coupe** sur fond orange avec lignes topographiques ; grande **bande verticale orange clair** à bord pinceau
  (x ≈ 450–1250) ; à droite, **skyline en duotone** rouge sombre (x ≈ 1250–1700) ; bande anthracite à l'extrême droite.
- SLOGAN sur 2 lignes (« MOT1 / MOT1 », petit mot de liaison entre les deux) : italique très grasse, BLANC, avec
  **contour/ombre noire décalée** (≈ 12 px bas-gauche) ; hauteur de capitale ≈ 230 px, ligne 1 à y ≈ 300, ligne 2 à
  y ≈ 470, x ≈ 0–1000.
- f15–24 : les deux lignes **entrent de la gauche** avec **flou de mouvement** horizontal fort qui se résorbe
  (décalage ≈ −600 → 0 px, Easing.out(Easing.cubic)), la 2e ligne avec 2 images de retard.
- f25–29 : petit mot de liaison (≈ 70 px, italique) qui apparaît entre MOT1 et MOT2 (x ≈ 1050, y ≈ 380).
- f30–36 : **bande de pinceau noire** (≈ 1700 × 260 px, bords secs) qui glisse de la gauche au centre (y ≈ 470),
  chargée d'une rangée de **logos du club** en contour blanc (≈ 80 px, espacés de 160 px) qui se remplissent un par
  un ; elle recouvre le slogan.

## Temps 3 — Rush 1 entre bandes déchirées (f37–61)

- f37 : carré orange à bords déchirés (x ≈ 480–1300) sur fond sombre, rangée de logos qui continue.
- f38–41 : **bandes verticales orange** à bords déchirés qui balaient de droite à gauche (volets).
- f42–61 : **rush 1** plein cadre : le joueur avance vers la caméra, **flou de profondeur** (le joueur ne devient
  jamais tout à fait net), ralenti. Deux **bandes verticales orange déchirées** cadrent : gauche x ≈ 280–420, droite
  x ≈ 1600–1760 ; logos du club (≈ 60 px) posés sur les bandes à y ≈ 540. Bord droit (x ≈ 1860–1920) : bande noire
  avec le SLOGAN vertical en blanc qui défile vers le haut.

## Temps 4 — « BUT » géant sur le rush (f62–90)

- f62 : **coupe** sur un autre moment du rush (ou rush de célébration), haut sombre, bas dégradé vers l'orange ;
  **bandes de pinceau orange** horizontales en haut (y ≈ 0–40) et en bas (y ≈ 940–1080).
- MOT en linéale très grasse, BLANC, hauteur ≈ 520 px puis plus, x ≈ 60–1800, y ≈ 280–800.
- f62–70 : les lettres arrivent **translucides et floues** de gauche à droite (1re lettre blanche, suivantes
  rosées / orange à 40–70 % d'opacité), chacune avec un **dédoublement** (copie décalée de −80 px, plus floue).
- f70–82 : les lettres deviennent blanches une par une ; grossissement continu ×1,00 → ×1,35 (Easing.in(Easing.quad))
  ancré en bas à gauche : le mot finit par sortir du cadre par le bas.
- f76–90 : **écho du MOT** au-dessus (une ligne coupée en haut), qui descend avec le mot ; logo du club en contour
  en haut à droite (≈ 90 px) ; petit slogan en bas au centre.

## Temps 5 — Numéro qui irradie (f91–111)

- f91 : **coupe** sur fond ANTHRACITE texturé (lignes topographiques).
- NUM géant (hauteur ≈ 1100 px, déborde en haut et en bas), x ≈ 0–1050 : rendu **lumineux** — cœur CRÈME
  surexposé, bord orange-rouge, très flou (≈ 25 px), comme une enseigne lumineuse hors mise au point.
- Par-dessus, le **dernier chiffre en contour fin net** (gris clair 3 px, ≈ 1000 px de haut) décalé à droite du
  chiffre lumineux (x ≈ 520–1000).
- VILLE en italique **contour** gris foncé (≈ 110 px) à droite (x ≈ 1000–1750, y ≈ 300) ; une copie de plus empilée
  dessous toutes les 4 images (f92 : 1, f96 : 2, f100 : 3), coupées par le bord gauche ; deux points orange.
- Petit texte vertical (VILLE + CLUB) contre le bord gauche.
- f91–106 : lente poussée (×1,00 → ×1,05) ; f107–111 : la lumière **s'intensifie** jusqu'à surexposer la moitié
  gauche (montée de luminosité), transition par la lumière.

## Temps 6 — Poste du joueur (f112–124)

- f112–113 : **flash surexposé** jaune-crème (luminosité poussée) sur une photo noir et blanc d'immeuble.
- f114 : fond sombre, **ville en noir et blanc** (gratte-ciel), petit texte défilant tout en haut (SLOGAN répété,
  ≈ 14 px), trois points orange en haut à droite.
- POSTE en lettres très espacées (≈ 45 px, interlettrage ≈ 2 em) dans une **bande de pinceau orange** (x ≈ 250–1690,
  y ≈ 420–560) ; deux copies en contour du mot au-dessus et au-dessous ; coin de logo du club en noir et blanc géant
  qui entre en bas à droite.
- f117–124 : la bande s'épaissit (hauteur ×1,5) et se remplit d'une **vidéo orange** (gros plan flou du maillot) ;
  f123–124 : elle s'élargit jusqu'à remplir le haut de l'image.

## Temps 7 — Gros plan visage (f125–166)

- f125–134 : **deux entailles diagonales orange** (≈ 60° , largeur ≈ 120 px, bords déchirés) qui découvrent le
  **rush 2** (gros plan visage, regard caméra) ; la bande POSTE disparaît dans les entailles.
- f135–162 : rush 2 plein cadre, très lente poussée ; NUM en bas à droite (≈ 260 px) **lumineux** (dégradé crème →
  orange, halo), logo du club en contour en bas à gauche, minuscule texte « CLUB · SAISON » au-dessus du visage et
  en bas ; petite bande orange en diagonale dans le coin haut gauche.
- f163–166 : une **lumière orange** envahit la moitié gauche du visage en diagonale (gel de couleur), annonce la coupe.

## Temps 8 — Nom géant texturé (f167–187)

- f167–182 : fond dégradé rouge sombre → orange ; NOM en capitales **gigantesques** (hauteur ≈ 950 px) BLANC à
  **texture de plâtre / peinture épaisse** (relief doux, coups de spatule) ; panoramique de droite à gauche qui
  fait défiler les dernières lettres vers les premières, en dézoomant légèrement (×1,15 → ×1,0).
- f183–187 : **coupe** : fond orange avec photo de pont / ville en duotone, **emblème du club géant** sombre à
  droite ; NOM sur une ligne (≈ 240 px) : première moitié PLEINE BLANCHE, seconde moitié en **contour** ;
  bloc SLOGAN en bas à droite ; texte SLOGAN répété en haut et en bas (≈ 14 px).

## Temps 9 — Plan final (f188–282)

- f188–194 : **rush 3** (action : tir, course) **teinté rouge-orange** (duotone qui vire au naturel), flash à f193.
- f195–202 : rush au naturel, sombre (fond noir bleuté), légère **mise au point** (flou → net).
- f203–282 : **traînée stroboscopique** : 4–6 copies fantômes du joueur aux positions précédentes (décalées de
  6–10 images dans le temps), opacité décroissante, légèrement teintées orange ; le joueur traverse de gauche à droite.
- NOM en **contour** fin gris (≈ 200 px) derrière le joueur, centré à droite.
- **Barres latérales HUD** : trait vertical orange (x ≈ 60 et x ≈ 1860, y ≈ 230–750) avec graduations et texte CLUB
  vertical minuscule.
- Bloc SLOGAN petit en bas au centre (y ≈ 1020). Tenue jusqu'à la fin (aucune sortie).

# Découpage à l'image près

Référence : 1200×1200, 30 i/s, 271 images (9,03 s), pas d'audio. Positions en pixels sur 1200.
Couleurs mesurées dans la référence (à remplacer par la palette du club, en gardant les mêmes rôles et contrastes) :

| Rôle | Référence | Remarque |
|------|-----------|----------|
| CHAUD (fond principal) | `#C5402B` | orange brique, légèrement désaturé (aspect encre) |
| SOMBRE (bandeaux, panneau, numéro) | `#1B204F` | bleu nuit ; filigrane ton sur ton `#171B45` / `#1D2157` |
| CRÈME (texte) | `#D8C7A4` | jamais de blanc pur |

Dans ce fichier : MOT = le mot du but (« GOAL » dans la référence, « BUT » ou « BUUUT » en foot), NOM = prénom + nom
du buteur, NUM = numéro.

## Scène 1 — Mot géant qui défile (f0–39)

**Mise en page (3 bandes horizontales)**
- Bandeau haut SOMBRE y ≈ 48–240, bandeau bas SOMBRE y ≈ 960–1160 (fines lignes CHAUD au-dessus et en dessous).
- Bande centrale CHAUD y ≈ 240–960.
- Dans chaque bandeau : « PRÉNOM NOM · PRÉNOM NOM · … » en petites capitales CHAUD (hauteur ≈ 28 px,
  interlettrage ≈ 0,15 em), centré verticalement dans le bandeau. Le haut défile vers la gauche, le bas vers la droite,
  ≈ 6 px/image.

**Mot géant**
- MOT en capitales CRÈME, police **étendue** très grasse aux angles arrondis, hauteur de capitale ≈ 560 px
  (y ≈ 320–880), largeur totale ≈ 2 600 px : il ne tient jamais en entier dans le cadre.
- Défilement **linéaire** de droite à gauche : bord gauche de la première lettre à x ≈ 680 à f0, dernière lettre
  sortante vers f39 (≈ 70 px/image).
- Trame de demi-teintes SOMBRE en ombre portée en bas à droite des lettres (points ≈ 6 px → 1 px sur 60 px).

**Badge penché (au centre, x ≈ 600, y ≈ 600)**
- Parallélogramme aux coins arrondis, penché d'environ −12°, bord gauche plus bas que le droit, ≈ 520 × 170 px.
- f0–2 : pas de badge ; « M O T » en très petites capitales SOMBRE très espacées au centre.
- f3–7 : un trait horizontal fin (2 lignes CRÈME/CHAUD) traverse le centre de gauche à droite (prémices du badge).
- f8–9 : badge SOMBRE vide qui apparaît d'un coup.
- f10 : MOT en CRÈME condensé dans le badge (hauteur ≈ 90 px).
- f10–17 : **inversion de palette une image sur deux** : images paires = bande centrale SOMBRE, bandeaux CHAUD,
  badge CHAUD ; images impaires = palette normale, badge SOMBRE. (Relevé : f10 S, f11 C, f12 S, f13 C, f14 S, f15 C,
  f16 S, f17 C pour la bande centrale.)
- f18–27 : palette normale stable, badge SOMBRE.
- f28–35 : le badge s'allonge (largeur ×1,4, ancré à gauche, Easing.out(Easing.cubic)).
- f36 : badge CHAUD, bande centrale passe SOMBRE ; f37–38 badge vide ; f39 « M O T » très espacé dans le badge.

## Scène 2 — Mot centré sur écusson (f40–74)

- **f40 coupe** : fond SOMBRE uni, écusson du club en filigrane ton sur ton (≈ 85 % de la largeur, centré,
  opacité ≈ 30 %, légèrement plus clair que le fond), petits textes CRÈME « VILLE » au-dessus (y ≈ 250) et « CLUB »
  en dessous (y ≈ 960), hauteur ≈ 16 px — bien à l'écart du mot (corrigé après un premier essai où le mot les cachait).
- **Apparition lettre par lettre**, centrée (x ≈ 600, mot de y ≈ 390 à 780) :
  f41 : 2ᵉ lettre seule, CRÈME, fond **CHAUD** ;
  f42 : 2ᵉ + 3ᵉ lettres en CHAUD, fond SOMBRE ;
  f43 : mot complet, une lettre en SOMBRE, les autres CRÈME, fond CHAUD ;
  f44 : fond SOMBRE définitif, mot CRÈME sauf 1–3 lettres CHAUD.
- Mot en police **condensée** très grasse, hauteur de capitale ≈ 380 px à f44, largeur ≈ 880 px ; trame de
  demi-teintes en ombre en bas à droite ; lettres un peu usées (grain clair).
- **Poussée** : échelle 1,00 (f44) → 1,12 (f64), puis **saut** à 1,25 à f65 (coupe d'échelle) → 1,35 (f73).
- Textes ville/club : l'interlettrage s'élargit de 0,2 em à 0,8 em entre f44 et f60, puis ils disparaissent à f65.
- **Stroboscope de couleur** (mot entier CHAUD au lieu de CRÈME) aux images : 46, 47, 48, 50, 57, 64, 71.
- f74 : le mot glisse vers la gauche (−250 px en 1 image, la 1re lettre est coupée) → coupe.

## Scène 3 — Numéro + signature (f75–109)

- **f75 coupe** : fond SOMBRE, NUM en CHAUD atténué (≈ 75 % d'opacité), police condensée très grasse, hauteur
  ≈ 880 px, centré x ≈ 640 (le dernier chiffre déborde à droite), y ≈ 600.
- f76–80 : **inversion une image sur deux** : f76 S (fond SOMBRE / NUM CHAUD), f77 C (fond CHAUD / NUM SOMBRE),
  f78 S, f79 C, f80 S ; à partir de f81 : fond CHAUD, NUM SOMBRE définitif.
- Trame de demi-teintes CHAUD sur le haut des chiffres (points qui s'effacent vers le bas), et tache de trame en bas à
  droite du cadre.
- **Signature manuscrite du club** (logo-script fourni par le club) en CRÈME, posée en diagonale (≈ −15°) en travers
  du haut du numéro, largeur ≈ 620 px, centre ≈ (560, 380). **S'écrit** de gauche à droite de f76 à f101
  (révélation progressive du tracé, Easing.inOut(Easing.quad)), le trait de soulignement se termine vers f96–101.
  Petit débord SOMBRE (« coup de pinceau ») qui précède la pointe de l'écriture.
- Bandeau bas : NOM répété en petites capitales SOMBRE, y ≈ 1170, défilement vers la gauche ≈ 4 px/image.
- Lente poussée de tout : échelle 1,00 → 1,04 (f81–107).
- **Sortie** : f108 bande CRÈME de 50 px en bas, f109 bande de 90 px (elle porte le bandeau de NOM) → coupe f110.

## Scène 4 — Carte joueur (f110–270)

**Mise en page finale (mesurée à f200)**
- Bande SOMBRE en haut y ≈ 0–50 ; fond CHAUD y ≈ 50–1090 ; bande SOMBRE y ≈ 1090–1150 ; bande CRÈME y ≈ 1150–1200.
- **Anneau d'écusson** en filigrane CHAUD foncé (texte circulaire + cercles), centré vers (150, 380), rayon ≈ 420,
  coupé par le bord gauche ; rotation lente ≈ 0,1°/image.
- **Panneau SOMBRE** à droite : x ≈ 540–1150, y ≈ 190–1090, coin haut-gauche en **encoche** (marche de ≈ 60 px),
  bord droit coupé par une **bande diagonale CRÈME** (≈ 60 px de large, penchée ≈ 8°) ; le bas du panneau passe en
  dégradé vers CHAUD clair avec une trame de demi-teintes.
- **NUM** CRÈME, condensé très gras, hauteur ≈ 430 px, x ≈ 660–1040, y ≈ 480–910, avec dégradé vertical CRÈME →
  CRÈME rosé en bas.
- **Prénom** en CHAUD, petites capitales espacées (hauteur ≈ 45 px) à (680, 310) ; **nom** CRÈME gras (hauteur
  ≈ 55 px) dans une **étiquette penchée CHAUD** (parallélogramme ≈ 500 × 80 px) à (660–1160, 360–440).
- **Ville d'origine** (« VILLE, PAYS ») CRÈME petites capitales sous le numéro (≈ 680, 950).
- **Pastille ronde** du club (≈ 140 px) à droite du numéro (≈ 1120, 780).
- **Photo du joueur** détourée à gauche, buste, x ≈ 0–620, du haut (y ≈ 160) jusqu'à la bande du bas ; elle passe
  **devant** le bord gauche du panneau.

**Assemblage**
- f110 : le panneau apparaît en **forme découpée irrégulière** (silhouette dentelée, comme une épaule) et se
  redresse en rectangle à encoche jusqu'à f117 (morphing de forme, 1 étape par image).
- f110–114 : NUM et pastille déjà là ; pas de photo.
- Nom : machine à écrire, une lettre toutes les 2 images. Le nom de famille commence f115, le prénom f117 ;
  tous deux complets vers f135.
- **Photo en stroboscope** : f116 visible, f117 cachée, f118 visible, puis visible en continu.
- f118–270 : **lente poussée** de la photo (échelle 1,00 → 1,05, glissement +20 px vers la droite) ; le panneau et
  le texte restent fixes ; l'anneau tourne. Fin sur cette tenue (≈ 5 s), sans sortie.

# Découpage à l'image près

Référence : 1080×1080, 29,97 i/s, 361 images (12,05 s), **piste son muette**, boucle (f360 ≈ f0, écart moyen 8/255).
Positions en pixels sur 1080×1080.

| Rôle | Référence | Remarque |
|------|-----------|----------|
| ROUGE | `#D3000C` (`#BE0003` sur la carte blanche) | barres, bande, mot, bloc |
| ROUGE SOMBRE | `#200004` / `#1B0A0C` | fond carbone, ombres, lettres géantes sombres |
| NOIR TEXTE | `#1E0004` | texte noir de la carte blanche (noir teinté rouge, jamais `#000`) |
| GRIS PAPIER | `#E8E7E7` | fond de la carte blanche |
| BLANC | `#FFFFFF` | épure technique, mot sur bloc rouge |
| CHROME | dégradé `#F4F4F6` → `#9A9AA2` → `#FFFFFF` → `#6E6E78` | nom du club, lettres en relief |

CLUB = nom court du club (« CANES » dans la référence) ; MOT = mot de victoire (« WIN ») ; NOM = nom complet en
capitales (« HURRICANES ») ; SIGNATURE = « NOM MOT » en petit ; LOGOS = 3 petits logos secondaires ; BLOC CLUB = logo +
nom + « HOCKEY CLUB » en petit (à remplacer par « FOOTBALL CLUB »).

## Temps 1 — Carte sombre (f0–46)

- Fond : **fibre de carbone** à losanges en relief (tissage vu en perspective, plus brillant en haut), vignettage
  rouge sombre ; **barre rouge** en haut (y 0–30, x 80–700 environ) et en bas (y 1050–1080, x 0–560), à bords nets.
- LOGOS : 3 petits logos blancs (≈ 60 px) alignés à gauche, y ≈ 130, x ≈ 60 / 190 / 300.
- Filets fins blancs (1 px, 60 % d'opacité) pleine largeur à y ≈ 190 et y ≈ 520.
- CLUB en **chrome** (≈ 95 px de capitale, linéale étendue grasse), centré, y ≈ 245–320 ; MOT en **rouge vif** (≈ 140 px),
  y ≈ 340–465, légère lueur rouge ; SIGNATURE (≈ 24 px, capitales espacées, petit carré blanc devant) alignée à droite,
  x ≈ 300–640, y ≈ 558.
- f0–38 : lente poussée (×1,00 → ×1,08), le reflet du chrome glisse sur les lettres.
- f13–16 : **glitch en zigzag** — tout (filets, logos, lettres, signature) est déformé en dents de scie horizontales
  (amplitude ≈ 10 px, pas ≈ 14 px) ; f14 : MOT en **contour rouge fin** seulement ; f15 : MOT plein + zigzag ; f16 : retour.
- f17–19 : MOT clignote : contour (f17), contour sombre (f18), plein assombri (f19), plein (f20).
- f39–46 : **lavis rouge** sur toute l'image (mode multiplication / écran alterné), qui clignote image par image
  (rouge, normal, rouge…) ; la poussée accélère (×1,08 → ×1,35) : CLUB et MOT débordent du cadre, flou de mouvement.

## Temps 2 — Bande rouge et lettres chromées 3D (f47–109)

- Fond **blanc** avec **épure technique** grise fine : grand cercle (diamètre ≈ 1000 px) contenant un emblème gravé
  (lignes rayonnantes, motif en relief très pâle), réticule vertical en haut et en bas (trait de 40 px), pointillés
  horizontaux de part et d'autre de la bande, swoosh argent flou en bas.
- **Bande rouge** pleine largeur, bord haut **cranté** (petits créneaux blancs ≈ 8 × 8 px tous les 16 px), texture
  légère ; lettres du MOT en **chrome extrudé 3D** (face argent, tranche plus sombre, ombre portée sur la bande).
- f47–52 : **macro** sur une lettre (le « I » en très gros, ≈ 600 px), croix de visée (+) noires, rose et rouge
  translucides, pointillés ; la caméra recule très vite (×6 → ×1,4).
- f53–60 : recul jusqu'à voir la bande (y ≈ 330–480 puis 560–700 selon le cadrage) ; les lettres sont **décalées en
  hauteur** (certaines hors de la bande) et descendent/montent pour se ranger, chacune avec son propre retard
  (f56–80) ; un petit trait de 3 couleurs (gris, rouge sombre, rouge) en haut à gauche.
- f53–72 : SIGNATURE en petites capitales très espacées sous la bande qui **se décode** (lettres manquantes puis
  aléatoires, puis justes).
- f80–100 : lettres rangées, lente poussée ; la bande remplit la largeur ; f88–91 la signature glisse à gauche et sort.
- f100–109 : léger dézoom ; f104–113 : **transition en blocs** — des rectangles de la scène 3 (logo rouge) poussent la
  carte blanche par la droite et le bas.

## Temps 3 — Logo en relief 3D (f110–175)

- Le **logo du club en relief** (extrudé, biseauté, matière rouge satinée, parties sombres légèrement rayées, tranche
  argent) sur une **surface rouge texturée** (petit motif hexagonal) ; caméra proche, légèrement en plongée, qui dérive
  vers la droite et tourne de quelques degrés (f110–175).
- f110–130 : **tracés blancs fins** (contours de grandes lettres du MOT, 1 px) superposés ; rectangles blancs qui
  glissent sur la droite (f113–128).
- f133–175 : **MOT en contour** blanc (2 px) + remplissage blanc à 15 %, très grand (≈ 330 px), centré verticalement,
  débordant ; NOM en petites capitales noires très espacées (≈ 34 px, interlettrage 1,5 em) qui **s'assemble lettre
  par lettre dans un ordre mélangé** (f135–150) ; clignotement du NOM (f159–162).
- f157–167 : **anneau lumineux** fin (cercle blanc qui grandit et s'efface autour du logo).
- f168–175 : flou de mouvement, puis **blocs** noirs et blancs (f172–175).

## Temps 4 — Lettres géantes et logo qui se retourne (f176–198)

- Fond : **une lettre géante du NOM par image, à l'envers** (S, E, N, A, C, I, R, R, U, H), en rouge et rouge sombre /
  noir, coupée par le cadre (≈ 900 px) ; MOT géant en bas (≈ 500 px, rouge) qui reste.
- f176–183 : le **logo se retourne** : vu par la tranche (ellipse aplatie, chromée) puis de face (≈ 420 px de large),
  rotation sur l'axe horizontal ; petit rebond.
- f184–192 : le fond passe au **blanc/gris** (lettres en gris, rouge et blanc), le logo réduit (420 → 300 px).
- f192–198 : **mise au point qui glisse** : le fond devient très flou (rayures rouge/blanc/noir), le logo monte
  et réduit (300 → 140 px) vers sa place de la carte blanche.

## Temps 5 — Carte blanche éditoriale (f199–339)

- Fond **gris papier** quadrillé très pâle, rayures diagonales de lumière ; en haut, le **logo rouge rogné** (seulement
  le bas, y 0–70) sur fond rouge sombre ; en bas à droite, **swoosh argent** courbe ; filets noirs fins à y ≈ 195 et
  y ≈ 548 (partiels).
- NOM noir (linéale étendue, ≈ 60 px) dans un **cadre fin** (2 px) x ≈ 65–675, y ≈ 250–305 ; MOT **blanc** (≈ 170 px)
  sur **bloc rouge** x ≈ 60–670, y ≈ 315–485 ; BLOC CLUB en bas à gauche (x ≈ 60–255, y ≈ 590–630) ; LOGOS noirs en
  haut à droite (y ≈ 105), qui montent en place f224–231.
  (Dans la référence, la carte est vue en léger gros plan : composer comme si elle occupait 1080 × 1080 avec ces positions
  à l'échelle 1,55 → bloc rouge ≈ 60–1030 de large.)
- f199–206 : **entrée glitch** : bloc rose translucide (rouge à 55 %) qui glisse, MOT en blanc avec traînée de
  copies (décalage RGB/flou horizontal), le logo de la scène 4 qui disparaît dedans ; NOM en lettres pixelisées /
  dédoublées.
- f206–222 : NOM qui **se décode** (lettres doublées, coupées, puis justes) ; le bloc devient rouge plein, le MOT se pose.
- f232–250, f288–300, f304–316 : le NOM **roule** : des copies du NOM (en italique, plus petites ou plus grandes)
  défilent verticalement dans le cadre, comme un compteur, puis le NOM se repose.
- f234–238 : **respiration de mise au point** (flou 4 px puis net) ; lente poussée continue (×1,00 → ×1,04).

## Temps 6 — Retour à la carte sombre (f340–359)

- f340–347 : **blocs** : rectangles rouges, noirs, morceaux de carbone et une lettre chromée floue (« N ») qui
  recouvrent la carte blanche.
- f346–359 : la carte sombre revient : CLUB en lettres **très espacées** (C A N E S) qui se resserrent, MOT rouge qui
  se complète (lettres manquantes puis toutes) ; LOGOS et signature en place ; f359 = position de f0 → **boucle**.

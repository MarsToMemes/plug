# Découpage à l'image près

Référence : 1080×1350, 59,94 i/s, 764 images (12,75 s), **muette** ; boucle de **380 images** (f380 = f0) jouée deux
fois. Numéros d'images à 60 i/s, positions en pixels sur 1080×1350.

| Rôle | Référence | Remarque |
|------|-----------|----------|
| JAUNE | `#EDC830` (`#F3D836` sur le slogan) | encre des lettres |
| JAUNE FLASH | `#F9F23A` / lavis `#E8E070` | pop surexposé, flash f48 |
| MARINE | `#2C294C` (fond béton) / `#15305E` (slogan) | couleur du logo (selon l'éclairage) |
| BLANC | `#F2F2F2` → gris `#B8B8B8` en bas des lettres | mots blancs, dégradé vertical |
| BÉTON | `#474847` marbré (taches sombres `#2E2F30`) | fond du temps 1 |
| TOILE | `#3D3F4A` tissage fin | fond du début du temps 2 |
| ORAGE | `#515151` nuages, `#2A231C` brun-noir | fonds des temps 2–8 |

CLUB = nom du club (« BREWERS ») ; MOT = mot de victoire (« WIN ») ; SLOGAN = 3 mots (« WIN / OUR / WAY ») ;
LOGO = logo du club.

## Temps 1 — Logo imprimé (f0–53)

- Fond **béton** gris marbré, légère texture de toile. LOGO imprimé (grain, manques, bords qui bavent), largeur ≈ 520 px,
  centré (x ≈ 540, y ≈ 560), petit « ™ » à droite (à ne pas reproduire si le logo du club n'en a pas).
- f0–13 : poussée ×1,00 → ×1,12, dérive vers la droite (+20 px).
- f14 : **coupe sèche** en plus gros (×1,35), cadrage décalé vers le haut-gauche.
- f16–36 : poussée lente ×1,35 → ×1,5, rotation −3° → +2° ; f26–36 le **bas du logo coule** : traînées verticales de
  20–60 px sous les formes, colonnes de pixels étirées (comme un pochoir qui dégouline), la balle s'éclaircit.
- f38–46 : **saturation** : contour jaune → jaune vif lumineux (halo 10 px), blanc brûlé, fond plus clair ; tremblement
  ±6 px, dédoublement léger.
- f48 : **flash jaune** une image : lavis jaune pâle (≈ 70 %) sur tout le cadre, logo visible en transparence.
- f50–53 : coupe **très serrée** (×2,2) sur le logo flou ; la première lettre du temps 2 apparaît déjà par-dessus
  (fondu enchaîné de 2 images).

## Temps 2 — Le mot se construit (f54–73)

- f54–63 : fond **toile** bleu-gris sombre (tissage diagonal fin) ; f64 : fond qui passe au **ciel d'orage gris** + **texte
  géant en diagonale** (« CLUB MOT CLUB MOT… », lignes de ≈ 180 px, rotation −25°, gris plus sombre à 30 %).
- Bloc final : CLUB (≈ 120 px, condensée très grasse, jaune) sur une ligne, MOT (≈ 260 px) dessous, aligné à gauche
  x ≈ 120, y ≈ 380–760 ; léger penché (−4°).
- Construction : une lettre toutes les 2 images (ordre de lecture, les deux lignes en parallèle) ; chaque lettre naît
  **ondulée** (déformation liquide verticale, amplitude 30 → 0 px en 4 images) et **étirée** (scaleY 1,4 → 1) ; un
  **fantôme** de la lettre suivante (même lettre, 40 % d'opacité, plus sombre) apparaît 30–60 px à droite / en dessous
  et glisse vers sa place.
- f70–73 : bloc complet, quelques taches de grain qui bougent.

## Temps 3 — Flash blanc puis rotation (f74–113)

- f74–82 : le texte passe **blanc**, **flou de mise au point** (6 → 12 → 4 px), légère surexposition du fond.
- f84–109 : retour au jaune net ; rotation lente −4° → −8°, poussée ×1,00 → ×1,05, le fond diagonal glisse.
- f110–112 : **écrasement** vertical (scaleY 1 → 0,82 → 1) du bloc, comme une anticipation.

## Temps 4 — Pop jaune (f114–187)

- f114–122 : bloc **jaune surexposé** (`#F9F23A`, halo), **très flou** (16 px), plus grand (×1,25), rotation −8° → −2°.
- f124–132 : mise au point (16 → 0 px), ×1,25 → ×1,45 : le bloc remplit presque la largeur (x ≈ 20–1060).
- f134–183 : jaune normal, lente rotation et poussée (×1,45 → ×1,55) ; le texte en diagonale du fond continue.
- f184–187 : **sortie** : glissement rapide vers la gauche (−300 px) avec flou de mouvement.

## Temps 5 — Ciel d'orage (f188–199)

- Plein cadre de nuages d'orage **brun-noir** (`#2A231C` → `#4A4038`), très contrastés, qui dérivent ; sert de volet.

## Temps 6 — Le slogan arrive (f200–237)

- Fond : ciel d'orage en **noir et blanc** (nuages gris clairs et sombres), légère dérive.
- f200–209 : LOGO (≈ 260 px) + MOT 2 (jaune, police **étendue** très grasse, ≈ 120 px) arrivent **en tournoyant** : départ
  bas-droite, rotation −35° → 0°, échelle ×0,8 → ×1, **flou de mouvement** directionnel, grain de pochoir.
- f210–228 : MOT 1 (blanc, condensée très grasse, ≈ 230 px) se révèle en haut à droite du logo par **lamelles
  verticales** (6–8 bandes de largeur inégale qui descendent du haut, chacune avec son retard, bords nets).
- f220–232 : MOT 3 (blanc, ≈ 300 px) se révèle de la même façon en bas, lamelles qui montent.
- f230–237 : tout le bloc passe de légèrement flou à net.

## Temps 7 — Tenue du slogan (f238–349)

- Mise en page finale : [LOGO ≈ 240 px][MOT 1] sur la 1ʳᵉ ligne (y ≈ 300–520), MOT 2 jaune étendu (y ≈ 540–640), MOT 3
  blanc (y ≈ 660–900, **dégradé** blanc → gris vers le bas) ; bloc centré, largeur ≈ 860 px.
- Lettres **au pochoir** : bords qui bavent (grain de bombe autour des lettres sur 6–10 px), petits manques internes.
- Lente poussée ×1,00 → ×1,06 et dérive (+10 px) ; le grain de pochoir change toutes les 4 images.

## Temps 8 — Plongée (f350–379)

- f350–371 : poussée **accélérée** (×1 → ×9, Easing.in(Easing.exp)) vers une lettre du MOT 2 (le « U » de OUR, centre
  ≈ x 560, y 600), rotation +10°, flou de mouvement radial croissant ; le grain de bombe devient énorme.
- f372–379 : plein cadre de texture jaune granuleuse, **flou** 6 → 20 px.
- f380 = f0 : coupe sèche sur le logo (boucle).

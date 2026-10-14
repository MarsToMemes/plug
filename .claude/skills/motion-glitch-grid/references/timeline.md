# Découpage à l'image près

Référence : 1080×1080, **24 i/s**, 187 images (7,79 s), pas d'audio. Positions en pixels sur 1080.

| Rôle | Référence | Remarque |
|------|-----------|----------|
| ROUGE (fond) | `#BF002D` | rouge du club, fonds principaux |
| ROUGE SOMBRE | `#54000B` | bande derrière le nom, ombres du duotone |
| BLANC | `#FFFFFF` | texte, vagues, cases blanches |
| NOIR | `#000000` | cases de chiffres, fond de la grille de mots, bandes du cadre photo |
| GRIS | `#9D9B9C` (photo) / `#D9D9D9` (blocs) | uniquement photo d'action et blocs de mosaïque |

Dans ce fichier : MOT = mot du but (« GOAL »), NUM = numéro (2 chiffres), PRÉNOM/NOM du buteur, LOGO = logotype du club
(nom de ville + nom du club), EMBLÈME = forme graphique emblématique du club (dans la référence : l'aile).

## Temps 1 — Carte logotype (f0–7)

- Fond ROUGE. EMBLÈME blanc géant, coupé, dans le coin haut gauche (≈ 0–500 × 0–130).
- LOGO centré à gauche : ville en capitales grasses blanches (hauteur ≈ 70 px, x ≈ 60–440, y ≈ 160–230), nom du club
  dessous en petites capitales très espacées (≈ 30 px, interlettrage ≈ 0,4 em, y ≈ 250).
- **Lignes techniques** fines blanches (2 px) : un crochet vertical à droite du LOGO (x ≈ 460, y ≈ 120–290) qui se
  prolonge en flèche horizontale sous le nom du club (vers la gauche), plus un trait vertical à droite (x ≈ 1010).
- Bas de l'image (y ≈ 680–1080) : photo de la ville/stade en **duotone** ROUGE SOMBRE → ROUGE, petit EMBLÈME blanc
  (≈ 60 px) au centre bas.
- Mouvement : quasi fixe (dérive horizontale de quelques px).

## Temps 2 — Mosaïque de blocs (f8–16)

- Rectangles gris clair `#D9D9D9` et blancs, alignés sur une grille de 45 px, tailles 1×1 à 4×6 cellules.
- f8 : quelques blocs ; f9–11 : densité croissante (≈ 40 % de l'image couverte), le LOGO se casse (des lettres
  disparaissent sous les blocs, des tranches de la photo du bas se décalent) ; f12–15 : fond ROUGE uni sous les blocs
  (la carte a disparu), blocs qui changent de place à **chaque image** ; f16 : blocs qui se raréfient et premières
  bribes du temps 3.

## Temps 3 — Lettres qui claquent (f17–35)

Lettres en blanc ou noir sur ROUGE, police large très grasse, centrées (x ≈ 540, y ≈ 560) :

| Image | Contenu |
|-------|---------|
| f17 | 1re lettre BLANCHE énorme (hauteur ≈ 620 px), quelques blocs encore autour |
| f18 | même lettre BLANCHE, moyenne (≈ 280 px) |
| f19 | même lettre NOIRE, petite (≈ 200 px) |
| f20 | 2e lettre BLANCHE énorme (≈ 620 px) |
| f21 | 2e lettre NOIRE moyenne (≈ 330 px) |
| f22 | 2e lettre NOIRE petite (≈ 200 px) |
| f23–24 | 1re lettre BLANCHE énorme, coupée par le bord gauche (zoom, entrée par la gauche) |
| f25 | 1re lettre BLANCHE moyenne (≈ 260 px), x ≈ 290 |
| f26–27 | 2 premières lettres (≈ 220 px) ; f27 décalées vers la droite, un fragment de lettre à gauche |
| f28–31 | **mot en tranches** : le mot est coupé en 2–3 bandes horizontales ; chaque bande montre un état différent (lettres 3–4 en BLANC en haut, en NOIR en bas), décalées en x de ±80 px ; f31 mot complet, bas des lettres en NOIR |
| f32–35 | 3 lignes du mot empilées (hauteur ≈ 150 px, interligne 0) : ligne du haut et du bas coupées (on n'en voit que la moitié), ligne du milieu bicolore (BLANC à gauche, NOIR à droite de la coupe verticale) |

## Temps 4 — Grille de mots (f36–56)

- f36–37 : **coupe sur fond NOIR**, 5 lignes du mot en BLANC (hauteur ≈ 150 px, interligne serré, lignes 1 et 5
  coupées en tranches) ; f37 même chose sur ROUGE.
- f38 : fond NOIR, 5 lignes du mot propres, centrées (hauteur ≈ 70 px, x ≈ 270–700, y ≈ 40–960).
- f39 : **coupe sur le portrait** serré du joueur (visage plein cadre, fond rouge flou), mêmes 5 lignes en BLANC.
- f40–47 : l'interlettrage augmente ligne par ligne (une ligne de plus chaque image ou deux) jusqu'à ce que les
  lettres forment **4 colonnes** (x ≈ 25, 300, 575, 850), hauteur des lettres ≈ 75 px, 5 rangées (y ≈ 30–1050).
- f48–56 : le portrait **et** les colonnes de lettres sont découpés en **4 bandes verticales** (une par colonne)
  décalées verticalement (−120 à +150 px), nouvelles valeurs toutes les 2 images ; les bandes « glissent » comme des
  rouleaux de machine à sous.

## Temps 5 — Compteur à rouleaux (f57–75)

- Fond ROUGE. Deux cases côte à côte, centrées sur (540, 560) : ≈ 390 × 600 px chacune, écart 20 px
  (x ≈ 75–465 et 485–875, y ≈ 260–860).
- f57 : deux rectangles BLANCS plats (≈ 400 × 300) ; f58–60 : ils se transforment en cases NOIRES de haut en bas
  (rideau), les chiffres BLANCS apparaissent dedans en train de **rouler** vers le haut.
- f60–68 : chaque case fait défiler les chiffres (plusieurs chiffres par image au début, puis ralenti) ; la case de
  gauche se cale sur le 1er chiffre de NUM vers f63, celle de droite sur le 2e vers f67–68 (léger rebond).
- f69–70 : pose ; une **flèche fine** verticale apparaît en haut à gauche.
- f71–75 : la flèche devient horizontale et file vers la droite (y ≈ 160) ; NUM glisse vers la droite/gauche avec
  **écho** (copie décalée superposée, f74–75), puis sort.

## Temps 6 — Photo d'action noir et blanc (f76–91)

- f76 : **coupe** : fond NOIR, photo d'action vue de dessus en **noir et blanc** (gris `#9D9B9C`), cadrée en
  rectangle x ≈ 0–1080, y ≈ 90–930 ; bandes NOIRES haut et bas avec de minuscules textes BLANCS très espacés
  (« VILLE », « POSTE ») répétés.
- NUM en **cases BLANCHES** à chiffres NOIRS, centré (≈ 200 × 150 px), le joueur passe derrière/à côté.
- f76–87 : lente poussée de la photo (×1,00 → ×1,06) et léger panoramique, le joueur traverse de gauche à droite.
- f88 : le 1er chiffre disparaît (case vide) ; f89 : il ne reste que le 2e chiffre ; f90 : un trait blanc remplace
  le chiffre ; les bandes noires disparaissent (zoom avant, la photo remplit le cadre).

## Temps 7 — Mosaïque vers la carte joueur, puis carte (f89–155)

**Transition f89–99** : blocs de mosaïque (grille 45 px) dont certains montrent la photo d'action, d'autres la carte
finale (ROUGE, vagues blanches, joueur) ; proportion de carte finale croissante ; tranches horizontales décalées.

**Carte (posée ≈ f118)**
- Fond ROUGE. Joueur (photo couleur, maillot du club) en grand, buste, tête vers (430, 120), occupe x ≈ 0–900,
  y ≈ 0–760 ; fond derrière lui ROUGE.
- Bande horizontale ROUGE SOMBRE pleine largeur, y ≈ 440–760 (derrière le nom, devant le bas de la photo, en
  produit/multiplication).
- **Vagues** : 4–5 bandes BLANCHES courbes (motif de l'emblème) qui partent du bas gauche et montent vers la droite,
  y ≈ 760–1080.
- Nom : PRÉNOM en petites capitales BLANCHES espacées (≈ 45 px) centré à (540, 760) ; NOM en capitales BLANCHES
  grasses (≈ 75 px, interlettrage ≈ 0,12 em) à (540, 820), **première lettre un peu plus grande** (petites capitales).
- NUM en cases NOIRES (≈ 75 × 95 px chacune) en haut à droite de la tête (≈ 560–720, 30–125).
- Lignes techniques fines NOIRES : grand arc de cercle (centre ≈ (1080, 320), rayon ≈ 330) en haut à droite, petites
  croix (×) aux extrémités, flèches horizontales fines à y ≈ 500 et y ≈ 1050.

**Animation**
- f99–108 : le NOM se **décode** : lettres remplacées par des glyphes aléatoires / morceaux de lettres
  (fragments, miroirs) qui se fixent de gauche à droite ; PRÉNOM pareil, en retard de 2 images ; la flèche horizontale
  traverse le nom.
- f105–124 : les cases du NUM apparaissent (blanches → noires) et **roulent en comptant** depuis NUM − 9 jusqu'à NUM
  (une valeur toutes les 2 images, 2e chiffre qui défile, 1er chiffre fixe).
- f107–118 : l'arc se dessine (tracé progressif), les croix et flèches apparaissent.
- f118–155 : tenue ; très lente poussée du joueur (×1,00 → ×1,03) ; les lignes techniques tournent/dérivent un peu.

## Temps 8 — Sortie et boucle (f155–186)

- f155–158 : la carte se découpe en **tranches horizontales** qui glissent (±60–200 px), le joueur se dédouble.
- f159–166 : mosaïque de blocs ROUGE / ROUGE SOMBRE (morceaux de la carte, puis de la photo de ville) → la carte
  logotype réapparaît derrière.
- f167–178 : LOGO qui se **recompose** : la ville en lettres cassées (moitiés de lettres, lettres décalées, fragments
  noirs), de plus en plus juste ; les lignes techniques se redessinent (crochet, flèche).
- f179–186 : nom du club tapé lettre par lettre ; f186 = f0 (boucle).

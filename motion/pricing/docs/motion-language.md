# Langage de motion design éditorial — pricing

Le texte est un **objet physique** : il a une masse (il met du temps à partir), une vitesse
(il traîne un flou proportionnel), il percute, pousse, se comprime, se déchire, se transforme.
Chaque mouvement répond à la question : *pourquoi ce texte bouge-t-il ainsi, maintenant ?*

## Grammaire d'un mouvement

Un mouvement n'est jamais un tween unique. C'est une **mini-séquence de phases**, chacune avec
sa durée et sa courbe :

| phase        | rôle                                    | courbe            | durée type |
|--------------|-----------------------------------------|-------------------|------------|
| anticipation | l'objet se prépare (recul, compression) | easeIn (power2.in)| 90–200 ms  |
| entrée       | il part vite                            | expo.out          | 200–420 ms |
| impact       | il dépasse sa place                     | (fin de l'entrée) | 60–100 ms  |
| overshoot    | 1.00 → 1.08 → 0.98 → 1.00               | back.out léger    | 120–200 ms |
| settle       | tracking qui se resserre, poids         | quart.out         | 200–400 ms |
| hold         | parfaitement immobile : on lit          | —                 | ≥ 600 ms   |
| sortie       | part plus vite qu'il n'est venu         | power3.in         | 150–300 ms |

Les durées ne se répètent pas : le rythme est humain (180 / 320 / 90 / 140 / 700…).

## Profondeur et caméra

Quatre plans : **fond → information secondaire → information principale → héros**. La caméra
virtuelle les traverse avec du parallax (le fond bouge moins, l'avant-plan plus).
Caméra : stable pour une information normale, *slow push* pour une donnée importante,
*fast push* pour une révélation, puis ralentissement. *Whip pan* pour un changement d'idée.

## Flou de mouvement

Échantillonné, comme un obturateur : l'objet est rendu à plusieurs instants dans la durée
d'une image. Lent → aucun flou ; rapide → traînée ; impact → flou maximum quelques images,
puis netteté immédiate (la vitesse tombe à zéro).

## Bibliothèque

`src/motion/` — primitives (pistes à phases, caméra à plans, flou échantillonné, mots
découpés en lettres, masques) et 20 presets `TYPO_*` paramétrables. `chooseMotion()` choisit
le preset selon le **sens** du texte (« plus cher » → slam, « demande ↑ » → étirement
vertical, « disponibilité ↓ » → compression, « 129 € → 349 € » → transformation numérique,
« 2 heures » → accélération temporelle, « jamais fixe » → oscillation, « algorithme » →
multiplication).

## Benchmark — 10 s, découpage

Rythme des plans : 1,5 · 1,2 · 0,9 · 1,5 · 2,3 · 1,8 · 0,8 s (irrégulier, voulu).

1. **POURQUOI** (0,00–1,50) — monumental, plus large que le cadre. La caméra part très près
   (×2,2) sur les lettres et *track* de gauche à droite en reculant ; les lettres sortent d'un
   masque, décalages irréguliers. À 1,30 : anticipation (le mot se comprime de 4 %), puis
   *whip pan* vers la droite avec flou.
2. **VOTRE BILLET** (1,50–2,70) — arrive porté par le whip. VOTRE (sans, petit, tracking
   large) en arrière-plan, BILLET (serif, énorme) au premier plan, une ligne de perforation
   devant : trois profondeurs, trois vitesses (parallax). BILLET dépasse sa place et revient.
   Sortie par **déchirure** : la perforation coupe le mot, la moitié haute monte, la basse
   descend.
3. **COÛTE** (2,70–3,60) — naît dans la déchirure : tracking très ouvert qui se referme,
   étirement horizontal qui se résorbe. Caméra stable (information normale). Hold court.
4. **PLUS CHER** (3,60–5,10) — le héros. Comprimé hors cadre (anticipation), accélère,
   dépasse sa place (impact), 1,00 → 1,08 → 0,98 → 1,00, tracking qui se resserre, micro
   push-in de la caméra à l'impact, puis immobile 700 ms. À l'impact, il **pousse** COÛTE
   hors du cadre.
5. **129 € → 349 €** (5,10–7,40) — PLUS CHER s'écrase en une barre (squash) : le mot devient
   une ligne. 129 € sort de derrière la barre. Slow push. Puis chaque chiffre s'écrase en
   trait et se redéploie en nouveau chiffre (le 1 devient le 3), de droite à gauche, décalages
   irréguliers ; la barre s'allonge dans la proportion 129 → 349 (le chiffre devient une
   barre) ; à l'arrivée du dernier chiffre, fast push et le prix prend son poids (orange).
6. **2 HEURES** (7,40–9,20) — *whip* vertical ; la barre devient une ligne de temps qui
   défile de plus en plus vite (accélération temporelle). Le « 2 » monumental s'écrase sur la
   ligne ; les lettres d'HEURES arrivent avec des décalages qui raccourcissent (accélération),
   puis freinage brusque et hold.
7. **Sortie** (9,20–10,00) — pull back rapide, tout se replie vers un point orange, noir.

## Composition avant le mouvement (méthode obligatoire)

1. Contenu → hiérarchie (héros, secondaire, support, méta, graphique, décor).
2. Composition sur la grille (`src/layout/grid.ts`) : 12 colonnes, marges 112 px, zone sûre,
   échelle d'espacement 8·16·24·32·48·64·96·128, ancres sémantiques.
3. Mesure réelle du texte (`src/layout/measure.ts`) : encre, chasse, hauteur de capitale (centrage
   optique), ligne de base — jamais d'estimation au nombre de caractères. Une mesure faite avec une
   fonte de secours n'est jamais gardée.
4. Placement par bords d'encre et modes (`src/layout/layout.ts`) : `stack` (STACKED_EDITORIAL),
   `dataEditorial` (DATA_EDITORIAL), `chooseBreaks` (coupures de lignes choisies par le sens),
   `centerBlock` (centre optique).
5. Contrôle (`qa()`) : chevauchements, proximité < 16 px, zone sûre, rognage, hiérarchie (poids
   visuel du héros ≥ 1,6 × le suivant), bords partagés.
6. Image fixe de diagnostic (`BenchmarkLayouts`, `<QAOverlay>`) → inspection → correction.
7. Seulement ensuite : l'animation part de ces positions et y revient (`BenchmarkQA` superpose les
   boîtes validées aux images animées, à travers la même caméra).
8. La caméra pousse autour du héros (pivot), jamais autour du centre de l'image quand la
   composition est alignée sur un bord.

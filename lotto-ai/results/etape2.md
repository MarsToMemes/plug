# Étape 2 : chaîne complète sur tirages synthétiques

Graine 42, 4000 tirages simulés (5/49 + Chance 1/10).

## A. Tirages parfaitement aléatoires

3700 tirages testés, 10 grilles par tirage. Hasard attendu : **0,5102** bon numéro par grille et 10 % pour le Chance. Une p-valeur sous 0,05 voudrait dire « bat le hasard » (mais voir B).

| Modèle | Bons n° / grille | Écart au hasard | p-valeur | N° Chance trouvé |
|---|---|---|---|---|
| Aléatoire | 0,5114 | +0,2 % | 0,3606 | 10,2 % |
| Chauds (fenêtre 50) | 0,5124 | +0,4 % | 0,3513 | 9,7 % |
| Froids (retard) | 0,5036 | -1,3 % | 0,8563 | 9,9 % |
| Bayésien (demi-vie 100) | 0,5124 | +0,4 % | 0,2943 | 10,2 % |
| Associations | 0,5070 | -0,6 % | 0,6355 | 9,9 % |
| Machine learning (logistique) | 0,5087 | -0,3 % | 0,6661 | 10,1 % |
| Hybride (poids du plan ChatGPT, sans deep learning) | 0,5164 | +1,2 % | 0,0900 | 10,3 % |

Pour info, répartition des grilles du générateur aléatoire (0 à 5 bons numéros) : 20999, 13280, 2527, 188, 6, 0.

## B. Le piège du surapprentissage

79 réglages testés. Période « dev » : tirages 300–2765 ; période « test » : tirages 2766–3999 (jamais utilisée pour choisir).

| | Dev (choix du réglage) | Test (vérification) |
|---|---|---|
| Meilleur réglage : **Hybride [0, 7, 4, 19], β=4** | +1,7 %, p = 0,0726 | +0,0 %, p = 0,4957 |
| Réglages « significatifs » (p < 0,05) | 0 / 79 | 12 / 79 |
| Attendu par pur hasard | ≈ 4 / 79 | ≈ 4 / 79 |

Corrélation entre l'écart en dev et l'écart en test, sur les 79 réglages : **+0,08** (proche de 0 = la performance en dev ne dit rien de la suite).

Seuil honnête quand on essaie 79 réglages (correction de Bonferroni) : p < 0,00063.

## C. Contrôle positif : tirages truqués

Les numéros 7, 13, 22 ont 30 % de chances en plus à chaque boule. Une chaîne qui marche doit le voir.

| Modèle | Bons n° / grille | Écart au hasard | p-valeur | N° Chance trouvé |
|---|---|---|---|---|
| Aléatoire | 0,5133 | +0,6 % | 0,1812 | 10,1 % |
| Chauds (fenêtre 400) | 0,5191 | +1,7 % | 0,0129 | 9,9 % |
| Bayésien (demi-vie 300) | 0,5172 | +1,4 % | 0,0308 | 9,9 % |
| Froids (retard) | 0,5064 | -0,8 % | 0,7338 | 9,9 % |
| Machine learning (logistique) | 0,5152 | +1,0 % | 0,0735 | 9,7 % |
| Chauds (fenêtre 400), concentré β=40 | 0,5464 | +7,1 % | < 0,0001 | 9,5 % |
| Bayésien (demi-vie 300), concentré β=40 | 0,5530 | +8,4 % | < 0,0001 | 9,5 % |
| Machine learning (logistique), concentré β=40 | 0,5457 | +7,0 % | < 0,0001 | 9,1 % |

Les 5 numéros les plus sortis dans ces tirages truqués : 13, 7, 22, 31, 10.

_Calcul : 30 s._

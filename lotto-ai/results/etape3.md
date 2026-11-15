# Étape 3 : backtest sur les vrais tirages FDJ

2907 tirages du 06/10/2008 au 14/11/2026. Prédits : 2607 tirages (à partir du 28/08/2010), 10 grilles par tirage, graine 42.

Hasard attendu : 0,5102 bon numéro par grille, 10 % pour le Chance. Seuil (Bonferroni, 7 modèles) : p < 0,0071.

| Modèle | Bons n° / grille | Écart au hasard | p-valeur | N° Chance trouvé |
|---|---|---|---|---|
| Aléatoire | 0,5097 | -0,1 % | 0,5532 | 10,2 % |
| Chauds (fenêtre 50) | 0,5057 | -0,9 % | 0,7487 | 10,2 % |
| Froids (retard) | 0,5144 | +0,8 % | 0,2851 | 10,1 % |
| Bayésien (demi-vie 100) | 0,5095 | -0,1 % | 0,5616 | 10,1 % |
| Associations | 0,5062 | -0,8 % | 0,6439 | 10,1 % |
| Machine learning (logistique) | 0,4993 | -2,1 % | 0,9963 | 10,2 % |
| Hybride (poids du plan ChatGPT, sans deep learning) | 0,4998 | -2,0 % | 0,9742 | 10,4 % |

| Modèle | z (numéros) | Significatif ? | z (Chance) | Significatif ? |
|---|---|---|---|---|
| Aléatoire | -0,13 | non | +1,28 | non |
| Chauds (fenêtre 50) | -0,67 | non | +0,69 | non |
| Froids (retard) | +0,57 | non | +0,60 | non |
| Bayésien (demi-vie 100) | -0,16 | non | +0,32 | non |
| Associations | -0,37 | non | +0,47 | non |
| Machine learning (logistique) | -2,68 | non | +0,74 | non |
| Hybride (poids du plan ChatGPT, sans deep learning) | -1,95 | non | +1,22 | non |

**Verdict : 0 modèle(s) sur 7 battent le hasard au seuil fixé.**

## Analyse exploratoire (hors protocole)

La logistique fait −2,1 % (z = −2,68), ce qui ressemble à « pire que le hasard ». Vérification :
avec 10 autres graines, son z moyen est de −0,06 (de −2,07 à +1,62), et la version sans tirage
au sort des grilles donne z = −1,39. Le −2,68 venait du tirage au sort des grilles avec la graine 42 :
c'est du bruit, pas un effet.

_Calcul : 3 s._

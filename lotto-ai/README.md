# LOTTO AI — projet expérimental

Projet perso, sans lien avec le reste du dépôt `plug`. Le but n'est pas de battre le hasard
(c'est impossible sur des tirages uniformes et indépendants), mais de voir où mènent
des modèles « prédictifs » et d'apprendre à reconnaître une fausse découverte.

## Lancer

```bash
python3 run_step2.py              # 4000 tirages, graine 42, ~35 s
python3 run_step2.py --seed 7     # autre tirage au sort
```

Seule dépendance : `numpy`. Le rapport est écrit dans `results/etape2.md`.

## Contenu

| Fichier | Rôle |
|---|---|
| `fetch_fdj.py` | Télécharge les archives officielles FDJ dans `data/fdj/` |
| `lotto/fdj.py` | Lit les CSV FDJ (contrôles : numéros valides, pas de doublon contradictoire) |
| `lotto/data.py` | Tirages synthétiques 5/49 + Chance 1/10, avec biais optionnel |
| `lotto/features.py` | Statistiques de l'historique (fréquences, retards, associations), sans fuite du futur |
| `lotto/models.py` | Aléatoire, chauds, froids, bayésien, associations, régression logistique, hybride |
| `lotto/backtest.py` | Backtest chronologique + test statistique exact contre le hasard |
| `run_step2.py` | Les trois expériences de l'étape 2 |

## Méthode

- À chaque tirage `t`, le modèle ne voit que les tirages `0..t-1` et produit 10 grilles.
- Les grilles sont tirées au sort selon les scores du modèle : `p ∝ score^β`.
  `β` petit = presque du hasard, `β` grand = toujours les mêmes favoris.
- Mesure : bons numéros par grille. Hasard : 25/49 ≈ 0,510.
- Test : sous « tirage uniforme et indépendant des grilles », le total de bons numéros
  a une espérance et une variance exactes (loi hypergéométrique) → score z, p-valeur.

## Étapes

1. **Données réelles FDJ** ← fait : `python3 fetch_fdj.py` puis `lotto.fdj.load()`.
   2 907 tirages 5/49 + Chance du 06/10/2008 au 14/11/2026 (2 836 Loto, 62 Super Loto, 9 Grand Loto).
   Le « second tirage » du Loto (depuis 2019, sans numéro Chance) est ignoré.
   Il manque à la FDJ les Super Loto de 02/2017 à 09/2017 et de 10/2018 à 06/2019.
2. **Chaîne complète sur tirages synthétiques** ← fait
3. **Backtest sur les vrais tirages, réglages figés à l'avance** ← fait (`run_step3.py`) : 0 modèle sur 7 bat le hasard
4. **Tests du hasard des tirages FDJ** ← fait (`run_step4.py`) : 0 test sur 10 signale un écart

Le deep learning du plan initial n'est pas implémenté : il demanderait PyTorch, et sur des
données sans structure il ne peut que surapprendre. On pourra l'ajouter à l'étape 3 pour le vérifier.

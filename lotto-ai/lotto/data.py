"""Tirages synthétiques au format Loto / Super Loto : 5 numéros sur 49 + 1 numéro Chance sur 10.

En interne les numéros vont de 0 à 48 (et 0 à 9 pour le Chance) ; on ajoute 1 à l'affichage.
"""
import numpy as np

N_MAIN, K_MAIN, N_CHANCE = 49, 5, 10


def simulate(n_draws, rng, main_weights=None, chance_weights=None):
    """Génère `n_draws` tirages indépendants.

    Sans poids, chaque combinaison est équiprobable (le cas du vrai Loto).
    Avec des poids, les boules sont tirées une à une sans remise, proportionnellement
    à leur poids : sert de « contrôle positif » (un biais réel que les modèles devraient trouver).
    """
    w = np.ones(N_MAIN) if main_weights is None else np.asarray(main_weights, float)
    keys = np.log(w) + rng.gumbel(size=(n_draws, N_MAIN))  # astuce de Gumbel = tirage sans remise pondéré
    main = np.argpartition(-keys, K_MAIN, axis=1)[:, :K_MAIN]
    main.sort(axis=1)
    cw = np.ones(N_CHANCE) if chance_weights is None else np.asarray(chance_weights, float)
    chance = rng.choice(N_CHANCE, size=n_draws, p=cw / cw.sum())
    return main, chance

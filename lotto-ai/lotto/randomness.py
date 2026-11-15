"""Tests du hasard d'un historique de tirages (5/49 + Chance).

Chaque test résume l'historique par un histogramme (ou un nombre). La référence n'est pas une
formule : on simule des milliers d'historiques parfaitement aléatoires de même longueur et on
regarde où se place le vrai historique parmi eux (p-valeur de Monte-Carlo).
"""
import numpy as np

from .data import N_CHANCE, N_MAIN

SUM_EDGES = np.array([15, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 236])
GAP_EDGES = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 17, 20, 25, 30, 40, 60, 10_000])
_IU = np.triu_indices(N_MAIN, 1)
_COLS = [(a, b) for a in range(5) for b in range(a + 1, 5)]

# nom → (description, type) ; "hist" = écart à l'histogramme attendu, "scalar" = nombre brut
TESTS = {
    "numeros": ("Fréquence de chaque numéro (1 à 49)", "hist"),
    "chance": ("Fréquence de chaque numéro Chance (1 à 10)", "hist"),
    "paires": ("Fréquence de chacune des 1 176 paires de numéros", "hist"),
    "somme": ("Somme des 5 numéros", "hist"),
    "pairs": ("Nombre de numéros pairs par tirage", "hist"),
    "consecutifs": ("Numéros qui se suivent dans un tirage (ex. 12-13)", "hist"),
    "retards": ("Écart entre deux sorties d'un même numéro", "hist"),
    "repetition": ("Numéros communs entre deux tirages successifs", "hist"),
    "chance_repete": ("Numéro Chance identique au tirage suivant", "hist"),
    "stabilite": ("Fréquences de la 1re moitié comparées à la 2e", "scalar"),
}


def summarize(main, chance):
    """main : [n, 5] numéros 0..48 triés ; chance : [n] 0..9."""
    n = len(main)
    pres = np.zeros((n, N_MAIN), bool)
    pres[np.arange(n)[:, None], main] = True
    counts = pres.sum(0)

    codes = np.concatenate([main[:, a] * N_MAIN + main[:, b] for a, b in _COLS])
    pairs = np.bincount(codes, minlength=N_MAIN * N_MAIN).reshape(N_MAIN, N_MAIN)[_IU]

    nums, ts = np.nonzero(pres.T)  # trié par numéro puis par date
    same = nums[1:] == nums[:-1]
    gaps = np.diff(ts)[same]

    consec = (np.diff(main, axis=1) == 1).sum(1)
    overlap = (pres[1:] & pres[:-1]).sum(1)
    half = n // 2
    c1, c2 = pres[:half].sum(0), pres[half:2 * half].sum(0)

    return {
        "numeros": counts,
        "chance": np.bincount(chance, minlength=N_CHANCE),
        "paires": pairs,
        "somme": np.histogram(main.sum(1) + 5, SUM_EDGES)[0],
        "pairs": np.bincount(((main + 1) % 2 == 0).sum(1), minlength=6),
        "consecutifs": np.bincount(np.minimum(consec, 2), minlength=3),
        "retards": np.histogram(gaps, GAP_EDGES)[0],
        "repetition": np.bincount(np.minimum(overlap, 3), minlength=4),
        "chance_repete": np.bincount((chance[1:] == chance[:-1]).astype(int), minlength=2),
        "stabilite": np.array([((c1 - c2) ** 2 / np.maximum(c1 + c2, 1)).sum()]),
    }


def simulate_uniform(n, rng):
    keys = rng.random((n, N_MAIN))
    main = np.sort(np.argpartition(keys, 5, axis=1)[:, :5], axis=1)
    return main, rng.integers(0, N_CHANCE, n)


def run_tests(histories, n_sims, rng):
    """histories : {nom: (main, chance)}, tous de même longueur. Renvoie {nom: {test: (stat, p)}}."""
    n = len(next(iter(histories.values()))[0])
    sims = [summarize(*simulate_uniform(n, rng)) for _ in range(n_sims)]
    results = {name: {} for name in histories}
    observed = {name: summarize(*h) for name, h in histories.items()}
    for test, (_, kind) in TESTS.items():
        S = np.array([s[test] for s in sims], float)
        if kind == "hist":
            E = S.mean(0)
            ok = E > 0
            stat = lambda h: (((h[ok] - E[ok]) ** 2) / E[ok]).sum()
        else:
            stat = lambda h: float(h[0])
        null = np.array([stat(s) for s in S])
        for name, obs in observed.items():
            x = stat(np.asarray(obs[test], float))
            results[name][test] = (x, (1 + (null >= x).sum()) / (1 + n_sims))
    return results

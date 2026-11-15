"""Backtest chronologique et test statistique.

À chaque tirage t : le modèle voit les tirages 0..t-1, produit `n_grids` grilles, puis on
compte les bons numéros. Les grilles sont tirées au sort selon les scores du modèle
(p ∝ score^beta) : beta = 0 → hasard pur, beta grand → toujours les mêmes favoris.

Test : sous l'hypothèse « le tirage est uniforme et indépendant des grilles », le nombre
total de bons numéros a une espérance et une variance exactes (loi hypergéométrique).
On en tire un score z et une p-valeur unilatérale (« le modèle fait mieux que le hasard »).
"""
import math
from dataclasses import dataclass

import numpy as np

from .data import K_MAIN, N_CHANCE, N_MAIN

# Var(Σ v_i X_i) = C · Σ (v_i - v̄)² quand X est un tirage uniforme de 5 numéros parmi 49
VAR_C = K_MAIN * (N_MAIN - K_MAIN) / (N_MAIN * (N_MAIN - 1))
EXPECTED_PER_GRID = K_MAIN * K_MAIN / N_MAIN  # ≈ 0,510 bon numéro par grille


def _sample(scores, beta, n_grids, k, rng):
    s = np.asarray(scores, float)
    logp = beta * np.log(np.maximum(s / s.max(), 1e-12))
    keys = logp + rng.gumbel(size=(n_grids, len(s)))
    return np.argpartition(-keys, k - 1, axis=1)[:, :k]


@dataclass
class Run:
    name: str
    start: int
    V: np.ndarray      # [tirages, 49] combien de grilles contiennent chaque numéro
    W: np.ndarray      # [tirages, 10] idem pour le numéro Chance
    hits: np.ndarray   # [tirages, n_grids] bons numéros par grille
    chits: np.ndarray  # [tirages, n_grids] numéro Chance trouvé


def run(model, f, start, end, rng, n_grids=10, beta=1.0, name=None):
    n = end - start
    V = np.zeros((n, N_MAIN), np.int16)
    W = np.zeros((n, N_CHANCE), np.int16)
    hits = np.zeros((n, n_grids), np.int8)
    chits = np.zeros((n, n_grids), bool)
    for i, t in enumerate(range(start, end)):
        grids = _sample(model.main_scores(f, t), beta, n_grids, K_MAIN, rng)
        V[i] = np.bincount(grids.ravel(), minlength=N_MAIN)
        hits[i] = f.pres[t][grids].sum(1)
        c = _sample(model.chance_scores(f, t), beta, n_grids, 1, rng)[:, 0]
        W[i] = np.bincount(c, minlength=N_CHANCE)
        chits[i] = c == f.chance[t]
    return Run(name or model.name, start, V, W, hits, chits)


@dataclass
class Score:
    name: str
    draws: int
    grids: int
    mean_hits: float      # bons numéros par grille
    lift: float           # écart relatif au hasard (0,05 = +5 %)
    z: float
    p: float              # p-valeur unilatérale
    chance_rate: float
    chance_z: float
    hist: np.ndarray      # nombre de grilles à 0,1,...,5 bons numéros


def _p(z):
    return 0.5 * math.erfc(z / math.sqrt(2))


def evaluate(r, f, lo=None, hi=None):
    """Évalue les tirages d'indice absolu [lo, hi) du run."""
    lo = r.start if lo is None else lo
    hi = r.start + len(r.V) if hi is None else hi
    sl = slice(lo - r.start, hi - r.start)
    V, W = r.V[sl].astype(float), r.W[sl].astype(float)
    X, Xc = f.pres[lo:hi], f.cpres[lo:hi]

    total, expected = (V * X).sum(), V.sum() * K_MAIN / N_MAIN
    var = VAR_C * ((V - V.mean(1, keepdims=True)) ** 2).sum()
    z = (total - expected) / math.sqrt(var) if var > 0 else 0.0

    ctot, cexp = (W * Xc).sum(), W.sum() / N_CHANCE
    cvar = ((W ** 2).sum(1) / N_CHANCE - (W.sum(1) / N_CHANCE) ** 2).sum()
    cz = (ctot - cexp) / math.sqrt(cvar) if cvar > 0 else 0.0

    n_grids = int(V.sum() / K_MAIN)
    return Score(
        r.name, hi - lo, n_grids, total / n_grids, total / expected - 1, z, _p(z),
        ctot / W.sum(), cz, np.bincount(r.hits[sl].ravel(), minlength=K_MAIN + 1),
    )

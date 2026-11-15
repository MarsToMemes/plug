"""Les modèles « prédictifs ». Chacun donne un score positif par numéro (plus haut = favori).

Le deep learning du plan initial n'est pas implémenté à cette étape : il demanderait PyTorch
et n'apporterait rien de plus pour tester la chaîne (voir README).
"""
import numpy as np

from .data import K_MAIN, N_CHANCE, N_MAIN

EPS = 1e-3


def rank01(scores, rng):
    """Rang normalisé entre 0 et 1, égalités départagées au hasard."""
    order = np.lexsort((rng.random(len(scores)), scores))
    r = np.empty(len(scores))
    r[order] = np.arange(len(scores)) / (len(scores) - 1)
    return r


class Model:
    name = "?"

    def main_scores(self, f, t):
        raise NotImplementedError

    def chance_scores(self, f, t):
        return np.ones(N_CHANCE)


class Uniform(Model):
    """Générateur aléatoire : la référence à battre."""
    name = "Aléatoire"

    def main_scores(self, f, t):
        return np.ones(N_MAIN)


class Hot(Model):
    """Numéros « chauds » : les plus sortis sur les `window` derniers tirages."""

    def __init__(self, window=50):
        self.window, self.name = window, f"Chauds (fenêtre {window})"

    def main_scores(self, f, t):
        return f.freq(t, self.window) + EPS

    def chance_scores(self, f, t):
        return f.cfreq(t, self.window) + EPS


class Cold(Model):
    """Numéros « en retard » : ceux qui ne sont pas sortis depuis longtemps."""
    name = "Froids (retard)"

    def main_scores(self, f, t):
        return f.gap[t].astype(float)


class Bayes(Model):
    """Fréquences lissées (a priori de Dirichlet) avec oubli exponentiel."""

    def __init__(self, halflife=100, alpha=1.0):
        self.halflife, self.alpha = halflife, alpha
        self.name = f"Bayésien (demi-vie {halflife})"

    def main_scores(self, f, t):
        return self.alpha + f.decayed(t, self.halflife)[0]

    def chance_scores(self, f, t):
        return self.alpha + f.decayed(t, self.halflife)[1]


class Pair(Model):
    """Associations : numéros souvent sortis avec ceux du tirage précédent."""
    name = "Associations"

    def main_scores(self, f, t):
        if t == 0:
            return np.ones(N_MAIN)
        prev = f.main[t - 1]
        counts = np.maximum(f.cum[t][prev], 1)[:, None]
        return (f.cooc[t][prev] / counts).sum(0) + EPS

    def chance_scores(self, f, t):
        return f.cfreq(t, 200) + EPS


class Logistic(Model):
    """Machine learning : régression logistique « ce numéro sort-il au prochain tirage ? ».

    Variables : fréquences sur 10/50/200 tirages, retard, présence au tirage précédent.
    Réentraînée tous les `retrain_every` tirages sur les `train_window` derniers.
    """

    def __init__(self, train_window=600, retrain_every=100, iters=150, lr=0.5):
        self.train_window, self.retrain_every = train_window, retrain_every
        self.iters, self.lr = iters, lr
        self.name = "Machine learning (logistique)"
        self.w, self.trained_at = None, None

    @staticmethod
    def _x(f, t):
        base = N_MAIN / K_MAIN
        prev = f.pres[t - 1] if t > 0 else np.zeros(N_MAIN)
        return np.column_stack([
            f.freq(t, 10) * base - 1,
            f.freq(t, 50) * base - 1,
            f.freq(t, 200) * base - 1,
            np.minimum(f.gap[t], 60) / base - 1,
            prev,
            np.ones(N_MAIN),
        ])

    def _fit(self, f, t):
        lo = max(1, t - self.train_window)
        X = np.vstack([self._x(f, s) for s in range(lo, t)])
        y = np.concatenate([f.pres[s] for s in range(lo, t)]).astype(float)
        w = np.zeros(X.shape[1])
        for _ in range(self.iters):
            p = 1 / (1 + np.exp(-X @ w))
            w -= self.lr * X.T @ (p - y) / len(y)
        self.w, self.trained_at = w, t

    def main_scores(self, f, t):
        if self.w is None or t - self.trained_at >= self.retrain_every or t < self.trained_at:
            self._fit(f, t)
        return 1 / (1 + np.exp(-self._x(f, t) @ self.w))

    def chance_scores(self, f, t):
        return f.cfreq(t, 200) + EPS


class Hybrid(Model):
    """Combinaison pondérée des rangs de plusieurs modèles (+ une part de pur hasard)."""

    def __init__(self, components, random_weight, rng, name="Hybride"):
        self.components, self.random_weight, self.rng, self.name = components, random_weight, rng, name

    def _mix(self, parts):
        total = sum(w for _, w in self.components) + self.random_weight
        s = self.random_weight * self.rng.random(len(parts[0]))
        for (_, w), p in zip(self.components, parts):
            s += w * rank01(p, self.rng)
        return s / total + EPS

    def main_scores(self, f, t):
        return self._mix([m.main_scores(f, t) for m, _ in self.components])

    def chance_scores(self, f, t):
        return self._mix([m.chance_scores(f, t) for m, _ in self.components])

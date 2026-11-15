"""Statistiques précalculées sur l'historique.

Convention : tout ce qui est indexé par `t` n'utilise QUE les tirages 0..t-1.
Le modèle qui prédit le tirage t ne voit donc jamais le tirage t (pas de fuite du futur).
"""
import numpy as np

from .data import N_CHANCE, N_MAIN


class Features:
    def __init__(self, main, chance):
        T = len(main)
        self.T, self.main, self.chance = T, main, chance
        self.pres = np.zeros((T, N_MAIN), np.int8)
        self.pres[np.arange(T)[:, None], main] = 1
        self.cpres = np.zeros((T, N_CHANCE), np.int8)
        self.cpres[np.arange(T), chance] = 1

        zeros = lambda n: np.zeros((1, n), np.int32)
        self.cum = np.vstack([zeros(N_MAIN), np.cumsum(self.pres, 0, dtype=np.int32)])
        self.ccum = np.vstack([zeros(N_CHANCE), np.cumsum(self.cpres, 0, dtype=np.int32)])

        last = np.full((T + 1, N_MAIN), -1, np.int32)
        for t in range(T):
            last[t + 1] = last[t]
            last[t + 1, main[t]] = t
        self.gap = np.arange(T + 1)[:, None] - last  # nombre de tirages depuis la dernière sortie

        p = self.pres.astype(np.float32)
        self.cooc = np.zeros((T + 1, N_MAIN, N_MAIN), np.float32)
        np.cumsum(p[:, :, None] * p[:, None, :], axis=0, out=self.cooc[1:])

        self._decay = {}

    def freq(self, t, window):
        lo = max(0, t - window)
        return (self.cum[t] - self.cum[lo]) / max(t - lo, 1)

    def cfreq(self, t, window):
        lo = max(0, t - window)
        return (self.ccum[t] - self.ccum[lo]) / max(t - lo, 1)

    def decayed(self, t, halflife):
        """Comptes avec oubli exponentiel (un tirage vieux de `halflife` pèse moitié moins)."""
        if halflife not in self._decay:
            d = 0.5 ** (1 / halflife)
            m = np.zeros((self.T + 1, N_MAIN))
            c = np.zeros((self.T + 1, N_CHANCE))
            for i in range(self.T):
                m[i + 1] = d * m[i] + self.pres[i]
                c[i + 1] = d * c[i] + self.cpres[i]
            self._decay[halflife] = (m, c)
        m, c = self._decay[halflife]
        return m[t], c[t]

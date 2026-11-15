"""Étape 4 : le hasard des tirages FDJ est-il conforme ? Protocole figé AVANT tout résultat.

Protocole (commité avant la première exécution) :
- Données : les 2 907 tirages 5/49 + Chance de 10/2008 à 11/2026 (fichiers de data/fdj/).
- 10 tests (liste dans lotto/randomness.py), chacun comparé à 2 000 historiques simulés
  parfaitement aléatoires de même longueur. Graine 2024.
- Seuil : p < 0,05 / 10 = 0,005 (Bonferroni pour 10 tests).
- Contrôles positifs, mêmes tests et même seuil :
    1. « Boules biaisées » : 3 numéros (7, 13, 22) ont 30 % de chances en plus.
    2. « Tirages collants » : dans 15 % des tirages sans numéro commun avec le précédent,
       un numéro du tirage précédent est forcé à ressortir.
  Les tests concernés doivent les détecter, sinon un résultat négatif sur les vrais tirages
  ne prouverait rien.

Usage : python3 run_step4.py
"""
import time
from pathlib import Path

import numpy as np

from lotto.data import N_MAIN, simulate
from lotto.fdj import load
from lotto.randomness import TESTS, run_tests

SEED = 2024
N_SIMS = 2000
ALPHA = 0.05 / len(TESTS)


def sticky(n, rng, rate=0.15):
    main, chance = simulate(n, rng)
    main = main.copy()
    for t in range(1, n):
        if rng.random() < rate and not np.intersect1d(main[t], main[t - 1]).size:
            main[t, rng.integers(5)] = rng.choice(main[t - 1])
            main[t].sort()
    return main, chance


def fmt_p(p):
    return ("< 0,0005" if p < 0.001 else f"{p:.3f}".replace(".", ",")) + (" **⚠**" if p < ALPHA else "")


def main():
    t0 = time.time()
    rng = np.random.default_rng(SEED)
    d = load()
    n = len(d)
    w = np.ones(N_MAIN)
    w[[6, 12, 21]] = 1.3
    histories = {
        "FDJ": (d.main, d.chance),
        "Contrôle : boules biaisées": simulate(n, rng, main_weights=w),
        "Contrôle : tirages collants": sticky(n, rng),
    }
    res = run_tests(histories, N_SIMS, rng)

    names = list(histories)
    out = ["# Étape 4 : tests du hasard des tirages FDJ\n",
           f"{n} tirages du {d.dates[0]:%d/%m/%Y} au {d.dates[-1]:%d/%m/%Y}. Chaque test est comparé à "
           f"{N_SIMS} historiques simulés parfaitement aléatoires. Seuil (Bonferroni, {len(TESTS)} tests) : "
           f"p < {ALPHA:.3f}".replace(".", ",") + ". ⚠ = écart significatif.\n",
           "| Test | " + " | ".join(names) + " |",
           "|---|" + "---|" * len(names)]
    for test, (desc, _) in TESTS.items():
        out.append(f"| {desc} | " + " | ".join(fmt_p(res[nm][test][1]) for nm in names) + " |")
    for nm in names:
        k = sum(res[nm][t][1] < ALPHA for t in TESTS)
        out.append(f"\n**{nm} : {k} test(s) sur {len(TESTS)} signalent un écart.**")

    dm = d.main
    overlap = np.mean([np.intersect1d(a, b).size for a, b in zip(dm[1:], dm[:-1])])
    out.append(f"\nRepères FDJ : somme moyenne des 5 numéros {np.mean(dm.sum(1) + 5):.1f} (attendu 125,0) ; "
               f"numéros communs avec le tirage précédent {overlap:.3f} en moyenne (attendu {25 / 49:.3f}) ; "
               f"Chance identique au tirage suivant {np.mean(d.chance[1:] == d.chance[:-1]) * 100:.1f} % (attendu 10 %).\n"
               .replace(".", ",", 1))
    out.append(f"_Calcul : {time.time() - t0:.0f} s._\n")

    text = "\n".join(out)
    (Path(__file__).parent / "results" / "etape4.md").write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()

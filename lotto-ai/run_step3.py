"""Étape 3 : backtest sur les vrais tirages FDJ, protocole figé AVANT tout résultat.

Protocole (commité avant la première exécution) :
- Données : tous les tirages 5/49 + Chance de 10/2008 à 11/2026 (Loto, Super Loto, Grand Loto),
  en ordre chronologique. Le tirage t n'est prédit qu'avec les tirages 0..t-1.
- Modèles et réglages : les 7 de l'expérience A de l'étape 2, sans aucun changement
  (Aléatoire β=1, Chauds 50 β=4, Froids β=2, Bayésien 100 β=4, Associations β=4,
  Logistique β=4, Hybride β=4).
- 300 premiers tirages d'échauffement, 10 grilles par tirage, graine 42.
- Critère principal : bons numéros par grille comparés au hasard (test exact, unilatéral).
- Seuil : p < 0,05 / 7 ≈ 0,0071 (correction de Bonferroni pour 7 modèles).
- Le numéro Chance est un critère secondaire, avec le même seuil.

Usage : python3 run_step3.py
"""
import time
from pathlib import Path

import numpy as np

from lotto import backtest as bt
from lotto.fdj import load
from lotto.features import Features
from run_step2 import WARMUP, base_models, fr, pct, pval, table

SEED = 42
ALPHA = 0.05 / 7


def main():
    t0 = time.time()
    d = load()
    f = Features(d.main, d.chance)
    rng = np.random.default_rng(SEED)
    scores = [bt.evaluate(bt.run(m, f, WARMUP, f.T, rng, beta=beta), f) for m, beta in base_models(rng)]

    out = ["# Étape 3 : backtest sur les vrais tirages FDJ\n",
           f"{len(d)} tirages du {d.dates[0]:%d/%m/%Y} au {d.dates[-1]:%d/%m/%Y}. "
           f"Prédits : {f.T - WARMUP} tirages (à partir du {d.dates[WARMUP]:%d/%m/%Y}), 10 grilles par tirage, graine {SEED}.\n",
           f"Hasard attendu : {fr(bt.EXPECTED_PER_GRID, '.4f')} bon numéro par grille, 10 % pour le Chance. "
           f"Seuil (Bonferroni, 7 modèles) : p < {fr(ALPHA, '.4f')}.\n",
           table(scores) + "\n",
           "| Modèle | z (numéros) | Significatif ? | z (Chance) | Significatif ? |",
           "|---|---|---|---|---|"]
    for s in scores:
        cp = bt._p(s.chance_z)
        out.append(f"| {s.name} | {fr(s.z, '+.2f')} | {'**oui**' if s.p < ALPHA else 'non'} "
                   f"| {fr(s.chance_z, '+.2f')} | {'**oui**' if cp < ALPHA else 'non'} |")
    n_sig = sum(s.p < ALPHA for s in scores)
    out.append(f"\n**Verdict : {n_sig} modèle(s) sur 7 battent le hasard au seuil fixé.**\n")
    out.append(f"_Calcul : {time.time() - t0:.0f} s._\n")

    text = "\n".join(out)
    path = Path(__file__).parent / "results" / "etape3.md"
    path.write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()

"""Étape 2 : faire tourner toute la chaîne sur des tirages synthétiques.

Trois expériences :
  A. Tirages parfaitement aléatoires : chaque modèle bat-il le hasard ?
  B. Piège du surapprentissage : on essaie ~100 réglages sur la période « dev »,
     on garde le meilleur, et on regarde s'il tient sur la période « test ».
  C. Contrôle positif : on truque les tirages (3 boules favorisées). La chaîne doit le détecter,
     sinon un « rien trouvé » en A ne prouverait rien.

Usage : python3 run_step2.py [--draws 4000] [--seed 42]
"""
import argparse
import time
from pathlib import Path

import numpy as np

from lotto import backtest as bt
from lotto.data import N_MAIN, simulate
from lotto.features import Features
from lotto.models import Bayes, Cold, Hot, Hybrid, Logistic, Pair, Uniform

WARMUP = 300
BIASED = [7, 13, 22]       # numéros truqués pour l'expérience C (affichage 1..49)
BIAS_FACTOR = 1.3          # 30 % de chances en plus à chaque boule tirée


def fr(x, fmt):
    return format(x, fmt).replace(".", ",")


def pct(x):
    return fr(x * 100, "+.1f") + " %"


def pval(p):
    return "< 0,0001" if p < 1e-4 else f"{p:.4f}".replace(".", ",")


def table(scores):
    rows = ["| Modèle | Bons n° / grille | Écart au hasard | p-valeur | N° Chance trouvé |",
            "|---|---|---|---|---|"]
    for s in scores:
        rows.append(f"| {s.name} | {fr(s.mean_hits, '.4f')} | {pct(s.lift)} | {pval(s.p)} | {fr(s.chance_rate * 100, '.1f')} % |")
    return "\n".join(rows)


def hybrid(rng, w_bayes=25, w_ml=30, w_pair=15, w_rand=20, beta_name=""):
    return Hybrid([(Bayes(100), w_bayes), (Logistic(), w_ml), (Pair(), w_pair)], w_rand, rng,
                  name=f"Hybride (poids du plan ChatGPT, sans deep learning){beta_name}")


def base_models(rng):
    return [
        (Uniform(), 1.0),
        (Hot(50), 4.0),
        (Cold(), 2.0),
        (Bayes(100), 4.0),
        (Pair(), 4.0),
        (Logistic(), 4.0),
        (hybrid(rng), 4.0),
    ]


def experiment_a(f, rng, out):
    out.append("## A. Tirages parfaitement aléatoires\n")
    out.append(f"{f.T - WARMUP} tirages testés, 10 grilles par tirage. "
               f"Hasard attendu : **{fr(bt.EXPECTED_PER_GRID, '.4f')}** bon numéro par grille et 10 % pour le Chance. "
               "Une p-valeur sous 0,05 voudrait dire « bat le hasard » (mais voir B).\n")
    scores = []
    for m, beta in base_models(rng):
        scores.append(bt.evaluate(bt.run(m, f, WARMUP, f.T, rng, beta=beta), f))
    out.append(table(scores) + "\n")
    tot = sum(s.hist for s in scores[:1])
    out.append(f"Pour info, répartition des grilles du générateur aléatoire (0 à 5 bons numéros) : "
               f"{', '.join(str(int(x)) for x in tot)}.\n")
    return scores


def configs(rng):
    for w in (10, 25, 50, 100, 200, 400):
        for beta in (1, 2, 4, 8):
            yield Hot(w), beta, f"Chauds {w}, β={beta}"
    for beta in (1, 2, 4, 8):
        yield Cold(), beta, f"Froids, β={beta}"
        yield Pair(), beta, f"Associations, β={beta}"
    for h in (10, 30, 100, 300, 1000):
        for beta in (2, 4, 8):
            yield Bayes(h), beta, f"Bayésien {h}, β={beta}"
    for beta in (2, 8):
        yield Logistic(), beta, f"Logistique, β={beta}"
    for i in range(30):
        w = rng.integers(0, 40, size=4)
        beta = int(rng.choice([2, 4, 8]))
        m = Hybrid([(Hot(int(rng.choice([25, 100, 400]))), int(w[0])), (Bayes(100), int(w[1])),
                    (Pair(), int(w[2])), (Cold(), int(w[3]))], 20, rng)
        yield m, beta, f"Hybride {list(map(int, w))}, β={beta}"


def experiment_b(f, rng, out):
    split = WARMUP + (f.T - WARMUP) * 2 // 3
    results = []
    for m, beta, label in configs(rng):
        r = bt.run(m, f, WARMUP, f.T, rng, beta=beta, name=label)
        results.append((bt.evaluate(r, f, WARMUP, split), bt.evaluate(r, f, split, f.T)))
    K = len(results)
    dev_sig = sum(d.p < 0.05 for d, _ in results)
    test_sig = sum(t.p < 0.05 for _, t in results)
    best_dev, best_test = max(results, key=lambda x: x[0].z)
    dl = np.array([d.lift for d, _ in results])
    tl = np.array([t.lift for _, t in results])
    corr = float(np.corrcoef(dl, tl)[0, 1])

    out.append("## B. Le piège du surapprentissage\n")
    out.append(f"{K} réglages testés. Période « dev » : tirages {WARMUP}–{split - 1} ; "
               f"période « test » : tirages {split}–{f.T - 1} (jamais utilisée pour choisir).\n")
    out.append("| | Dev (choix du réglage) | Test (vérification) |\n|---|---|---|")
    out.append(f"| Meilleur réglage : **{best_dev.name}** | {pct(best_dev.lift)}, p = {pval(best_dev.p)} "
               f"| {pct(best_test.lift)}, p = {pval(best_test.p)} |")
    out.append(f"| Réglages « significatifs » (p < 0,05) | {dev_sig} / {K} | {test_sig} / {K} |")
    out.append(f"| Attendu par pur hasard | ≈ {K * 0.05:.0f} / {K} | ≈ {K * 0.05:.0f} / {K} |\n")
    out.append(f"Corrélation entre l'écart en dev et l'écart en test, sur les {K} réglages : **{fr(corr, '+.2f')}** "
               "(proche de 0 = la performance en dev ne dit rien de la suite).\n")
    out.append(f"Seuil honnête quand on essaie {K} réglages (correction de Bonferroni) : "
               f"p < {0.05 / K:.5f}".replace(".", ",") + ".\n")


def experiment_c(seed, n, out):
    rng = np.random.default_rng(seed + 1)
    w = np.ones(N_MAIN)
    w[[b - 1 for b in BIASED]] = BIAS_FACTOR
    f = Features(*simulate(n, rng, main_weights=w))
    out.append("## C. Contrôle positif : tirages truqués\n")
    out.append(f"Les numéros {', '.join(map(str, BIASED))} ont {int((BIAS_FACTOR - 1) * 100)} % de chances en plus "
               "à chaque boule. Une chaîne qui marche doit le voir.\n")
    scores = []
    runs = [(Uniform(), 1.0, None), (Hot(400), 4.0, None), (Bayes(300), 4.0, None), (Cold(), 2.0, None),
            (Logistic(), 4.0, None), (Hot(400), 40.0, "Chauds (fenêtre 400), concentré β=40"),
            (Bayes(300), 40.0, "Bayésien (demi-vie 300), concentré β=40"),
            (Logistic(), 40.0, "Machine learning (logistique), concentré β=40")]
    for m, beta, label in runs:
        scores.append(bt.evaluate(bt.run(m, f, WARMUP, f.T, rng, beta=beta, name=label), f))
    out.append(table(scores) + "\n")
    freq = f.cum[-1] / f.T
    top = np.argsort(-freq)[:5] + 1
    out.append(f"Les 5 numéros les plus sortis dans ces tirages truqués : {', '.join(map(str, top))}.\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--draws", type=int, default=4000)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default=str(Path(__file__).parent / "results" / "etape2.md"))
    a = ap.parse_args()

    t0 = time.time()
    rng = np.random.default_rng(a.seed)
    f = Features(*simulate(a.draws, rng))
    out = [f"# Étape 2 : chaîne complète sur tirages synthétiques\n",
           f"Graine {a.seed}, {a.draws} tirages simulés (5/49 + Chance 1/10).\n"]
    experiment_a(f, rng, out)
    experiment_b(f, rng, out)
    experiment_c(a.seed, a.draws, out)
    out.append(f"_Calcul : {time.time() - t0:.0f} s._\n")

    text = "\n".join(out)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()

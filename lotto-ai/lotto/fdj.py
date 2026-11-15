"""Lecture des CSV FDJ (téléchargés par fetch_fdj.py) en tirages au format du projet."""
import csv
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import numpy as np

DATA = Path(__file__).resolve().parent.parent / "data" / "fdj"
KINDS = {"loto": "Loto", "superloto": "Super Loto", "lotonoel": "Grand Loto", "grandloto": "Grand Loto"}


@dataclass
class Draws:
    dates: list          # datetime.date
    kinds: list          # "Loto", "Super Loto", "Grand Loto"
    main: np.ndarray     # [n, 5] numéros 0..48, triés
    chance: np.ndarray   # [n] 0..9

    def __len__(self):
        return len(self.dates)

    def select(self, mask):
        idx = np.flatnonzero(mask)
        return Draws([self.dates[i] for i in idx], [self.kinds[i] for i in idx], self.main[idx], self.chance[idx])


def _kind(filename):
    stem = filename.removeprefix("nouveau_")
    for prefix, kind in KINDS.items():
        if stem.startswith(prefix):
            return kind
    raise ValueError(filename)


def _date(s):
    d, m, y = s.strip().split("/")
    return date(int(y), int(m), int(d))


def load(folder=DATA):
    rows = {}
    files = sorted(Path(folder).glob("*.csv"))
    if not files:
        raise FileNotFoundError(f"Aucun CSV dans {folder} : lancer d'abord python3 fetch_fdj.py")
    for path in files:
        kind = _kind(path.name)
        with open(path, encoding="latin-1", newline="") as fh:
            for r in csv.DictReader(fh, delimiter=";"):
                balls = sorted(int(r[f"boule_{i}"]) for i in range(1, 6))
                chance = int(r["numero_chance"])
                if len(set(balls)) != 5 or not all(1 <= b <= 49 for b in balls) or not 1 <= chance <= 10:
                    raise ValueError(f"{path.name} : ligne invalide {r['date_de_tirage']}")
                key = (_date(r["date_de_tirage"]), kind)
                if key in rows and rows[key] != (balls, chance):
                    raise ValueError(f"Deux résultats différents pour {key}")
                rows[key] = (balls, chance)
    keys = sorted(rows, key=lambda k: (k[0], k[1]))
    return Draws(
        [k[0] for k in keys], [k[1] for k in keys],
        np.array([rows[k][0] for k in keys]) - 1,
        np.array([rows[k][1] for k in keys]) - 1,
    )

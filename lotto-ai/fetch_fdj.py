"""Télécharge les archives officielles FDJ (format 5/49 + Chance, depuis octobre 2008).

Liens relevés sur https://www.fdj.fr/jeux-de-tirage/loto/historique (novembre 2026).
Les CSV extraits vont dans data/fdj/. Usage : python3 fetch_fdj.py
"""
import io
import urllib.request
import zipfile
from pathlib import Path

BASE = "https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66af"
FILES = {
    "nouveau_loto": "m6",        # Loto 10/2008 → 03/2017
    "loto2017": "n6",            # Loto 03/2017 → 02/2019
    "loto_201902": "o6",         # Loto 02/2019 → 11/2019
    "loto_201911": "p6",         # Loto 11/2019 → aujourd'hui
    "nouveau_superloto": "i6",   # Super Loto 02/2009 → 01/2017
    "superloto2017": "j6",       # Super Loto 10/2017 → 09/2018
    "superloto_201907": "k6",    # Super Loto 07/2019 → aujourd'hui
    "lotonoel2017": "f6",        # Grand Loto 12/2017 → 12/2018
    "grandloto_201912": "g6",    # Grand Loto 12/2019 → aujourd'hui
}
OUT = Path(__file__).parent / "data" / "fdj"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, suffix in FILES.items():
        req = urllib.request.Request(BASE + suffix, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            csvs = [n for n in z.namelist() if n.lower().endswith(".csv")]
            if len(csvs) != 1:
                raise RuntimeError(f"{name} : {len(csvs)} CSV dans l'archive")
            (OUT / f"{name}.csv").write_bytes(z.read(csvs[0]))  # nom imposé : pas de chemin venu de l'archive
        print(f"{name}: {len(data) // 1024} ko")


if __name__ == "__main__":
    main()

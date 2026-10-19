"""Pavage de vitrail (cellules de Voronoï) pour remplir le mot club, façon verrières de la cathédrale de Metz.

Usage : python tools/vitrail.py src/vitrail-cells.json
Sortie : liste de polygones (coordonnées dans une boîte 1000 × 300, à placer sur le mot) + teinte par cellule.
Déterministe (graine fixe).
"""
import json
import sys

import numpy as np
from scipy.spatial import Voronoi

W, H = 1000, 300
rng = np.random.default_rng(1332)

# points un peu plus serrés vers le haut (là où la lumière tombe), ~75 cellules
pts = np.column_stack([rng.uniform(0, W, 75), rng.uniform(0, H, 75) ** 1.0])
# miroirs autour de la boîte pour que toutes les cellules utiles soient fermées
mirrored = np.vstack([pts, pts * [-1, 1], pts * [1, -1] + [0, 0], [2 * W, 0] + pts * [-1, 1], [0, 2 * H] + pts * [1, -1]])
vor = Voronoi(mirrored)

SHADES = ['#9B1C2C', '#B5263A', '#74070B', '#C43A50', '#8A1530', '#A51F33']
cells = []
for i in range(len(pts)):
    region = vor.regions[vor.point_region[i]]
    if -1 in region or not region:
        continue
    poly = np.clip(vor.vertices[region], [0, 0], [W, H])
    cells.append({
        'd': 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in poly) + ' Z',
        'fill': SHADES[int(rng.integers(len(SHADES)))],
    })

with open(sys.argv[1] if len(sys.argv) > 1 else 'src/vitrail-cells.json', 'w') as f:
    json.dump(cells, f)
print(len(cells), 'cellules')

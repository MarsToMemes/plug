"""Texture « grenat taillé » (gemme facettée) calculée pixel par pixel, pour remplir le mot club.

Usage : python tools/gemme.py public/matieres/grenat-gemme.png [largeur] [hauteur] [graine] [px² par facette]
Modèle simple mais physique : facettes planes (Voronoï) d'orientations aléatoires, reflets d'un
environnement de studio (Fresnel de Schlick, n≈1,8 pour un grenat), lumière transmise teintée par
absorption (Beer-Lambert), deux reflets spéculaires nets, arêtes qui accrochent la lumière.
"""
import sys

import numpy as np
from PIL import Image

out = sys.argv[1] if len(sys.argv) > 1 else 'public/matieres/grenat-gemme.png'
W = int(sys.argv[2]) if len(sys.argv) > 2 else 2600
H = int(sys.argv[3]) if len(sys.argv) > 3 else 800
rng = np.random.default_rng(int(sys.argv[4]) if len(sys.argv) > 4 else 1919)

# --- facettes triangulaires (taille de pierre) -------------------------------------------
from scipy.spatial import Delaunay

DENSITY = float(sys.argv[5]) if len(sys.argv) > 5 else 14000  # px² par point : plus grand = facettes plus grandes
n_seeds = int(W * H / DENSITY)
seeds = np.vstack([
    np.column_stack([rng.uniform(0, W, n_seeds), rng.uniform(0, H, n_seeds)]),
    [[0, 0], [W, 0], [0, H], [W, H]],
    np.column_stack([np.linspace(0, W, 12), np.zeros(12)]), np.column_stack([np.linspace(0, W, 12), np.full(12, H)]),
])
tri = Delaunay(seeds)
yy, xx = np.mgrid[0:H, 0:W]
pix = np.column_stack([xx.ravel(), yy.ravel()]).astype(np.float64)
simplex = tri.find_simplex(pix)
simplex[simplex < 0] = 0
label = simplex.reshape(H, W)
n_tri = len(tri.simplices)

# distance à l'arête la plus proche via les coordonnées barycentriques
T_ = tri.transform[simplex]
b = np.einsum('ijk,ik->ij', T_[:, :2, :], pix - T_[:, 2, :])
bary = np.column_stack([b, 1 - b.sum(1)])
edge = (bary.min(1) * 60).reshape(H, W)  # ~ px depuis l'arête

centroid = seeds[tri.simplices].mean(1)
tilt = rng.normal(0, 0.42, (n_tri, 2))
cx, cy = centroid[:, 0] / W - 0.5, centroid[:, 1] / H - 0.5
tilt[:, 0] += cx * 0.5
tilt[:, 1] += cy * 0.8
nrm = np.column_stack([tilt, np.ones(n_tri)])
nrm /= np.linalg.norm(nrm, axis=1, keepdims=True)
N = nrm[label]

# reflets internes : gradient de lumière à l'intérieur de chaque facette, direction aléatoire
gdir = rng.normal(0, 1, (n_tri, 2))
gdir /= np.linalg.norm(gdir, axis=1, keepdims=True)
tv = seeds[tri.simplices]
e1, e2 = tv[:, 1] - tv[:, 0], tv[:, 2] - tv[:, 0]
size = np.sqrt(np.abs(e1[:, 0] * e2[:, 1] - e1[:, 1] * e2[:, 0]) / 2) + 1
rel = (pix - centroid[simplex]) / size[simplex, None]
inner = np.clip(0.5 + (rel * gdir[simplex]).sum(1) * 0.9, 0, 1).reshape(H, W)
glow = rng.uniform(0.2, 1.0, n_tri)[label]  # certaines facettes « s'allument »

V = np.array([0, 0, 1.0])


def normalize(v):
    return v / np.linalg.norm(v)


def env(d):
    """Studio sombre : boîte à lumière en haut à gauche, fine bande claire à droite."""
    x, y = d[..., 0], d[..., 1]
    softbox = np.exp(-(((x + 0.42) / 0.22) ** 2 + ((y + 0.5) / 0.18) ** 2)) * 1.6
    strip = np.exp(-(((x - 0.6) / 0.05) ** 2)) * np.clip(-y + 0.5, 0, 1) * 1.0
    return softbox + strip + 0.02


ndv = np.clip(N[..., 2], 0, 1)
R = 2 * ndv[..., None] * N - V
F0 = ((1.8 - 1) / (1.8 + 1)) ** 2
fres = F0 + (1 - F0) * (1 - ndv) ** 5
refl = env(R)

# lumière transmise teintée grenat : plus la facette « s'allume », plus la pierre traversée est fine
light_in = (0.15 + 1.6 * inner * glow) ** 1.4
depth = 1.9 - 1.2 * inner * glow
absorb = np.array([0.35, 3.6, 3.0])
body = np.exp(-absorb * depth[..., None]) * light_in[..., None]

# le reflet de l'environnement repasse en partie dans la pierre : on le teinte grenat, seul le spéculaire reste blanc
col = body * (1 - fres[..., None]) + refl[..., None] * fres[..., None] * np.array([1.0, 0.42, 0.45])

# reflets spéculaires nets
for L, power, gain in ((normalize(np.array([-0.5, -0.6, 0.62])), 900, 3.0), (normalize(np.array([0.72, -0.25, 0.64])), 1400, 1.6)):
    Hh = normalize(L + V)
    spec = np.clip((N * Hh).sum(-1), 0, 1) ** power
    col += spec[..., None] * gain * np.array([1.0, 0.97, 0.95])

# arêtes : fin liseré lumineux d'un côté, ombre de l'autre (la taille accroche la lumière)
key = (N * normalize(np.array([-0.5, -0.6, 0.62]))).sum(-1)
line = np.exp(-(edge / 1.2) ** 2)
col += line[..., None] * np.clip(key - 0.75, 0, 1)[..., None] * np.array([2.2, 1.0, 0.95])
col *= (1 - 0.6 * line * np.clip(0.85 - key, 0, 1))[..., None]

# étincelles ponctuelles
for _ in range(int(n_tri * 0.03)):
    x, y = rng.integers(0, W), rng.integers(0, H)
    r = rng.uniform(1.2, 2.8)
    d2 = (xx - x) ** 2 + (yy - y) ** 2
    col += (np.exp(-d2 / (2 * r * r)) * 2.0)[..., None]

# tonemapping filmique doux puis sRGB
col = col / (1 + col * 0.55)
col = np.clip(col, 0, 1) ** (1 / 2.2)
Image.fromarray((col * 255).astype(np.uint8)).save(out)
print('ok', out, W, H, n_tri, 'facettes')

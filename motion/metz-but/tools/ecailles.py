"""Texture « écailles du Graoully » calculée pixel par pixel (originale, aucune image source).

Usage : python tools/ecailles.py public/matieres/ecailles-graoully.png [largeur] [hauteur] [graine]
Écailles arrondies posées en tuiles (chaque rangée recouvre celle du dessous), relief bombé,
cuir craquelé (réseau de Voronoï fin), patine grenat sur base charbon, ombre portée des écailles
du dessus, lumière rasante et léger brillant.
"""
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, zoom
from scipy.spatial import cKDTree

out = sys.argv[1] if len(sys.argv) > 1 else 'public/matieres/ecailles-graoully.png'
W = int(sys.argv[2]) if len(sys.argv) > 2 else 3000
H = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
rng = np.random.default_rng(int(sys.argv[4]) if len(sys.argv) > 4 else 1552)

SW, SH = 190.0, 250.0  # taille d'une écaille (px), ovale plus haute que large
ROW = SH * 0.42         # pas vertical entre rangées (fort recouvrement)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

label = np.full((H, W), -1, np.int32)
dome = np.zeros((H, W), np.float32)
zmap = np.full((H, W), -1.0, np.float32)
edge_d = np.full((H, W), 1.0, np.float32)

scales = []
rows = int(H / ROW) + 3
# des rangées du bas vers le haut : chaque rangée plus haute recouvre la précédente
for r in range(rows - 1, -2, -1):
    cy = r * ROW
    off = (SW / 2) * (r % 2)
    for c in range(-1, int(W / SW) + 2):
        cx = c * SW + off + rng.uniform(-6, 6)
        a = SW * 0.55 * rng.uniform(0.97, 1.03)
        b = SH * 0.52 * rng.uniform(0.97, 1.03)
        x0, x1 = int(max(0, cx - a - 2)), int(min(W, cx + a + 2))
        y0, y1 = int(max(0, cy - b - 2)), int(min(H, cy + b + 2))
        if x0 >= x1 or y0 >= y1:
            continue
        dx = (xx[y0:y1, x0:x1] - cx) / a
        dy = (yy[y0:y1, x0:x1] - cy) / b
        # bas arrondi, haut légèrement pincé (forme de goutte)
        rr = dx ** 2 * (1 + 0.25 * np.clip(-dy, 0, 1)) + dy ** 2
        m = rr < 1
        idx = len(scales)
        scales.append((cx, cy, a, b))
        label[y0:y1, x0:x1][m] = idx
        d = np.sqrt(np.clip(1 - rr, 0, 1)) ** 0.7
        # plaque bombée et relevée vers le bas (le bord libre se soulève)
        dome[y0:y1, x0:x1][m] = (d * (0.55 + 0.45 * np.clip((dy + 1) / 2, 0, 1)))[m]
        zmap[y0:y1, x0:x1][m] = -r
        edge_d[y0:y1, x0:x1][m] = (1 - np.sqrt(rr))[m]

n = len(scales)
print(n, 'écailles')

def noise(scale, seed):
    g = np.random.default_rng(seed)
    small = g.standard_normal((int(H / scale) + 4, int(W / scale) + 4))
    big = zoom(small, scale, order=3)[:H, :W]
    return (big - big.mean()) / (big.std() + 1e-6)


def ridges(scale, seed):
    """Rides de cuir : creux là où le bruit passe par zéro."""
    return np.exp(-(noise(scale, seed) / 0.22) ** 2)


# cuir : rides fines et organiques à deux échelles + quelques grandes plaques à peine marquées
def plates(spacing, seed):
    g = np.random.default_rng(seed)
    k = int(W * H / spacing ** 2)
    pts = np.column_stack([g.uniform(0, W, k), g.uniform(0, H, k)])
    pix = np.column_stack([xx.ravel(), yy.ravel()])
    dist, _ = cKDTree(pts).query(pix, k=2, workers=-1)
    e = (dist[:, 1] - dist[:, 0]).reshape(H, W)
    return np.exp(-(e / 1.2) ** 2)


wrinkle = 0.45 * ridges(6, 21) + 0.4 * ridges(14, 22) + 0.3 * plates(34, 23)
grain = noise(1.6, 7) * 0.6 + noise(3.5, 8) * 0.4

height = dome * 70.0 - wrinkle * 1.4 + grain * 0.3
height += np.exp(-(edge_d / 0.03) ** 2) * 3.0  # bourrelet du bord libre

gy, gx = np.gradient(gaussian_filter(height, 0.9))
N = np.dstack([-gx, -gy, np.ones_like(gx) * 1.0])
N /= np.linalg.norm(N, axis=2, keepdims=True)

L = np.array([-0.6, -0.68, 0.42]); L /= np.linalg.norm(L)
V = np.array([0, 0, 1.0])
Hh = (L + V) / np.linalg.norm(L + V)
diff = np.clip((N * L).sum(2), 0, 1)
spec = np.clip((N * Hh).sum(2), 0, 1) ** 26
fill = np.clip((N * np.array([0.5, 0.2, 0.84])).sum(2), 0, 1) ** 2  # lumière d'appoint douce

# ombre portée par les écailles du dessus + creux sombre entre les écailles
sx, sy = 16, 28
zs = np.full_like(zmap, -1e9)
zs[sy:, sx:] = zmap[:-sy, :-sx]
shadow = gaussian_filter(((zs > zmap) & (label >= 0)).astype(np.float32), 9)
ao = (1 - 0.95 * shadow) * (0.15 + 0.85 * np.clip(edge_d * 7, 0, 1) ** 0.6)

# patine grenat usée : couvre les reliefs, s'efface dans les creux et sur certaines écailles
per_scale = rng.uniform(-1.0, 1.0, n + 1)[label]
patches = noise(70, 11) * 0.7 + noise(18, 12) * 0.5 + noise(4, 13) * 0.35
raised = np.clip(dome * 1.4, 0, 1)
patches = noise(120, 11) * 0.45 + noise(22, 12) * 0.4 + noise(4, 13) * 0.3
t = 0.1 + 0.85 * per_scale + patches * 0.45 + 0.25 * raised - wrinkle * 0.6
red_amt = np.clip((t - 0.1) / 0.5, 0, 1)
red_amt = red_amt * red_amt * (3 - 2 * red_amt)  # transition nette, effet peinture usée
charcoal = np.array([0.032, 0.031, 0.036])
grenat = np.array([0.58, 0.022, 0.045])
albedo = charcoal * (1 - red_amt[..., None]) + grenat * red_amt[..., None]
albedo *= (1 - 0.45 * wrinkle)[..., None]

col = albedo * (0.03 + 1.9 * diff[..., None] ** 1.3 + 0.2 * fill[..., None]) * ao[..., None]
col += (spec * 0.38 * (0.35 + 0.65 * (1 - red_amt)) * ao)[..., None] * np.array([0.85, 0.86, 0.95])
col[label < 0] = 0.005

col = col / (1 + col * 0.3)
col = np.clip(col, 0, 1) ** (1 / 2.2)
Image.fromarray((col * 255).astype(np.uint8)).save(out)
print('ok', out, W, H)

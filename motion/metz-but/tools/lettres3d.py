"""Mot club sculpté en relief, recouvert d'écailles du Graoully (rendu calculé, image RGBA).

Usage : python tools/lettres3d.py public/matieres/metz-ecailles-3d.png METZ [graine]
Les lettres sont des objets : biseau irrégulier (bords ébréchés), épaisseur visible, écailles qui
suivent la surface et passent sur les arêtes, une seule lumière pour tout, ombre portée. Pas de halo
ni de contour : l'image se pose telle quelle sur le fond de la vidéo.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates, zoom
from scipy.spatial import cKDTree

out = sys.argv[1] if len(sys.argv) > 1 else 'public/matieres/metz-ecailles-3d.png'
WORD = sys.argv[2] if len(sys.argv) > 2 else 'METZ'
rng = np.random.default_rng(int(sys.argv[3]) if len(sys.argv) > 3 else 1552)
FONT = Path(__file__).resolve().parent.parent / 'public/fonts/Unbounded-Black.ttf'

# --- silhouette des lettres (×2 pour la netteté), penchée de 12° comme dans la vidéo ---------
FS = 600
font = ImageFont.truetype(str(FONT), FS)
x0, y0, x1, y1 = font.getbbox(WORD)
PAD = 140
W, H = int(x1 - x0 + 2 * PAD + 0.22 * (y1 - y0)), int(y1 - y0 + 2 * PAD)
img = Image.new('L', (W, H), 0)
ImageDraw.Draw(img).text((PAD - x0 + 0.11 * (y1 - y0), PAD - y0), WORD, font=font, fill=255)
shear = np.tan(np.radians(12))
img = img.transform(img.size, Image.AFFINE, (1, shear, -shear * H / 2, 0, 1, 0), resample=Image.BICUBIC)
mask = np.asarray(img, np.float32) / 255
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
print('canvas', W, H)


def noise(scale, seed):
    g = np.random.default_rng(seed)
    small = g.standard_normal((int(H / scale) + 4, int(W / scale) + 4))
    big = zoom(small, scale, order=3)[:H, :W]
    return (big - big.mean()) / (big.std() + 1e-6)


# bords ébréchés : on ronge la silhouette avec du bruit près du contour
inside = distance_transform_edt(mask > 0.5)
chip = noise(9, 31) * 0.6 + noise(3, 32) * 0.4
solid = ((inside > 0) & ((inside + chip * 2.2) > 2.0)).astype(np.float32)  # on ne fait que retirer de la matière
solid = gaussian_filter(solid, 0.7)
dist = distance_transform_edt(solid > 0.5)

# --- écailles en tuiles sur toute la surface -----------------------------------------------
SW, SH = 70.0, 92.0  # écailles fines : plus nombreuses dans chaque lettre, meilleure lisibilité
ROW = SH * 0.42
label = np.full((H, W), -1, np.int32)
dome = np.zeros((H, W), np.float32)
zmap = np.full((H, W), -1.0, np.float32)
edge_d = np.ones((H, W), np.float32)
n = 0
for r in range(int(H / ROW) + 3, -2, -1):
    cy = r * ROW
    off = (SW / 2) * (r % 2)
    for c in range(-1, int(W / SW) + 2):
        cx = c * SW + off + rng.uniform(-4, 4)
        a, b = SW * 0.55 * rng.uniform(0.97, 1.03), SH * 0.52 * rng.uniform(0.97, 1.03)
        ax0, ax1 = int(max(0, cx - a - 2)), int(min(W, cx + a + 2))
        ay0, ay1 = int(max(0, cy - b - 2)), int(min(H, cy + b + 2))
        if ax0 >= ax1 or ay0 >= ay1:
            continue
        dx = (xx[ay0:ay1, ax0:ax1] - cx) / a
        dy = (yy[ay0:ay1, ax0:ax1] - cy) / b
        rr = dx ** 2 * (1 + 0.25 * np.clip(-dy, 0, 1)) + dy ** 2
        m = rr < 1
        label[ay0:ay1, ax0:ax1][m] = n
        d = np.sqrt(np.clip(1 - rr, 0, 1)) ** 0.7
        dome[ay0:ay1, ax0:ax1][m] = (d * (0.55 + 0.45 * np.clip((dy + 1) / 2, 0, 1)))[m]
        zmap[ay0:ay1, ax0:ax1][m] = -r
        edge_d[ay0:ay1, ax0:ax1][m] = (1 - np.sqrt(rr))[m]
        n += 1


def ridges(scale, seed):
    return np.exp(-(noise(scale, seed) / 0.22) ** 2)


def plates(spacing, seed):
    g = np.random.default_rng(seed)
    k = int(W * H / spacing ** 2)
    pts = np.column_stack([g.uniform(0, W, k), g.uniform(0, H, k)])
    dd, _ = cKDTree(pts).query(np.column_stack([xx.ravel(), yy.ravel()]), k=2, workers=-1)
    return np.exp(-(((dd[:, 1] - dd[:, 0]).reshape(H, W)) / 1.1) ** 2)


wrinkle = 0.4 * ridges(3.2, 21) + 0.35 * ridges(7, 22) + 0.3 * plates(15, 23)
grain = noise(1.4, 7) * 0.6 + noise(3, 8) * 0.4

# --- relief total : biseau de la lettre + écailles + cuir --------------------------------------
BEVEL = 34.0
bevel = np.clip(dist / BEVEL, 0, 1)
bevel = 1 - (1 - bevel) ** 2.2  # arrondi rapide puis plateau
# écailles peu bombées (plaque plate au centre, bord net) : moins « gonflé »
plate = np.clip(dome, 0, 1) ** 0.45
height = bevel * 55.0 + plate * 13.0 * (0.35 + 0.65 * bevel) - wrinkle * 1.0 + grain * 0.25
height += np.exp(-(edge_d / 0.05) ** 2) * 1.6 * bevel
height *= solid

gy, gx = np.gradient(gaussian_filter(height, 0.8))
N = np.dstack([-gx, -gy, np.ones_like(gx)])
N /= np.linalg.norm(N, axis=2, keepdims=True)
L = np.array([-0.58, -0.66, 0.48]); L /= np.linalg.norm(L)
V = np.array([0, 0, 1.0])
Hh = (L + V) / np.linalg.norm(L + V)
diff = np.clip((N * L).sum(2), 0, 1)
spec = np.clip((N * Hh).sum(2), 0, 1) ** 26
fill = np.clip((N * np.array([0.5, 0.2, 0.84])).sum(2), 0, 1) ** 2

sx, sy = 6, 11
zs = np.full_like(zmap, -1e9)
zs[sy:, sx:] = zmap[:-sy, :-sx]
shadow = gaussian_filter(((zs > zmap) & (label >= 0)).astype(np.float32), 5)
ao = (1 - 0.9 * shadow) * (0.2 + 0.8 * np.clip(edge_d * 7, 0, 1) ** 0.6)
ao *= 0.55 + 0.45 * bevel  # les bords de la lettre reçoivent moins de lumière ambiante

# couleur : toutes les écailles en grenat (nuances par écaille), patine noire qui s'accumule dans les creux :
# sous le bord des écailles du dessus, dans les rides du cuir, et en quelques zones usées
shade_k = rng.uniform(0.75, 1.15, n + 1)[label]
patches = noise(110, 11) * 0.5 + noise(20, 12) * 0.35 + noise(3, 13) * 0.25
crevice = np.clip(1 - edge_d * 5, 0, 1) ** 1.5
black = np.clip(0.95 * shadow + 0.65 * crevice + 0.8 * wrinkle + 0.38 * patches - 0.05, 0, 1)
black = black * black * (3 - 2 * black)
red = 1 - black
charcoal = np.array([0.028, 0.026, 0.03])
grenat = np.array([0.33, 0.012, 0.03])
albedo = charcoal * black[..., None] + grenat * (red * shade_k)[..., None]
front = albedo * (0.05 + 1.85 * diff[..., None] ** 1.2 + 0.25 * fill[..., None]) * ao[..., None]
# cuir légèrement ciré : brillant discret, un peu plus marqué sur la patine noire
front += (spec * 0.3 * (0.45 + 0.55 * black) * ao)[..., None] * np.array([0.9, 0.88, 0.92])

# --- épaisseur : flanc visible en bas à droite (extrusion), teinte sombre et lisse -----------
DEPTH = 22
smooth = gaussian_filter(solid, 1.2)
side = np.zeros((H, W), np.float32)
side_col = np.zeros((H, W, 3), np.float32)
tone = gaussian_filter(red, 6)  # le flanc garde la couleur dominante de l'écaille au-dessus, sans détail
for k in range(1, DEPTH + 1):
    dxk, dyk = k * 0.45, k * 1.0
    shifted = map_coordinates(smooth, [yy - dyk, xx - dxk], order=1)
    take = (shifted > 0.5) & (side < 0.5) & (solid < 0.5)
    side[take] = 1
    t_k = map_coordinates(tone, [yy - dyk, xx - dxk], order=1)
    base = charcoal * (1 - t_k[..., None]) + grenat * t_k[..., None]
    shade = 0.075 - 0.05 * (k / DEPTH)  # flanc dans l ombre, plus sombre en s éloignant de l arête
    side_col[take] = (base * shade)[take]
side = gaussian_filter(side, 0.6)

alpha_obj = np.maximum(solid, side)
col = np.where(solid[..., None] > 0.5, front, side_col)
col = np.where((solid[..., None] > 0.5) | (side[..., None] > 0.01), col, 0)
col = col * alpha_obj[..., None]

# --- ombre portée sur le décor (douce, décalée vers le bas à droite) ----------------------------
sh = map_coordinates(alpha_obj, [yy - 46, xx - 28], order=1)
sh = gaussian_filter(sh, 18) * 0.85
alpha = alpha_obj + sh * (1 - alpha_obj)

col = col / (1 + col * 0.3)
col = np.clip(col, 0, 1) ** (1 / 2.2)
# couleur prémultipliée → droite pour le PNG
rgb = np.where(alpha[..., None] > 1e-3, col * alpha_obj[..., None] / np.maximum(alpha[..., None], 1e-3), 0)
rgba = np.dstack([np.clip(rgb, 0, 1), np.clip(alpha, 0, 1)])
Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').save(out)
print('ok', out, W, H, n, 'écailles')

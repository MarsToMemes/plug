"""Mot club en vitrail : verre grenat serti dans des plombs en relief, rendu calculé (image RGBA).

Usage : python tools/vitrail3d.py public/matieres/metz-vitrail-3d-1.png METZ [graine]
Comme tools/lettres3d.py, la lettre est un objet : cadre en plomb biseauté sur tout le contour, plombs
en relief entre les pièces de verre, verre éclairé par derrière (couleur par pièce, stries, bulles,
épaisseur plus sombre près des plombs), reflets sur le verre et le plomb avec une seule lumière,
flanc et ombre portée. Aucun halo ni contour ajouté. Pavage original (Voronoï), aucune image source.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates, zoom
from scipy.spatial import cKDTree

out = sys.argv[1] if len(sys.argv) > 1 else 'public/matieres/metz-vitrail-3d-1.png'
WORD = sys.argv[2] if len(sys.argv) > 2 else 'METZ'
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1220
rng = np.random.default_rng(seed)
FONT = Path(__file__).resolve().parent.parent / 'public/fonts/Unbounded-Black.ttf'

# --- silhouette (même mise en page que lettres3d.py pour pouvoir échanger les images) ---------
FS = 600
font = ImageFont.truetype(str(FONT), FS)
x0, y0, x1, y1 = font.getbbox(WORD)
PAD = 140
W, H = int(x1 - x0 + 2 * PAD + 0.22 * (y1 - y0)), int(y1 - y0 + 2 * PAD)
img = Image.new('L', (W, H), 0)
ImageDraw.Draw(img).text((PAD - x0 + 0.11 * (y1 - y0), PAD - y0), WORD, font=font, fill=255)
shear = np.tan(np.radians(12))
img = img.transform(img.size, Image.AFFINE, (1, shear, -shear * H / 2, 0, 1, 0), resample=Image.BICUBIC)
solid = gaussian_filter((np.asarray(img, np.float32) / 255 > 0.5).astype(np.float32), 0.7)
dist = distance_transform_edt(solid > 0.5)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)


def noise(scale, s, sx=None):
    g = np.random.default_rng(s)
    sy_, sx_ = scale, sx or scale
    small = g.standard_normal((int(H / sy_) + 4, int(W / sx_) + 4))
    big = zoom(small, (sy_, sx_), order=3)[:H, :W]
    return (big - big.mean()) / (big.std() + 1e-6)


# --- pièces de verre (Voronoï, plus petites près des bords comme un vrai vitrail) -------------
k = int(W * H / 95 ** 2)
pts = np.column_stack([rng.uniform(0, W, k), rng.uniform(0, H, k)])
pix = np.column_stack([xx.ravel(), yy.ravel()])
dd, ii = cKDTree(pts).query(pix, k=2, workers=-1)
cell = ii[:, 0].reshape(H, W)
gap = ((dd[:, 1] - dd[:, 0]) / 2).reshape(H, W)  # distance au plomb le plus proche

FRAME = 15.0  # largeur du cadre en plomb sur le contour des lettres
LEAD = 4.2    # demi-largeur d'un plomb intérieur
lead_d = np.minimum(gap, np.maximum(dist - FRAME, 0))  # distance au plomb (intérieur ou cadre)
is_frame = dist < FRAME
is_lead = (gap < LEAD) | is_frame
glass = (~is_lead) & (solid > 0.5)

# --- relief : plombs bombés, cadre biseauté, verre légèrement ondulé --------------------------
lead_profile = np.sqrt(np.clip(1 - (gap / LEAD) ** 2, 0, 1)) * 6.0
frame_profile = np.clip(dist / FRAME, 0, 1)
frame_profile = np.sin(frame_profile * np.pi) ** 0.8 * 10.0 + np.clip(dist / 6, 0, 1) * 4.0
height = np.where(is_frame, frame_profile, np.where(gap < LEAD, 4.0 + lead_profile, 2.5))
glass_wave = noise(40, 41) * 0.6 + noise(12, 42) * 0.25
height = height + np.where(glass, glass_wave, 0)
height = gaussian_filter(height * solid, 0.8)

gy, gx = np.gradient(height)
N = np.dstack([-gx, -gy, np.ones_like(gx)])
N /= np.linalg.norm(N, axis=2, keepdims=True)
L = np.array([-0.58, -0.66, 0.48]); L /= np.linalg.norm(L)
V = np.array([0, 0, 1.0])
Hh = (L + V) / np.linalg.norm(L + V)
diff = np.clip((N * L).sum(2), 0, 1)
spec = np.clip((N * Hh).sum(2), 0, 1)

# --- couleur du verre : nuances de grenat, quelques pièces ambre/or très rares ----------------
PALETTE = np.array([
    [0.60, 0.010, 0.030], [0.42, 0.004, 0.022], [0.78, 0.030, 0.040], [0.30, 0.003, 0.018],
    [0.55, 0.008, 0.060], [0.50, 0.012, 0.012], [0.88, 0.060, 0.050],
])
AMBER = np.array([0.80, 0.36, 0.03])
pick = rng.integers(0, len(PALETTE), k)
tint = PALETTE[pick]
amber = rng.random(k) < 0.03
tint[amber] = AMBER
tint *= rng.uniform(0.85, 1.15, (k, 1))
gcol = tint[cell]

# lumière qui traverse : plus forte au centre du mot et en haut à gauche, variable par pièce
back = np.clip(0.75 + 0.3 * noise(160, 51) + 0.18 * rng.uniform(-1, 1, k)[cell], 0.3, None)
back *= 0.85 + 0.3 * np.exp(-(((xx - W * 0.35) / (W * 0.45)) ** 2 + ((yy - H * 0.35) / (H * 0.7)) ** 2))
# stries du verre soufflé (orientation propre à chaque pièce) + bulles
ang = rng.uniform(0, np.pi, k)[cell]
u = xx * np.cos(ang) + yy * np.sin(ang)
streak = 0.5 + 0.5 * np.sin(u / 3.1 + noise(30, 52) * 2.0)
streak = 0.88 + 0.12 * streak + 0.06 * noise(2.2, 53)
bub_n = int(W * H / 2600)
bpts = np.column_stack([rng.uniform(0, W, bub_n), rng.uniform(0, H, bub_n)])
bd, _ = cKDTree(bpts).query(pix, k=1, workers=-1)
br = rng.uniform(1.0, 3.2, bub_n)[_ if False else cKDTree(bpts).query(pix, k=1, workers=-1)[1]].reshape(H, W)
bd = bd.reshape(H, W)
bubble_rim = np.exp(-((bd - br) / 0.7) ** 2) * 0.35
bubble_core = np.exp(-(bd / (br * 0.6)) ** 2) * 0.15
# épaisseur : le verre s'assombrit et sature près des plombs
edge_dark = 0.55 + 0.45 * np.clip(lead_d / 14, 0, 1) ** 0.7

trans = gcol * (back * streak * edge_dark)[..., None]
trans = trans * (1 - bubble_rim[..., None]) + (bubble_core[..., None] * gcol * 1.6)
glass_col = trans * 1.5 + (spec ** 160)[..., None] * 0.45

# --- plomb : gris anthracite patiné, mat avec brillant doux ----------------------------------
patina = 0.9 + 0.1 * noise(3, 61)
lead_base = np.array([0.040, 0.038, 0.038]) * patina[..., None]
lead_col = lead_base * (0.2 + 1.7 * diff[..., None]) + (spec ** 45 * 0.22)[..., None] * np.array([0.9, 0.92, 1.0])
lead_col *= (0.6 + 0.4 * np.clip(gaussian_filter(dist, 2) / 4, 0, 1))[..., None]

front = np.where(glass[..., None], glass_col, lead_col)

# --- épaisseur (flanc du cadre en plomb) et ombre portée ------------------------------------
DEPTH = 22
smooth = gaussian_filter(solid, 1.2)
side = np.zeros((H, W), np.float32)
side_col = np.zeros((H, W, 3), np.float32)
for kk in range(1, DEPTH + 1):
    shifted = map_coordinates(smooth, [yy - kk * 1.0, xx - kk * 0.45], order=1)
    take = (shifted > 0.5) & (side < 0.5) & (solid < 0.5)
    side[take] = 1
    side_col[take] = np.array([0.035, 0.033, 0.033]) * (1.1 - 0.6 * kk / DEPTH)
side = gaussian_filter(side, 0.6)

alpha_obj = np.maximum(solid, side)
col = np.where(solid[..., None] > 0.5, front, side_col)
col = np.where((solid[..., None] > 0.5) | (side[..., None] > 0.01), col, 0)
sh = gaussian_filter(map_coordinates(alpha_obj, [yy - 46, xx - 28], order=1), 18) * 0.85
alpha = alpha_obj + sh * (1 - alpha_obj)

col = np.clip(col, 0, None)
col = col / (1 + col * 0.18)
col = np.clip(col, 0, 1) ** (1 / 2.2)
rgb = np.where(alpha[..., None] > 1e-3, col * alpha_obj[..., None] / np.maximum(alpha[..., None], 1e-3), 0)
Image.fromarray((np.dstack([np.clip(rgb, 0, 1), np.clip(alpha, 0, 1)]) * 255).astype(np.uint8), 'RGBA').save(out)
print('ok', out, W, H, k, 'pièces')

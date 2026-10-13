"""Mot club taillé dans un grenat, traité en objet (image RGBA) : même méthode que lettres3d.py.

Usage : python tools/gemme3d.py public/matieres/metz-grenat-3d-1.png METZ [graine]
Face avant facettée (texture de gemme recalculée sur la taille du mot), biseau taillé en facette
plate tout autour (chanfrein qui accroche la lumière), flanc sombre, ombre portée. Aucun halo ni
liseré ajouté : la lumière vient uniquement de l'éclairage des facettes.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates

out = sys.argv[1] if len(sys.argv) > 1 else 'public/matieres/metz-grenat-3d-1.png'
WORD = sys.argv[2] if len(sys.argv) > 2 else 'METZ'
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1919
HERE = Path(__file__).resolve().parent
FONT = HERE.parent / 'public/fonts/Unbounded-Black.ttf'

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

# face avant : texture de gemme calculée à la taille exacte du mot (grandes facettes)
tex_path = Path(out).with_suffix('.tex.png')
subprocess.run([sys.executable, str(HERE / 'gemme.py'), str(tex_path), str(W), str(H), str(seed), '30000'], check=True)
face = np.asarray(Image.open(tex_path).convert('RGB'), np.float32) / 255
tex_path.unlink()
face = face ** 2.2  # retour en linéaire

# biseau : chanfrein plat de largeur BEVEL dont la normale suit la direction vers l'extérieur
BEVEL = 22.0
gy, gx = np.gradient(gaussian_filter(dist, 2.0))
gn = np.sqrt(gx ** 2 + gy ** 2) + 1e-6
out_x, out_y = -gx / gn, -gy / gn  # direction vers l'extérieur de la lettre
tilt = 0.85  # pente du chanfrein
N = np.dstack([out_x * tilt, out_y * tilt, np.ones_like(gx)])
N /= np.linalg.norm(N, axis=2, keepdims=True)
L = np.array([-0.58, -0.66, 0.48]); L /= np.linalg.norm(L)
V = np.array([0, 0, 1.0])
Hh = (L + V) / np.linalg.norm(L + V)
diff = np.clip((N * L).sum(2), 0, 1)
spec = np.clip((N * Hh).sum(2), 0, 1)
on_bevel = (dist < BEVEL) & (solid > 0.5)

# le chanfrein est du grenat : sombre à l'ombre, rouge vif et brillant face à la lumière
garnet = np.array([0.42, 0.012, 0.03])
bevel_col = garnet * (0.15 + 1.9 * diff[..., None] ** 1.6) + (spec ** 90)[..., None] * 1.4 * np.array([1.0, 0.8, 0.8])
# un peu de la texture transparaît dans le chanfrein (même pierre)
bevel_col = bevel_col * 0.75 + face * 0.25 * (0.4 + diff[..., None])
# arête vive entre face et chanfrein : fine ligne claire seulement côté lumière (pas un contour)
ridge = np.exp(-((dist - BEVEL) / 1.2) ** 2) * np.clip(diff - 0.55, 0, 1) * 2.0
front = np.where(on_bevel[..., None], bevel_col, face * 0.95)
front += ridge[..., None] * np.array([1.0, 0.55, 0.55])
# la face avant est légèrement plus sombre près du chanfrein (épaisseur de la pierre)
front *= (0.78 + 0.22 * np.clip((dist - BEVEL) / 30, 0, 1))[..., None] ** np.where(on_bevel, 0, 1)[..., None]

# flanc et ombre portée (comme lettres3d.py)
DEPTH = 22
smooth = gaussian_filter(solid, 1.2)
side = np.zeros((H, W), np.float32)
side_col = np.zeros((H, W, 3), np.float32)
for k in range(1, DEPTH + 1):
    shifted = map_coordinates(smooth, [yy - k * 1.0, xx - k * 0.45], order=1)
    take = (shifted > 0.5) & (side < 0.5) & (solid < 0.5)
    side[take] = 1
    side_col[take] = garnet * (0.16 - 0.11 * k / DEPTH)
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
print('ok', out, W, H)

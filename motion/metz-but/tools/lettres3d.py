"""Mot club sculpté en écailles du Graoully, rendu image par image avec une lumière qui bouge.

Usage : python tools/lettres3d.py public/matieres/ecailles 1 METZ 1552 [--frames 22] [--width 1300]
        → public/matieres/ecailles/ligne-1-00.webp … ligne-1-21.webp (RGBA)

La lettre est un objet : bord net (quelques ébréchures seulement), biseau, flanc, ombre portée, sans halo
ni contour. Les écailles suivent le sens des traits (champ d'orientation tiré de la forme des lettres),
sont plus petites près des bords et des angles, et chacune a un bord libre cerclé de noir brillant.
La géométrie est calculée une fois ; seule la lumière change d'une image à l'autre : lente au début,
puis un balayage rasant rapide sur le drop de la musique (image 15).
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates, zoom
from scipy.spatial import cKDTree

ap = argparse.ArgumentParser()
ap.add_argument('out_dir')
ap.add_argument('row', type=int)
ap.add_argument('word', nargs='?', default='METZ')
ap.add_argument('seed', nargs='?', type=int, default=1552)
ap.add_argument('--frames', type=int, default=22)
ap.add_argument('--width', type=int, default=1300)
args = ap.parse_args()
rng = np.random.default_rng(args.seed)
FONT = Path(__file__).resolve().parent.parent / 'public/fonts/Unbounded-Black.ttf'

# --- silhouette (×2 pour la netteté), penchée de 12° comme dans la vidéo -----------------------
FS = 600
font = ImageFont.truetype(str(FONT), FS)
x0, y0, x1, y1 = font.getbbox(args.word)
PAD = 140
W, H = int(x1 - x0 + 2 * PAD + 0.22 * (y1 - y0)), int(y1 - y0 + 2 * PAD)
img = Image.new('L', (W, H), 0)
ImageDraw.Draw(img).text((PAD - x0 + 0.11 * (y1 - y0), PAD - y0), args.word, font=font, fill=255)
shear = np.tan(np.radians(12))
img = img.transform(img.size, Image.AFFINE, (1, shear, -shear * H / 2, 0, 1, 0), resample=Image.BICUBIC)
mask = np.asarray(img, np.float32) / 255 > 0.5
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)


def noise(scale, s):
    g = np.random.default_rng(s)
    small = g.standard_normal((int(H / scale) + 4, int(W / scale) + 4))
    big = zoom(small, scale, order=3)[:H, :W]
    return (big - big.mean()) / (big.std() + 1e-6)


# 1. bord net : seulement quelques ébréchures, rares et petites
inside = distance_transform_edt(mask)
bites = (inside < 7) & (noise(16, args.seed + 31) > 2.1)
solid = gaussian_filter((mask & ~bites).astype(np.float32), 0.8)
dist = distance_transform_edt(solid > 0.5)
outside = distance_transform_edt(solid <= 0.5)
sdist = dist - outside  # distance signée (positive dans la lettre)

# 2. sens des traits : tenseur de structure de la distance au bord, lissé
gy, gx = np.gradient(gaussian_filter(dist, 3))
wgt = gaussian_filter(solid, 1)
Jxx = gaussian_filter(gx * gx * wgt, 28)
Jxy = gaussian_filter(gx * gy * wgt, 28)
Jyy = gaussian_filter(gy * gy * wgt, 28)
theta_n = 0.5 * np.arctan2(2 * Jxy, Jxx - Jyy)  # direction normale au bord
tx, ty = -np.sin(theta_n), np.cos(theta_n)        # tangente = sens du trait
flip = (ty + 0.35 * tx) < 0                        # orientées « vers la queue » : vers le bas / la droite
tx[flip] *= -1
ty[flip] *= -1

# 3. centres des écailles : plus petites près des bords, rangées qui avancent dans le sens du trait
def radius(d):
    return 35.0 * (0.72 + 0.28 * np.clip(d / 50.0, 0, 1))


cand_y, cand_x = np.mgrid[0:H:6, 0:W:6]
cand = np.column_stack([cand_x.ravel(), cand_y.ravel()]).astype(np.float32)
cand += rng.uniform(-3, 3, cand.shape)
cand = np.clip(cand, 0, [W - 1, H - 1])
ci = cand[:, 1].astype(int), cand[:, 0].astype(int)
keep = sdist[ci] > -14
cand = cand[keep]
ci = cand[:, 1].astype(int), cand[:, 0].astype(int)
key = cand[:, 0] * tx[ci] + cand[:, 1] * ty[ci] + rng.uniform(-1.5, 1.5, len(cand))
order = np.argsort(key)
cell = 80.0
grid = {}
centers = []
for idx in order:
    x, y = cand[idx]
    r = radius(max(sdist[int(y), int(x)], 0))
    gxk, gyk = int(x // cell), int(y // cell)
    ttx, tty = tx[int(y), int(x)], ty[int(y), int(x)]
    ok = True
    for i in range(gxk - 1, gxk + 2):
        for j in range(gyk - 1, gyk + 2):
            for (px, py, pr) in grid.get((i, j), ()):
                # espacement de tuiles dans le repère du trait : 1,9 r le long d'une rangée, 0,95 r entre rangées
                rm = 0.5 * (r + pr)
                du = ((px - x) * ttx + (py - y) * tty) / (0.95 * rm)
                dw = (-(px - x) * tty + (py - y) * ttx) / (1.9 * rm)
                if du * du + dw * dw < 1:
                    ok = False
                    break
            if not ok:
                break
        if not ok:
            break
    if ok:
        grid.setdefault((gxk, gyk), []).append((x, y, r))
        centers.append((x, y, r, key[idx]))
centers.sort(key=lambda c: -c[3])  # queue d'abord : les écailles côté tête recouvrent celles côté queue
print(len(centers), 'écailles')

label = np.full((H, W), -1, np.int32)
plate = np.zeros((H, W), np.float32)
zmap = np.full((H, W), -1e9, np.float32)
edge_d = np.ones((H, W), np.float32)
uloc = np.zeros((H, W), np.float32)
for n, (cx, cy, r, k) in enumerate(centers):
    ttx, tty = tx[int(cy), int(cx)], ty[int(cy), int(cx)]
    a, b = r * 0.95 * rng.uniform(0.95, 1.05), r * 1.22 * rng.uniform(0.95, 1.05)
    ext = int(b + 3)
    ax0, ax1 = int(max(0, cx - ext)), int(min(W, cx + ext))
    ay0, ay1 = int(max(0, cy - ext)), int(min(H, cy + ext))
    if ax0 >= ax1 or ay0 >= ay1:
        continue
    px = xx[ay0:ay1, ax0:ax1] - cx
    py = yy[ay0:ay1, ax0:ax1] - cy
    u = (px * ttx + py * tty) / b       # le long du trait (vers la queue = bord libre)
    w = (-px * tty + py * ttx) / a      # en travers
    rr = w ** 2 * (1 + 0.25 * np.clip(-u, 0, 1)) + u ** 2
    m = rr < 1
    label[ay0:ay1, ax0:ax1][m] = n
    d = np.sqrt(np.clip(1 - rr, 0, 1))
    plate[ay0:ay1, ax0:ax1][m] = (d ** 0.45 * (0.55 + 0.45 * np.clip((u + 1) / 2, 0, 1)))[m]
    zmap[ay0:ay1, ax0:ax1][m] = -k
    edge_d[ay0:ay1, ax0:ax1][m] = (1 - np.sqrt(rr))[m]
    uloc[ay0:ay1, ax0:ax1][m] = u[m]


def ridges(scale, s):
    return np.exp(-(noise(scale, s) / 0.22) ** 2)


def plates_net(spacing, s):
    g = np.random.default_rng(s)
    kk = int(W * H / spacing ** 2)
    pts = np.column_stack([g.uniform(0, W, kk), g.uniform(0, H, kk)])
    dd, _ = cKDTree(pts).query(np.column_stack([xx.ravel(), yy.ravel()]), k=2, workers=-1)
    return np.exp(-(((dd[:, 1] - dd[:, 0]).reshape(H, W)) / 1.1) ** 2)


wrinkle = 0.4 * ridges(3.2, 21) + 0.35 * ridges(7, 22) + 0.3 * plates_net(15, 23)
grain = noise(1.4, 7) * 0.6 + noise(3, 8) * 0.4

# 4. bord libre de chaque écaille (côté queue) : liseré sombre légèrement relevé
rim = np.exp(-(edge_d / 0.075) ** 2) * np.clip(uloc * 2.5, 0, 1) * (label >= 0)

BEVEL = 34.0
bevel = np.clip(dist / BEVEL, 0, 1)
bevel = 1 - (1 - bevel) ** 2.2
height = bevel * 60.0 + plate * 14.0 * (0.35 + 0.65 * bevel) - wrinkle * 1.0 + grain * 0.25
height += rim * 2.6 * bevel
height *= solid
hy, hx = np.gradient(gaussian_filter(height, 0.8))
N = np.dstack([-hx, -hy, np.ones_like(hx)])
N /= np.linalg.norm(N, axis=2, keepdims=True)

# ombre des écailles du dessus : on regarde vers la tête, le long du trait
look = 10.0
z_head = map_coordinates(zmap, [yy - ty * look, xx - tx * look], order=0)
lab_head = map_coordinates(label.astype(np.float32), [yy - ty * look, xx - tx * look], order=0)
shadow = gaussian_filter(((z_head > zmap) & (lab_head != label) & (label >= 0)).astype(np.float32), 4)
ao = (1 - 0.88 * shadow) * (0.25 + 0.75 * np.clip(edge_d * 7, 0, 1) ** 0.6)
ao *= 0.55 + 0.45 * bevel

shade_k = rng.uniform(0.75, 1.15, len(centers) + 1)[label]
patches = noise(110, 11) * 0.5 + noise(20, 12) * 0.35 + noise(3, 13) * 0.25
crevice = np.clip(1 - edge_d * 5, 0, 1) ** 1.5
black = np.clip(0.95 * shadow + 0.5 * crevice + 0.8 * wrinkle + 0.32 * patches + 0.9 * rim - 0.05, 0, 1)
black = black * black * (3 - 2 * black)
charcoal = np.array([0.026, 0.024, 0.028])
grenat = np.array([0.33, 0.012, 0.03])
albedo = charcoal * black[..., None] + grenat * ((1 - black) * shade_k)[..., None]
gloss = 0.25 + 0.75 * np.maximum(black, rim)  # la patine et le liseré sont plus brillants que le cuir rouge

# flanc (fixe) et ombre portée
DEPTH = 24
smooth = gaussian_filter(solid, 1.2)
side = np.zeros((H, W), np.float32)
side_col = np.zeros((H, W, 3), np.float32)
tone = gaussian_filter(1 - black, 6)
for kk in range(1, DEPTH + 1):
    shifted = map_coordinates(smooth, [yy - kk * 1.0, xx - kk * 0.45], order=1)
    take = (shifted > 0.5) & (side < 0.5) & (solid < 0.5)
    side[take] = 1
    t_k = map_coordinates(tone, [yy - kk * 1.0, xx - kk * 0.45], order=1)
    base = charcoal * (1 - t_k[..., None]) + grenat * t_k[..., None]
    side_col[take] = (base * (0.075 - 0.05 * kk / DEPTH))[take]
side = gaussian_filter(side, 0.6)
alpha_obj = np.maximum(solid, side)
sh = gaussian_filter(map_coordinates(alpha_obj, [yy - 40, xx - 24], order=1), 22) * 0.8
contact = gaussian_filter(map_coordinates(alpha_obj, [yy - 10, xx - 6], order=1), 4) * 0.5
alpha = np.clip(alpha_obj + np.maximum(sh, contact) * (1 - alpha_obj), 0, 1)
front_mask = solid[..., None] > 0.5
obj_mask = (solid[..., None] > 0.5) | (side[..., None] > 0.01)
V = np.array([0, 0, 1.0])


# 5. trajet de la lumière, image par image
def light(f):
    if f < 15:
        p = f / 14
        az, el, gain = 205 + 40 * p, 32, 0.9 + 0.08 * p
    else:
        p = min((f - 15) / 4, 1)
        e = 1 - (1 - p) ** 3
        az, el = 245 + 95 * e, 32 - 10 * np.sin(p * np.pi)
        gain = 1.0 + 0.4 * (1 - p) ** 2
    a, e_ = np.radians(az), np.radians(el)
    return np.array([np.cos(a) * np.cos(e_), np.sin(a) * np.cos(e_), np.sin(e_)]), gain


out = Path(args.out_dir)
out.mkdir(parents=True, exist_ok=True)
Hout = round(args.width * H / W)
for f in range(args.frames):
    L, gain = light(f)
    Hh = (L + V) / np.linalg.norm(L + V)
    diff = np.clip((N * L).sum(2), 0, 1)
    spec = np.clip((N * Hh).sum(2), 0, 1)
    fill = np.clip((N * np.array([0.5, 0.2, 0.84])).sum(2), 0, 1) ** 2
    front = albedo * (0.05 + 1.85 * gain * diff[..., None] ** 1.2 + 0.25 * fill[..., None]) * ao[..., None]
    front += ((spec ** 30) * 0.42 * gain * gloss * ao)[..., None] * np.array([0.92, 0.9, 0.95])
    col = np.where(front_mask, front, side_col)
    col = np.where(obj_mask, col, 0)
    col = np.clip(col, 0, None)
    col = col / (1 + col * 0.3)
    col = np.clip(col, 0, 1) ** (1 / 2.2)
    rgb = np.where(alpha[..., None] > 1e-3, col * alpha_obj[..., None] / np.maximum(alpha[..., None], 1e-3), 0)
    im = Image.fromarray((np.dstack([np.clip(rgb, 0, 1), alpha]) * 255).astype(np.uint8), 'RGBA')
    im.resize((args.width, Hout), Image.LANCZOS).save(out / f'ligne-{args.row}-{f:02d}.webp', quality=90, method=6)
print('ok', out, args.row, args.frames, 'images', args.width, Hout)

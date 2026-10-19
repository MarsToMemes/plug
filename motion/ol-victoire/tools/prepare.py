# Prépare les assets : logo vectorisé en couches (relief 3D), lion seul (petit logo), textures.
# Usage : python -I tools/prepare.py <logo.png|webp> <public/>
import json
import sys

import cv2
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

src, pub = sys.argv[1:3]
im = Image.open(src).convert('RGBA')
im.save(f'{pub}/club/logo.png', optimize=True)
a = np.asarray(im).astype(int)
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
H, W = al.shape
solid = al > 127


def near(c, tol=60):
    return solid & (np.abs(r - c[0]) + np.abs(g - c[1]) + np.abs(b - c[2]) < tol)


gold = near((0xC8, 0x8C, 0x28), 90)
white = near((255, 255, 255), 90)
red = near((0xE5, 0x20, 0x2E), 90)
blue = near((0x0F, 0x23, 0xAA), 90)


def components(mask):
    lab, n = ndi.label(mask)
    sizes = ndi.sum(mask, lab, range(1, n + 1))
    order = np.argsort(sizes)[::-1]
    return lab, [i + 1 for i in order], sizes[order]


# bord doré = plus grande composante dorée ; lion = la suivante
lab, ids, sizes = components(gold)
border = lab == ids[0]
lion = np.isin(lab, ids[1:]) & (ndi.binary_dilation(lab == ids[1], iterations=40))
# blanc : la plus grande composante = cadre blanc ; le reste = lettres, L, cercle
labw, idw, _ = components(white)
white_in = white & ~(labw == idw[0])

fill = lambda m: ndi.binary_closing(m, iterations=1)
layers = [
    # nom, masque, couleur, z bas, z haut
    ('socle', ndi.binary_fill_holes(solid), 'gold', 0.0, 0.10),
    ('face', ndi.binary_fill_holes(solid) & ~border, 'white', 0.10, 0.16),
    ('panneaux', fill(red | blue), 'panels', 0.16, 0.21),
    ('lettres', fill(white_in), 'white', 0.16, 0.235),
    ('lion', fill(lion), 'gold', 0.235, 0.27),
]

scale = 4.0 / W  # largeur du logo = 4 unités


def shapes_of(mask):
    m = (mask * 255).astype(np.uint8)
    contours, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    if hier is None:
        return out
    hier = hier[0]
    for i, c in enumerate(contours):
        if hier[i][3] != -1 or cv2.contourArea(c) < 30:
            continue
        def pts(cc):
            cc = cv2.approxPolyDP(cc, 0.8, True)[:, 0, :]
            return [[round((x - W / 2) * scale, 4), round((H / 2 - y) * scale, 4)] for x, y in cc]
        holes = []
        j = hier[i][2]
        while j != -1:
            if cv2.contourArea(contours[j]) >= 20:
                holes.append(pts(contours[j]))
            j = hier[j][0]
        out.append({'outer': pts(c), 'holes': holes})
    return out


data = {'width': 4.0, 'height': round(H * scale, 4), 'layers': []}
for name, mask, color, z0, z1 in layers:
    if color == 'panels':
        for sub, col in (('rouge', red), ('bleu', blue)):
            data['layers'].append({'name': f'panneau-{sub}', 'color': sub, 'z0': z0, 'z1': z1, 'shapes': shapes_of(fill(col))})
        continue
    data['layers'].append({'name': name, 'color': color, 'z0': z0, 'z1': z1, 'shapes': shapes_of(mask)})
    print(name, len(data['layers'][-1]['shapes']))
json.dump(data, open(f'{pub}/club/logo-3d.json', 'w'), separators=(',', ':'))


def save_mask(m, path, crop=True):
    m = m.astype(float)
    if crop:
        ys, xs = np.nonzero(m > 0)
        m = m[ys.min() - 4:ys.max() + 5, xs.min() - 4:xs.max() + 5]
    out = np.zeros(m.shape + (4,), np.uint8)
    out[..., :3] = 255
    out[..., 3] = (ndi.gaussian_filter(m, 0.6) * 255).clip(0, 255).astype(np.uint8)
    Image.fromarray(out).save(path, optimize=True)


save_mask(lion, f'{pub}/icones/lion.png')
save_mask(ndi.binary_fill_holes(solid), f'{pub}/club/logo-silhouette.png', crop=False)

rng = np.random.default_rng(5)

# Fibre de carbone : tuile 64 × 64, losanges en relief éclairés en haut à gauche, rangées décalées.
T = 64
yy, xx = np.mgrid[0:T, 0:T].astype(float)
pyr = np.zeros((T, T))
for cy, cx in ((T / 4, T / 4), (T / 4, 3 * T / 4), (3 * T / 4, 0), (3 * T / 4, T / 2), (3 * T / 4, T)):
    d = 1 - (np.abs(xx - cx) + np.abs(yy - cy)) / (T / 4)
    pyr = np.maximum(pyr, d)
gy, gx = np.gradient(pyr)
shade = 0.5 + (-gx - gy) * 9
carbon = np.clip(18 + shade * 34 + pyr * 8, 0, 255)
img = np.stack([carbon * 1.0, carbon * 1.0, carbon * 1.08], -1).clip(0, 255).astype(np.uint8)
Image.fromarray(img).save(f'{pub}/textures/carbone.png')

# Carte de déplacement en dents de scie (glitch zigzag) : canal R = scie verticale de pas 14 px.
H2 = W2 = 1080
saw = ((np.arange(H2) % 14) / 13.0 * 255).astype(np.uint8)
zz = np.zeros((H2, W2, 3), np.uint8)
zz[..., 0] = saw[:, None]
zz[..., 1] = 128
zz[..., 2] = 128
Image.fromarray(zz).save(f'{pub}/textures/zigzag.png')

# Grain (overlay)
Image.fromarray(np.clip(128 + rng.normal(0, 36, (512, 512)), 0, 255).astype(np.uint8)).save(f'{pub}/textures/grain.png')
print('ok')

# Génère les textures du style « grunge pochoir » : béton, toile, ciels d'orage, grain de bombe, surpulvérisation,
# carte de coulure. Usage : python -I tools/textures.py public/
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

pub = sys.argv[1]
rng = np.random.default_rng(21)


def fractal(h, w, octaves, base, seed, absolute=False):
    """Bruit fractal isotrope : bruit blanc flouté à plusieurs échelles (sigma = h / base / 2^o)."""
    r = np.random.default_rng(seed)
    acc = np.zeros((h, w))
    amp = 1.0
    for o in range(octaves):
        sigma = h / (base * 2 ** o) / 2.5
        layer = ndi.gaussian_filter(r.standard_normal((h, w)), sigma, mode='wrap')
        layer /= layer.std() + 1e-9
        if absolute:
            layer = -np.abs(layer)
        acc += amp * layer
        amp *= 0.55
    return (acc - acc.min()) / (acc.max() - acc.min())


def save_gray(a, path, tint=(1, 1, 1)):
    a = np.clip(a, 0, 255)
    Image.fromarray(np.stack([a * tint[0], a * tint[1], a * tint[2]], -1).clip(0, 255).astype(np.uint8)).save(path, quality=88)


W, H = 1080, 1350

# Béton : gris marbré + taches sombres + micro-grain
n = fractal(H, W, 6, 3, 1)
spots = ndi.gaussian_filter((fractal(H, W, 3, 2, 2) > 0.62).astype(float), 30)
conc = 70 + (n - 0.5) * 36 - spots * 22 + rng.normal(0, 4, (H, W))
save_gray(conc, f'{pub}/textures/beton.jpg')

# Toile : tissage diagonal fin, teinte bleu-gris
yy, xx = np.mgrid[0:H, 0:W].astype(float)
weave = np.sin((xx + yy) * 2 * np.pi / 6) * np.sin((xx - yy) * 2 * np.pi / 12)
base = fractal(H, W, 4, 3, 3)
canvas = 60 + weave * 7 + (base - 0.5) * 22 + rng.normal(0, 3, (H, W))
save_gray(canvas, f'{pub}/textures/toile.jpg', tint=(0.92, 0.95, 1.12))

# Ciels d'orage (2 fois plus grands pour dériver) : nuages contrastés
CH, CW = 1800, 1440
c = fractal(CH, CW, 7, 2, 4, absolute=True)
c = ndi.gaussian_filter(c, 1.2)
c = (c - c.min()) / (c.max() - c.min())
s = 1 / (1 + np.exp(-(c - 0.55) * 9))  # contraste en S
clouds = 40 + s * 150 + rng.normal(0, 3, c.shape)
save_gray(clouds, f'{pub}/textures/orage-gris.jpg')
save_gray(25 + s * 70 + rng.normal(0, 3, c.shape), f'{pub}/textures/orage-brun.jpg', tint=(1.12, 0.95, 0.75))


def save_mask(a, path):
    out = np.zeros(a.shape + (4,), np.uint8)
    out[..., :3] = 255
    out[..., 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
    Image.fromarray(out).save(path, optimize=True)


# Grain de bombe (masque) : matière pleine avec trous fins et quelques manques plus gros — tuile 512
T = 512
fine = rng.random((T, T))
holes = (fine < 0.07).astype(float)
blobs = ndi.gaussian_filter(rng.random((T, T)), 2)
blobs = (blobs < np.quantile(blobs, 0.018)).astype(float)
streak = ndi.gaussian_filter((rng.random((T, T // 8)) < 0.05).astype(float), (6, 0.3))
streak = np.asarray(Image.fromarray((streak * 255).astype(np.uint8)).resize((T, T))).astype(float) / 255
keep = 1 - np.clip(holes * 0.9 + blobs + streak * 0.8, 0, 1)
save_mask(ndi.gaussian_filter(keep, 0.4), f'{pub}/textures/grain-bombe.png')

# Surpulvérisation (masque de points épars) — tuile 512
dots = (rng.random((T, T)) < 0.09).astype(float)
dots = np.maximum(dots, ndi.gaussian_filter((rng.random((T, T)) < 0.004).astype(float), 1.2) * 4)
save_mask(np.clip(dots, 0, 1), f'{pub}/textures/surpulverisation.png')

# Carte de coulure : canal G = déplacement vertical par colonnes, nul en haut, fort en bas ; R neutre
cols = np.repeat(rng.random(W // 3 + 1), 3)[:W]
cols = ndi.gaussian_filter1d(cols, 0.6)
grad = np.clip((np.arange(H) / H - 0.45) / 0.4, 0, 1) ** 1.6
g = 128 - (cols[None, :] * grad[:, None]) * 127  # vers le haut de la source = la matière descend
m = np.zeros((H, W, 3), np.uint8)
m[..., 0] = 128
m[..., 1] = np.clip(g, 0, 255).astype(np.uint8)
m[..., 2] = 128
Image.fromarray(m).save(f'{pub}/textures/coulure.png')

# Film grain (overlay)
Image.fromarray(np.clip(128 + rng.normal(0, 34, (512, 512)), 0, 255).astype(np.uint8)).save(f'{pub}/textures/grain.png')
print('ok')

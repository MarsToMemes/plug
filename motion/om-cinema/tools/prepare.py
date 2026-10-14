# Prépare les assets du projet : logo en masques, joueurs détourés, fonds rebouchés (parallaxe), textures.
# Usage : python -I tools/prepare.py <dossier des détourages rembg> <public/>
# Les détourages viennent de rembg (u2net_human_seg) sur les photos fournies : <k>-src.png et <k>-u2net.png.
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

cut, pub = sys.argv[1:3]
rng = np.random.default_rng(13)


def save_mask(a, path, color=(255, 255, 255)):
    h, w = a.shape
    out = np.zeros((h, w, 4), np.uint8)
    out[..., :3] = color
    out[..., 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
    Image.fromarray(out).save(path, optimize=True)


# 1. Logo : la partie bleue devient un masque blanc (plein et contour), recoloré ensuite en CSS.
logo = np.asarray(Image.open(f'{pub}/club/logo-source.webp').convert('RGBA')).astype(float) / 255
blue = logo[..., 3] * np.clip((1 - logo[..., 0]) / (1 - 14 / 255), 0, 1)
save_mask(blue, f'{pub}/club/logo-plein.png')
m = blue > 0.5
edge = ndi.binary_dilation(m, iterations=5) & ~ndi.binary_erosion(m, iterations=5)
edge = ndi.gaussian_filter(edge.astype(float), 0.8)
save_mask(edge, f'{pub}/club/logo-contour.png')

# 2. Joueurs détourés + fond rebouché derrière (remplissage flou normalisé) pour la parallaxe 2,5D.
def fill(src, alpha, sigmas=(12, 30, 70, 160)):
    hole = ndi.binary_dilation(alpha > 0.02, iterations=40)
    known = (~hole).astype(float)
    img = src.copy()
    for s in sigmas:
        num = np.stack([ndi.gaussian_filter(img[..., c] * known, s) for c in range(3)], -1)
        den = ndi.gaussian_filter(known, s)[..., None]
        est = num / np.maximum(den, 1e-6)
        ok = den[..., 0] > 0.02
        upd = hole & ok & (known < 0.5)
        img[upd] = est[upd]
        known = np.maximum(known, upd.astype(float))
    # grain pour que la zone rebouchée ne soit pas plus lisse que le reste de la photo
    img = img + rng.normal(0, 2.2, img.shape) * hole[..., None]
    return np.clip(img, 0, 255).astype(np.uint8)


for k, plate in (('action', True), ('celeb', True), ('dodo', False)):
    src = Image.open(f'{cut}/{k}-src.png').convert('RGB')
    rgba = Image.open(f'{cut}/{k}-u2net.png')
    rgba.save(f'{pub}/joueurs/abdallah-{k}.png', optimize=True)
    if plate:
        a = np.asarray(rgba.getchannel('A')).astype(float) / 255
        Image.fromarray(fill(np.asarray(src).astype(float), a)).save(f'{pub}/joueurs/abdallah-{k}-fond.jpg', quality=92)
    print(k, rgba.size)


# 3. Bruit fractal (somme d'octaves de bruit agrandi)
def fractal(h, w, octaves=5, base=6, seed=0):
    r = np.random.default_rng(seed)
    acc = np.zeros((h, w))
    amp = 1.0
    for o in range(octaves):
        n = base * 2 ** o
        small = r.random((n, int(n * w / h) + 1))
        acc += amp * np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(float) / 255
        amp *= 0.5
    return (acc - acc.min()) / (acc.max() - acc.min())


# Lignes topographiques blanches sur transparent (posées à 6–10 % en overlay).
n = ndi.gaussian_filter(fractal(1080, 1920, octaves=3, base=2, seed=4), 6)
v = n * 16
d = np.abs(v - np.round(v))
line = np.clip(1 - d / 0.035, 0, 1) ** 1.5
save_mask(line, f'{pub}/textures/topo.png')


# Masques de coups de pinceau horizontaux, bords secs : rectangle à bords bruités + poils + manques.
def brush(seed, w=2048, h=360, top=60, bot=300):
    r = np.random.default_rng(seed)
    x = np.arange(w)

    def edge(amp1, amp2):
        lo = np.interp(x, np.linspace(0, w, 9), r.normal(0, amp1, 9))
        hi = np.interp(x, np.linspace(0, w, 160), r.normal(0, amp2, 160))
        return lo + hi

    t = top + edge(20, 7)
    b = bot + edge(20, 7)
    yy = np.arange(h)[:, None]
    a = ((yy > t[None, :]) & (yy < b[None, :])).astype(float)
    # extrémités gauche/droite déchirées
    lend = 30 + np.interp(np.arange(h), np.linspace(0, h, 20), r.normal(0, 22, 20))
    rend = w - 30 - np.interp(np.arange(h), np.linspace(0, h, 20), r.normal(0, 40, 20)) - 60
    a *= (x[None, :] > lend[:, None]) & (x[None, :] < rend[:, None])
    # poils : stries horizontales qui dépassent ou manquent près des bords
    for _ in range(70):
        y0 = int(r.choice([r.uniform(top - 25, top + 25), r.uniform(bot - 25, bot + 25)]))
        x0 = int(r.uniform(0, w * 0.9))
        ln = int(r.uniform(80, 600))
        th = int(r.uniform(1, 4))
        val = 1.0 if r.random() < 0.55 else 0.0
        a[max(0, y0):y0 + th, x0:x0 + ln] = val
    # manques secs à l'intérieur (traînées claires)
    for _ in range(40):
        y0 = int(r.uniform(top + 10, bot - 10))
        x0 = int(r.uniform(w * 0.4, w))
        ln = int(r.uniform(60, 500))
        a[y0:y0 + int(r.uniform(1, 3)), x0:x0 + ln] *= r.uniform(0.0, 0.5)
    a = ndi.gaussian_filter(a, 0.7)
    return a


for i, seed in enumerate((2, 7, 11)):
    save_mask(brush(seed), f'{pub}/textures/pinceau-{i + 1}.png')

# Texture plâtre / peinture épaisse pour le nom géant : relief doux + coups de spatule, éclairé en haut à gauche.
H, W = 1024, 2048
hgt = fractal(H, W, octaves=6, base=4, seed=9) * 0.5
for _ in range(260):
    cx, cy = rng.uniform(0, W), rng.uniform(0, H)
    ln, th, ang = rng.uniform(60, 260), rng.uniform(10, 34), rng.uniform(-0.5, 0.5)
    R = int(ln * 3)
    yy, xx = np.ogrid[max(0, int(cy - R)):min(H, int(cy + R)), max(0, int(cx - R)):min(W, int(cx + R))]
    u = (xx - cx) * np.cos(ang) + (yy - cy) * np.sin(ang)
    w_ = -(xx - cx) * np.sin(ang) + (yy - cy) * np.cos(ang)
    blob = np.exp(-(u / ln) ** 2 - (w_ / th) ** 2)
    hgt[yy, xx] += blob * rng.uniform(0.15, 0.4) * (1 if rng.random() < 0.7 else -1)
hgt = ndi.gaussian_filter(hgt, 1.5)
gy, gx = np.gradient(hgt)
light = -(gx + gy) * 5
shade = np.clip(0.93 + light + rng.normal(0, 0.012, hgt.shape), 0.62, 1.04)
base = np.array([243, 243, 241]) / 255
img = np.clip(shade[..., None] * base * 255, 0, 255).astype(np.uint8)
Image.fromarray(img).save(f'{pub}/textures/platre.jpg', quality=90)

# Grain de film (tuile 512, gris centré sur 128 pour mode overlay)
g = np.clip(128 + rng.normal(0, 38, (512, 512)), 0, 255).astype(np.uint8)
Image.fromarray(g).save(f'{pub}/textures/grain.png')
print('ok')

import cv2, json, numpy as np
F = json.load(open('faces.json'))
SKIP = {'6620864-uhd_3840_2160_25fps', '8496466-hd_1920_1080_25fps'}
PAPER = np.array([226, 233, 236], np.float32); INK = np.array([22, 21, 20], np.float32)
W, H = 360, 420

def card(img, box, name, mirror=False, warp=0.0, light=1.0, seed=1, size=(W, H)):
    x, y, w, h = box
    cx, cy = x + w / 2, y + h * 0.58
    s = w * 1.12
    src = np.float32([[cx - s, cy - s * 1.17], [cx + s, cy - s * 1.17], [cx - s, cy + s * 1.17]])
    dst = np.float32([[0, 0], [size[0], 0], [0, size[1]]])
    M = cv2.getAffineTransform(src, dst)
    c = cv2.warpAffine(img, M, size, flags=cv2.INTER_AREA, borderMode=cv2.BORDER_REPLICATE)
    valid = cv2.warpAffine(np.ones(img.shape[:2], np.float32), M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    valid = cv2.GaussianBlur(cv2.erode(valid, np.ones((25, 25), np.uint8)), (0, 0), 18)
    valid = valid * np.clip((size[1] - np.mgrid[0:size[1], 0:size[0]][0]) / (size[1] * 0.22), 0, 1) ** 1.5
    if mirror: c = c[:, ::-1].copy(); valid = valid[:, ::-1].copy()
    if warp:
        yy, xx = np.mgrid[0:size[1], 0:size[0]].astype(np.float32)
        k = np.clip((yy - size[1] * 0.45) / (size[1] * 0.3), 0, 1)
        c = cv2.remap(c, size[0] / 2 + (xx - size[0] / 2) / (1 + warp * k), yy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    Wc, Hc = size
    # person mask
    m = np.full((Hc, Wc), cv2.GC_PR_BGD, np.uint8)
    cv2.ellipse(m, (Wc // 2, int(Hc * 0.47)), (int(Wc * 0.2), int(Hc * 0.2)), 0, 0, 360, cv2.GC_FGD, -1)
    cv2.ellipse(m, (Wc // 2, int(Hc * 0.45)), (int(Wc * 0.36), int(Hc * 0.4)), 0, 0, 360, cv2.GC_PR_FGD, -1)
    m[:, :6] = cv2.GC_BGD; m[:, -6:] = cv2.GC_BGD; m[:6, :] = cv2.GC_BGD
    bg = np.zeros((1, 65)); fg = np.zeros((1, 65))
    try: cv2.grabCut(c, m, None, bg, fg, 5, cv2.GC_INIT_WITH_MASK)
    except Exception: pass
    pm = np.where((m == 1) | (m == 3), 1.0, 0.0).astype(np.float32)
    pm = cv2.morphologyEx(pm, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    fe = (((np.mgrid[0:Hc, 0:Wc][1] - Wc / 2) / (Wc * 0.24)) ** 2 + ((np.mgrid[0:Hc, 0:Wc][0] - Hc * 0.47) / (Hc * 0.27)) ** 2 < 1).astype(np.float32)
    pm = np.maximum(pm, fe)
    pm = cv2.GaussianBlur(pm, (0, 0), 6) * valid
    sm = cv2.bilateralFilter(c, 7, 40, 7)
    L = cv2.cvtColor(sm, cv2.COLOR_BGR2LAB)[:, :, 0].astype(np.float32) / 255
    yy, xx = np.mgrid[0:Hc, 0:Wc]
    face = ((xx - Wc / 2) / (Wc * 0.2)) ** 2 + ((yy - Hc * 0.47) / (Hc * 0.22)) ** 2 < 1
    fv = L[face]; med = np.median(fv); hi = np.percentile(fv, 99); lo = np.percentile(L[pm > 0.5], 2) if (pm > 0.5).any() else 0
    t = np.where(L >= med, 0.4 * np.clip((hi - L) / (hi - med + 1e-3), 0, 1), 0.4 + 0.55 * np.clip((med - L) / (med - lo + 1e-3), 0, 1))
    t = np.clip(t, 0, 0.95) * light
    G = L * 255
    g1 = cv2.GaussianBlur(G, (0, 0), 1.0); g2 = cv2.GaussianBlur(G, (0, 0), 1.7)
    Dg = (g1 - 0.982 * g2) / 255.0
    E = np.where(Dg >= -0.003, 1.0, 1 + np.tanh(70 * (Dg + 0.003)))
    lines = np.clip(1 - E, 0, 1)
    vign = np.exp(-(((xx - Wc / 2) / (Wc * 0.42)) ** 2 + ((yy - Hc * 0.48) / (Hc * 0.5)) ** 2) ** 1.6)
    ink = np.clip(cv2.GaussianBlur(t, (0, 0), 1.6) * 0.9 + lines * 0.85, 0, 1) * pm
    # charcoal strokes along the form, in the shadows
    rng = np.random.default_rng(seed)
    gx = cv2.Sobel(cv2.GaussianBlur(L, (0, 0), 4), cv2.CV_32F, 1, 0); gy = cv2.Sobel(cv2.GaussianBlur(L, (0, 0), 4), cv2.CV_32F, 0, 1)
    flat = (ink ** 3).ravel().astype(np.float64); flat /= flat.sum()
    strokes = np.zeros((Hc, Wc), np.float32)
    for k in rng.choice(flat.size, 900, p=flat):
        yy0, xx0 = divmod(int(k), Wc)
        a = np.arctan2(gy[yy0, xx0], gx[yy0, xx0]) + np.pi / 2 + rng.normal(0, 0.3)
        ln = 4 + rng.random() * 8
        p1 = (int(xx0 - np.cos(a) * ln), int(yy0 - np.sin(a) * ln)); p2 = (int(xx0 + np.cos(a) * ln), int(yy0 + np.sin(a) * ln))
        cv2.line(strokes, p1, p2, float(0.25 + 0.5 * ink[yy0, xx0]), 1, cv2.LINE_AA)
    ink = np.clip(ink + strokes * pm, 0, 1)
    col = PAPER[None, None] * (1 - ink[..., None]) + INK[None, None] * ink[..., None]
    alpha = np.clip(vign * (0.08 + 0.92 * pm) * 1.05, 0, 1) * valid
    rgba = np.dstack([col, alpha[..., None] * 255]).clip(0, 255).astype(np.uint8)
    cv2.imwrite(f'cards/{name}.png', rgba)

n = 0
for name, v in F.items():
    if name in SKIP: continue
    img = cv2.imread(f'frames/{name}.png')
    base = name.split('-')[0]
    for j, (mir, wp, li) in enumerate([(False, 0, 1.0), (True, 0.05, 0.92), (False, -0.05, 1.08)]):
        card(img, v['box'], f'{base}_{j}', mir, wp, li, seed=n); n += 1
# the look-alikes, from the same portrait as plates 04-06
crop = cv2.imread('/home/user/facefx/p2/crop.png')
box = (437 - 155, 352 - 110, 310, 330)
card(crop, box, 'A', size=(W, H), seed=101)
card(crop, box, 'Ahero', size=(720, 840), seed=102)
import importlib.util
CX = 437
h, w = crop.shape[:2]
s1 = lambda y: np.clip((y - 430) / 150.0, 0, 1); s2 = lambda y: np.clip((y - 430) / 120.0, 0, 1) * np.clip((720 - y) / 120.0, 0, 1); s3 = lambda y: np.clip(1 - np.abs(y - 350) / 70.0, 0, 1)
mimg = crop[:, ::-1].copy()
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
B = cv2.remap(mimg, CX + (xx - CX) / (1 + 0.06 * s1(yy) + 0.045 * s3(yy)), yy - 10 * s2(yy), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
card(B, (840 - 437 - 155, 352 - 110, 310, 330), 'B', light=0.88, seed=103)
card(B, (840 - 437 - 155, 352 - 110, 310, 330), 'Bhero', light=0.88, seed=104, size=(720, 840))
print(n + 3)

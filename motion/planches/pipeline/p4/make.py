import cv2, numpy as np, json
D = '/home/user/facefx/p4/'
src = cv2.imread('/home/user/facefx/p2/crop.png'); msk = cv2.imread('/home/user/facefx/p2/mask.png', 0)
h, w = msk.shape
inv = 255 - msk; n, lab, st, _ = cv2.connectedComponentsWithStats(inv)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] < 4000: msk[lab == i] = 255
CX = 437
LM = {  # landmarks of the original portrait (crop coordinates)
    'eyeLo': (295, 352), 'eyeLi': (380, 355), 'eyeRi': (497, 355), 'eyeRo': (585, 352),
    'browL1': (290, 296), 'browL2': (390, 302), 'browR1': (488, 302), 'browR2': (590, 296),
    'noseTip': (437, 470), 'nosL': (392, 488), 'nosR': (482, 488),
    'mouthL': (345, 568), 'mouthR': (528, 568), 'lipU': (437, 552), 'lipD': (437, 590),
    'chin': (437, 655), 'jawL': (262, 560), 'jawR': (612, 560), 'cheekL': (238, 430), 'cheekR': (636, 430), 'forehead': (437, 160),
}
s1 = lambda y: np.clip((y - 430) / 150.0, 0, 1)
s2 = lambda y: np.clip((y - 430) / 120.0, 0, 1) * np.clip((720 - y) / 120.0, 0, 1)
s3 = lambda y: np.clip(1 - np.abs(y - 350) / 70.0, 0, 1)
def variant_b(img):
    m = img[:, ::-1]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    sx = CX + (xx - CX) / (1 + 0.06 * s1(yy) + 0.045 * s3(yy)); sy = yy - 10 * s2(yy)
    return cv2.remap(np.ascontiguousarray(m), sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
def lm_b(p):
    x, y = 840 - p[0], p[1]
    return (float(CX + (x - CX) * (1 + 0.06 * s1(y) + 0.045 * s3(y))), float(y + 10 * s2(y)))

def charcoal(img, m, tag, seed, light=1.0):
    soft = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 4)
    sm = cv2.bilateralFilter(img, 9, 40, 9); sm = cv2.bilateralFilter(sm, 9, 30, 7)
    L = cv2.cvtColor(sm, cv2.COLOR_BGR2LAB)[:, :, 0].astype(np.float32) / 255
    yy, xx = np.mgrid[0:h, 0:w]
    face = ((xx - CX) / 205.0) ** 2 + ((yy - 400) / 270.0) ** 2 < 1
    fv = L[face & (m > 0)]; med = np.median(fv); hi = np.percentile(fv, 99.5); lo = np.percentile(L[m > 0], 2)
    t = np.where(L >= med, 0.42 * np.clip((hi - L) / (hi - med), 0, 1), 0.42 + 0.53 * np.clip((med - L) / (med - lo), 0, 1))
    t = np.clip(t, 0, 0.95)
    hair = (m > 0) & (t > 0.7) & (~face | (yy < 140)) & (yy < 640)
    hair = cv2.morphologyEx(hair.astype(np.uint8) * 255, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    hairS = cv2.GaussianBlur(hair.astype(np.float32) / 255, (0, 0), 4)
    fade = np.clip(yy / 80.0, 0, 1) * np.clip((h - yy) / 300.0, 0, 1) ** 1.3
    base = soft * fade
    smudge = cv2.GaussianBlur(t, (0, 0), 3) * base * light
    G = L * 255
    g1 = cv2.GaussianBlur(G, (0, 0), 1.2); g2 = cv2.GaussianBlur(G, (0, 0), 2.0)
    Dg = (g1 - 0.982 * g2) / 255.0
    E = np.where(Dg >= -0.003, 1.0, 1 + np.tanh(70 * (Dg + 0.003)))
    lines = np.clip(1 - E, 0, 1)
    lb = (lines > 0.3).astype(np.uint8); n, lab, st, _ = cv2.connectedComponentsWithStats(lb)
    keep = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 30]).astype(np.uint8)
    lines = lines * cv2.dilate(keep, np.ones((3, 3), np.uint8)) * base
    tone = np.clip(smudge * 0.85 * (1 - hairS) + smudge * hairS * 1.05, 0, 1)
    rgba = np.zeros((h, w, 4), np.uint8); rgba[..., :3] = (20, 21, 22)
    rgba[..., 3] = np.clip(tone * 255, 0, 255).astype(np.uint8); cv2.imwrite(f'{D}{tag}_tone.png', rgba)
    rgba[..., 3] = np.clip(lines * 0.9 * 255, 0, 255).astype(np.uint8); cv2.imwrite(f'{D}{tag}_lines.png', rgba)
    gx = cv2.Sobel(cv2.GaussianBlur(L, (0, 0), 6), cv2.CV_32F, 1, 0); gy = cv2.Sobel(cv2.GaussianBlur(L, (0, 0), 6), cv2.CV_32F, 0, 1)
    rng = np.random.default_rng(seed); out = []
    for A, N, L0, PW in ((smudge * (1 - hairS), 1500, 12, 3.2), (smudge * hairS, 1700, 24, 1.6)):
        flat = (A ** PW).ravel().astype(np.float64); p = flat / flat.sum()
        for k in rng.choice(flat.size, N, p=p):
            y, x = divmod(int(k), w); a = float(A[y, x])
            ang = float(np.arctan2(gy[y, x], gx[y, x])) + np.pi / 2 + rng.normal(0, 0.3)
            ln = L0 * (0.6 + rng.random() * 0.9); dx, dy = np.cos(ang) * ln / 2, np.sin(ang) * ln / 2
            out.append([round(float(x - dx), 1), round(float(y - dy), 1), round(float(x + dx), 1), round(float(y + dy), 1), round(0.5 + a * 1.6, 2), round(min(1.0, 0.25 + a * 0.8), 2)])
    return out

sa = charcoal(src, msk, 'A', 3)
sb = charcoal(variant_b(src), variant_b(msk), 'B', 9, light=0.86)
json.dump({'A': {'strokes': sa, 'lm': LM}, 'B': {'strokes': sb, 'lm': {k: lm_b(v) for k, v in LM.items()}}}, open(D + 'p4.json', 'w'))
# preview with landmarks
prev = []
for tag, lm in (('A', LM), ('B', {k: lm_b(v) for k, v in LM.items()})):
    out = np.full((h, w, 3), (238, 243, 245), np.float32)
    for part in ('tone', 'lines'):
        im = cv2.imread(f'{D}{tag}_{part}.png', cv2.IMREAD_UNCHANGED).astype(np.float32); a = im[..., 3:] / 255
        out = out * (1 - a) + im[..., :3] * a
    o = out.astype(np.uint8)
    for p in lm.values(): cv2.circle(o, (int(p[0]), int(p[1])), 5, (40, 40, 200), -1)
    prev.append(o)
cv2.imwrite(D + 'preview.png', cv2.resize(np.hstack(prev), (1000, 514)))

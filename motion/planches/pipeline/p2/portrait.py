import cv2, numpy as np, json
D='/home/user/facefx/p2/'
img = cv2.imread(D+'crop.png'); m = cv2.imread(D+'mask.png', 0)
h, w = m.shape
inv = (255 - m); n, lab, st, _ = cv2.connectedComponentsWithStats(inv)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] < 4000: m[lab == i] = 255
soft = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 4)
sm = cv2.bilateralFilter(img, 9, 40, 9); sm = cv2.bilateralFilter(sm, 9, 30, 7)
L = cv2.cvtColor(sm, cv2.COLOR_BGR2LAB)[:, :, 0].astype(np.float32) / 255
yy, xx = np.mgrid[0:h, 0:w]
face = ((xx - 437) / 205.0) ** 2 + ((yy - 400) / 270.0) ** 2 < 1
fv = L[face & (m > 0)]; med = np.median(fv); hi = np.percentile(fv, 99.5); lo = np.percentile(L[m > 0], 2)
t = np.where(L >= med, 0.42 * np.clip((hi - L) / (hi - med), 0, 1), 0.42 + 0.53 * np.clip((med - L) / (med - lo), 0, 1))
t = np.clip(t, 0, 0.95)
hair = (m > 0) & (t > 0.7) & (~face | (yy < 140)) & (yy < 640)
hair = cv2.morphologyEx(hair.astype(np.uint8) * 255, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
hairS = cv2.GaussianBlur(hair.astype(np.float32) / 255, (0, 0), 4)
fade = np.clip(yy / 80.0, 0, 1) * np.clip((h - yy) / 300.0, 0, 1) ** 1.3
base = soft * fade
smudge = cv2.GaussianBlur(t, (0, 0), 3) * base
G = L * 255
g1 = cv2.GaussianBlur(G, (0, 0), 1.2); g2 = cv2.GaussianBlur(G, (0, 0), 2.0)
Dg = (g1 - 0.982 * g2) / 255.0
E = np.where(Dg >= -0.003, 1.0, 1 + np.tanh(70 * (Dg + 0.003)))
lines = np.clip(1 - E, 0, 1)
lb = (lines > 0.3).astype(np.uint8); n, lab, st, _ = cv2.connectedComponentsWithStats(lb)
keep = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 30]).astype(np.uint8)
lines = lines * cv2.dilate(keep, np.ones((3, 3), np.uint8)) * base
def save(name, a):
    rgba = np.zeros((h, w, 4), np.uint8); rgba[..., 0] = 20; rgba[..., 1] = 21; rgba[..., 2] = 22
    rgba[..., 3] = np.clip(a * 255, 0, 255).astype(np.uint8); cv2.imwrite(D + name, rgba)
skinA = smudge * (1 - hairS) * 0.85; hairA = np.clip(smudge * hairS * 1.05, 0, 1); det = lines * 0.9
save('skin.png', skinA); save('hair.png', hairA); save('detail.png', det)
gx = cv2.Sobel(cv2.GaussianBlur(L, (0, 0), 6), cv2.CV_32F, 1, 0); gy = cv2.Sobel(cv2.GaussianBlur(L, (0, 0), 6), cv2.CV_32F, 0, 1)
rng = np.random.default_rng(3)
strokes = {'skin': [], 'hair': []}
for kind, A, N, L0, PW in (('skin', skinA, 1500, 12, 3.2), ('hair', hairA, 1700, 24, 1.6)):
    flat = (A ** PW).ravel().astype(np.float64); p = flat / flat.sum()
    idx = rng.choice(flat.size, N, p=p)
    for k in idx:
        y, x = divmod(int(k), w)
        a = float(A[y, x])
        g = float(np.hypot(gx[y, x], gy[y, x]))
        ang = float(np.arctan2(gy[y, x], gx[y, x])) + np.pi / 2 + rng.normal(0, 0.25 if kind == 'hair' else 0.35)
        if kind == 'skin' and g < 0.02: ang = np.deg2rad(55) + rng.normal(0, 0.2)
        ln = L0 * (0.6 + rng.random() * 0.9)
        dx, dy = np.cos(ang) * ln / 2, np.sin(ang) * ln / 2
        strokes[kind].append([round(float(x - dx), 1), round(float(y - dy), 1), round(float(x + dx), 1), round(float(y + dy), 1),
                              round(0.5 + a * 1.6, 2), round(min(1.0, 0.25 + a * 0.8), 2), round(y / h, 3)])
json.dump(strokes, open(D + 'strokes.json', 'w'))
paper = np.full((h, w, 3), (238, 243, 245), np.float32); out = paper.copy()
for a in [skinA, hairA, det]:
    out = out * (1 - a[..., None]) + np.array([20, 21, 22]) * a[..., None]
o8 = out.astype(np.uint8)
for kind in ('skin', 'hair'):
    for s in strokes[kind]:
        ov = o8.copy()
        cv2.line(ov, (int(s[0]), int(s[1])), (int(s[2]), int(s[3])), (22, 21, 20), max(1, int(round(s[4]))), cv2.LINE_AA)
        o8 = cv2.addWeighted(ov, s[5] * 0.6, o8, 1 - s[5] * 0.6, 0)
cv2.imwrite(D + 'preview.png', o8)
print(len(strokes['skin']), len(strokes['hair']))

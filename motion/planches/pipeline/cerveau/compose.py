"""
Assembles the sequence: the observer's eye, through the pupil into the brain, back out
to the face he is looking at. Frames are read and written through ffmpeg; every move
is a sub-pixel crop-zoom (cv2.warpAffine), eased, so pushes stay smooth.

Usage: python compose.py OUT.mp4 [--preview]   (--preview: half size, no grain)
"""
import subprocess
import sys

import cv2
import numpy as np

OUT = sys.argv[1]
PREVIEW = '--preview' in sys.argv
W, H = (640, 360) if PREVIEW else (1280, 720)
FPS = 25
SRC = '/home/user/brainfx/src'
BRAIN = '/home/user/brainfx/frames'


def read(path, start, dur, size=(2560, 1440)):
    """Frames of a clip from `start` for `dur` seconds, at 25 fps, as uint8 RGB of `size`."""
    w, h = size
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(start), '-t', str(dur), '-i', path,
           '-vf', f'fps={FPS},scale={w}:{h}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return list(np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3))


def track(points, t):
    """Piecewise-linear (t, x, y) path, t in seconds."""
    ts = [p[0] for p in points]
    return float(np.interp(t, ts, [p[1] for p in points])), float(np.interp(t, ts, [p[2] for p in points]))


def find_pupil(img, cx, cy, r=0.035):
    """The pupil near (cx, cy): the darkest small spot ringed by the lighter iris (difference
    of Gaussians), so eyelashes and the shadow of the face are not taken for it."""
    h, w = img.shape[:2]
    x0, x1 = max(0, int((cx - r) * w)), min(w, int((cx + r) * w))
    y0, y1 = max(0, int(cy * h - r * w)), min(h, int(cy * h + r * w))
    g = cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_RGB2GRAY).astype(np.float32)
    s1 = w / 1100  # about the pupil's radius
    dog = cv2.GaussianBlur(g, (0, 0), s1) - cv2.GaussianBlur(g, (0, 0), s1 * 3.5)
    y, x = np.unravel_index(dog.argmin(), dog.shape)
    return (x0 + x) / w, (y0 + y) / h


def ease(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ease_in(t):
    t = min(1.0, max(0.0, t))
    return t ** 2.2


def zoom(img, cx, cy, z):
    """Crop around (cx, cy) (0-1 of the frame) with zoom z, output W x H float; keeps the crop inside."""
    if img.dtype == np.uint8:
        img = img.astype(np.float32) / 255
    h, w = img.shape[:2]
    cw, ch = w / z, h / z
    x0 = min(max(cx * w - cw / 2, 0), w - cw)
    y0 = min(max(cy * h - ch / 2, 0), h - ch)
    s = W / cw
    m = np.float32([[s, 0, -x0 * s], [0, s, -y0 * s]])
    return cv2.warpAffine(img, m, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def iris(img, amount, cx=0.5, cy=0.5):
    """Darkness closing around a point: amount 0 = open, 1 = black (the pupil filling the frame)."""
    if amount <= 0:
        return img
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.hypot((xx - cx * W) / W, (yy - cy * H) / W)
    r = (1 - amount) * 0.9
    mask = np.clip((d - r) / 0.18 + 1 - amount, 0, 1)[..., None]
    return img * (1 - mask * min(1, amount * 1.6)) * (1 - ease(amount) ** 3)


def grade(img, warm=0.0):
    """One look for everything: slightly desaturated, soft warm highlights, deep blacks."""
    lum = img @ np.float32([0.2126, 0.7152, 0.0722])
    img = lum[..., None] + (img - lum[..., None]) * 0.86
    img = img * np.float32([1.0 + 0.03 * warm, 1.0, 1.0 - 0.03 * warm])
    img = np.clip(img, 0, 1) ** 1.05
    return img


GRAIN_SEED = np.random.default_rng(7)


def finish(img):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vign = 1 - 0.28 * (np.hypot((xx / W - 0.5) * 1.2, yy / H - 0.5) ** 2) * 2.2
    img = img * vign[..., None]
    if not PREVIEW:
        g = GRAIN_SEED.normal(0, 0.018, (H // 2, W // 2)).astype(np.float32)
        img = img + cv2.resize(g, (W, H))[..., None]
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)


enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                        '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
                        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)


class Out:
    """Frames go straight to the encoder: a 20 s sequence of float frames would not fit in memory."""
    n = 0

    def append(self, f):
        enc.stdin.write(finish(f).tobytes())
        self.n += 1

    def extend(self, fs):
        for f in fs:
            self.append(f)


frames = Out()
mix = lambda a, b, t: a * (1 - t) + b * t

# A. The observer: a man in the dark, light across his eye. The camera of the clip already
# pushes in slowly; the frame closes on his pupil, then the pupil fills it (4.5 s).
PUPIL = [(0.0, 0.297, 0.347), (0.5, 0.33, 0.35), (1.0, 0.35, 0.35), (1.5, 0.367, 0.306), (2.0, 0.36, 0.306),
         (2.5, 0.34, 0.264), (3.0, 0.33, 0.25), (3.5, 0.32, 0.22), (4.5, 0.31, 0.20)]
man = read(f'{SRC}/6620864-uhd_3840_2160_25fps.mp4', 10.5, 4.5)
def follow(frames_, start):
    """Pupil track: found once, then the iris patch is matched from frame to frame."""
    h, w = frames_[0].shape[:2]
    gray = [cv2.cvtColor(f, cv2.COLOR_RGB2GRAY) for f in frames_]
    cx, cy = find_pupil(frames_[0], *start)
    half, search = int(0.022 * w), int(0.03 * w)
    out = [(cx, cy)]
    tpl = gray[0][int(cy * h) - half:int(cy * h) + half, int(cx * w) - half:int(cx * w) + half]
    for g in gray[1:]:
        px, py = int(out[-1][0] * w), int(out[-1][1] * h)
        x0, y0 = px - half - search, py - half - search
        win = g[y0:py + half + search, x0:px + half + search]
        res = cv2.matchTemplate(win, tpl, cv2.TM_CCOEFF_NORMED)
        _, _, _, (mx, my) = cv2.minMaxLoc(res)
        nx, ny = x0 + mx + half, y0 + my + half
        out.append((nx / w, ny / h))
        tpl = g[ny - half:ny + half, nx - half:nx + half]
    return out


raw_c = follow(man, (0.284, 0.376))
# Smooth the track (the detector jitters a little).
k = np.ones(7) / 7
cxs = np.convolve(np.pad([c[0] for c in raw_c], 3, mode='edge'), k, 'valid')
cys = np.convolve(np.pad([c[1] for c in raw_c], 3, mode='edge'), k, 'valid')
def eye_frame(i, f, n):
    t = i / (n - 1)
    # The frame drifts from a wide composition toward the pupil while closing in.
    m = ease(t / 0.6)
    cx, cy = 0.42 + (cxs[i] - 0.42) * m, 0.45 + (cys[i] - 0.45) * m
    z = 1.0 + 1.6 * ease(t / 0.7) + 5.5 * ease_in((t - 0.55) / 0.45)
    out = grade(zoom(f, cx, cy, z), warm=1)
    if not PREVIEW:
        out = cv2.GaussianBlur(out, (0, 0), 0.1 + 1.6 * ease_in((t - 0.7) / 0.3))
    # The pupil spot in the output, for the closing darkness.
    return iris(out, ease_in((t - 0.78) / 0.22), 0.5, 0.5)
A = [eye_frame(i, f, len(man)) for i, f in enumerate(man)]
for i, f in enumerate(A):
    frames.append(f * ease(i / 15))
frames.extend([np.zeros((H, W, 3), np.float32)] * 6)

# C. The brain (rendered with Blender, its own fade from and back to darkness).
import glob
brain_files = sorted(glob.glob(f'{BRAIN}/f_*.png'))
for p in brain_files:
    img = cv2.cvtColor(cv2.imread(p), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    frames.append(grade(cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)))
frames.extend([np.zeros((H, W, 3), np.float32)] * 4)

# D. Back out through the same pupil: the end of A, reversed (2 s), opening on darkness.
back = man[-50:][::-1]
D = []
for j, f in enumerate(back):
    i = len(man) - 1 - j
    D.append(eye_frame(i, f, len(man)))

# E. What he sees: her face, looking back. A slow settle (5 s), dissolving in from D.
her = read(f'{SRC}/4588232-uhd_3840_2160_25fps.mp4', 1.0, 5.2)
E = []
for i, f in enumerate(her):
    t = i / (len(her) - 1)
    E.append(grade(zoom(f, 0.5, 0.42, 1.28 - 0.18 * ease(t)), warm=0.5) * (1 - ease((i - (len(her) - 20)) / 20)))
for i in range(len(D) - 12):
    frames.append(D[i])
for k2 in range(12):
    frames.append(mix(D[len(D) - 12 + k2], E[k2], ease((k2 + 1) / 13)))
frames.extend(E[12:])

enc.stdin.close()
enc.wait()
print(f'{OUT}: {frames.n} frames, {frames.n / FPS:.1f} s, brain frames {len(brain_files)}')

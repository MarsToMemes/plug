"""Control of a rendered episode, before it is delivered.

    python audio/check.py out/episode.mp4

1. Measures the visible motion (10 fps) -> audio/out/motion.npy (used by mix.py to snap cues).
2. Lists every stretch where the picture does not change for more than LIMIT seconds.
Exit code 1 if any frozen stretch is longer than LIMIT.
"""
import os
import subprocess
import sys

import numpy as np

LIMIT = 6.0
HERE = os.path.dirname(os.path.abspath(__file__))
video = sys.argv[1]
W, H = 240, 136
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-vf', f'fps=10,scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
ch = (np.abs(np.diff(x, axis=0)) > 6).mean((1, 2))
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
np.save(os.path.join(HERE, 'out', 'motion.npy'), ch)

runs, s = [], None
for i, c in enumerate(list(ch) + [1.0]):
    if c < 0.002:
        s = i if s is None else s
    else:
        if s is not None and (i - s) / 10 >= 4.0:
            runs.append((s / 10, i / 10))
        s = None
mmss = lambda t: f'{int(t // 60)}:{t % 60:04.1f}'
print(f'{len(ch) / 10:.1f} s analysed; frozen stretches of 4 s or more:')
for a, b in runs:
    print(f'  {mmss(a)} -> {mmss(b)}  {b - a:4.1f} s{"   <-- TOO LONG" if b - a > LIMIT else ""}')
print(f'total frozen: {sum(b - a for a, b in runs):.1f} s')
sys.exit(1 if any(b - a > LIMIT for a, b in runs) else 0)

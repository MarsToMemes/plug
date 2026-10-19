# Vectorise l'emblème (lion de l'OL, masque PNG) en un seul tracé SVG pour le contour qui se dessine.
# Usage : python -I tools/emblem.py public/club/lion.png src/emblem.json
import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, out = sys.argv[1:3]
a = np.asarray(Image.open(src).getchannel('A')) > 127
a = ndi.binary_closing(a, iterations=3)
a = ndi.binary_fill_holes(a)
h, w = a.shape
cs, _ = cv2.findContours((a * 255).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
c = max(cs, key=cv2.contourArea)
c = cv2.approxPolyDP(c, 1.2, True)[:, 0, :]
d = 'M' + ' L'.join(f'{x},{y}' for x, y in c) + ' Z'
json.dump({'w': w, 'h': h, 'd': d}, open(out, 'w'))
print(w, h, len(c), 'points')

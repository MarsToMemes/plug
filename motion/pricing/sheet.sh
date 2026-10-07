#!/bin/sh
# ./sheet.sh <Composition> <outdir> <f1,f2,...> : renders stills and a contact sheet (sheet.jpg)
set -e
mkdir -p "$2"
find "$2" -maxdepth 1 -name 'f*.png' -delete
COMP=$1 node render.mjs "$2" stills "$3" 2>&1 | grep -iE "error" || true
/home/user/brainfx/comp/bin/python -c "
import cv2,numpy as np,glob,sys
d=sys.argv[1];fs=sorted(glob.glob(d+'/f*.png'));ims=[cv2.resize(cv2.imread(f),(640,360)) for f in fs]
for i,f in zip(ims,fs): cv2.putText(i,f.split('/')[-1],(10,25),0,0.7,(0,0,255),2)
ims+=[np.zeros_like(ims[0])]*(-len(ims)%3)
cv2.imwrite(d+'/sheet.jpg',np.vstack([np.hstack(ims[i:i+3]) for i in range(0,len(ims),3)]))" "$2"

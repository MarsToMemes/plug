import cv2, glob, os, json, numpy as np, subprocess
casc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
out = {}
for f in sorted(glob.glob('src/*.mp4')):
    name = os.path.basename(f)[:-4]
    dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
    best = None
    for k in range(1, 8):
        t = dur * k / 8
        raw = subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',f,'-frames:v','1','-f','image2pipe','-vcodec','png','-'],capture_output=True).stdout
        img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
        if img is None: continue
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        fs = casc.detectMultiScale(g, 1.1, 6, minSize=(int(img.shape[0]*0.18),)*2)
        for (x,y,w,h) in fs:
            sc = w * h
            if best is None or sc > best[0]: best = (sc, t, (int(x),int(y),int(w),int(h)), img)
    if best:
        sc, t, (x,y,w,h), img = best
        cv2.imwrite(f'frames/{name}.png', img)
        out[name] = {'t': t, 'box': [x,y,w,h], 'W': img.shape[1], 'H': img.shape[0]}
json.dump(out, open('faces.json','w'), indent=1)
tiles=[]
for n,v in out.items():
    img=cv2.imread(f'frames/{n}.png'); x,y,w,h=v['box']
    cx,cy=x+w//2,y+h//2; s=int(w*1.25)
    c=img[max(0,cy-s):cy+s, max(0,cx-s):cx+s]; c=cv2.resize(c,(200,200)); cv2.putText(c,n[:8],(4,14),0,0.45,(0,255,255),1); tiles.append(c)
while len(tiles)%5: tiles.append(np.zeros((200,200,3),np.uint8))
rows=[np.hstack(tiles[i:i+5]) for i in range(0,len(tiles),5)]
cv2.imwrite('sheet.png', np.vstack(rows)); print(len(out))

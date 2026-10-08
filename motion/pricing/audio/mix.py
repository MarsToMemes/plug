"""Sound mix of the voice-timed episode: voice + music + sound effects.

    python audio/synth.py && python audio/mix.py
        -> audio/out/mix.wav (+ stems), then normalised by ffmpeg to -14 LUFS into public/audio/mix.m4a

Cues are pinned to the words of the voice-over (voice/transcript.json), not to raw seconds, so
moving a word moves its sound. Sound effects come from audio/synth.py (synthesised, no licence).
Music: "Subtle Shifts" (Suno, made by the author). It is 7:20 long for a 10:02 episode: it plays
from its start to its natural break at 4:00, then comes back in at 1:17.5 so that its own ending
lands on the end of the episode. Under the voice it is ducked by the voice's envelope.
"""
import json
import os
import subprocess
import wave

import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
END = 602.5  # VOICE.end in src/data/voice.ts
CUTS = [27.3, 44.2, 65.6, 90.4, 131.4, 203.9, 238.3, 275.3, 310.8, 352.4, 386.7, 416.9, 440.8, 457.1, 489.6, 525.5, 553.9, 579.8, 592.5]

WORDS = [w for s in json.load(open(os.path.join(ROOT, 'voice', 'transcript.json')))['segments'] for w in s['words']]


def w(word, after):
    """Start time of the first word beginning with `word` at or after `after` seconds."""
    for x in WORDS:
        if x['s'] >= after - 1.0 and x['w'].strip(" '.,?»«").lower().startswith(word.lower()):
            return x['s']
    raise KeyError(f'{word} after {after}')


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


SFX = {}


def sfx(name):
    if name not in SFX:
        SFX[name] = load(os.path.join(ROOT, 'public', 'sfx', f'{name}.wav'))
    return SFX[name]


# ------------------------------------------------------------------ cue sheet
# Rule: one sound = one visible event, starting when the event starts on screen (never before).
# Times are seconds of the episode. Beats of the scenes built on the narration's timing are exact;
# for the scenes stretched on the voice (anchors), `snap=True` moves the cue onto the first
# visible motion within ±0.6 s, measured on the rendered picture (audio/out/motion.npy).
C = []


def cue(t, name, db, **o):
    C.append([t, name, db, o])


def roll(t, n=3, db=-18, rate=1.0, snap=False):
    """An odometer: one tick per digit, right to left, 2 frames apart."""
    for k in range(n):
        cue(t + k * 2 / 30, 'price_tick', db - 2 * k, rate=rate + 0.05 * k, snap=snap)


# Whooshes only where a grid of units (seats, rooms, cells) flies to its new place during a
# transition; the whoosh peaks in the middle of the morph (cut - 0.08 s).
GRID_CUTS = (44.2, 65.6, 90.4, 131.4, 310.8, 352.4, 386.7, 416.9, 440.8)
for k, c in enumerate(GRID_CUTS):
    cue(c - 1.16, 'whoosh_long', -21, rate=(0.94, 1.0, 1.05)[k % 3])

# 01  (built on the voice)
cue(4.4, 'impact_soft', -21)                       # 287 € appears
cue(6.3, 'ui_click', -17)                          # the app closes
cue(9.2, 'ui_click', -18, rate=1.12)               # opened again
cue(10.22, 'price_rise', -16)                      # 287 -> 341
cue(13.34, 'price_rise', -15)                      # 341 -> 476
for t in (16.0, 17.7, 19.7):                       # même avion / siège / trajet
    cue(t - 0.1, 'digital_tick', -19)
cue(24.4, 'impact_soft', -16)                      # "qui décide de ce prix ?"

# 02
cue(42.8, 'clock_pulse', -21, snap=True)           # date d'expiration

# 04  take-off
cue(44.2, 'airport_ambience', -31, dur=21.4)
cue(52.78 - 4.4, 'airplane_pass', -17)             # loudest when the aircraft takes off
cue(54.0, 'impact_soft', -16, snap=True)           # "c'est terminé": zoom into the empty seats
cue(63.6, 'low_rumble', -21)                       # capacité perdue

# 05  the room tonight
cue(65.6, 'hotel_ambience', -31, dur=24.8)
cue(72.0, 'clock_pulse', -20, snap=True)           # 23:53
cue(74.76, 'room_lock', -16, snap=True)            # 00:00, the night is lost
cue(77.6, 'impact_soft', -19, snap=True)           # 1 chambre perdue

# 06  100 rooms, demand > capacity, price rises, Revenue Management
cue(110.5, 'data_stream', -22, snap=True)          # demand flows in
cue(115.4, 'impact_soft', -17, snap=True)          # demande > capacité
for t in (121.1, 123.4, 125.4):
    cue(t, 'price_rise', -17, snap=True)           # 100 -> 130 -> 170 -> 220
cue(129.0, 'impact_heavy', -14)                    # Revenue Management

# 07  fare classes (stretched), then layers (on the voice)
roll(138.4, 2, snap=True)                          # 79 €
cue(148.74, 'room_lock', -18, snap=True)           # the 79 class closes
cue(151.0, 'price_rise', -17, snap=True)           # 109
roll(152.6, 3, snap=True)                          # 149
cue(153.74, 'price_rise', -16, snap=True)          # 219
cue(155.3, 'digital_tick', -18)                    # 349, "beaucoup plus"
cue(158.3, 'ui_click', -18)                        # one seat
for k, t in enumerate((172.5, 173.9, 175.3, 176.6, 178.1)):
    cue(t, 'digital_tick', -17, rate=1 + 0.08 * k) # the five layers
cue(180.3, 'ui_click', -18)                        # 1 siège
cue(190.8, 'room_lock', -17)                       # épuisé
cue(191.7, 'room_lock', -18, rate=0.9)             # fermé
cue(193.2, 'ui_confirm', -18)                      # ouvert
roll(198.8, 2)                                     # 79 €
cue(199.5, 'impact_soft', -16)                     # 349 €

# 08  same room, different price, then the context
roll(210.3, 2, snap=True)                          # 89
cue(213.0, 'price_rise', -17, snap=True)           # 129
cue(215.72, 'price_rise', -16, snap=True)          # 179
cue(220.5, 'price_rise', -19, snap=True)           # 249
cue(224.5, 'ui_click', -19)                        # même lit
cue(226.4, 'ui_click', -19, rate=1.1)              # même vue
cue(228.9, 'impact_soft', -18)                     # le contexte
for k in range(5):
    cue(231.2 + 0.25 * k, 'digital_tick', -20)     # rooms counting down
cue(233.4, 'clock_pulse', -21)                     # days counting down
cue(236.1, 'algorithm_pulse', -19)                 # anticipated demand

# 10  the engine: each signal arrives when it is named
for t in (243.6, 248.0, 250.0, 252.7, 255.6, 257.0, 258.4, 259.4, 263.6):
    cue(t, 'digital_tick', -18)
cue(246.0, 'data_stream', -22)                     # énormément de signaux
cue(267.0, 'algorithm_pulse', -17)                 # prévision

# 19  two aircraft
for k in range(6):
    cue(277.7 + 0.22 * k, 'digital_tick', -21)     # A fills
for k in range(5):
    cue(283.4 + 0.3 * k, 'digital_tick', -21)      # B fills
cue(291.0, 'impact_soft', -16)                     # revenue bars
cue(304.0, 'data_stream', -22)                     # value flows to revenue
cue(308.9, 'impact_soft', -17)                     # Revenue Management

# 09  demand and price move together (stretched)
cue(321.0, 'price_rise', -18, snap=True)
cue(323.0, 'price_rise', -17, snap=True)
cue(333.46, 'room_lock', -18, snap=True)           # low fares closed
roll(338.5, 3, rate=0.85, snap=True)               # price comes back down

# 03  inventory disappears with time
cue(369.7, 'clock_pulse', -21, snap=True)          # les jours passent
cue(378.7, 'room_lock', -17, snap=True)            # the deadline
cue(383.0, 'impact_soft', -17, snap=True)          # précieuse

# 11  the analytical engine
cue(395.0, 'data_stream', -22, snap=True)
cue(408.0, 'algorithm_pulse', -17, snap=True)
cue(413.0, 'price_rise', -16, snap=True)           # prix recommandé 219 €

# 13  a big event
cue(419.0, 'low_rumble', -19)
cue(420.38, 'impact_soft', -19, snap=True)         # grand événement
cue(422.96, 'data_stream', -21, snap=True)         # thousands of people
cue(438.1, 'price_rise', -16, snap=True)           # pression sur le prix

# 12  days of the week
cue(449.6, 'price_rise', -18, snap=True)          # the curve climbs to the weekend
roll(452.1, 3, snap=True)                          # mercredi
roll(454.2, 3, snap=True)                          # dimanche
cue(455.5, 'impact_soft', -18, snap=True)          # rareté

# 14  book now or wait: the question (scene 14), then the price curve written by the spark (SparkCurve, on the voice)
cue(465.2, 'digital_tick', -19)                    # the spark lands on 129 €
cue(470.08, 'price_rise', -15)                     # 214 €
cue(471.1, 'impact_soft', -18)                     # rewind
roll(475.8, 3, rate=0.85)                          # 119 €
for t in (482.25, 483.0, 483.8):                   # the forecasts redrawn
    cue(t, 'digital_tick', -21)

# 20  the ticket at 219 €
cue(494.4, 'impact_soft', -17)                     # 219 € on the ticket
cue(504.4, 'digital_tick', -18)                    # becomes the price node

# 17  the machine
cue(512.5, 'algorithm_pulse', -17, snap=True)      # the loop starts
cue(521.5, 'impact_heavy', -15)              # c'est une décision

# 15  capacity and the clock
cue(546.0, 'clock_pulse', -20, snap=True)          # chaque départ, chaque nuit
cue(550.2, 'digital_tick', -19)                    # l'horloge

# 18a / 16 / 18b
cue(556.94, 'price_rise', -16, snap=True)          # 129 -> 219
cue(567.02, 'algorithm_pulse', -17, snap=True)     # le système
cue(569.66, 'data_stream', -22, snap=True)         # la demande…
cue(588.78, 'impact_soft', -15, snap=True)         # capacité limitée
cue(597.4, 'impact_heavy', -13)                    # jamais vraiment fixe
cue(599.0, 'impact_soft', -19, snap=True)          # demande -> capacité -> temps -> prix


# Snap to the picture.
MOTION = os.path.join(HERE, 'out', 'motion.npy')
if os.path.exists(MOTION):
    ch = np.load(MOTION)  # visible change between frame i and i+1, 10 fps
    for c in C:
        if not c[3].get('snap'):
            continue
        t = c[0]
        # The event starts where the visible change jumps the most within ±0.8 s.
        a, b = int((t - 0.8) * 10), int((t + 0.8) * 10)
        jump = np.diff(ch[max(0, a - 1):b])
        if len(jump) and jump.max() > 0.0008:
            c[0] = (max(0, a - 1) + int(np.argmax(jump)) + 1) / 10
C = [tuple(c) for c in C]

# ------------------------------------------------------------------ render
def resample(x, rate):
    if rate == 1:
        return x
    n = int(len(x) / rate)
    src = np.arange(n) * rate
    return np.stack([np.interp(src, np.arange(len(x)), x[:, c]) for c in (0, 1)], 1)


def fades(n, fin, fout):
    e = np.ones(n)
    a, b = min(n, int(fin * SR)), min(n, int(fout * SR))
    if a: e[:a] = np.linspace(0, 1, a)
    if b: e[n - b:] *= np.linspace(1, 0, b)
    return e[:, None]


def add(bus, t, x):
    i = int(round(t * SR))
    if i < 0:
        x, i = x[-i:], 0
    n = min(len(x), len(bus) - i)
    if n > 0:
        bus[i:i + n] += x[:n]


N = int(END * SR)
voice = np.zeros((N, 2))
v = load(os.path.join(ROOT, 'public', 'voice', 'voix-off.mp3'))
voice[:min(N, len(v))] = v[:N]
voice *= 10 ** (6.0 / 20)  # the take is quiet (-22.6 LUFS)

fx = np.zeros((N, 2))
for t, name, db, o in C:
    x = resample(sfx(name), o.get('rate', 1.0)) * 10 ** (db / 20)
    if 'dur' in o:
        x = x[:int(o['dur'] * SR)]
        x = x * fades(len(x), 1.5, 1.5)
    add(fx, t, x)

# Music: 0 -> 240 s, then 77.5 s -> end, joined in the track's own silence at 4:00.
m = load(os.path.join(ROOT, 'public', 'music', 'subtle-shifts.mp3'))
music = np.zeros((N, 2))
a = m[:int(241.0 * SR)] * fades(int(241.0 * SR), 2.0, 1.2)
add(music, 0.0, a)
start_b = 240.0
b = m[int(77.5 * SR) + int((start_b - 240.0) * SR):]
b = b[:N - int(start_b * SR)]
b = b * fades(len(b), 1.6, 4.0)
add(music, start_b, b)

# Duck the music under the voice: envelope of the voice, fast attack, slow release.
hop = SR // 100
env = np.sqrt(np.convolve((voice ** 2).mean(1), np.ones(hop) / hop, mode='same'))[::hop]
active = np.clip((20 * np.log10(env + 1e-9) + 40) / 15, 0, 1)  # -40 dBFS -> 0, -25 dBFS -> 1
sm = np.zeros_like(active)
for k in range(1, len(active)):
    coef = 0.5 if active[k] > sm[k - 1] else 0.035  # ~20 ms attack, ~300 ms release
    sm[k] = sm[k - 1] + coef * (active[k] - sm[k - 1])
duck = 10 ** ((-15.0 - 5.0 * np.interp(np.arange(N) / hop, np.arange(len(sm)), sm)) / 20)
music *= duck[:, None]

mix = voice + music + fx
# The last image holds after the voice: let the mix fade with the picture.
mix *= fades(N, 0.0, 2.5)
os.makedirs(os.path.join(ROOT, 'public', 'audio'), exist_ok=True)
for name, bus in (('mix', mix), ('stem-fx', fx), ('stem-music', music)):
    path = os.path.join(HERE, 'out', f'{name}.wav')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    peak = np.abs(bus).max()
    data = bus / peak * 0.89 if peak > 0.89 else bus
    with wave.open(path, 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((np.clip(data, -1, 1) * 32767).astype('<i2').tobytes())
print(f'{len(C)} cues, peak before normalising {20 * np.log10(np.abs(mix).max()):.1f} dBFS')

src = os.path.join(HERE, 'out', 'mix.wav')
dst = os.path.join(ROOT, 'public', 'audio', 'mix.m4a')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-c:a', 'aac', '-b:a', '192k', dst], check=True)
print('->', dst)

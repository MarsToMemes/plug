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
# (time in s, sound, gain dB, options)  options: dur (cut + fade), rate (pitch/speed)
C = []


def cue(t, name, db, **o):
    C.append((t, name, db, o))


def roll(t, n, db=-17, gap=0.055, rate=1.0, step=0.04):
    """A price counter flipping digit after digit, landing on t."""
    for k in range(n):
        cue(t - (n - 1 - k) * gap, 'price_tick', db, rate=rate + step * k)


# Transitions: every cut is a camera move from one scene to the next (bridge of 2 s on the cut).
for i, c in enumerate(CUTS):
    cue(c - 1.05, 'whoosh_long', -21, rate=(0.92, 1.0, 1.06)[i % 3])

# 01  287 -> 341 -> 476
cue(0.0, 'airport_ambience', -29, dur=27.6)
cue(w('cherchez', 2), 'search_swipe', -19)
roll(w('287', 4), 3)
cue(w('287', 4), 'impact_soft', -19)
cue(w('fermez', 6), 'ui_click', -16)
cue(w('revenez', 9), 'notification', -22)
cue(w('341', 10) - 0.9, 'price_rise', -16)
cue(w('476', 13) - 0.9, 'price_rise', -15)
cue(w('476', 13), 'impact_soft', -16)
cue(12.6, 'airplane_pass', -24)
cue(w('pourquoi', 21) - 0.8, 'low_rumble', -19)
cue(w('décide', 25) - 2.6, 'tension_riser', -22)

# 02  seats / rooms, expiry date
cue(w('sièges', 34), 'ui_click', -20)
cue(w('chambres', 36), 'room_lock', -21)
cue(w('expiration', 42) - 1.6, 'clock_pulse', -20)
cue(w('expiration', 42), 'impact_soft', -16)

# 04  180 seats, take-off, 1 euro, lost capacity
cue(44.2, 'airport_ambience', -30, dur=21.6)
for k in range(6):
    cue(w('180', 46) + 0.08 * k, 'digital_tick', -22, rate=1 + 0.05 * k)
cue(w('décollé', 52) - 4.4, 'airplane_pass', -16)
cue(w('terminé', 53), 'impact_soft', -15)
roll(w('1', 57.5), 4, rate=1.15, step=-0.06)
cue(w('perdue', 63) - 0.6, 'low_rumble', -19)

# 05  Tuesday night, lost by Wednesday
cue(65.6, 'hotel_ambience', -30, dur=25)
cue(w('chambre', 68), 'notification', -23)
cue(w('mercredi', 74) - 1.4, 'clock_pulse', -20)
cue(w('définitivement', 75), 'room_lock', -16)

# 06  100 rooms at 100 euros, the real question, Revenue Management
cue(90.4, 'hotel_ambience', -31, dur=16)
cue(w('hôtel', 91.5), 'ui_click', -19)
roll(w('100', 95), 3)
cue(w('chercheront', 105), 'notification', -24)
cue(w('vraie', 121) - 0.6, 'low_rumble', -20)
cue(w('Revenue', 128) - 3.0, 'tension_riser', -19)
cue(w('Revenue', 128), 'impact_heavy', -13)

# 07  fare classes 79 / 109 / 149 / 219 / 349
cue(131.4, 'airport_ambience', -32, dur=24)
roll(w('79', 138), 3)
cue(w('réservent', 140), 'ui_click', -19)
cue(w('réservent', 140) + 0.35, 'ui_confirm', -20)
cue(w('disparaître', 147), 'room_lock', -18)
cue(w('109', 150) - 0.9, 'price_rise', -17)
roll(w('149', 152), 4)
roll(w('219', 153), 4)
cue(w('219', 153), 'impact_soft', -17)
cue(w('beaucoup', 156), 'price_rise', -19, rate=0.9)
cue(w('fondamentale', 167), 'impact_soft', -17)
for t, n in ((172.6, '79'), (174.0, '109'), (175.4, '149'), (176.7, '219'), (178.2, '349')):
    cue(w(n, t - 0.2), 'digital_tick', -17)
cue(w('349', 178), 'impact_soft', -18)
cue(w('fermées', 191), 'room_lock', -18)
cue(w('différents', 199), 'impact_soft', -16)

# 08  same room, 89 / 129 / 179
cue(203.9, 'hotel_ambience', -31, dur=34.5)
roll(w('89', 210), 3)
cue(w('129', 212.5) - 0.9, 'price_rise', -17)
cue(w('179', 215) - 0.9, 'price_rise', -16)
cue(w('179', 215), 'impact_soft', -17)
cue(w('évoluer', 220), 'notification', -24)
cue(w('changé', 222.5), 'impact_soft', -16)
cue(w('contexte', 229), 'impact_soft', -17)
cue(w('temps', 233), 'clock_pulse', -21)

# 10  the engine: signals, forecasts
cue(w('signaux', 246) - 1.2, 'data_stream', -21)
cue(w('demande', 247.5), 'algorithm_pulse', -17)
cue(w('marchés', 262) - 0.5, 'data_stream', -21)
cue(w('prévision', 268), 'algorithm_pulse', -17)
cue(w('subtil', 272.5), 'impact_soft', -17)

# 19  two planes: 100 % cheap vs 85 % dear
cue(272.8, 'airplane_pass', -21)
for k in range(8):
    cue(w('rempli', 278) + 0.07 * k, 'digital_tick', -23, rate=1 + 0.04 * k)
cue(w('100%', 278.8), 'impact_soft', -18)
roll(w('bas', 282.3), 3, rate=0.9, step=-0.05)
for k in range(7):
    cue(w('rempli', 284) + 0.07 * k, 'digital_tick', -23, rate=1 + 0.04 * k)
cue(w('85%', 284.8), 'impact_soft', -18)
cue(w('chère', 289.5) - 0.9, 'price_rise', -16)
cue(w('revenus', 292) - 2.4, 'tension_riser', -22)
cue(w('revenus', 292) + 0.3, 'impact_soft', -15)
cue(w('optimiser', 304), 'algorithm_pulse', -18)
cue(w('Revenue', 309), 'impact_soft', -14)

# 09  demand -> close low fares / stimulate
cue(w('changer', 312.3), 'notification', -23)
cue(w('anticiper', 320.5), 'algorithm_pulse', -17)
cue(w('fermer', 333), 'room_lock', -16)
cue(w('inverse', 335.5), 'whoosh_short', -21)
roll(w('attractifs', 341), 3, rate=0.9, step=-0.05)
cue(w('signal', 346.5), 'impact_soft', -17)

# 03  30 days before, time passing, last rooms
cue(352.4, 'hotel_ambience', -31, dur=34)
cue(w('30', 358), 'notification', -23)
cue(w('passent', 369.5) - 0.3, 'clock_pulse', -20)
cue(w('diminue', 374.5), 'room_lock', -19)
cue(w('limite', 377) - 2.8, 'tension_riser', -22)
cue(w('précieuse', 383), 'impact_soft', -15)

# 11  the system is not "the later, the dearer"
roll(w('réduire', 395), 3, rate=0.9, step=-0.05)
cue(w('système', 402.5), 'algorithm_pulse', -18)
cue(w('maximise', 411), 'impact_soft', -15)

# 13  a big event, same 100 rooms
cue(w('événement', 420) - 1.5, 'low_rumble', -18)
cue(w('événement', 420), 'impact_soft', -15)
cue(w('milliers', 422.5), 'data_stream', -19)
cue(w('augmente', 431) - 0.9, 'price_rise', -16)
cue(w('suivre', 438) - 0.9, 'price_rise', -15)

# 12  school holidays, congress: scarcity changes
cue(w('Vacances', 442.5), 'clock_pulse', -21)
cue(w('voyager', 451) - 0.9, 'price_rise', -17)
cue(w('rareté', 455), 'impact_soft', -15)

# 14  book at 129, see 214, or wait and see it drop
cue(w('réserver', 465) - 0.4, 'search_swipe', -19)
cue(w('réserver', 465), 'ui_click', -16)
roll(w('129', 466), 3)
cue(w('129', 466) + 0.2, 'ui_confirm', -18)
cue(w('attendre', 467.8), 'clock_pulse', -21)
cue(w('214', 470) - 0.9, 'price_rise', -15)
cue(w('attendre', 472.8), 'clock_pulse', -21)
roll(w('baisser', 475.5), 4, rate=1.1, step=-0.07)
cue(w('système', 481.5), 'algorithm_pulse', -17)
cue(w('fixe', 485.6), 'impact_soft', -16)

# 17  219 euros is a decision
roll(w('219', 494), 3)
cue(w('219', 500), 'impact_soft', -18)
cue(w('situation', 506.5), 'algorithm_pulse', -17)
cue(w('prévisions', 511.5) - 0.6, 'data_stream', -21)
cue(w('219', 513.5), 'impact_soft', -16)
cue(w('décision', 521) - 3.0, 'tension_riser', -19)
cue(w('décision', 521), 'impact_heavy', -13)

# 15  limited capacity, a seat after take-off, the clock
cue(w('limitée', 531.3), 'room_lock', -19)
cue(w('siège', 536) - 4.3, 'airplane_pass', -19)
cue(w('nuit', 541.5), 'room_lock', -20)
cue(w('Chaque', 545.5), 'clock_pulse', -20)
for k in range(5):
    cue(w('horloge', 550) + 0.5 * k, 'digital_tick', -19)

# 18a  129 -> 219: the system around the ticket changed
cue(w('129', 556.5) - 0.2, 'price_rise', -16)
cue(w('système', 566.5), 'algorithm_pulse', -17)
cue(w('demande', 569.5) - 0.4, 'data_stream', -21)

# 16  limited capacity at a precise moment
cue(579.8, 'low_rumble', -22)
cue(w('limitée', 588.5), 'impact_soft', -15)
cue(w('moment', 590), 'clock_pulse', -21)

# 18b  the price was never really fixed
cue(w('fixe', 597) - 3.0, 'tension_riser', -18)
cue(w('fixe', 597), 'impact_heavy', -12)
for k in range(4):
    cue(599.0 + 0.4 * k, 'ui_click', -21, rate=1 + 0.06 * k)
cue(600.6, 'impact_soft', -18)


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

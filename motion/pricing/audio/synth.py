"""Synthesised sound effects for the pricing episode (no third-party samples, no licence needed).

    python audio/synth.py            -> public/sfx/<name>.wav (48 kHz, stereo, 16-bit)

Every sound is built from sines and seeded noise, shaped by envelopes and FFT filters, so the
result is the same on every run.
"""
import os
import wave

import numpy as np

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sfx')
rng = np.random.default_rng(7)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def brown(dur):
    x = np.cumsum(noise(dur))
    x -= np.convolve(x, np.ones(4801) / 4801, mode='same')  # remove the drift
    return x / (np.abs(x).max() + 1e-9)


def spectral(x, gain):
    """Static filter: gain(freqs) -> amplitude."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * gain(f), len(x))


def lowpass(x, fc, order=2):
    return spectral(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))


def highpass(x, fc, order=2):
    return spectral(x, lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order)))


def band_sweep(x, center, width=0.5, n=1024):
    """Time-varying band-pass: center(t in 0..1) -> Hz, width in octaves. Overlap-add STFT."""
    hop = n // 4
    win = np.hanning(n)
    pad = np.concatenate([np.zeros(n), x, np.zeros(n)])
    out = np.zeros_like(pad)
    f = np.fft.rfftfreq(n, 1 / SR)
    for s in range(0, len(pad) - n, hop):
        c = center(np.clip((s - n) / max(1, len(x)), 0, 1))
        g = np.exp(-0.5 * (np.log2(np.maximum(f, 1) / c) / width) ** 2)
        out[s:s + n] += np.fft.irfft(np.fft.rfft(pad[s:s + n] * win) * g, n) * win
    return out[n:n + len(x)] / 1.5


def env(dur, a, d, curve=4.0):
    """Attack a (s), then exponential-ish decay over d (s)."""
    t = t_(dur)
    e = np.where(t < a, t / max(a, 1e-6), np.exp(-curve * (t - a) / max(d, 1e-6)))
    return e


def bell(dur, peak=0.5, p=2.0):
    t = t_(dur) / dur
    return np.where(t < peak, (t / peak) ** p, ((1 - t) / (1 - peak)) ** p)


def sine(freq, dur, phase=0.0):
    t = t_(dur)
    if callable(freq):
        ph = 2 * np.pi * np.cumsum(freq(t / dur)) / SR
        return np.sin(ph + phase)
    return np.sin(2 * np.pi * freq * t + phase)


def tone(freq, dur, a=0.004, d=0.3, harm=(1.0, 0.25, 0.08)):
    x = sum(h * sine(freq * (k + 1), dur) for k, h in enumerate(harm))
    return x * env(dur, a, d)


def reverb(x, tail=1.2, mix=0.25):
    ir = noise(tail) * np.exp(-6 * t_(tail) / tail)
    ir = lowpass(ir, 3500)
    ir /= np.sqrt((ir ** 2).sum())
    wet = np.fft.irfft(np.fft.rfft(np.concatenate([x, np.zeros(len(ir))])) * np.fft.rfft(np.concatenate([ir, np.zeros(len(x))])), len(x) + len(ir))
    dry = np.concatenate([x, np.zeros(len(ir))])
    return dry + mix * wet


def place(total, *parts):
    """parts: (offset s, signal)."""
    out = np.zeros(int(total * SR))
    for off, s in parts:
        i = int(off * SR)
        n = min(len(s), len(out) - i)
        out[i:i + n] += s[:n]
    return out


def stereo(x, pan=0.0):
    if x.ndim == 2:
        return x
    p = (np.asarray(pan) + 1) / 2  # 0 left .. 1 right
    return np.stack([x * np.cos(p * np.pi / 2), x * np.sin(p * np.pi / 2)], 1)


def fade(x, fin=0.005, fout=0.02):
    n = len(x)
    e = np.ones(n)
    a, b = int(fin * SR), int(fout * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if b: e[n - b:] = np.minimum(e[n - b:], np.linspace(1, 0, b))
    return x * (e[:, None] if x.ndim == 2 else e)


def save(name, x, peak_db=-1.0):
    x = stereo(x)
    x = fade(x)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, f'{name}.wav'), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())
    print(f'{name:16s} {len(x) / SR:5.2f} s')


# ---------------------------------------------------------------- interface / numbers
def click(freq=2600, dur=0.05, body=0.012):
    n = highpass(noise(dur), 1500) * env(dur, 0.0005, 0.004, 5)
    return 0.5 * n + tone(freq, dur, 0.0005, body, (1.0, 0.3))


# price_tick: one digit flipping (a dry mechanical-digital tick)
save('price_tick', click(3100, 0.06, 0.01), -3)

# price_rise: a short run of ticks that speeds up and climbs, over a soft rising tone (129 -> 349)
dur = 1.3
ticks = [(0.02 + 0.9 * (1 - (1 - k / 13) ** 1.6), click(2200 + 120 * k, 0.05, 0.008) * (0.5 + 0.04 * k)) for k in range(14)]
rise = sine(lambda u: 420 + 540 * u ** 1.4, dur) * bell(dur, 0.85, 1.6) * 0.22
rise += sine(lambda u: 840 + 1080 * u ** 1.4, dur) * bell(dur, 0.85, 1.6) * 0.06
save('price_rise', place(dur, *ticks) + rise, -2)

# ui_click: a soft touch on glass
save('ui_click', click(1900, 0.07, 0.016), -4)

# ui_confirm: two rising notes, round and short (booking done)
c = place(0.9, (0, tone(1318.5, 0.6, 0.003, 0.35)), (0.09, tone(1975.5, 0.8, 0.003, 0.5)))
save('ui_confirm', reverb(c, 0.8, 0.18), -3)

# notification: one soft bell with a gentle partial, a little air around it
n = tone(1046.5, 1.2, 0.006, 0.9, (1.0, 0.0, 0.18, 0.0, 0.05)) + 0.4 * tone(1568, 1.2, 0.01, 0.6, (1.0,))
save('notification', reverb(n, 1.0, 0.25), -5)

# digital_tick: a very small, very high tick (time passing)
save('digital_tick', click(4200, 0.03, 0.004) * 0.8, -6)

# clock_pulse: tick-tock, two seconds (four beats), woody
def wood(freq):
    d = 0.09
    return band_sweep(noise(d), lambda u: freq, 0.35) * env(d, 0.0008, 0.03, 5) * 3 + 0.4 * tone(freq / 2, d, 0.001, 0.03, (1.0,))
save('clock_pulse', place(2.0, (0.0, wood(1700)), (0.5, wood(1300)), (1.0, wood(1700)), (1.5, wood(1300))), -4)

# search_swipe: a short swipe across a screen
d = 0.4
save('search_swipe', band_sweep(noise(d), lambda u: 900 * 4 ** u, 0.45) * bell(d, 0.6, 1.5), -5)

# data_stream: a quiet, dense flow of blips (data leaving towards the algorithm)
d = 3.0
blips = [(rng.uniform(0, d - 0.05), tone(rng.choice([1760, 2093, 2349, 2637, 3136]), 0.04, 0.001, 0.012, (1.0,)) * rng.uniform(0.3, 1.0)) for _ in range(90)]
ds = place(d, *blips) * bell(d, 0.3, 1.0)
ds += 0.15 * band_sweep(noise(d), lambda u: 2500 + 1500 * u, 0.6) * bell(d, 0.3, 1.0)
save('data_stream', stereo(lowpass(ds, 6000), np.linspace(-0.4, 0.4, len(ds))), -6)

# algorithm_pulse: three low pulses, like a machine thinking
def pulse():
    d = 0.42
    return (sine(lambda u: 110 - 30 * u, d) + 0.35 * sine(lambda u: 220 - 60 * u, d)) * env(d, 0.01, 0.35, 4)
ap = place(1.6, (0, pulse()), (0.45, pulse() * 0.8), (0.9, pulse() * 0.65))
ap += 0.25 * place(1.6, (0, click(3000, 0.04, 0.006)), (0.45, click(3300, 0.04, 0.006)), (0.9, click(3600, 0.04, 0.006)))
save('algorithm_pulse', ap, -4)

# ---------------------------------------------------------------- tension / impacts / motion
# low_rumble: six seconds of deep tension, swelling in and out
d = 6.0
r = lowpass(brown(d), 110, 3) + 0.35 * sine(43.65, d) + 0.15 * sine(65.4, d)
save('low_rumble', r * bell(d, 0.45, 1.4), -4)

# tension_riser: three seconds rising to the reveal (cue it so it ends on the word)
d = 3.0
rs = band_sweep(noise(d), lambda u: 400 * 8 ** (u ** 1.5), 0.5) * (t_(d) / d) ** 2.2
rs += 0.3 * sine(lambda u: 180 + 520 * u ** 2, d) * (t_(d) / d) ** 2
save('tension_riser', fade(rs, 0.05, 0.03), -3)

# impact_soft: a felt thump under an important number
d = 0.9
im = sine(lambda u: 70 - 25 * u, d) * env(d, 0.003, 0.5, 4) + 0.25 * lowpass(noise(d), 900) * env(d, 0.001, 0.05, 5)
save('impact_soft', reverb(im, 0.8, 0.15), -3)

# impact_heavy: a deep boom with a long tail (major reveal)
d = 2.4
ih = sine(lambda u: 58 - 30 * u, d) * env(d, 0.002, 1.6, 3.5) + 0.5 * lowpass(noise(d), 1400) * env(d, 0.001, 0.12, 5)
ih += 0.3 * sine(lambda u: 116 - 50 * u, d) * env(d, 0.002, 0.7, 4)
save('impact_heavy', reverb(ih, 2.0, 0.35), -1)

# whoosh_short: half a second of air
d = 0.5
save('whoosh_short', band_sweep(noise(d), lambda u: 500 + 2200 * np.sin(np.pi * u), 0.6) * bell(d, 0.55, 2.0), -4)

# whoosh_long: the camera travelling to the next scene, left to right
d = 1.8
wl = band_sweep(noise(d), lambda u: 350 + 1500 * np.sin(np.pi * u) ** 1.5, 0.7) * bell(d, 0.6, 1.8)
wl += 0.4 * lowpass(brown(d), 200) * bell(d, 0.6, 1.8)
save('whoosh_long', stereo(wl, np.linspace(-0.7, 0.7, len(wl))), -3)

# ---------------------------------------------------------------- places
# airplane_pass: a jet passing overhead, about ten seconds (doppler, left to right)
d = 10.0
u = t_(d) / d
prox = 1 / (1 + ((u - 0.45) / 0.14) ** 2)  # loudest when it is above us
roar = band_sweep(noise(d), lambda v: 300 + 1200 / (1 + ((v - 0.45) / 0.14) ** 2), 1.2)
roar += 1.5 * lowpass(brown(d), 180, 2)
whine = sine(lambda v: 1650 - 500 * np.tanh((v - 0.45) / 0.06), d) * 0.08
ap = (roar * 0.6 + whine) * prox ** 1.3
save('airplane_pass', stereo(ap, np.clip((u - 0.45) * 2.4, -0.9, 0.9)), -3)

# airport_ambience: a large hall, very far away, with one distant two-note chime (30 s)
d = 30.0
hall = lowpass(noise(d), 700, 2) * 0.5 + 0.8 * lowpass(brown(d), 160, 2)
hall *= 1 + 0.15 * sine(0.07, d)
chime = 0.1 * reverb(place(2.0, (0, tone(784, 1.4, 0.01, 1.0, (1.0, 0.1))), (0.55, tone(659.3, 1.4, 0.01, 1.0, (1.0, 0.1)))), 2.5, 0.6)
amb = place(d, (0, hall), (13.0, chime))
save('airport_ambience', fade(stereo(amb, 0.0) + 0.3 * stereo(lowpass(noise(d), 500) * 0.3, 0.0), 1.5, 1.5), -9)

# hotel_ambience: a quiet room tone, air conditioning and a faint electrical hum (30 s)
d = 30.0
room = lowpass(brown(d), 240, 2) + 0.15 * lowpass(noise(d), 1200, 2) + 0.05 * sine(100, d) + 0.03 * sine(200, d)
save('hotel_ambience', fade(room, 1.5, 1.5), -12)

# room_lock: a keycard lock — a click, a short motor, a low double beep (booked / unavailable)
d = 0.8
lk = place(d,
           (0.00, click(1500, 0.06, 0.02)),
           (0.05, band_sweep(noise(0.12), lambda v: 1800, 0.5) * bell(0.12, 0.5, 1) * 0.6),
           (0.25, tone(740, 0.12, 0.003, 0.1, (1.0, 0.2)) * 0.7),
           (0.42, tone(554, 0.16, 0.003, 0.14, (1.0, 0.2)) * 0.7))
save('room_lock', lk, -4)

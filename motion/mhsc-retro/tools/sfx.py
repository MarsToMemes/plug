"""Effets sonores de la carte BUUUT, fabriqués par synthèse (aucun échantillon externe, libres de droits).

Usage : python tools/sfx.py public/sfx      (nécessite numpy et scipy)
Chaque effet est déterministe (graine fixe) : relancer le script redonne exactement les mêmes fichiers.
"""
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt, sosfiltfilt

SR = 48000
rng = np.random.default_rng(8)


def t(dur):
    return np.arange(int(dur * SR)) / SR


def lowpass(x, hz, order=2):
    return sosfilt(butter(order, hz, 'low', fs=SR, output='sos'), x)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, 'high', fs=SR, output='sos'), x)


def sweep_filter(x, f0, f1, curve):
    """Passe-bas dont la coupure suit curve (0→1) entre f0 et f1, par blocs de 256 échantillons."""
    out = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), 256):
        c = curve[min(i, len(curve) - 1)]
        fc = f0 * (f1 / f0) ** c
        b, a = butter(2, min(fc, SR / 2 - 100), 'low', fs=SR)
        from scipy.signal import lfilter, lfilter_zi
        if zi is None:
            zi = lfilter_zi(b, a) * 0
        out[i:i + 256], zi = lfilter(b, a, x[i:i + 256], zi=zi)
    return out


def reverb(x, decay=0.35, taps=((0.029, 0.5), (0.037, 0.4), (0.053, 0.3), (0.071, 0.22))):
    y = x.copy()
    for d, g in taps:
        n = int(d * SR)
        for k in range(1, 6):
            if n * k < len(y):
                y[n * k:] += x[:-n * k] * g * (decay ** (k - 1))
    return y


def stereo(x, pan_curve=None):
    if pan_curve is None:
        return np.stack([x, x], 1)
    left = x * np.cos((pan_curve + 1) * np.pi / 4)
    right = x * np.sin((pan_curve + 1) * np.pi / 4)
    return np.stack([left, right], 1) * np.sqrt(2)


def save(path, x, peak=0.89):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    data = (x * 32767).astype(np.int16)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def whoosh(dur=0.55, peak_at=0.6, f0=250, f1=5000, pan=(-0.7, 0.7)):
    tt = t(dur)
    p = tt / dur
    env = np.where(p < peak_at, (p / peak_at) ** 2, ((1 - p) / (1 - peak_at)) ** 1.5)
    noise = rng.standard_normal(len(tt))
    curve = np.where(p < peak_at, p / peak_at, 1 - (p - peak_at) / (1 - peak_at))
    x = sweep_filter(noise, f0, f1, curve) * env
    return stereo(x, np.linspace(pan[0], pan[1], len(tt)))


def impact(dur=1.8, f_start=110, f_end=38, click=1.0, rumble=0.5):
    tt = t(dur)
    freq = f_end + (f_start - f_end) * np.exp(-tt * 9)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    sub = np.sin(phase) * np.exp(-tt * 2.6)
    hit = highpass(rng.standard_normal(len(tt)), 1500) * np.exp(-tt * 60) * click
    body = lowpass(rng.standard_normal(len(tt)), 400) * np.exp(-tt * 5) * rumble
    x = sub * 1.0 + hit * 0.5 + body * 0.6
    x = np.tanh(x * 1.6)  # saturation légère pour le punch
    return stereo(reverb(x, 0.3))


def glitch(dur=0.42):
    n = int(dur * SR)
    x = np.zeros(n)
    step = int(0.018 * SR)
    for i in range(0, n, step):
        f = rng.choice([180, 360, 720, 1440, 2880, 95])
        seg = np.arange(min(step, n - i)) / SR
        wave_ = np.sign(np.sin(2 * np.pi * f * seg))
        if rng.random() < 0.35:
            wave_ = rng.standard_normal(len(seg))
        x[i:i + step] = wave_ * (0 if rng.random() < 0.18 else 1)
    x = np.round(x * 6) / 6  # bitcrush
    env = np.minimum(1, (1 - np.arange(n) / n) * 3)
    return stereo(highpass(x, 120) * env * 0.6, (rng.random(n) - 0.5) * 0.6)


def shimmer(dur=1.4):
    tt = t(dur)
    x = np.zeros_like(tt)
    for f, a in ((2093, 1), (2637, 0.7), (3136, 0.6), (4186, 0.45), (5274, 0.3), (6272, 0.2)):
        x += a * np.sin(2 * np.pi * f * tt + rng.random() * 6.28)
    env = (1 - np.exp(-tt * 60)) * np.exp(-tt * 3.2) * (1 + 0.25 * np.sin(2 * np.pi * 11 * tt))
    sweep = whoosh(0.35, 0.8, 2000, 9000, (0.3, -0.3))[:, 0] * 0.4
    y = x * env
    y[:len(sweep)] += sweep
    return stereo(reverb(y, 0.45), np.sin(2 * np.pi * 0.7 * tt) * 0.4)


def riser(dur=0.35):
    """Aspiration courte avant le zoom traversant (souffle qui monte puis coupe net)."""
    w = whoosh(dur, 0.97, 300, 8000, (0, 0))
    return w


def main(out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    save(out / 'whoosh-lettres.wav', whoosh(0.45, 0.55, 400, 6000, (0.8, -0.6)), 0.7)
    save(out / 'impact-metz.wav', impact(1.6, 120, 40, 1.0, 0.6))
    save(out / 'glitch.wav', glitch(), 0.6)
    save(out / 'impact-but.wav', impact(2.2, 95, 34, 0.8, 0.9))
    save(out / 'whoosh-sortie.wav', whoosh(0.4, 0.4, 300, 7000, (-0.5, 0.9)), 0.7)
    save(out / 'impact-numero.wav', impact(1.4, 140, 45, 1.2, 0.4), 0.85)
    save(out / 'aspiration.wav', riser(0.36), 0.8)
    save(out / 'atterrissage.wav', impact(1.2, 90, 40, 0.6, 0.5), 0.75)
    save(out / 'scintillement.wav', shimmer(), 0.55)
    save(out / 'impact-final.wav', impact(2.6, 80, 30, 1.0, 1.0))
    print('ok', sorted(p.name for p in out.glob('*.wav')))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'public/sfx')

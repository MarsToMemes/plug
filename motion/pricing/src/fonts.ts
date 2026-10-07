import { continueRender, delayRender, staticFile } from 'remotion';

/**
 * Registers a font copied into public/fonts by scripts/google_font.py (offline, reproducible).
 * The frame waits until the font is loaded.
 *   registerFont('Space Grotesk', 'fonts/spacegrotesk/SpaceGrotesk[wght].ttf', { weight: '300 700' });
 *
 * Any Google Font can also be loaded by name with @remotion/google-fonts
 * (import { loadFont } from '@remotion/google-fonts/Anton'), but that fetches from Google at
 * render time: it needs a normal internet access (it does not work in the cloud container,
 * whose browser cannot reach Google through the proxy with certificate checks on).
 */
export function registerFont(family: string, path: string, descriptors: FontFaceDescriptors = {}) {
  const handle = delayRender(`font ${family}`);
  new FontFace(family, `url(${staticFile(path)})`, descriptors).load()
    .then((f) => { document.fonts.add(f); continueRender(handle); })
    .catch((e) => { throw new Error(`Font ${family} (${path}): ${e}`); });
}

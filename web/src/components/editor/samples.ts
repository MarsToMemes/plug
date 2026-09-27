import { photo, video, videoPoster } from '../../media/catalog';

/** A short generated arpeggio, so the audio preview and waveform can be tried without a file. */
export function makeWav(sec: number): File {
  const sr = 22050, n = sr * sec, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  const notes = [220, 277.2, 329.6, 440, 329.6, 277.2];
  for (let i = 0; i < n; i++) {
    const t = i / sr, k = Math.floor(t * 1.5) % notes.length, lt = (t * 1.5) % 1, env = Math.exp(-lt * 3) * (0.6 + 0.4 * Math.sin(t * 0.8));
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, Math.sin(2 * Math.PI * notes[k] * t) * env * 0.5)) * 32767, true);
  }
  return new File([buf], 'ambiance_tokyo.wav', { type: 'audio/wav', lastModified: 1 });
}

export const SAMPLE_SRT = '1\n00:00:00,500 --> 00:00:02,800\nOn a quarante-huit heures pour tout voir.\n\n2\n00:00:03,000 --> 00:00:05,400\nPremière étape, le carrefour de Shibuya.\n\n3\n00:00:05,600 --> 00:00:08,200\nC’est encore plus impressionnant que dans les vidéos.\n\n4\n00:00:08,500 --> 00:00:11,000\nEt maintenant, on part chercher des ramen.\n';

/** Example media already hosted (no File object): [name, type, mime, size, url, thumbnail]. */
export const remoteSamples = (): [string, 'VIDEO' | 'IMAGE', string, number, string, string][] => [
  ['tokyo_rue_nuit.mp4', 'VIDEO', 'video/mp4', 48.2e6, video('nightStreet'), videoPoster('nightStreet')],
  ['shibuya_crossing.mp4', 'VIDEO', 'video/mp4', 31.6e6, video('crossing'), photo('crossing', 720)],
  ['akihabara.jpg', 'IMAGE', 'image/jpeg', 3.4e6, photo('tokyo', 720), photo('tokyo', 720)],
  ['ramen_shinjuku.jpg', 'IMAGE', 'image/jpeg', 2.1e6, photo('food', 720), photo('food', 720)],
  ['senso-ji.jpg', 'IMAGE', 'image/jpeg', 2.8e6, photo('temple', 720), photo('temple', 720)],
  ['tokyo_tower.jpg', 'IMAGE', 'image/jpeg', 1.9e6, photo('tower', 720), photo('tower', 720)]
];

/** Pseudo waveform for audio whose real waveform could not be decoded. */
export const pseudoWave = (name: string) => {
  let s = 0;
  for (const ch of name) s = (s * 31 + ch.charCodeAt(0)) % 99991;
  return Array.from({ length: 56 }, (_, i) => { s = (s * 9301 + 49297) % 233280; return 0.25 + 0.75 * Math.abs(Math.sin(i / 4 + s / 5e4)) * (0.5 + (s % 100) / 200); });
};

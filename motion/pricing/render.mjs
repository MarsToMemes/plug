// node render.mjs out.mp4 [stills f1,f2,...]
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
const [, , out, mode, list] = process.argv;
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id: process.env.COMP ?? 'Plate01', browserExecutable });
if (mode === 'stills') {
  for (const f of list.split(',').map(Number)) {
    await renderStill({ serveUrl, composition, frame: f, output: `${out}/f${String(f).padStart(4, '0')}.png`, browserExecutable });
    console.log('still', f);
  }
} else if (process.env.RANGES) {
  // RANGES=a-b,c-d : one file per range, named <out>-<a>.mp4
  for (const r of process.env.RANGES.split(',')) {
    const [a, b] = r.split('-').map(Number);
    await renderMedia({ serveUrl, composition, codec: 'h264', crf: 14, outputLocation: `${out}-${String(a).padStart(5, '0')}.mp4`, browserExecutable, concurrency: 3, frameRange: [a, b] });
    console.log('range', a, b);
  }
} else {
  await renderMedia({ serveUrl, composition, codec: 'h264', crf: 14, outputLocation: out, browserExecutable, concurrency: 3,
    onProgress: ({ progress }) => { if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`\r${Math.round(progress * 100)}%`); } });
  console.log('\ndone', out);
}

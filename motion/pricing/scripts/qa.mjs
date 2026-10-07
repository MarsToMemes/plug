// node scripts/qa.mjs [step=30] [from=0] [to=end] — composition QA of the voice episode, one frame
// every `step`: overlaps between texts, texts outside the safe area, clipped texts.
// Writes out/qa.json and prints the frames with issues.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const [step = 30, from = 0, to] = process.argv.slice(2).map(Number);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const inputProps = { qa: true };
const composition = await selectComposition({ serveUrl, id: 'VoiceEpisode', browserExecutable, inputProps });
const end = to || composition.durationInFrames - 1;
const report = {};
for (let f = from; f <= end; f += step) {
  await renderStill({ serveUrl, composition, frame: f, output: '/tmp/qa-still.jpg', imageFormat: 'jpeg', scale: 0.25, browserExecutable, inputProps,
    onBrowserLog: (l) => { const m = /^QA (\d+) (.*)$/.exec(l.text); if (m) { const v = JSON.parse(m[2]); if (v.length) report[m[1]] = v; } } });
}
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/qa.json', JSON.stringify(report, null, 1));
const t = (f) => `${Math.floor(f / 1800)}:${String(Math.floor((f / 30) % 60)).padStart(2, '0')}`;
for (const [f, v] of Object.entries(report)) console.log(t(Number(f)), f, v.join(' | '));
console.log(`${Object.keys(report).length} frame(s) with issues`);

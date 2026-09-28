// Downloads every example photo and video into public/media so the site does not hotlink
// Unsplash / Mixkit in production. Both licences allow commercial use.
// Usage: npm run fetch-media
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = await readFile(join(root, 'src/media/catalog.ts'), 'utf8');
const block = name => src.slice(src.indexOf(`export const ${name}`), src.indexOf('} as const', src.indexOf(`export const ${name}`)));
const photos = [...block('PHOTOS').matchAll(/'([0-9]+-[0-9a-f]+)'/g)].map(m => m[1]);
const videos = [...block('VIDEOS').matchAll(/:\s*(\d+)/g)].map(m => +m[1]);
const sizes = [...src.match(/PHOTO_SIZES = \[([^\]]+)\]/)[1].matchAll(/\d+/g)].map(m => +m[0]);

const out = join(root, 'public/media');
await mkdir(join(out, 'photos'), { recursive: true });
await mkdir(join(out, 'videos'), { recursive: true });

async function get(url, file) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status + ' ' + url);
      await writeFile(file, Buffer.from(await r.arrayBuffer()));
      console.log('✓', file.replace(root + '/', ''));
      return;
    } catch (e) {
      if (i === 3) throw e;
      await new Promise(r => setTimeout(r, 1000 * 2 ** i));
    }
  }
}

const jobs = [];
for (const id of photos) for (const w of sizes)
  jobs.push([`https://images.unsplash.com/photo-${id}?w=${w}&q=72&auto=format&fit=crop&fm=jpg`, join(out, 'photos', `${id}-${w}.jpg`)]);
for (const id of videos) {
  jobs.push([`https://assets.mixkit.co/videos/${id}/${id}-720.mp4`, join(out, 'videos', `${id}-720.mp4`)]);
  jobs.push([`https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`, join(out, 'videos', `${id}-poster.jpg`)]);
}

let failed = 0;
for (let i = 0; i < jobs.length; i += 6)
  await Promise.all(jobs.slice(i, i + 6).map(([u, f]) => get(u, f).catch(e => { failed++; console.error('✗', e.message); })));

await writeFile(join(out, 'manifest.json'), JSON.stringify({ ok: failed === 0, photos: photos.length, videos: videos.length, fetchedAt: new Date().toISOString() }, null, 2));
console.log(failed ? `${failed} file(s) failed — the site keeps using remote URLs.` : 'All media downloaded. The site now serves them locally.');
process.exit(failed ? 1 : 0);

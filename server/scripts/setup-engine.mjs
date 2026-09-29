// Prepares studio-engine (git submodule engine/) for the Plug server:
//   1. the submodule is checked out;
//   2. npm ci + build (engine, editor-brain, render);
//   3. sound effects and demo media (packages/remotion/public);
//   4. the HyperFrames studio blocks of the Apple style (public/hyperframes).
// Usage: npm run setup-engine   (from server/)
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const engine = resolve(process.env.ENGINE_DIR ?? join(root, 'engine'));
const remotion = join(engine, 'packages', 'remotion');
const log = (m) => console.log(`\n▸ ${m}`);
const run = (cmd, args, cwd = engine, env = {}) => execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

if (!existsSync(join(engine, 'package.json'))) {
  log('Récupération du sous-module engine/ (studio-engine)');
  run('git', ['submodule', 'update', '--init', 'engine'], root);
}

log('Installation et build de studio-engine');
run('npm', ['ci']);
run('npm', ['run', 'build']);

if (!existsSync(join(remotion, 'public', 'sfx'))) {
  log('Effets sonores et médias de démo');
  run('npm', ['run', 'assets'], remotion);
}

// The studio blocks (Apple style) change with the engine: sync again whenever their sources change.
const studioDir = join(remotion, 'hyperframes-studio');
const studioHash = createHash('sha256');
for (const f of readdirSync(studioDir, { recursive: true }).map(String).sort()) {
  const path = join(studioDir, f);
  if (statSync(path).isFile()) studioHash.update(f).update(readFileSync(path));
}
const hash = studioHash.digest('hex');
const hashFile = join(remotion, 'public', 'hyperframes', '.studio-hash');
const synced = existsSync(join(remotion, 'public', 'hyperframes', 'hyperframe.runtime.js')) && existsSync(hashFile) && readFileSync(hashFile, 'utf8') === hash;
if (synced) {
  log('Blocs studio (style Apple) : à jour');
} else {
  log('Blocs studio HyperFrames (style Apple)');
  // The sync script clones HyperFrames without blobs, then fetches them one by one: slow.
  // A shallow fetch of the pinned commit is much faster when we know its full hash.
  const pinned = /HYPERFRAMES_COMMIT = '([0-9a-f]+)'/.exec(readFileSync(join(remotion, 'scripts', 'hyperframes-sync.mjs'), 'utf8'))?.[1];
  const KNOWN = { '8798e40': '8798e40da8d56b2f0f3be0b74198d0cbbec1dc06' };
  const full = pinned && KNOWN[pinned];
  let env = {};
  if (full) {
    const dir = join(engine, '.studio-cache', 'hyperframes-shallow');
    if (!existsSync(join(dir, 'registry'))) {
      mkdirSync(dir, { recursive: true });
      run('git', ['init', '-q'], dir);
      spawnSync('git', ['remote', 'add', 'origin', 'https://github.com/heygen-com/hyperframes.git'], { cwd: dir });
      run('git', ['fetch', '-q', '--depth', '1', 'origin', full], dir);
      run('git', ['checkout', '-q', 'FETCH_HEAD'], dir);
    }
    env = { HYPERFRAMES_DIR: dir };
  } else console.log(`  commit ${pinned} inconnu de ce script : synchronisation standard (lente).`);
  run('node', ['scripts/hyperframes-sync.mjs'], remotion, env);
  writeFileSync(hashFile, hash);
}

log('Vérifications');
const ffmpeg = spawnSync(process.env.FFMPEG ?? 'ffmpeg', ['-hide_banner', '-filters'], { encoding: 'utf8' });
if (ffmpeg.status !== 0) console.log('  ⚠ FFmpeg absent du PATH : le rendu utilisera celui de Remotion, mais la planche de contrôle demande un FFmpeg complet (apt install ffmpeg / brew install ffmpeg).');
else if (!/\bdrawtext\b/.test(ffmpeg.stdout)) console.log('  ⚠ Ce FFmpeg n’a pas le filtre drawtext : la planche de contrôle échouera.');
else console.log('  ✓ FFmpeg complet');
console.log('\nstudio-engine est prêt. Lancez le serveur : npm start');

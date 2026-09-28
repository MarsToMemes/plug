import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';
import { findFfmpeg } from './media.ts';

const config = loadConfig();
if (!existsSync(join(config.engineDir, 'packages', 'render', 'dist', 'index.js'))) {
  console.error(`studio-engine n'est pas construit dans ${config.engineDir}. Lancez : npm run setup-engine`);
  process.exit(1);
}
const tools = findFfmpeg(config.engineDir);
const { app } = await buildApp({ config, tools, logger: true });
try {
  await app.listen({ port: config.port, host: config.host });
} catch (e) {
  if ((e as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    console.error(`Le port ${config.port} est déjà utilisé par un autre programme. Choisissez-en un autre : PORT=8788 npm start (et PLUG_API=http://127.0.0.1:8788 pour le site).`);
    process.exit(1);
  }
  throw e;
}
console.log(`Plug API : http://${config.host}:${config.port}`);
console.log(`  voix IA / transcription ElevenLabs : ${config.elevenLabsKey ? 'oui' : 'non (ELEVENLABS_API_KEY absente : alignement local)'}`);
console.log(`  cerveau éditorial Claude : ${config.anthropicKey ? config.anthropicModel : 'non (ANTHROPIC_API_KEY absente : heuristique)'}`);

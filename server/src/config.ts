import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export interface Config {
  port: number;
  host: string;
  /** Projects, media, plans, renders. */
  dataDir: string;
  /** The studio-engine submodule. */
  engineDir: string;
  /** Remotion's public folder (studio blocks, sound effects). */
  enginePublicDir: string;
  /** Base URL the renderer's browser loads the project media from (this server). */
  mediaBaseUrl: string;
  elevenLabsKey?: string;
  /** Default ElevenLabs voice for generated voice-overs. */
  elevenLabsVoiceId: string;
  elevenLabsModel: string;
  anthropicKey?: string;
  /** Runway: generates a visual for a sentence, on request. */
  runwayKey?: string;
  /** Claude model of the editorial brain (--llm). */
  anthropicModel: string;
  /** Render cache (chunks, decoded media, mixes) kept after a render, bytes. */
  renderCacheBytes: number;
  /** Chrome / Chromium Headless Shell for Remotion and the control sheet. */
  browser?: string;
  /** Origins allowed to call the API (the web app in development). */
  corsOrigins: string[];
}

/** Browsers found without configuration: the cloud container's, then Chrome / Chromium on a Mac. */
const BROWSERS = [
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const port = Number(env.PORT ?? 8787);
  const host = env.HOST ?? '127.0.0.1';
  const engineDir = resolve(env.ENGINE_DIR ?? resolve(here, '..', '..', 'engine'));
  // Always explicit: the control sheet script would otherwise look for the cloud container's browser.
  const browser = env.REMOTION_BROWSER ?? BROWSERS.find((b) => existsSync(b));
  return {
    port,
    host,
    dataDir: resolve(env.DATA_DIR ?? resolve(here, '..', 'data')),
    engineDir,
    enginePublicDir: resolve(engineDir, 'packages', 'remotion', 'public'),
    mediaBaseUrl: (env.MEDIA_BASE_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, ''),
    ...(env.ELEVENLABS_API_KEY ? { elevenLabsKey: env.ELEVENLABS_API_KEY } : {}),
    // "George", a warm narrator voice from the ElevenLabs default library.
    elevenLabsVoiceId: env.ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb',
    elevenLabsModel: env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2',
    ...(env.ANTHROPIC_API_KEY ? { anthropicKey: env.ANTHROPIC_API_KEY } : {}),
    // RUNWAYML_API_SECRET is the name Runway's own SDK reads.
    ...(env.RUNWAYML_API_SECRET || env.RUNWAY_API_KEY ? { runwayKey: (env.RUNWAYML_API_SECRET || env.RUNWAY_API_KEY)! } : {}),
    anthropicModel: env.ANTHROPIC_MODEL ?? 'claude-sonnet-5-5',
    renderCacheBytes: Math.max(0, Number(env.RENDER_CACHE_GB ?? 10)) * 1e9,
    ...(browser ? { browser } : {}),
    corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((s) => s.trim()).filter(Boolean),
  };
}

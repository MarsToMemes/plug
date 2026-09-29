/**
 * The production pipeline of a project, on studio-engine:
 *
 *   voice (ElevenLabs, upload or none) → word timings → editor brain, Apple style
 *   → plan.json → control sheet (stills.jpg) → Remotion render → master → QC
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from './config.ts';
import { speechToText, textToSpeech } from './elevenlabs.ts';
import {
  AnthropicModel,
  directEpisode,
  directEpisodeWithLlm,
  ffmpegFilters,
  qcEpisode,
  renderEpisode,
  runFfmpeg,
  type AssetRegistry,
  type AssetSource,
  type BrainInput,
  type BrainResult,
  type FfmpegTools,
  type RenderEvent,
  type ShotPlan,
  type TranscriptWord,
} from './engine.ts';
import { concatAudio, decodePcm16k, normalizeVoice, probe, sha256File, writeJson } from './media.ts';
import { chunkText, parseScript, spokenText } from './script.ts';
import { MAX_RENDERS, newId, type MediaItem, type Project, type ProjectStore, type RenderInfo } from './store.ts';
import { alignKnownText, wordsFromAlignment, wordsFromStt } from './words.ts';

export interface PipelineContext {
  config: Config;
  store: ProjectStore;
  tools: FfmpegTools;
  /** Progress of the running step: 0..1 and a message in French. */
  report: (progress: number, message: string) => void;
  /**
   * Saves results into project.json. Steps never write project.json
   * themselves: they may run in a worker thread while the server keeps
   * serving requests (and edits) on the main thread, the only writer.
   */
  commit: (fields: Partial<Project>) => void;
  fetch?: typeof fetch;
}

const OWN: AssetSource = { provider: 'fourni par l’utilisateur (Plug)', license: 'own', commercialUse: true, attributionRequired: false };
const FPS = 30;

export const mediaUrl = (config: Config, projectId: string, file: string) => `${config.mediaBaseUrl}/api/projects/${projectId}/files/media/${encodeURIComponent(file)}`;
const outputUrl = (config: Config, projectId: string, file: string) => `${config.mediaBaseUrl}/api/projects/${projectId}/files/${encodeURIComponent(file)}`;

// ---------------------------------------------------------------------------
// Voice

interface Voice {
  durationInSeconds: number;
  words: TranscriptWord[];
  timing: 'tts' | 'stt' | 'aligned';
  checksum: string;
}

function voiceKey(project: Project, config: Config, text: string): string {
  const voiceFile = project.media.find((m) => m.role === 'voice');
  const material = project.voice.mode === 'tts'
    ? `tts|${project.voice.voiceId ?? config.elevenLabsVoiceId}|${config.elevenLabsModel}|${text}`
    : `upload|${voiceFile?.checksum ?? ''}|${config.elevenLabsKey ? 'stt' : `aligned|${text}`}`;
  return createHash('sha256').update(material).digest('hex').slice(0, 24);
}

/** Produces voice.wav (normalised) and words.json, or reuses them while nothing that made them changed. */
export async function prepareVoice(project: Project, ctx: PipelineContext): Promise<Voice | undefined> {
  const { config, store, tools, report } = ctx;
  if (project.voice.mode === 'none') return undefined;
  const text = spokenText(parseScript(project.script));
  const key = voiceKey(project, config, text);
  const wav = store.file(project.id, 'voice.wav');
  const wordsFile = store.file(project.id, 'words.json');
  if (project.voiceTrack?.key === key && existsSync(wav) && existsSync(wordsFile)) {
    report(0.3, 'Voix off inchangée : réutilisée');
    return { durationInSeconds: project.voiceTrack.durationInSeconds, words: JSON.parse(readFileSync(wordsFile, 'utf8')), timing: project.voiceTrack.timing, checksum: sha256File(wav) };
  }

  let words: TranscriptWord[];
  let timing: Voice['timing'];
  const raw = store.file(project.id, 'voice-raw.wav');
  if (project.voice.mode === 'tts') {
    if (!config.elevenLabsKey) throw new Error('La voix IA demande une clé ElevenLabs (ELEVENLABS_API_KEY) sur le serveur. Importez plutôt votre propre voix off.');
    const chunks = chunkText(text);
    const pieces: string[] = [];
    words = [];
    let offsetMs = 0;
    for (const [i, chunk] of chunks.entries()) {
      report(0.05 + (0.2 * i) / chunks.length, `Génération de la voix IA (${i + 1}/${chunks.length})`);
      const piece = await textToSpeech({
        key: config.elevenLabsKey,
        voiceId: project.voice.voiceId ?? config.elevenLabsVoiceId,
        model: config.elevenLabsModel,
        text: chunk,
        ...(i > 0 ? { previousText: chunks[i - 1]! } : {}),
        ...(i < chunks.length - 1 ? { nextText: chunks[i + 1]! } : {}),
        ...(ctx.fetch ? { fetch: ctx.fetch } : {}),
      });
      const file = store.file(project.id, `voice-part-${i}.mp3`);
      writeFileSync(file, piece.audio);
      pieces.push(file);
      words.push(...wordsFromAlignment(piece.alignment, offsetMs));
      offsetMs += (probe(tools, file).durationInSeconds ?? 0) * 1000;
    }
    concatAudio(tools, pieces, raw);
    for (const f of pieces) rmSync(f, { force: true });
    timing = 'tts';
  } else {
    const upload = project.media.find((m) => m.role === 'voice');
    if (!upload) throw new Error('Aucune voix off importée.');
    concatAudio(tools, [join(store.mediaDir(project.id), upload.file)], raw);
    if (config.elevenLabsKey) {
      report(0.15, 'Transcription de la voix off (ElevenLabs)');
      const stt = await speechToText({ key: config.elevenLabsKey, audio: readFileSync(raw), fileName: 'voice.wav', ...(ctx.fetch ? { fetch: ctx.fetch } : {}) });
      words = wordsFromStt(stt);
      timing = 'stt';
    } else {
      report(0.15, 'Alignement du script sur la voix off');
      words = alignKnownText(decodePcm16k(tools, raw), text);
      timing = 'aligned';
    }
  }
  report(0.28, 'Normalisation de la voix (−16 LUFS)');
  normalizeVoice(tools, raw, wav);
  rmSync(raw, { force: true });
  if (!words.length) throw new Error('Aucun mot détecté dans la voix off.');
  writeJson(wordsFile, words);
  const durationInSeconds = probe(tools, wav).durationInSeconds ?? words[words.length - 1]!.endMs / 1000;
  ctx.commit({ voiceTrack: { durationInSeconds, timing, words: words.length, key } });
  return { durationInSeconds, words, timing, checksum: sha256File(wav) };
}

// ---------------------------------------------------------------------------
// Brain input

/** Sound effects shipped in the engine's public folder (sfx/<category>.wav). */
function sfxLibrary(config: Config): { assets: AssetRegistry; sfx: BrainInput['sfx'] } {
  const dir = join(config.enginePublicDir, 'sfx');
  const assets: AssetRegistry = {};
  const sfx: NonNullable<BrainInput['sfx']> = {};
  if (!existsSync(dir)) return { assets, sfx };
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.wav'))) {
    const category = f.replace(/\.wav$/, '') as keyof typeof sfx;
    const id = `sfx-${category}`;
    assets[id] = { id, kind: 'audio', src: `sfx/${f}`, source: { provider: 'studio-engine (synthèse)', license: 'own', commercialUse: true, attributionRequired: false } };
    (sfx[category] ??= []).push(id);
  }
  return { assets, sfx };
}

const tagsOf = (m: MediaItem) => [...new Set([...m.tags, ...m.description.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3)])];

export function buildBrainInput(project: Project, config: Config, voice: Voice | undefined): BrainInput {
  const lib = sfxLibrary(config);
  const assets: AssetRegistry = { ...lib.assets };
  const catalog: NonNullable<BrainInput['catalog']> = [];
  for (const m of project.media) {
    if (m.role === 'voice') continue;
    assets[m.id] = {
      id: m.id,
      kind: m.kind,
      src: mediaUrl(config, project.id, m.file),
      checksum: m.checksum,
      ...(m.width ? { width: m.width } : {}),
      ...(m.height ? { height: m.height } : {}),
      ...(m.durationInSeconds ? { durationInSeconds: m.durationInSeconds } : {}),
      source: { ...OWN, ...(m.synthetic ? { syntheticMedia: true } : {}) },
    };
    if (m.role === 'visual') catalog.push({ assetId: m.id, description: m.description || m.originalName, tags: tagsOf(m) });
  }
  const music = project.media.find((m) => m.role === 'music');
  if (voice) {
    assets.narration = {
      id: 'narration',
      kind: 'audio',
      src: outputUrl(config, project.id, 'voice.wav'),
      durationInSeconds: voice.durationInSeconds,
      checksum: voice.checksum,
      source: project.voice.mode === 'tts'
        ? { provider: 'ElevenLabs (voix générée pour ce projet)', license: 'ElevenLabs subscription', commercialUse: true, attributionRequired: false }
        : OWN,
    };
  }
  return {
    title: project.title,
    fps: FPS,
    width: 1920,
    height: 1080,
    script: parseScript(project.script),
    assets,
    catalog,
    ...(voice ? { narration: { assetId: 'narration', words: voice.words } } : {}),
    ...(music ? { music: { assetId: music.id } } : {}),
    sfx: lib.sfx,
    captions: project.captions,
    style: project.style ?? 'apple',
    pacing: project.pacing,
  };
}

// ---------------------------------------------------------------------------
// Steps

export async function directStep(projectId: string, ctx: PipelineContext): Promise<void> {
  const { config, store, report } = ctx;
  const project = store.get(projectId)!;
  if (!parseScript(project.script).some((b) => b.kind === 'text')) throw new Error('Le script est vide.');
  report(0.02, 'Préparation de la voix off');
  const voice = await prepareVoice(project, ctx);
  const input = buildBrainInput(store.get(projectId)!, config, voice);
  writeJson(store.file(projectId, 'input.json'), input);

  let result: BrainResult;
  let brain: 'llm' | 'heuristic' = 'heuristic';
  const notes: string[] = [];
  if (project.llm && config.anthropicKey) {
    report(0.4, 'Claude écrit l’analyse éditoriale');
    const r = await directEpisodeWithLlm(input, { model: new AnthropicModel({ model: config.anthropicModel, apiKey: config.anthropicKey }) });
    result = r;
    brain = r.llm?.accepted === 'none' ? 'heuristic' : 'llm';
    if (r.llm) notes.push(`Claude (${r.llm.model}) : ${r.llm.accepted}, ${r.llm.attempts} appel(s)`);
  } else {
    if (project.llm) notes.push('Pas de clé ANTHROPIC_API_KEY : le cerveau heuristique a monté l’épisode.');
    report(0.5, 'Le cerveau éditorial monte l’épisode (style Apple)');
    result = directEpisode(input);
  }
  if (!voice) notes.push('Sans voix off, les durées sont estimées et la vidéo sera muette.');
  writeJson(store.file(projectId, 'plan.json'), result.plan);
  const frames = result.plan.shots.reduce((s, shot) => s + shot.durationInFrames, 0);
  ctx.commit({
    plan: {
      createdAt: new Date().toISOString(),
      shots: result.plan.shots.length,
      durationInSeconds: frames / result.plan.fps,
      valid: result.qc.valid,
      brain,
      decisions: result.decisions,
      assetRequests: result.assetRequests,
      errors: result.qc.errors.map((e) => ({ message: e.message, ...(e.rule ? { rule: e.rule } : {}) })),
      warnings: result.qc.warnings.map((e) => ({ message: e.message, ...(e.rule ? { rule: e.rule } : {}) })),
      notes: [...notes, ...result.qc.notes],
    },
  });
  report(1, `Plan prêt : ${result.plan.shots.length} plans`);
}

export function readProjectPlan(store: ProjectStore, projectId: string): ShotPlan {
  const file = store.file(projectId, 'plan.json');
  if (!existsSync(file)) throw new Error('Générez d’abord le plan de montage.');
  return JSON.parse(readFileSync(file, 'utf8')) as ShotPlan;
}

/** Control sheet: 3 stills per shot, on the studio blocks (engine/packages/remotion/scripts/stills.mjs). */
export async function stillsStep(projectId: string, ctx: PipelineContext): Promise<void> {
  const { config, store, tools, report } = ctx;
  const project = store.get(projectId)!;
  readProjectPlan(store, projectId);
  // The sheet is assembled with drawtext: Remotion's minimal FFmpeg does not have it.
  if (!ffmpegFilters(tools).has('drawtext')) throw new Error('La planche de contrôle demande un FFmpeg complet (filtre drawtext) sur le serveur : installez FFmpeg (apt install ffmpeg, brew install ffmpeg) ou indiquez-le avec $FFMPEG.');
  if (!config.browser) throw new Error('La planche de contrôle demande Google Chrome : installez-le, ou indiquez un navigateur avec REMOTION_BROWSER.');
  report(0.05, 'Planche de contrôle : ouverture du navigateur');
  const script = join(config.engineDir, 'packages', 'remotion', 'scripts', 'stills.mjs');
  const args = [script, store.file(projectId, 'plan.json'), '--out', store.file(projectId, 'stills.jpg'), ...(config.browser ? ['--browser', config.browser] : [])];
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: join(config.engineDir, 'packages', 'remotion'), env: { ...process.env, FFMPEG: tools.ffmpeg[0]! }, stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    child.stdout.resume();
    // The script reports only at the end: progress is estimated (about 1.5 s per shot).
    const total = project.plan?.shots ?? 1;
    const t0 = Date.now();
    const tick = setInterval(() => report(Math.min(0.95, 0.1 + (0.85 * (Date.now() - t0)) / (total * 1500)), 'Planche de contrôle : captures des plans'), 1000);
    child.on('close', () => clearInterval(tick));
    child.stderr.on('data', (d: Buffer) => (err += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`La planche de contrôle a échoué :\n${err.slice(-1500)}`))));
  });
  ctx.commit({ stills: { createdAt: new Date().toISOString(), planCreatedAt: project.plan!.createdAt } });
  report(1, 'Planche prête');
}

/** Remotion render by cached chunks, JS mix, -14 LUFS master, then QC. */
export async function renderStep(projectId: string, ctx: PipelineContext, scale: number): Promise<void> {
  const { config, store, tools, report } = ctx;
  const plan = readProjectPlan(store, projectId);
  const project = store.get(projectId)!;
  const planCreatedAt = project.plan!.createdAt;
  // Each render is a version: video-<id>.mp4 and its poster, the last MAX_RENDERS kept.
  const id = newId();
  const file = `video-${id}.mp4`;
  const output = store.file(projectId, file);
  const tmp = store.file(projectId, `video-${id}.tmp.mp4`);
  const onProgress = (e: RenderEvent) => {
    if (e.phase === 'chunk') report(0.05 + (0.8 * (e.index + 1)) / e.total, `Rendu : morceau ${e.index + 1}/${e.total}${e.cached ? ' (cache)' : ''}`);
    else report(e.phase === 'prepare' ? 0.03 : e.phase === 'mix' ? 0.87 : e.phase === 'concat' ? 0.86 : 0.9, { prepare: 'Préparation du rendu', mix: 'Mixage audio', concat: 'Assemblage', master: 'Mastering (−14 LUFS)' }[e.phase]);
  };
  const result = await renderEpisode(
    { plan, output: tmp, publicDir: config.enginePublicDir, cacheDir: join(config.dataDir, 'cache'), scale, master: true, onProgress },
    { engine: 'remotion', fallback: false, ffmpeg: tools.ffmpeg[0]!, ffprobe: tools.ffprobe[0]!, ...(config.browser ? { browserExecutable: config.browser } : {}) },
  );
  renameSync(tmp, output);
  let poster: string | undefined;
  try {
    const at = Math.min(1.5, (result.durationInFrames / plan.fps) / 3);
    runFfmpeg(tools, ['-y', '-ss', at.toFixed(2), '-i', output, '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '4', store.file(projectId, `video-${id}.jpg`)]);
    poster = `video-${id}.jpg`;
  } catch {
    // A version without a picture is still a version.
  }
  report(0.95, 'Contrôle qualité');
  let qc: RenderInfo['qc'];
  try {
    const r = await qcEpisode(tools, plan, output, { stage: scale >= 1 ? 'final' : 'preview' });
    qc = {
      pass: r.summary.pass,
      failed: r.checks.filter((c) => c.status === 'fail').map((c) => `${c.rule ? `[${c.rule}] ` : ''}${c.message}`),
      warnings: r.checks.filter((c) => c.status === 'warn').map((c) => `${c.rule ? `[${c.rule}] ` : ''}${c.message}`),
    };
  } catch (e) {
    qc = { pass: false, failed: [`Contrôle qualité impossible : ${(e as Error).message.slice(0, 300)}`], warnings: [] };
  }
  const info: RenderInfo = {
    id,
    file,
    ...(poster ? { poster } : {}),
    createdAt: new Date().toISOString(),
    planCreatedAt,
    durationInSeconds: result.durationInFrames / plan.fps,
    shots: plan.shots.length,
    style: project.style ?? 'apple',
    draft: result.draft,
    scale,
    ...(result.loudness ? { loudness: { integrated: result.loudness.after.integrated, truePeak: result.loudness.after.truePeak } } : {}),
    qc,
    notes: result.notes,
  };
  const before = store.get(projectId);
  // Projects rendered before versions existed only have `render`.
  const renders = [info, ...(before?.renders ?? (before?.render ? [before.render] : []))];
  for (const old of renders.slice(MAX_RENDERS)) {
    for (const f of [old.file, old.poster]) if (f) rmSync(store.file(projectId, f), { force: true });
  }
  ctx.commit({ render: info, renders: renders.slice(0, MAX_RENDERS) });
  report(1, 'Vidéo prête');
}

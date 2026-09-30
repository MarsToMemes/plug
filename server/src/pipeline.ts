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
  pruneCache,
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
import { frIssues, frLists } from './fr.ts';
import { msg, MsgError, text, type Msg } from './messages.ts';
import { hintKey, withHints } from './hints.ts';
import { chunkText, parseScript, spokenText } from './script.ts';
import { MAX_RENDERS, natureOf, newId, type MediaItem, type Project, type ProjectStore, type RenderInfo } from './store.ts';
import { alignKnownText, wordsFromAlignment, wordsFromStt } from './words.ts';

export interface PipelineContext {
  config: Config;
  store: ProjectStore;
  tools: FfmpegTools;
  /** Progress of the running step: 0..1 and a message, written in the reader's language (messages.ts). */
  report: (progress: number, message: Msg) => void;
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
    report(0.3, msg('voiceReused'));
    return { durationInSeconds: project.voiceTrack.durationInSeconds, words: JSON.parse(readFileSync(wordsFile, 'utf8')), timing: project.voiceTrack.timing, checksum: sha256File(wav) };
  }

  let words: TranscriptWord[];
  let timing: Voice['timing'];
  const raw = store.file(project.id, 'voice-raw.wav');
  if (project.voice.mode === 'tts') {
    if (!config.elevenLabsKey) throw new MsgError('ttsNeedsKey');
    const chunks = chunkText(text);
    const pieces: string[] = [];
    words = [];
    let offsetMs = 0;
    for (const [i, chunk] of chunks.entries()) {
      report(0.05 + (0.2 * i) / chunks.length, msg('ttsProgress', { i: i + 1, n: chunks.length }));
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
    if (!upload) throw new MsgError('noVoiceUploaded');
    concatAudio(tools, [join(store.mediaDir(project.id), upload.file)], raw);
    if (config.elevenLabsKey) {
      report(0.15, msg('transcribing'));
      const stt = await speechToText({ key: config.elevenLabsKey, audio: readFileSync(raw), fileName: 'voice.wav', ...(ctx.fetch ? { fetch: ctx.fetch } : {}) });
      words = wordsFromStt(stt);
      timing = 'stt';
    } else {
      report(0.15, msg('aligning'));
      words = alignKnownText(decodePcm16k(tools, raw), text);
      timing = 'aligned';
    }
  }
  report(0.28, msg('normalizing'));
  normalizeVoice(tools, raw, wav);
  rmSync(raw, { force: true });
  if (!words.length) throw new MsgError('noWords');
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
      ...(m.role === 'visual' ? { nature: natureOf(m) } : {}),
      source: { ...OWN, ...(m.role === 'visual' && natureOf(m) === 'generated' ? { syntheticMedia: true } : {}) },
    };
    if (m.role === 'visual') catalog.push({ assetId: m.id, description: m.description || m.originalName, tags: tagsOf(m), nature: natureOf(m) });
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
    script: withHints(parseScript(project.script), project.hints),
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

/** An issue of the plan's validation, as stored: the engine's text, its rule, the shot. */
const rawIssue = (e: { message: string; rule?: string; path?: string }) => ({ message: e.message, ...(e.rule ? { rule: e.rule } : {}) });

/** What the engine says about the plan, in French; what cannot be translated goes to `technical`. */
export function frPlanTexts(result: Pick<BrainResult, 'decisions' | 'qc'>, notes: string[]) {
  const lists = frLists({ decisions: result.decisions, notes: [...notes, ...result.qc.notes] });
  const technical = [...lists.technical];
  const errors = frIssues(result.qc.errors, technical);
  const warnings = frIssues(result.qc.warnings, technical);
  return { decisions: lists.decisions, notes: lists.notes, errors, warnings, technical };
}

/** The script line of each analysed sentence (a line may hold several sentences): the editor opens a shot's line. */
export function unitLines(script: string, units: ReadonlyArray<{ id: string; text: string }>): Record<string, string> {
  const lines = parseScript(script).flatMap((b) => (b.kind === 'text' ? [hintKey(b.text)] : []));
  const out: Record<string, string> = {};
  let from = 0;
  for (const u of units) {
    const text = hintKey(u.text);
    const i = lines.findIndex((l, k) => k >= from && l.includes(text));
    if (i < 0) continue;
    out[u.id] = lines[i]!;
    from = i;
  }
  return out;
}

/** The media need of each script line: the need of its first sentence. */
export function lineNeeds(script: string, units: ReadonlyArray<{ id: string; text: string; mediaNeed?: string }>): Record<string, string> {
  const lines = unitLines(script, units);
  const out: Record<string, string> = {};
  for (const u of units) {
    const line = lines[u.id];
    if (line && u.mediaNeed && !(line in out)) out[line] = u.mediaNeed;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Steps

export async function directStep(projectId: string, ctx: PipelineContext): Promise<void> {
  const { config, store, report } = ctx;
  const project = store.get(projectId)!;
  if (!parseScript(project.script).some((b) => b.kind === 'text')) throw new MsgError('emptyScript');
  report(0.02, msg('preparingVoice'));
  const voice = await prepareVoice(project, ctx);
  const input = buildBrainInput(store.get(projectId)!, config, voice);
  writeJson(store.file(projectId, 'input.json'), input);

  let result: BrainResult;
  let brain: 'llm' | 'heuristic' = 'heuristic';
  const notes: string[] = [];
  if (project.llm && config.anthropicKey) {
    report(0.4, msg('claudeWriting'));
    const r = await directEpisodeWithLlm(input, { model: new AnthropicModel({ model: config.anthropicModel, apiKey: config.anthropicKey }) });
    result = r;
    brain = r.llm?.accepted === 'none' ? 'heuristic' : 'llm';
    if (r.llm) notes.push(`Claude (${r.llm.model}): ${r.llm.accepted}, ${r.llm.attempts} call(s)`);
  } else {
    if (project.llm) notes.push('No ANTHROPIC_API_KEY: the automatic editor (without Claude) edited the episode.');
    report(0.5, msg('brainEditing'));
    result = directEpisode(input);
  }
  if (!voice) notes.push('Without a voice-over, timings are estimated and the video will be silent.');
  writeJson(store.file(projectId, 'plan.json'), result.plan);
  const frames = result.plan.shots.reduce((s, shot) => s + shot.durationInFrames, 0);
  ctx.commit({
    plan: {
      createdAt: new Date().toISOString(),
      shots: result.plan.shots.length,
      durationInSeconds: frames / result.plan.fps,
      valid: result.qc.valid,
      brain,
      // Stored as the engine wrote them (English): the reader gets them in their language (i18n.ts).
      raw: true,
      decisions: result.decisions,
      notes: [...notes, ...result.qc.notes],
      errors: result.qc.errors.map(rawIssue),
      warnings: result.qc.warnings.map(rawIssue),
      assetRequests: result.assetRequests,
      units: unitLines(project.script, result.analysis),
      needs: lineNeeds(project.script, result.analysis),
    },
  });
  report(1, msg('planReady', { n: result.plan.shots.length }));
}

export function readProjectPlan(store: ProjectStore, projectId: string): ShotPlan {
  const file = store.file(projectId, 'plan.json');
  if (!existsSync(file)) throw new MsgError('planFirst');
  return JSON.parse(readFileSync(file, 'utf8')) as ShotPlan;
}

/** Control sheet: 3 stills per shot, on the studio blocks (engine/packages/remotion/scripts/stills.mjs). */
export async function stillsStep(projectId: string, ctx: PipelineContext): Promise<void> {
  const { config, store, tools, report } = ctx;
  const project = store.get(projectId)!;
  readProjectPlan(store, projectId);
  // The sheet is assembled with drawtext: Remotion's minimal FFmpeg does not have it.
  if (!ffmpegFilters(tools).has('drawtext')) throw new MsgError('stillsNeedDrawtext');
  if (!config.browser) throw new MsgError('stillsNeedBrowser');
  report(0.05, msg('stillsBrowser'));
  const script = join(config.engineDir, 'packages', 'remotion', 'scripts', 'stills.mjs');
  const args = [script, store.file(projectId, 'plan.json'), '--out', store.file(projectId, 'stills.jpg'), ...(config.browser ? ['--browser', config.browser] : [])];
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: join(config.engineDir, 'packages', 'remotion'), env: { ...process.env, FFMPEG: tools.ffmpeg[0]! }, stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    child.stdout.resume();
    // The script reports only at the end: progress is estimated (about 1.5 s per shot).
    const total = project.plan?.shots ?? 1;
    const t0 = Date.now();
    const tick = setInterval(() => report(Math.min(0.95, 0.1 + (0.85 * (Date.now() - t0)) / (total * 1500)), msg('stillsCapturing')), 1000);
    child.on('close', () => clearInterval(tick));
    child.stderr.on('data', (d: Buffer) => (err += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new MsgError('stillsFailed', { detail: err.slice(-1500) }))));
  });
  ctx.commit({ stills: { createdAt: new Date().toISOString(), planCreatedAt: project.plan!.createdAt } });
  report(1, msg('stillsReady'));
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
    if (e.phase === 'chunk') report(0.05 + (0.8 * (e.index + 1)) / e.total, msg('renderChunk', { i: e.index + 1, n: e.total, cached: e.cached ? 1 : 0 }));
    else report(e.phase === 'prepare' ? 0.03 : e.phase === 'mix' ? 0.87 : e.phase === 'concat' ? 0.86 : 0.9, msg(({ prepare: 'renderPrepare', mix: 'renderMix', concat: 'renderConcat', master: 'renderMaster' } as const)[e.phase]));
  };
  const result = await renderEpisode(
    { plan, output: tmp, publicDir: config.enginePublicDir, cacheDir: join(config.dataDir, 'cache'), scale, master: true, onProgress },
    { engine: 'remotion', fallback: false, ffmpeg: tools.ffmpeg[0]!, ffprobe: tools.ffprobe[0]!, ...(config.browser ? { browserExecutable: config.browser } : {}) },
  );
  renameSync(tmp, output);
  // The cache speeds up the next render of the same shots; beyond the limit the least recently used entries go.
  try {
    pruneCache(join(config.dataDir, 'cache'), config.renderCacheBytes);
  } catch {
    // A cache that could not be pruned does not fail the render.
  }
  let poster: string | undefined;
  try {
    const at = Math.min(1.5, (result.durationInFrames / plan.fps) / 3);
    runFfmpeg(tools, ['-y', '-ss', at.toFixed(2), '-i', output, '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '4', store.file(projectId, `video-${id}.jpg`)]);
    poster = `video-${id}.jpg`;
  } catch {
    // A version without a picture is still a version.
  }
  report(0.95, msg('qualityControl'));
  let qc: RenderInfo['qc'];
  try {
    const r = await qcEpisode(tools, plan, output, { stage: scale >= 1 ? 'final' : 'preview' });
    // As the engine wrote them: the reader gets them in their language (i18n.ts).
    const checks = r.checks.filter((c) => c.status === 'fail' || c.status === 'warn').map((c) => ({
      status: c.status as 'fail' | 'warn',
      message: c.message,
      ...(c.rule ? { rule: c.rule } : {}),
      ...(c.at?.shotId ? { shotId: c.at.shotId } : {}),
    }));
    qc = { pass: r.summary.pass, checks, failed: checks.filter((c) => c.status === 'fail').map((c) => c.message), warnings: checks.filter((c) => c.status === 'warn').map((c) => c.message) };
  } catch (e) {
    const m = msg('qcImpossible', { detail: (e as Error).message.slice(0, 300) });
    qc = { pass: false, error: m, failed: [text(m, 'en')], warnings: [] };
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
  report(1, msg('videoReady'));
}

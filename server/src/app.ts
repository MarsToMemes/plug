/**
 * Plug HTTP API.
 *
 *   GET    /api/health
 *   GET    /api/projects                     POST /api/projects
 *   GET    /api/projects/:id                 PATCH /api/projects/:id     DELETE /api/projects/:id
 *   POST   /api/projects/:id/media           (multipart: file, role, description, nature)
 *   PATCH  /api/projects/:id/media/:mediaId  DELETE /api/projects/:id/media/:mediaId
 *   POST   /api/projects/:id/media/:mediaId/describe   Claude describes the visual again
 *   POST   /api/projects/:id/direct          voice → timings → Apple-style plan
 *   POST   /api/projects/:id/stills          control sheet
 *   POST   /api/projects/:id/render          { quality: 'preview' | 'final' }
 *   POST   /api/projects/:id/generate           { prompt, kind, seconds, line }: Runway makes a visual
 *   PUT    /api/projects/:id/hints            { line, hints }: what the author sets on one sentence
 *   GET    /api/projects/:id/plan
 *   GET    /api/projects/:id/files/:name     voice.wav, stills.jpg, video.mp4 (Range supported)
 *   GET    /api/projects/:id/files/media/:file
 */
import { createReadStream, createWriteStream, existsSync, statSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline as pump } from 'node:stream/promises';
import multipart from '@fastify/multipart';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import type { Config } from './config.ts';
import type { FfmpegTools } from './engine.ts';
import { ClaudeDescriber, framesOf, type Describer } from './describe.ts';
import { REAL_SUBJECT_NEEDS } from './engine.ts';
import { RunwayGenerator, type Generator } from './runway.ts';
import { HintError, hintKey, keepHints, parseHints } from './hints.ts';
import { localizePayload } from './i18n.ts';
import { failure as stored, BusyError, JobQueue } from './jobs.ts';
import { langOf, MsgError, text, type MsgKey } from './messages.ts';
import { probe, sha256File } from './media.ts';
import { readProjectPlan } from './pipeline.ts';
import { IMAGE_NATURES, newId, ProjectStore, VIDEO_NATURES, type EditStyle, type MediaItem, type MediaNature, type MediaRole, type Pacing, type Project, type VoiceMode } from './store.ts';

export interface AppOptions {
  config: Config;
  tools: FfmpegTools;
  fetch?: typeof fetch;
  logger?: boolean;
  /** Run jobs on the main thread (tests with an injected fetch). */
  inlineJobs?: boolean;
  /** Describes imported visuals. Default: Claude when ANTHROPIC_API_KEY is set; null turns it off. */
  describer?: Describer | null;
  /** Generates visuals. Default: Runway when RUNWAYML_API_SECRET is set; null turns it off. */
  generator?: Generator | null;
}

const OUTPUTS = new Set(['voice.wav', 'stills.jpg', 'video.mp4', 'plan.json']);
/** Versions: video-<id>.mp4 and their posters. */
const VERSION_FILE = /^video-[a-z0-9]{6,32}\.(mp4|jpg)$/;
const TYPES: Record<string, string> = {
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/mp4',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.flac': 'audio/flac',
  '.json': 'application/json',
};
const UPLOAD_EXT = new Set(Object.keys(TYPES).filter((e) => e !== '.json'));
const PACINGS: Pacing[] = ['calm', 'standard', 'dynamic'];
const STYLES: EditStyle[] = ['apple', 'default'];
const VOICE_MODES: VoiceMode[] = ['tts', 'upload', 'none'];
const ROLES: MediaRole[] = ['visual', 'voice', 'music'];

/** A declared nature if it fits the kind, else the default of the kind. */
function pickNature(wanted: string | undefined, kind: 'image' | 'video'): MediaNature {
  const allowed = kind === 'video' ? VIDEO_NATURES : IMAGE_NATURES;
  return wanted && allowed.includes(wanted as MediaNature) ? (wanted as MediaNature) : kind === 'video' ? 'real_video' : 'real_photo';
}

const visualIds = (p: Project) => new Set(p.media.filter((m) => m.role === 'visual').map((m) => m.id));

/** An HTTP error, answered in the language of the request (messages.ts). */
class HttpError extends MsgError {
  readonly status: number;
  constructor(status: number, key: MsgKey, params?: Record<string, string | number>) {
    super(key, params);
    this.status = status;
  }
}

type Body = Record<string, unknown>;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);

/** The editable fields of a project, validated. */
function projectFields(body: Body, partial: boolean): Partial<Project> {
  const out: Partial<Project> = {};
  const title = str(body.title, 200);
  if (title !== undefined) out.title = title.trim() || 'Sans titre';
  const script = str(body.script, 60_000);
  if (script !== undefined) out.script = script;
  if (body.pacing !== undefined) {
    if (!PACINGS.includes(body.pacing as Pacing)) throw new HttpError(400, 'badPacing');
    out.pacing = body.pacing as Pacing;
  }
  if (body.style !== undefined) {
    if (!STYLES.includes(body.style as EditStyle)) throw new HttpError(400, 'badStyle');
    out.style = body.style as EditStyle;
  }
  if (body.captions !== undefined) out.captions = body.captions === true;
  if (body.llm !== undefined) out.llm = body.llm === true;
  if (body.rightsConfirmed !== undefined) out.rightsConfirmed = body.rightsConfirmed === true;
  if (body.voice !== undefined) {
    const v = body.voice as Body;
    if (!v || !VOICE_MODES.includes(v.mode as VoiceMode)) throw new HttpError(400, 'badVoiceMode');
    const voiceId = str(v.voiceId, 64);
    if (voiceId !== undefined && !/^[A-Za-z0-9]+$/.test(voiceId)) throw new HttpError(400, 'badVoiceId');
    out.voice = { mode: v.mode as VoiceMode, ...(voiceId ? { voiceId } : {}) };
  }
  if (!partial) {
    out.title ??= 'Sans titre';
    out.script ??= '';
    out.pacing ??= 'standard';
    out.style ??= 'apple';
    out.captions ??= true;
    out.llm ??= true;
    out.voice ??= { mode: 'tts' };
    out.rightsConfirmed ??= false;
  }
  return out;
}

/** Streams a file, with HTTP Range (video seeking). */
function sendFile(req: FastifyRequest, reply: FastifyReply, file: string) {
  if (!existsSync(file)) throw new HttpError(404, 'fileNotFound');
  const size = statSync(file).size;
  const type = TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
  reply.header('content-type', type).header('accept-ranges', 'bytes').header('cache-control', 'no-cache');
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (range && size > 0) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return reply.code(416).header('content-range', `bytes */${size}`).send();
    reply.code(206).header('content-range', `bytes ${start}-${end}/${size}`).header('content-length', end - start + 1);
    return reply.send(createReadStream(file, { start, end }));
  }
  reply.header('content-length', size);
  return reply.send(createReadStream(file));
}

export async function buildApp(options: AppOptions): Promise<{ app: FastifyInstance; store: ProjectStore; jobs: JobQueue }> {
  const { config, tools } = options;
  const store = new ProjectStore(config.dataDir);
  const jobs = new JobQueue(store, { config, store, tools, ...(options.fetch ? { fetch: options.fetch } : {}) }, { inline: options.inlineJobs ?? false });
  // Descriptions and generations interrupted by a restart.
  for (const p of store.list()) {
    if (p.media.some((m) => m.auto?.status === 'pending') || p.generations?.some((g) => g.status === 'pending'))
      store.update(p.id, (x) => {
        x.media.forEach((m) => { if (m.auto?.status === 'pending') m.auto = { status: 'failed', ...stored(new MsgError('describeInterrupted')) }; });
        x.generations?.forEach((g) => { if (g.status === 'pending') Object.assign(g, { status: 'failed', ...stored(new MsgError('generationInterrupted')) }); });
      });
  }
  const generator = options.generator !== undefined ? options.generator : config.runwayKey ? new RunwayGenerator({ apiKey: config.runwayKey }) : null;

  /** Runway makes the visual, Plug downloads it into the project; with a line, it becomes that sentence's visual. */
  async function runGeneration(projectId: string, genId: string) {
    const g = store.get(projectId)?.generations?.find((x) => x.id === genId);
    if (!g || !generator) return;
    const fail = (e: unknown) => {
      app.log.warn({ err: e }, 'Runway generation failed');
      if (!store.get(projectId)) return;
      store.update(projectId, (x) => {
        const y = x.generations?.find((z) => z.id === genId);
        if (y) Object.assign(y, { status: 'failed', ...stored(e) });
      });
    };
    try {
      const out = await generator.generate({ prompt: g.prompt, kind: g.kind, seconds: g.seconds });
      const res = await fetch(out.url);
      if (!res.ok || !res.body) throw new MsgError('downloadFailed', { status: res.status });
      const type = res.headers.get('content-type') ?? '';
      const ext = g.kind === 'video' ? (type.includes('webm') ? '.webm' : '.mp4') : type.includes('png') ? '.png' : type.includes('webp') ? '.webp' : '.jpg';
      const id = newId('m');
      const file = `${id}${ext}`;
      const path = join(store.mediaDir(projectId), file);
      await pump(Readable.fromWeb(res.body as never), createWriteStream(path));
      const info = probe(tools, path);
      if (info.kind === 'audio') throw new MsgError('runwayNoImage');
      const item: MediaItem = {
        id,
        role: 'visual',
        kind: info.kind as 'image' | 'video',
        file,
        originalName: `runway-${g.kind === 'video' ? 'video' : 'image'}${ext}`,
        bytes: statSync(path).size,
        checksum: sha256File(path),
        ...(info.width ? { width: info.width } : {}),
        ...(info.height ? { height: info.height } : {}),
        ...(info.durationInSeconds ? { durationInSeconds: info.durationInSeconds } : {}),
        description: g.prompt.slice(0, 300),
        tags: [],
        nature: 'generated',
        natureSet: true,
        generated: { provider: 'Runway', model: out.model, prompt: g.prompt, ...(out.credits !== undefined ? { credits: out.credits } : {}) },
        ...(describer ? { auto: { status: 'pending' as const } } : {}),
      };
      store.update(projectId, (x) => {
        x.media.push(item);
        const y = x.generations?.find((z) => z.id === genId);
        if (y) Object.assign(y, { status: 'done', mediaId: id });
        // The sentence gets this visual, unless the line left the script meanwhile.
        if (g.line && x.script.split(/\r?\n/).some((l) => hintKey(l) === g.line)) x.hints = { ...(x.hints ?? {}), [g.line]: { ...(x.hints?.[g.line] ?? {}), media: id } };
      });
      // Claude adds tags in the script's language; the prompt stays the description.
      if (describer) void describeMedia(projectId, id, { replaceDescription: false });
    } catch (e) {
      fail(e);
    }
  }
  const describer = options.describer !== undefined ? options.describer : config.anthropicKey ? new ClaudeDescriber({ model: config.anthropicModel, apiKey: config.anthropicKey }) : null;

  /**
   * Claude describes a visual in the background. What the user typed meanwhile
   * wins: the description is replaced only while it is still `replaceDescription`
   * (the one set at upload), tags only while empty, the nature only when the user never chose it.
   */
  async function describeMedia(projectId: string, mediaId: string, how: { replaceDescription: string | false | true }) {
    const p = store.get(projectId);
    const m = p?.media.find((x) => x.id === mediaId);
    if (!p || !m || m.kind === 'audio' || !describer) return;
    try {
      const frames = await framesOf(tools, join(store.mediaDir(p.id), m.file), m.kind, m.durationInSeconds);
      const d = await describer.describe({ kind: m.kind, frames, natures: m.kind === 'video' ? VIDEO_NATURES : IMAGE_NATURES, script: p.script, fileName: m.originalName });
      store.update(projectId, (x) => {
        const y = x.media.find((z) => z.id === mediaId);
        if (!y) return;
        if (how.replaceDescription === true || y.description === how.replaceDescription) y.description = d.description;
        if (how.replaceDescription === true || !y.tags.length) y.tags = d.tags;
        if (d.nature && !y.natureSet) {
          y.nature = d.nature;
          delete y.synthetic;
        }
        y.auto = { status: 'done', model: config.anthropicModel, at: new Date().toISOString() };
      });
    } catch (e) {
      app.log.warn({ err: e }, 'automatic description failed');
      if (!store.get(projectId)) return;
      store.update(projectId, (x) => {
        const y = x.media.find((z) => z.id === mediaId);
        if (y) y.auto = { status: 'failed', ...stored(e) };
      });
    }
  }
  jobs.recover();

  const app = Fastify({ logger: options.logger ?? false, bodyLimit: 2 * 1024 * 1024 });
  await app.register(multipart, { limits: { fileSize: 4 * 1024 ** 3, files: 1, fields: 10 } });

  app.addHook('onRequest', async (req, reply) => {
    const origin = req.headers.origin;
    if (origin && config.corsOrigins.includes(origin)) {
      reply.header('access-control-allow-origin', origin).header('vary', 'origin');
      reply.header('access-control-allow-methods', 'GET,POST,PATCH,DELETE,OPTIONS').header('access-control-allow-headers', 'content-type,range');
      if (req.method === 'OPTIONS') return reply.code(204).send();
    }
  });

  app.setErrorHandler((err: Error & { statusCode?: number }, req, reply) => {
    const status = err instanceof HttpError ? err.status : err instanceof HintError ? 400 : err instanceof BusyError ? 409 : err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
    if (status >= 500) app.log.error(err);
    const lang = langOf(req.headers);
    const said = err instanceof MsgError ? text(err.msg, lang) : err.message;
    reply.code(status).send({ error: status >= 500 ? (lang === 'fr' ? `Erreur serveur : ${said}` : `Server error: ${said}`) : said });
  });

  // Projects and jobs are answered in the reader's language (i18n.ts); what is stored never changes.
  app.addHook('preSerialization', async (req, _reply, payload) => localizePayload(payload, langOf(req.headers)));

  const project = (id: string) => {
    const p = store.get(id);
    if (!p) throw new HttpError(404, 'projectNotFound');
    return p;
  };

  app.get('/api/health', async () => ({
    ok: true,
    elevenLabs: !!config.elevenLabsKey,
    anthropic: !!config.anthropicKey,
    runway: !!generator,
    studioBlocks: existsSync(join(config.enginePublicDir, 'hyperframes', 'hyperframe.runtime.js')),
    engineBuilt: existsSync(join(config.engineDir, 'packages', 'render', 'dist', 'index.js')),
    browser: config.browser ?? null,
  }));

  app.get('/api/projects', async () => store.list());

  app.post('/api/projects', async (req, reply) => {
    const p = store.create(projectFields((req.body ?? {}) as Body, false) as Parameters<ProjectStore['create']>[0]);
    return reply.code(201).send(p);
  });

  app.get<{ Params: { id: string } }>('/api/projects/:id', async (req) => project(req.params.id));

  app.patch<{ Params: { id: string } }>('/api/projects/:id', async (req) => {
    project(req.params.id);
    const fields = projectFields((req.body ?? {}) as Body, true);
    return store.update(req.params.id, (p) => {
      Object.assign(p, fields);
      // Hints of lines that left the script go with them.
      if (fields.script !== undefined && p.hints) p.hints = keepHints(p.hints, p.script, visualIds(p));
    });
  });

  app.delete<{ Params: { id: string } }>('/api/projects/:id', async (req, reply) => {
    const p = project(req.params.id);
    if (p.job?.status === 'running') throw new HttpError(409, 'jobRunning');
    store.remove(p.id);
    return reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>('/api/projects/:id/media', async (req, reply) => {
    const p = project(req.params.id);
    const part = await req.file();
    if (!part) throw new HttpError(400, 'noFile');
    const ext = extname(part.filename).toLowerCase();
    if (!UPLOAD_EXT.has(ext)) {
      part.file.resume();
      throw new HttpError(400, 'badFormat', { ext });
    }
    const field = (name: string) => {
      const f = part.fields[name] as { value?: unknown } | undefined;
      return typeof f?.value === 'string' ? f.value : undefined;
    };
    const role = (field('role') ?? 'visual') as MediaRole;
    if (!ROLES.includes(role)) throw new HttpError(400, 'badRole');
    const id = newId('m');
    const file = `${id}${ext}`;
    const path = join(store.mediaDir(p.id), file);
    await pump(part.file, createWriteStream(path));
    if (part.file.truncated) {
      await rm(path, { force: true });
      throw new HttpError(413, 'tooLarge');
    }
    let info;
    try {
      info = probe(tools, path);
    } catch {
      await rm(path, { force: true });
      throw new HttpError(400, 'unreadable');
    }
    if ((role === 'voice' || role === 'music') && !info.hasAudio) {
      await rm(path, { force: true });
      throw new HttpError(400, 'noSound');
    }
    if (role === 'visual' && info.kind === 'audio') {
      await rm(path, { force: true });
      throw new HttpError(400, 'visualKind');
    }
    const description = (field('description') ?? part.filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')).slice(0, 300);
    const declaredNature = field('nature') ?? (field('synthetic') === 'true' ? 'generated' : undefined);
    const autoDescribe = role === 'visual' && !!describer;
    const item: MediaItem = {
      id,
      role,
      kind: role === 'visual' ? (info.kind as 'image' | 'video') : 'audio',
      file,
      originalName: part.filename.slice(0, 200),
      bytes: statSync(path).size,
      checksum: sha256File(path),
      ...(info.width ? { width: info.width } : {}),
      ...(info.height ? { height: info.height } : {}),
      ...(info.durationInSeconds ? { durationInSeconds: info.durationInSeconds } : {}),
      description,
      tags: [],
      ...(role === 'visual' ? { nature: pickNature(declaredNature, info.kind as 'image' | 'video'), ...(declaredNature ? { natureSet: true } : {}) } : {}),
      ...(autoDescribe ? { auto: { status: 'pending' as const } } : {}),
    };
    // One voice and one music per project: a new one replaces the old.
    const replaced = role === 'visual' ? [] : p.media.filter((m) => m.role === role);
    for (const m of replaced) await rm(join(store.mediaDir(p.id), m.file), { force: true });
    const updated = store.update(p.id, (x) => {
      x.media = [...x.media.filter((m) => !replaced.includes(m)), item];
      if (role === 'voice') x.voice = { mode: 'upload' };
    });
    // A description typed at upload is the user's: Claude only adds tags and, if undeclared, the nature.
    if (autoDescribe) void describeMedia(p.id, id, { replaceDescription: field('description') === undefined ? description : false });
    return reply.code(201).send(updated);
  });

  app.patch<{ Params: { id: string; mediaId: string } }>('/api/projects/:id/media/:mediaId', async (req) => {
    const p = project(req.params.id);
    if (!p.media.some((m) => m.id === req.params.mediaId)) throw new HttpError(404, 'mediaNotFound');
    const body = (req.body ?? {}) as Body;
    return store.update(p.id, (x) => {
      const m = x.media.find((y) => y.id === req.params.mediaId)!;
      const description = str(body.description, 300);
      if (description !== undefined) m.description = description;
      if (Array.isArray(body.tags)) m.tags = body.tags.filter((t): t is string => typeof t === 'string').map((t) => t.slice(0, 40)).slice(0, 20);
      if (body.nature !== undefined || body.synthetic !== undefined) {
        if (m.role !== 'visual') throw new HttpError(400, 'natureOnlyVisual');
        const wanted = body.nature !== undefined ? String(body.nature) : body.synthetic === true ? 'generated' : undefined;
        const allowed = m.kind === 'video' ? VIDEO_NATURES : IMAGE_NATURES;
        if (wanted !== undefined && !allowed.includes(wanted as MediaNature)) throw new HttpError(400, 'badNature', { list: allowed.join(', ') });
        m.nature = wanted as MediaNature | undefined ?? (m.kind === 'video' ? 'real_video' : 'real_photo');
        m.natureSet = true;
        delete m.synthetic;
      }
      // An audio file is the voice-over or the music; one of each per project.
      if (body.role !== undefined && m.kind === 'audio' && (body.role === 'voice' || body.role === 'music') && body.role !== m.role) {
        const previous = x.media.find((y) => y.role === body.role);
        if (previous) previous.role = m.role;
        m.role = body.role;
        if (m.role === 'voice') x.voice = { mode: 'upload' };
        else if (!x.media.some((y) => y.role === 'voice') && x.voice.mode === 'upload') x.voice = { mode: 'tts' };
      }
    });
  });

  app.post<{ Params: { id: string; mediaId: string } }>('/api/projects/:id/media/:mediaId/describe', async (req, reply) => {
    const p = project(req.params.id);
    const m = p.media.find((y) => y.id === req.params.mediaId);
    if (!m) throw new HttpError(404, 'mediaNotFound');
    if (m.role !== 'visual') throw new HttpError(400, 'describeOnlyVisual');
    if (!describer) throw new HttpError(400, 'describeNoKey');
    if (m.auto?.status === 'pending') throw new HttpError(409, 'describing');
    const updated = store.update(p.id, (x) => {
      x.media.find((y) => y.id === m.id)!.auto = { status: 'pending' };
    });
    void describeMedia(p.id, m.id, { replaceDescription: true });
    return reply.code(202).send(updated);
  });

  app.delete<{ Params: { id: string; mediaId: string } }>('/api/projects/:id/media/:mediaId', async (req) => {
    const p = project(req.params.id);
    const m = p.media.find((y) => y.id === req.params.mediaId);
    if (!m) throw new HttpError(404, 'mediaNotFound');
    await rm(join(store.mediaDir(p.id), m.file), { force: true });
    return store.update(p.id, (x) => {
      x.media = x.media.filter((y) => y.id !== m.id);
      if (m.role === 'voice' && x.voice.mode === 'upload') x.voice = { mode: 'tts' };
      if (x.hints) x.hints = keepHints(x.hints, x.script, visualIds(x));
    });
  });

  app.post<{ Params: { id: string } }>('/api/projects/:id/generate', async (req, reply) => {
    const p = project(req.params.id);
    if (!generator) throw new HttpError(400, 'runwayNoKey');
    const body = (req.body ?? {}) as Body;
    const prompt = (str(body.prompt, 1000) ?? '').trim();
    if (!prompt) throw new HttpError(400, 'promptEmpty');
    const kind: 'image' | 'video' = body.kind === 'image' ? 'image' : 'video';
    const seconds = Math.min(10, Math.max(2, Math.round(Number(body.seconds) || 5)));
    const line = typeof body.line === 'string' ? hintKey(body.line) : undefined;
    if (line) {
      if (!p.script.split(/\r?\n/).some((l) => hintKey(l) === line)) throw new HttpError(400, 'lineGone');
      // Bible MED-07: a generated picture never stands for something real. The engine would not use it anyway.
      const need = p.hints?.[line]?.mediaNeed ?? p.plan?.needs?.[line];
      if (need && (REAL_SUBJECT_NEEDS as readonly string[]).includes(need))
        throw new HttpError(400, 'realSubject');
    }
    if ((p.generations ?? []).filter((g) => g.status === 'pending').length >= 3) throw new HttpError(409, 'tooManyGenerations');
    const g = { id: newId('g'), prompt, kind, seconds, ...(line ? { line } : {}), status: 'pending' as const, createdAt: new Date().toISOString() };
    const updated = store.update(p.id, (x) => {
      x.generations = [g, ...(x.generations ?? [])].slice(0, 20);
    });
    void runGeneration(p.id, g.id);
    return reply.code(202).send(updated);
  });

  app.put<{ Params: { id: string } }>('/api/projects/:id/hints', async (req) => {
    const p = project(req.params.id);
    const body = (req.body ?? {}) as Body;
    const line = typeof body.line === 'string' ? hintKey(body.line) : '';
    if (!line) throw new HttpError(400, 'lineMissing');
    if (!p.script.split(/\r?\n/).some((l) => hintKey(l) === line)) throw new HttpError(400, 'lineGone');
    const hints = body.hints === null ? {} : parseHints(body.hints, visualIds(p));
    return store.update(p.id, (x) => {
      const all = { ...(x.hints ?? {}) };
      if (Object.keys(hints).length) all[line] = hints;
      else delete all[line];
      x.hints = all;
    });
  });

  const requireRights = (p: Project) => {
    // A Runway visual comes with Runway's terms: only imported files need the confirmation.
    if (p.media.some((m) => m.role !== 'voice' && !m.generated) && !p.rightsConfirmed) throw new HttpError(400, 'rightsNeeded');
  };

  app.post<{ Params: { id: string } }>('/api/projects/:id/direct', async (req, reply) => {
    const p = project(req.params.id);
    requireRights(p);
    return reply.code(202).send(jobs.enqueue(p.id, 'direct'));
  });

  app.post<{ Params: { id: string } }>('/api/projects/:id/stills', async (req, reply) => {
    const p = project(req.params.id);
    if (!p.plan) throw new HttpError(400, 'planFirst');
    return reply.code(202).send(jobs.enqueue(p.id, 'stills'));
  });

  app.post<{ Params: { id: string } }>('/api/projects/:id/render', async (req, reply) => {
    const p = project(req.params.id);
    if (!p.plan) throw new HttpError(400, 'planFirst');
    requireRights(p);
    const quality = ((req.body ?? {}) as Body).quality === 'final' ? 'final' : 'preview';
    return reply.code(202).send(jobs.enqueue(p.id, 'render', { scale: quality === 'final' ? 1 : 0.5 }));
  });

  app.get<{ Params: { id: string } }>('/api/projects/:id/plan', async (req) => readProjectPlan(store, project(req.params.id).id));

  app.get<{ Params: { id: string; name: string } }>('/api/projects/:id/files/:name', async (req, reply) => {
    const p = project(req.params.id);
    if (!OUTPUTS.has(req.params.name) && !VERSION_FILE.test(req.params.name)) throw new HttpError(404, 'fileNotFound');
    return sendFile(req, reply, store.file(p.id, req.params.name));
  });

  app.get<{ Params: { id: string; file: string } }>('/api/projects/:id/files/media/:file', async (req, reply) => {
    const p = project(req.params.id);
    const m = p.media.find((x) => x.file === req.params.file);
    if (!m) throw new HttpError(404, 'fileNotFound');
    return sendFile(req, reply, join(store.mediaDir(p.id), m.file));
  });

  return { app, store, jobs };
}

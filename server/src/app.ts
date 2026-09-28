/**
 * Plug HTTP API.
 *
 *   GET    /api/health
 *   GET    /api/projects                     POST /api/projects
 *   GET    /api/projects/:id                 PATCH /api/projects/:id     DELETE /api/projects/:id
 *   POST   /api/projects/:id/media           (multipart: file, role, description, synthetic)
 *   PATCH  /api/projects/:id/media/:mediaId  DELETE /api/projects/:id/media/:mediaId
 *   POST   /api/projects/:id/direct          voice → timings → Apple-style plan
 *   POST   /api/projects/:id/stills          control sheet
 *   POST   /api/projects/:id/render          { quality: 'preview' | 'final' }
 *   GET    /api/projects/:id/plan
 *   GET    /api/projects/:id/files/:name     voice.wav, stills.jpg, video.mp4 (Range supported)
 *   GET    /api/projects/:id/files/media/:file
 */
import { createReadStream, createWriteStream, existsSync, statSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pipeline as pump } from 'node:stream/promises';
import multipart from '@fastify/multipart';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import type { Config } from './config.ts';
import type { FfmpegTools } from './engine.ts';
import { BusyError, JobQueue } from './jobs.ts';
import { probe, sha256File } from './media.ts';
import { readProjectPlan } from './pipeline.ts';
import { newId, ProjectStore, type MediaItem, type MediaRole, type Pacing, type Project, type VoiceMode } from './store.ts';

export interface AppOptions {
  config: Config;
  tools: FfmpegTools;
  fetch?: typeof fetch;
  logger?: boolean;
  /** Run jobs on the main thread (tests with an injected fetch). */
  inlineJobs?: boolean;
}

const OUTPUTS = new Set(['voice.wav', 'stills.jpg', 'video.mp4', 'plan.json']);
const TYPES: Record<string, string> = {
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/mp4',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.flac': 'audio/flac',
  '.json': 'application/json',
};
const UPLOAD_EXT = new Set(Object.keys(TYPES).filter((e) => e !== '.json'));
const PACINGS: Pacing[] = ['calm', 'standard', 'dynamic'];
const VOICE_MODES: VoiceMode[] = ['tts', 'upload', 'none'];
const ROLES: MediaRole[] = ['visual', 'voice', 'music'];

class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
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
    if (!PACINGS.includes(body.pacing as Pacing)) throw new HttpError(400, 'pacing: calm, standard ou dynamic');
    out.pacing = body.pacing as Pacing;
  }
  if (body.captions !== undefined) out.captions = body.captions === true;
  if (body.llm !== undefined) out.llm = body.llm === true;
  if (body.rightsConfirmed !== undefined) out.rightsConfirmed = body.rightsConfirmed === true;
  if (body.voice !== undefined) {
    const v = body.voice as Body;
    if (!v || !VOICE_MODES.includes(v.mode as VoiceMode)) throw new HttpError(400, 'voice.mode: tts, upload ou none');
    const voiceId = str(v.voiceId, 64);
    if (voiceId !== undefined && !/^[A-Za-z0-9]+$/.test(voiceId)) throw new HttpError(400, 'voice.voiceId invalide');
    out.voice = { mode: v.mode as VoiceMode, ...(voiceId ? { voiceId } : {}) };
  }
  if (!partial) {
    out.title ??= 'Sans titre';
    out.script ??= '';
    out.pacing ??= 'standard';
    out.captions ??= true;
    out.llm ??= true;
    out.voice ??= { mode: 'tts' };
    out.rightsConfirmed ??= false;
  }
  return out;
}

/** Streams a file, with HTTP Range (video seeking). */
function sendFile(req: FastifyRequest, reply: FastifyReply, file: string) {
  if (!existsSync(file)) throw new HttpError(404, 'fichier introuvable');
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

  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    const status = err instanceof HttpError ? err.status : err instanceof BusyError ? 409 : err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
    if (status >= 500) app.log.error(err);
    reply.code(status).send({ error: status >= 500 ? `Erreur serveur : ${err.message}` : err.message });
  });

  const project = (id: string) => {
    const p = store.get(id);
    if (!p) throw new HttpError(404, 'projet introuvable');
    return p;
  };

  app.get('/api/health', async () => ({
    ok: true,
    elevenLabs: !!config.elevenLabsKey,
    anthropic: !!config.anthropicKey,
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
    return store.update(req.params.id, (p) => Object.assign(p, fields));
  });

  app.delete<{ Params: { id: string } }>('/api/projects/:id', async (req, reply) => {
    const p = project(req.params.id);
    if (p.job?.status === 'running') throw new HttpError(409, 'Une tâche tourne sur ce projet.');
    store.remove(p.id);
    return reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>('/api/projects/:id/media', async (req, reply) => {
    const p = project(req.params.id);
    const part = await req.file();
    if (!part) throw new HttpError(400, 'fichier manquant');
    const ext = extname(part.filename).toLowerCase();
    if (!UPLOAD_EXT.has(ext)) {
      part.file.resume();
      throw new HttpError(400, `format non pris en charge : ${ext || 'inconnu'}`);
    }
    const field = (name: string) => {
      const f = part.fields[name] as { value?: unknown } | undefined;
      return typeof f?.value === 'string' ? f.value : undefined;
    };
    const role = (field('role') ?? 'visual') as MediaRole;
    if (!ROLES.includes(role)) throw new HttpError(400, 'role: visual, voice ou music');
    const id = newId('m');
    const file = `${id}${ext}`;
    const path = join(store.mediaDir(p.id), file);
    await pump(part.file, createWriteStream(path));
    if (part.file.truncated) {
      await rm(path, { force: true });
      throw new HttpError(413, 'fichier trop lourd (4 Go maximum)');
    }
    let info;
    try {
      info = probe(tools, path);
    } catch {
      await rm(path, { force: true });
      throw new HttpError(400, 'fichier illisible');
    }
    if ((role === 'voice' || role === 'music') && !info.hasAudio) {
      await rm(path, { force: true });
      throw new HttpError(400, 'ce fichier ne contient pas de son');
    }
    if (role === 'visual' && info.kind === 'audio') {
      await rm(path, { force: true });
      throw new HttpError(400, 'un visuel doit être une image ou une vidéo');
    }
    const description = (field('description') ?? part.filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')).slice(0, 300);
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
      ...(field('synthetic') === 'true' ? { synthetic: true } : {}),
    };
    // One voice and one music per project: a new one replaces the old.
    const replaced = role === 'visual' ? [] : p.media.filter((m) => m.role === role);
    for (const m of replaced) await rm(join(store.mediaDir(p.id), m.file), { force: true });
    const updated = store.update(p.id, (x) => {
      x.media = [...x.media.filter((m) => !replaced.includes(m)), item];
      if (role === 'voice') x.voice = { mode: 'upload' };
    });
    return reply.code(201).send(updated);
  });

  app.patch<{ Params: { id: string; mediaId: string } }>('/api/projects/:id/media/:mediaId', async (req) => {
    const p = project(req.params.id);
    if (!p.media.some((m) => m.id === req.params.mediaId)) throw new HttpError(404, 'média introuvable');
    const body = (req.body ?? {}) as Body;
    return store.update(p.id, (x) => {
      const m = x.media.find((y) => y.id === req.params.mediaId)!;
      const description = str(body.description, 300);
      if (description !== undefined) m.description = description;
      if (Array.isArray(body.tags)) m.tags = body.tags.filter((t): t is string => typeof t === 'string').map((t) => t.slice(0, 40)).slice(0, 20);
      if (body.synthetic !== undefined) m.synthetic = body.synthetic === true;
    });
  });

  app.delete<{ Params: { id: string; mediaId: string } }>('/api/projects/:id/media/:mediaId', async (req) => {
    const p = project(req.params.id);
    const m = p.media.find((y) => y.id === req.params.mediaId);
    if (!m) throw new HttpError(404, 'média introuvable');
    await rm(join(store.mediaDir(p.id), m.file), { force: true });
    return store.update(p.id, (x) => {
      x.media = x.media.filter((y) => y.id !== m.id);
      if (m.role === 'voice' && x.voice.mode === 'upload') x.voice = { mode: 'tts' };
    });
  });

  const requireRights = (p: Project) => {
    if (p.media.some((m) => m.role !== 'voice') && !p.rightsConfirmed) throw new HttpError(400, 'Confirmez que vous détenez les droits des médias importés.');
  };

  app.post<{ Params: { id: string } }>('/api/projects/:id/direct', async (req, reply) => {
    const p = project(req.params.id);
    requireRights(p);
    return reply.code(202).send(jobs.enqueue(p.id, 'direct'));
  });

  app.post<{ Params: { id: string } }>('/api/projects/:id/stills', async (req, reply) => {
    const p = project(req.params.id);
    if (!p.plan) throw new HttpError(400, 'Générez d’abord le plan de montage.');
    return reply.code(202).send(jobs.enqueue(p.id, 'stills'));
  });

  app.post<{ Params: { id: string } }>('/api/projects/:id/render', async (req, reply) => {
    const p = project(req.params.id);
    if (!p.plan) throw new HttpError(400, 'Générez d’abord le plan de montage.');
    requireRights(p);
    const quality = ((req.body ?? {}) as Body).quality === 'final' ? 'final' : 'preview';
    return reply.code(202).send(jobs.enqueue(p.id, 'render', { scale: quality === 'final' ? 1 : 0.5 }));
  });

  app.get<{ Params: { id: string } }>('/api/projects/:id/plan', async (req) => readProjectPlan(store, project(req.params.id).id));

  app.get<{ Params: { id: string; name: string } }>('/api/projects/:id/files/:name', async (req, reply) => {
    const p = project(req.params.id);
    if (!OUTPUTS.has(req.params.name)) throw new HttpError(404, 'fichier introuvable');
    return sendFile(req, reply, store.file(p.id, req.params.name));
  });

  app.get<{ Params: { id: string; file: string } }>('/api/projects/:id/files/media/:file', async (req, reply) => {
    const p = project(req.params.id);
    const m = p.media.find((x) => x.file === req.params.file);
    if (!m) throw new HttpError(404, 'fichier introuvable');
    return sendFile(req, reply, join(store.mediaDir(p.id), m.file));
  });

  return { app, store, jobs };
}

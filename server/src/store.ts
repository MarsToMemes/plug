/**
 * Projects on disk: <dataDir>/projects/<id>/project.json, media in media/,
 * outputs (voice.wav, plan.json, stills.jpg, video.mp4) next to it.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HintsByLine } from './hints.ts';

export type Pacing = 'calm' | 'standard' | 'dynamic';
/** `apple`: studio blocks timed to the voice. `default`: the engine's own compositions. */
export type EditStyle = 'apple' | 'default';
export type VoiceMode = 'tts' | 'upload' | 'none';
export type MediaRole = 'visual' | 'voice' | 'music';
/** What a visual is (studio-engine bible §27): the engine prefers the most authentic. */
export type MediaNature = 'real_video' | 'real_photo' | 'archive' | 'screenshot' | 'document' | 'generated';
export const VIDEO_NATURES: readonly MediaNature[] = ['real_video', 'generated'];
export const IMAGE_NATURES: readonly MediaNature[] = ['real_photo', 'archive', 'screenshot', 'document', 'generated'];
/** Nature of a media: declared, else from the old "généré par IA" flag and the kind. */
export const natureOf = (m: Pick<MediaItem, 'kind' | 'nature' | 'synthetic'>): MediaNature => m.nature ?? (m.synthetic ? 'generated' : m.kind === 'video' ? 'real_video' : 'real_photo');

export interface MediaItem {
  id: string;
  role: MediaRole;
  kind: 'image' | 'video' | 'audio';
  /** File name in media/. */
  file: string;
  originalName: string;
  bytes: number;
  checksum: string;
  width?: number;
  height?: number;
  durationInSeconds?: number;
  /** What the visual shows: the brain matches it to the narration. */
  description: string;
  tags: string[];
  /** What the visual is: real video, photo, archive, screenshot, document or generated. */
  nature?: MediaNature;
  /** Projects made before `nature`: AI-generated realistic image or video. */
  synthetic?: boolean;
  /** The user chose the nature (upload or library): Claude's guess never replaces it. */
  natureSet?: boolean;
  /** Claude's automatic description (describe.ts). */
  auto?: { status: 'pending' | 'done' | 'failed'; error?: string; model?: string; at?: string };
}

export type JobKind = 'direct' | 'stills' | 'render';

export interface Job {
  id: string;
  kind: JobKind;
  status: 'queued' | 'running' | 'done' | 'failed';
  /** 0 to 1. */
  progress: number;
  message: string;
  error?: string;
  queuedAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** The script, as typed (see script.ts for the format). */
  script: string;
  pacing: Pacing;
  /** Missing in projects made before the choice existed: Apple. */
  style?: EditStyle;
  captions: boolean;
  /** Claude writes the editorial analysis (needs ANTHROPIC_API_KEY). */
  llm: boolean;
  voice: { mode: VoiceMode; voiceId?: string };
  /** The user confirmed owning or licensing the uploaded media (bible SRC-01). */
  rightsConfirmed: boolean;
  media: MediaItem[];
  /** What the author set on sentences, keyed by script line (hints.ts). */
  hints?: HintsByLine;

  voiceTrack?: {
    durationInSeconds: number;
    timing: 'tts' | 'stt' | 'aligned';
    words: number;
    /** Hash of what produced the voice: a regeneration is skipped while it does not change. */
    key: string;
  };
  plan?: {
    createdAt: string;
    shots: number;
    durationInSeconds: number;
    valid: boolean;
    brain: 'llm' | 'heuristic';
    decisions: string[];
    assetRequests: Array<{ unitId: string; need: string; description: string }>;
    errors: Array<{ message: string; rule?: string }>;
    warnings: Array<{ message: string; rule?: string }>;
    notes: string[];
  };
  stills?: { createdAt: string; planCreatedAt: string };
  /** The latest render (also renders[0]). */
  render?: RenderInfo;
  /** The last renders, newest first: the "versions" of the editor. */
  renders?: RenderInfo[];
  job?: Job;
}

export interface RenderInfo {
  /** Missing on renders made before versions existed (their file is video.mp4). */
  id?: string;
  /** File name in the project folder. */
  file?: string;
  /** A frame of the video (JPEG), for the version cards. */
  poster?: string;
  createdAt: string;
  planCreatedAt: string;
  durationInSeconds: number;
  shots?: number;
  style?: EditStyle;
  draft: boolean;
  scale: number;
  loudness?: { integrated: number; truePeak: number };
  qc?: { pass: boolean; failed: string[]; warnings: string[] };
  notes: string[];
}

/** Versions kept per project; older files are deleted. */
export const MAX_RENDERS = 4;

export const newId = (prefix = '') => prefix + randomBytes(6).toString('hex');

const ID_RE = /^[a-z0-9]{6,32}$/;

export class ProjectStore {
  readonly root: string;

  constructor(dataDir: string) {
    this.root = join(dataDir, 'projects');
    mkdirSync(this.root, { recursive: true });
  }

  dir(id: string): string {
    if (!ID_RE.test(id)) throw new Error('invalid project id');
    return join(this.root, id);
  }

  mediaDir(id: string): string {
    return join(this.dir(id), 'media');
  }

  file(id: string, name: string): string {
    return join(this.dir(id), name);
  }

  create(fields: Pick<Project, 'title' | 'script' | 'pacing' | 'style' | 'captions' | 'llm' | 'voice' | 'rightsConfirmed'>): Project {
    const now = new Date().toISOString();
    const project: Project = { id: newId(), createdAt: now, updatedAt: now, media: [], ...fields };
    mkdirSync(this.mediaDir(project.id), { recursive: true });
    this.save(project);
    return project;
  }

  get(id: string): Project | undefined {
    let path: string;
    try {
      path = join(this.dir(id), 'project.json');
    } catch {
      return undefined;
    }
    if (!existsSync(path)) return undefined;
    return JSON.parse(readFileSync(path, 'utf8')) as Project;
  }

  list(): Project[] {
    return readdirSync(this.root)
      .filter((id) => ID_RE.test(id))
      .map((id) => this.get(id))
      .filter((p): p is Project => !!p)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  save(project: Project): Project {
    project.updatedAt = new Date().toISOString();
    const path = join(this.dir(project.id), 'project.json');
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(project, null, 2)}\n`);
    renameSync(tmp, path);
    return project;
  }

  /** Reads, changes and saves a project in one step. */
  update(id: string, change: (p: Project) => void): Project {
    const p = this.get(id);
    if (!p) throw new Error(`project ${id} not found`);
    change(p);
    return this.save(p);
  }

  remove(id: string): void {
    rmSync(this.dir(id), { recursive: true, force: true });
  }
}

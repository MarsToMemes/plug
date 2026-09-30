/**
 * One job at a time on the machine (a render uses every core); each project
 * has at most one job queued or running. Jobs run in a worker thread
 * (worker.ts); this thread stays the only writer of project.json, so a page
 * reload or another tab sees the same progress and edits are never lost.
 */
import { Worker } from 'node:worker_threads';
import { isMsg, msg, MsgError, text, type Msg } from './messages.ts';
import type { PipelineContext } from './pipeline.ts';
import { STEPS, type JobArgs } from './steps.ts';
import { newId, type Job, type JobKind, type Project, type ProjectStore } from './store.ts';
import type { WorkerInput, WorkerMessage } from './worker.ts';

export interface JobQueueOptions {
  /** Run the steps on this thread (tests: an injected fetch cannot cross into a worker). */
  inline?: boolean;
}

export class JobQueue {
  private readonly queue: Array<{ projectId: string; job: Job; args: JobArgs }> = [];
  private running = false;
  private idleWaiters: Array<() => void> = [];
  private readonly store: ProjectStore;
  private readonly context: Omit<PipelineContext, 'report' | 'commit'>;
  private readonly options: JobQueueOptions;

  constructor(store: ProjectStore, context: Omit<PipelineContext, 'report' | 'commit'>, options: JobQueueOptions = {}) {
    this.store = store;
    this.context = context;
    this.options = options;
  }

  /** Queues a job; throws if the project already has one. */
  enqueue(projectId: string, kind: JobKind, args: JobArgs = {}): Job {
    const project = this.store.get(projectId);
    if (!project) throw new MsgError('projectNotFound');
    if (project.job && (project.job.status === 'queued' || project.job.status === 'running')) throw new BusyError('busy');
    const waiting = msg('queued');
    const job: Job = { id: newId('job'), kind, status: 'queued', progress: 0, message: text(waiting, 'en'), msg: waiting, queuedAt: new Date().toISOString() };
    this.store.update(projectId, (p) => (p.job = job));
    this.queue.push({ projectId, job, args });
    void this.next();
    return job;
  }

  /** Resolves when nothing is queued or running (tests). */
  idle(): Promise<void> {
    if (!this.running && !this.queue.length) return Promise.resolve();
    return new Promise((r) => this.idleWaiters.push(r));
  }

  /** Jobs left "running" by a stopped server are marked failed at start-up. */
  recover(): void {
    for (const p of this.store.list()) {
      if (p.job && (p.job.status === 'queued' || p.job.status === 'running')) {
        this.store.update(p.id, (x) => (x.job = { ...x.job!, status: 'failed', ...failure(new MsgError('serverRestarted')), finishedAt: new Date().toISOString() }));
      }
    }
  }

  private async next(): Promise<void> {
    if (this.running) return;
    const item = this.queue.shift();
    if (!item) {
      for (const w of this.idleWaiters.splice(0)) w();
      return;
    }
    this.running = true;
    const { projectId, job, args } = item;
    const alive = () => !!this.store.get(projectId); // the project may be deleted meanwhile
    const setJob = (patch: Partial<Job>) => {
      if (alive()) this.store.update(projectId, (p) => (p.job = { ...job, ...p.job, ...patch, id: job.id }));
    };
    const commit = (fields: Partial<Project>) => {
      if (alive()) this.store.update(projectId, (p) => Object.assign(p, fields));
    };
    let last = 0;
    const report = (progress: number, m: Msg) => {
      // At most a few writes per second.
      const now = Date.now();
      if (progress < 1 && now - last < 300) return;
      last = now;
      setJob({ progress: Math.max(0, Math.min(1, progress)), message: text(m, 'en'), msg: m });
    };
    const starting = msg('starting');
    setJob({ status: 'running', startedAt: new Date().toISOString(), message: text(starting, 'en'), msg: starting });
    try {
      if (this.options.inline) await STEPS[job.kind](projectId, { ...this.context, report, commit }, args);
      else await this.inWorker({ config: this.context.config, tools: this.context.tools, projectId, kind: job.kind, args }, report, commit);
      setJob({ status: 'done', progress: 1, finishedAt: new Date().toISOString() });
    } catch (e) {
      setJob({ status: 'failed', ...failure(e), finishedAt: new Date().toISOString() });
    } finally {
      this.running = false;
      void this.next();
    }
  }

  private inWorker(input: WorkerInput, report: PipelineContext['report'], commit: PipelineContext['commit']): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { workerData: input });
      let settled = false;
      const settle = (err?: Error) => {
        if (settled) return;
        settled = true;
        if (err) reject(err);
        else resolve();
      };
      worker.on('message', (m: WorkerMessage) => {
        if (m.type === 'report') report(m.progress, m.msg);
        else if (m.type === 'commit') commit(m.fields);
        else if (m.type === 'done') settle();
        else settle(m.msg ? new MsgError(m.msg.key, m.msg.params) : new Error(m.message));
      });
      worker.on('error', (e) => settle(e));
      worker.on('exit', (code) => settle(code === 0 ? undefined : new MsgError('taskStopped', { code: code ?? '?' })));
    });
  }
}

/** The error of a failed job: the English text, and the message to translate when the server wrote it. */
export function failure(e: unknown): { error: string; errorMsg?: Msg } {
  const m = (e as { msg?: unknown }).msg;
  return { error: (e as Error).message ?? String(e), ...(isMsg(m) ? { errorMsg: m } : {}) };
}

/** A project that already has a job (answered 409). */
export class BusyError extends MsgError {}

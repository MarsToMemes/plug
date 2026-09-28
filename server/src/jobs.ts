/**
 * One job at a time on the machine (a render uses every core); each project
 * has at most one job queued or running. Jobs run in a worker thread
 * (worker.ts); this thread stays the only writer of project.json, so a page
 * reload or another tab sees the same progress and edits are never lost.
 */
import { Worker } from 'node:worker_threads';
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
    if (!project) throw new Error('project not found');
    if (project.job && (project.job.status === 'queued' || project.job.status === 'running')) throw new BusyError('Une tâche est déjà en cours sur ce projet.');
    const job: Job = { id: newId('job'), kind, status: 'queued', progress: 0, message: 'En attente', queuedAt: new Date().toISOString() };
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
        this.store.update(p.id, (x) => (x.job = { ...x.job!, status: 'failed', error: 'Le serveur a redémarré pendant la tâche : relancez-la.', finishedAt: new Date().toISOString() }));
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
    const report = (progress: number, message: string) => {
      // At most a few writes per second.
      const now = Date.now();
      if (progress < 1 && now - last < 300) return;
      last = now;
      setJob({ progress: Math.max(0, Math.min(1, progress)), message });
    };
    setJob({ status: 'running', startedAt: new Date().toISOString(), message: 'Démarrage' });
    try {
      if (this.options.inline) await STEPS[job.kind](projectId, { ...this.context, report, commit }, args);
      else await this.inWorker({ config: this.context.config, tools: this.context.tools, projectId, kind: job.kind, args }, report, commit);
      setJob({ status: 'done', progress: 1, finishedAt: new Date().toISOString() });
    } catch (e) {
      setJob({ status: 'failed', error: (e as Error).message, finishedAt: new Date().toISOString() });
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
        if (m.type === 'report') report(m.progress, m.message);
        else if (m.type === 'commit') commit(m.fields);
        else if (m.type === 'done') settle();
        else settle(new Error(m.message));
      });
      worker.on('error', (e) => settle(e));
      worker.on('exit', (code) => settle(code === 0 ? undefined : new Error(`la tâche s’est arrêtée (code ${code})`)));
    });
  }
}

export class BusyError extends Error {}

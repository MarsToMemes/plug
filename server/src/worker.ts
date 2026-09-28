/**
 * Runs one pipeline step off the main thread. The engine blocks its thread
 * at times (FFmpeg through spawnSync, the JS mixer), and FFmpeg reads the
 * project media from this server's URLs: on the main thread that would stop
 * the API, and deadlock.
 */
import { parentPort, workerData } from 'node:worker_threads';
import type { Config } from './config.ts';
import type { FfmpegTools } from './engine.ts';
import { STEPS, type JobArgs } from './steps.ts';
import { ProjectStore, type JobKind, type Project } from './store.ts';

export type WorkerMessage =
  | { type: 'report'; progress: number; message: string }
  | { type: 'commit'; fields: Partial<Project> }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface WorkerInput {
  config: Config;
  tools: FfmpegTools;
  projectId: string;
  kind: JobKind;
  args: JobArgs;
}

const input = workerData as WorkerInput;
const post = (m: WorkerMessage) => parentPort!.postMessage(m);

try {
  await STEPS[input.kind](input.projectId, {
    config: input.config,
    // Read-only here: results go back through commit().
    store: new ProjectStore(input.config.dataDir),
    tools: input.tools,
    report: (progress, message) => post({ type: 'report', progress, message }),
    commit: (fields) => post({ type: 'commit', fields }),
  }, input.args);
  post({ type: 'done' });
} catch (e) {
  post({ type: 'error', message: (e as Error).message ?? String(e) });
}

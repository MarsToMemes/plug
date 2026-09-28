import { directStep, renderStep, stillsStep, type PipelineContext } from './pipeline.ts';
import type { JobKind } from './store.ts';

export interface JobArgs {
  /** Render scale: 1 = 1080p, 0.5 = 540p preview. */
  scale?: number;
}

export const STEPS: Record<JobKind, (projectId: string, ctx: PipelineContext, args: JobArgs) => Promise<void>> = {
  direct: (id, ctx) => directStep(id, ctx),
  stills: (id, ctx) => stillsStep(id, ctx),
  render: (id, ctx, args) => renderStep(id, ctx, args.scale ?? 0.5),
};

/**
 * Runway generates a visual for a sentence that has none, on request only (each
 * generation costs credits). A generated visual is the last level of the
 * authenticity scale (studio-engine bible §27): it is marked "generated", never
 * used to show a real person, a historical fact, a platform or a document
 * (MED-07), and the render's quality control reminds to disclose it (SRC-04).
 */
import RunwayML, { TaskFailedError, TaskTimedOutError } from '@runwayml/sdk';
import { MsgError } from './messages.ts';

export interface GenerateRequest {
  prompt: string;
  kind: 'image' | 'video';
  /** Video length, 2 to 10 s. */
  seconds: number;
  /** A video made from this picture (data URI, 5 MB at most): an approved still is animated instead of generating footage blind. */
  image?: string;
}

export interface Generated {
  /** Where the file can be downloaded (expires within a day or two). */
  url: string;
  model: string;
  credits?: number;
  /** Video length Runway made (may differ from the one asked). */
  seconds?: number;
}

export interface Generator {
  generate(request: GenerateRequest): Promise<Generated>;
}

type Client = Pick<RunwayML, 'textToVideo' | 'textToImage' | 'imageToVideo'>;

/** Runway models used: Gen-4.5 for footage from text (720p), Gen-4 Turbo to animate a picture, Gen-4 Image for stills (1080p). */
export const RUNWAY_MODELS = { video: 'gen4.5', animate: 'gen4_turbo', image: 'gen4_image' } as const;
const WAIT_MS = 15 * 60 * 1000;

/**
 * The SDK waits about 5 s before reading the answer of create(): a refusal of Runway
 * in that time (bad key, no credits, bad length) was an unhandled rejection, which
 * stops Node and the whole server. Handled here, it reaches the caller through the wait.
 */
function waitFor<T>(created: PromiseLike<unknown> & { waitForTaskOutput(o: { timeout: number }): Promise<T> }): Promise<T> {
  Promise.resolve(created).catch(() => {});
  return created.waitForTaskOutput({ timeout: WAIT_MS });
}

export class RunwayGenerator implements Generator {
  private readonly client: Client;

  constructor(options: { apiKey?: string; client?: Client }) {
    this.client = options.client ?? new RunwayML(options.apiKey ? { apiKey: options.apiKey } : {});
  }

  async generate(r: GenerateRequest): Promise<Generated> {
    const promptText = r.prompt.trim().slice(0, 1000);
    if (!promptText) throw new MsgError('promptEmpty');
    try {
      if (r.kind === 'video' && r.image) return await this.animate(r.image, promptText, r.seconds);
      if (r.kind === 'video') {
        const duration = Math.min(10, Math.max(2, Math.round(r.seconds)));
        const task = await waitFor(this.client.textToVideo.create({ model: RUNWAY_MODELS.video, promptText, ratio: '1280:720', duration }));
        return { url: task.output[0]!, model: RUNWAY_MODELS.video, credits: task.cost.credits, seconds: duration };
      }
      const task = await waitFor(this.client.textToImage.create({ model: RUNWAY_MODELS.image, promptText, ratio: '1920:1080' }));
      return { url: task.output[0]!, model: RUNWAY_MODELS.image, credits: task.cost.credits };
    } catch (e) {
      if (e instanceof TaskFailedError) {
        const d = e.taskDetails as { failure?: string; failureCode?: string };
        throw new MsgError('runwayFailed', { failure: d.failure ?? '', code: d.failureCode ?? '' });
      }
      if (e instanceof TaskTimedOutError) throw new MsgError('runwayTimeout');
      if (e instanceof RunwayML.AuthenticationError) throw new MsgError('runwayBadKey');
      if (e instanceof RunwayML.RateLimitError) throw new MsgError('runwayBusy');
      if (e instanceof RunwayML.BadRequestError) throw new MsgError('runwayRefused', { detail: e.message });
      throw e;
    }
  }

  /**
   * Gen-4 Turbo from a picture. The SDK does not list the lengths it takes: when Runway
   * refuses the one asked, the next accepted length (5, then 10 s) is asked once.
   */
  private async animate(image: string, promptText: string, seconds: number): Promise<Generated> {
    const run = async (duration: number) => {
      const task = await waitFor(this.client.imageToVideo.create({ model: RUNWAY_MODELS.animate, promptImage: image, promptText, ratio: '1280:720', duration }));
      return { url: task.output[0]!, model: RUNWAY_MODELS.animate, credits: task.cost.credits, seconds: duration };
    };
    const wanted = Math.min(10, Math.max(2, Math.round(seconds)));
    try {
      return await run(wanted);
    } catch (e) {
      if (!(e instanceof RunwayML.BadRequestError) || !/duration/i.test(e.message) || wanted === 5 || wanted === 10) throw e;
      return await run(wanted < 5 ? 5 : 10);
    }
  }
}

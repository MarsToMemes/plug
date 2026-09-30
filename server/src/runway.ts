/**
 * Runway generates a visual for a sentence that has none, on request only (each
 * generation costs credits). A generated visual is the last level of the
 * authenticity scale (studio-engine bible §27): it is marked "generated", never
 * used to show a real person, a historical fact, a platform or a document
 * (MED-07), and the render's quality control reminds to disclose it (SRC-04).
 */
import RunwayML, { TaskFailedError, TaskTimedOutError } from '@runwayml/sdk';

export interface GenerateRequest {
  prompt: string;
  kind: 'image' | 'video';
  /** Video length, 2 to 10 s. */
  seconds: number;
}

export interface Generated {
  /** Where the file can be downloaded (expires within a day or two). */
  url: string;
  model: string;
  credits?: number;
}

export interface Generator {
  generate(request: GenerateRequest): Promise<Generated>;
}

type Client = Pick<RunwayML, 'textToVideo' | 'textToImage'>;

/** Runway models used: Gen-4.5 for footage (720p), Gen-4 Image for stills (1080p). */
export const RUNWAY_MODELS = { video: 'gen4.5', image: 'gen4_image' } as const;
const WAIT_MS = 15 * 60 * 1000;

export class RunwayGenerator implements Generator {
  private readonly client: Client;

  constructor(options: { apiKey?: string; client?: Client }) {
    this.client = options.client ?? new RunwayML(options.apiKey ? { apiKey: options.apiKey } : {});
  }

  async generate(r: GenerateRequest): Promise<Generated> {
    const promptText = r.prompt.trim().slice(0, 1000);
    if (!promptText) throw new Error('Décrivez ce que Runway doit générer.');
    try {
      if (r.kind === 'video') {
        const task = await this.client.textToVideo
          .create({ model: RUNWAY_MODELS.video, promptText, ratio: '1280:720', duration: Math.min(10, Math.max(2, Math.round(r.seconds))) })
          .waitForTaskOutput({ timeout: WAIT_MS });
        return { url: task.output[0]!, model: RUNWAY_MODELS.video, credits: task.cost.credits };
      }
      const task = await this.client.textToImage
        .create({ model: RUNWAY_MODELS.image, promptText, ratio: '1920:1080' })
        .waitForTaskOutput({ timeout: WAIT_MS });
      return { url: task.output[0]!, model: RUNWAY_MODELS.image, credits: task.cost.credits };
    } catch (e) {
      if (e instanceof TaskFailedError) {
        const d = e.taskDetails as { failure?: string; failureCode?: string };
        throw new Error(`Runway n’a pas pu générer ce visuel${d.failure ? ` : ${d.failure}` : ''}${d.failureCode ? ` (${d.failureCode})` : ''}`);
      }
      if (e instanceof TaskTimedOutError) throw new Error('Runway n’a pas terminé en 15 minutes : réessayez plus tard.');
      if (e instanceof RunwayML.AuthenticationError) throw new Error('Clé Runway refusée : vérifiez RUNWAYML_API_SECRET dans server/.env.');
      if (e instanceof RunwayML.RateLimitError) throw new Error('Runway est saturé ou vos crédits sont épuisés : réessayez plus tard.');
      if (e instanceof RunwayML.BadRequestError) throw new Error(`Runway a refusé la demande : ${e.message}`);
      throw e;
    }
  }
}

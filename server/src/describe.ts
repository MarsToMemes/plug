/**
 * Claude looks at an imported visual and writes what the editor brain needs to
 * match it to the narration: a description and tags in the language of the
 * script, and the nature of the file when the user did not declare it (bible
 * §27: a real photo is preferred to a generated one). Videos are described
 * from three frames. Runs on the main thread, asynchronously, after the upload
 * answered: the library shows "Claude décrit ce visuel…" meanwhile.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import type { FfmpegTools } from './engine.ts';
import { MsgError } from './messages.ts';
import type { MediaNature } from './store.ts';

const run = promisify(execFile);

export interface VisualDescription {
  description: string;
  tags: string[];
  /** Only when the file plainly shows what it is; else undefined. */
  nature?: MediaNature;
}

export interface DescribeRequest {
  kind: 'image' | 'video';
  /** JPEG frames: one for an image, three for a video. */
  frames: Buffer[];
  natures: readonly MediaNature[];
  /** The start of the script: the description is written in its language and vocabulary. */
  script: string;
  fileName: string;
}

export interface Describer {
  describe(request: DescribeRequest): Promise<VisualDescription>;
}

type MessagesClient = Pick<Anthropic, 'messages'>;

const NATURE_HELP: Record<MediaNature, string> = {
  real_video: 'real footage filmed by a camera',
  real_photo: 'a real photograph of today',
  archive: 'an old or historical photograph (period clothing, film grain, black and white, dated print)',
  screenshot: 'a screenshot of a website, an app or a social network',
  document: 'a scanned or photographed document: report, contract, letter, table, newspaper page',
  generated: 'an AI-generated or 3D-rendered picture that imitates reality',
};

const SYSTEM = `You catalogue the visuals a video editor will place under a documentary narration.
For each visual, write:
- description: one factual sentence (at most 25 words) naming what is visible: people, objects, places, actions, text that can be read. No opinion, no guess about who a person is unless the name is written in the picture.
- tags: 3 to 8 single words a narration would use to talk about this picture, lower case.
- nature: what the file is, among the allowed values, or "unsure". Answer "generated" only when the picture plainly looks AI-generated or 3D-rendered; when in doubt, answer "unsure".
Write the description and the tags in the language of the script excerpt you are given.`;

export class ClaudeDescriber implements Describer {
  private readonly client: MessagesClient;
  private readonly model: string;

  constructor(options: { model: string; apiKey?: string; client?: MessagesClient }) {
    this.model = options.model;
    this.client = options.client ?? new Anthropic(options.apiKey ? { apiKey: options.apiKey } : {});
  }

  async describe(r: DescribeRequest): Promise<VisualDescription> {
    const schema = {
      type: 'object',
      properties: {
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        nature: { type: 'string', enum: [...r.natures, 'unsure'] },
      },
      required: ['description', 'tags', 'nature'],
      additionalProperties: false,
    };
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      // A short, factual task: little thinking needed.
      output_config: { ...(/haiku/.test(this.model) ? {} : { effort: 'low' as const }), format: { type: 'json_schema', schema } },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            ...r.frames.map((data): Anthropic.ImageBlockParam => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: data.toString('base64') } })),
            {
              type: 'text',
              text: [
                r.kind === 'video' ? `A video file, shown by ${r.frames.length} frames taken at the start, the middle and the end.` : 'An image file.',
                `File name: ${r.fileName}`,
                `Allowed natures: ${r.natures.map((n) => `${n} (${NATURE_HELP[n]})`).join('; ')}.`,
                `Script excerpt:\n"""\n${r.script.slice(0, 600)}\n"""`,
              ].join('\n'),
            },
          ],
        },
      ],
    });
    if (response.stop_reason === 'refusal') throw new MsgError('claudeRefused', { category: response.stop_details?.category ?? '' });
    if (response.stop_reason === 'max_tokens') throw new MsgError('claudeCut');
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text;
    if (!text) throw new MsgError('claudeSilent');
    const out = JSON.parse(text) as { description?: unknown; tags?: unknown; nature?: unknown };
    const description = typeof out.description === 'string' ? out.description.trim().slice(0, 300) : '';
    if (!description) throw new MsgError('claudeEmpty');
    const tags = Array.isArray(out.tags) ? [...new Set(out.tags.filter((t): t is string => typeof t === 'string').map((t) => t.trim().toLowerCase().slice(0, 40)).filter(Boolean))].slice(0, 12) : [];
    const nature = r.natures.includes(out.nature as MediaNature) ? (out.nature as MediaNature) : undefined;
    return { description, tags, ...(nature ? { nature } : {}) };
  }
}

/** JPEG frames of a visual, at most 1024 px wide: one for an image, three for a video. */
export async function framesOf(tools: FfmpegTools, file: string, kind: 'image' | 'video', durationInSeconds?: number): Promise<Buffer[]> {
  const dir = await mkdtemp(join(tmpdir(), 'plug-frames-'));
  try {
    const [cmd, ...pre] = tools.ffmpeg;
    const times = kind === 'image' ? [undefined] : [0.15, 0.5, 0.85].map((f) => Math.max(0, (durationInSeconds ?? 3) * f));
    const frames: Buffer[] = [];
    for (const [i, t] of times.entries()) {
      const out = join(dir, `f${i}.jpg`);
      await run(cmd!, [...pre, '-y', '-v', 'error', ...(t !== undefined ? ['-ss', t.toFixed(2)] : []), '-i', file, '-frames:v', '1', '-vf', "scale='min(1024,iw)':-2", '-q:v', '4', out], { timeout: 60_000 });
      frames.push(await readFile(out));
    }
    return frames;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

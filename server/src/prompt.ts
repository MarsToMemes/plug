/**
 * Claude turns a sentence of the script (and what the author typed) into a
 * detailed prompt for Runway: subject, setting, light, camera, one shot. A
 * precise prompt succeeds more often on the first try, and every try costs
 * credits. Asked for by the author (a button), never run on its own.
 */
import Anthropic from '@anthropic-ai/sdk';
import { MsgError } from './messages.ts';

export interface PromptRequest {
  /** The sentence the visual is for. */
  line: string;
  /** What the author typed so far (may be the sentence itself). */
  draft: string;
  kind: 'image' | 'video';
  /** The whole script: the setting and the tone. */
  script: string;
}

export interface Prompter {
  write(request: PromptRequest): Promise<string>;
}

type MessagesClient = Pick<Anthropic, 'messages'>;

const SYSTEM = `You write prompts for Runway, a video and image generation model, for the b-roll of a documentary.
Write one prompt, in English, of 40 to 90 words, describing a single shot: the subject, the setting, the time of day and the light, the framing, and for a video one simple camera movement and what moves in the frame.
Realistic documentary style. No text, captions, logos or brand names in the picture. Never depict a real, identifiable person: show anonymous people, hands, silhouettes or places instead.
Answer with the prompt only.`;

export class ClaudePrompter implements Prompter {
  private readonly client: MessagesClient;
  private readonly model: string;

  constructor(options: { model: string; apiKey?: string; client?: MessagesClient }) {
    this.model = options.model;
    this.client = options.client ?? new Anthropic(options.apiKey ? { apiKey: options.apiKey } : {});
  }

  async write(r: PromptRequest): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      ...(/haiku/.test(this.model) ? {} : { output_config: { effort: 'low' as const } }),
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: [
          `A ${r.kind === 'video' ? 'video shot (a few seconds)' : 'still image'} for this sentence of the narration: "${r.line}"`,
          r.draft.trim() && r.draft.trim() !== r.line ? `What the author wants to see: "${r.draft.trim()}"` : '',
          `The script, for the setting and the tone:\n"""\n${r.script.slice(0, 1500)}\n"""`,
        ].filter(Boolean).join('\n\n'),
      }],
    });
    if (response.stop_reason === 'refusal') throw new MsgError('claudeRefusedPrompt', { category: response.stop_details?.category ?? '' });
    if (response.stop_reason === 'max_tokens') throw new MsgError('claudeCut');
    const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join(' ').trim().replace(/^"|"$/g, '');
    if (!text) throw new MsgError('claudeSilent');
    return text.slice(0, 1000);
  }
}

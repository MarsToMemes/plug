/** ClaudeDescriber against a fake client: the request it sends, the answer it accepts. */
import { describe, expect, it } from 'vitest';
import { ClaudeDescriber } from '../src/describe.ts';
import { text as say, type MsgError } from '../src/messages.ts';

type Params = Record<string, unknown> & { messages: Array<{ content: Array<{ type: string; text?: string }> }> };

const client = (reply: object) => {
  const calls: Params[] = [];
  return { calls, client: { messages: { create: async (p: Params) => (calls.push(p), reply) } } as never };
};
const text = (t: string, stop = 'end_turn') => ({ stop_reason: stop, content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: t }] });
const request = { kind: 'video' as const, frames: [Buffer.from('a'), Buffer.from('b'), Buffer.from('c')], natures: ['real_video', 'generated'] as const, script: 'Le rapport annuel le dit.', fileName: 'queue.mp4' };

describe('ClaudeDescriber', () => {
  it('sends the frames with a JSON schema, and reads the answer', async () => {
    const { calls, client: c } = client(text(JSON.stringify({ description: ' Des clients font la queue. ', tags: ['Clients', 'queue', 'clients'], nature: 'real_video' })));
    const d = await new ClaudeDescriber({ model: 'claude-sonnet-5-5', client: c }).describe({ ...request, natures: [...request.natures] });
    expect(d).toEqual({ description: 'Des clients font la queue.', tags: ['clients', 'queue'], nature: 'real_video' });
    const p = calls[0]!;
    expect(p.model).toBe('claude-sonnet-5-5');
    expect(p.tool_choice).toBeUndefined();
    expect(p.output_config).toMatchObject({ effort: 'low', format: { type: 'json_schema', schema: { properties: { nature: { enum: ['real_video', 'generated', 'unsure'] } } } } });
    expect(p.messages[0]!.content.filter((b) => b.type === 'image')).toHaveLength(3);
    expect(p.messages[0]!.content.at(-1)!.text).toContain('Le rapport annuel le dit.');
  });

  it('keeps no nature when Claude is unsure, and reports refusals', async () => {
    const unsure = await new ClaudeDescriber({ model: 'claude-sonnet-5-5', client: client(text(JSON.stringify({ description: 'Un bureau', tags: [], nature: 'unsure' }))).client }).describe({ ...request, natures: [...request.natures] });
    expect(unsure.nature).toBeUndefined();
    const refused = new ClaudeDescriber({ model: 'claude-sonnet-5-5', client: client({ stop_reason: 'refusal', stop_details: { category: 'general_harms' }, content: [] }).client });
    const e = (await refused.describe({ ...request, natures: [...request.natures] }).catch((x: MsgError) => x)) as MsgError;
    expect(say(e.msg, 'fr')).toBe('Claude a refusé de décrire ce visuel (general_harms).');
    expect(say(e.msg, 'en')).toBe('Claude declined to describe this visual (general_harms).');
  });
});

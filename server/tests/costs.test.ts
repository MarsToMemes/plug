/** What Runway charged (the ledger) and the prompt Claude writes for it. */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RunwayLedger } from '../src/ledger.ts';
import { text as say, type MsgError } from '../src/messages.ts';
import { ClaudePrompter } from '../src/prompt.ts';

describe('RunwayLedger', () => {
  it('averages credits per second and per still, and counts this month only', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plug-ledger-'));
    try {
      const l = new RunwayLedger(dir);
      l.add({ at: '2026-08-20T10:00:00Z', projectId: 'p', model: 'gen4.5', kind: 'video', seconds: 5, credits: 60 });
      l.add({ at: '2026-09-02T10:00:00Z', projectId: 'p', model: 'gen4.5', kind: 'video', seconds: 10, credits: 100 });
      l.add({ at: '2026-09-03T10:00:00Z', projectId: 'p', model: 'gen4_image', kind: 'image', seconds: 0, credits: 8 });
      expect(l.costs(500, new Date('2026-09-15T12:00:00Z'))).toEqual({ perSecond: { 'gen4.5': 11 }, perImage: { gen4_image: 8 }, monthUsed: 108, monthCap: 500 });
      expect(new RunwayLedger(join(dir, 'none')).costs()).toEqual({ perSecond: {}, perImage: {}, monthUsed: 0 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('ClaudePrompter', () => {
  type Params = { model: string; output_config?: unknown; messages: Array<{ content: string }> };
  const fake = (reply: object) => {
    const calls: Params[] = [];
    return { calls, client: { messages: { create: async (p: Params) => (calls.push(p), reply) } } as never };
  };

  it('writes one prompt from the sentence, the author’s draft and the script', async () => {
    const f = fake({ stop_reason: 'end_turn', content: [{ type: 'text', text: '"Wide shot of an empty parking lot at dusk."' }] });
    const out = await new ClaudePrompter({ model: 'claude-sonnet-5-5', client: f.client }).write({ line: 'Ils possèdent le terrain.', draft: 'un parking vide', kind: 'video', script: 'Le vrai business de McDonald’s.' });
    expect(out).toBe('Wide shot of an empty parking lot at dusk.');
    expect(f.calls[0]!.output_config).toEqual({ effort: 'low' });
    const asked = f.calls[0]!.messages[0]!.content;
    expect(asked).toContain('video shot');
    expect(asked).toContain('un parking vide');
    expect(asked).toContain('Le vrai business');
  });

  it('reports a refusal in the reader’s language', async () => {
    const f = fake({ stop_reason: 'refusal', stop_details: { category: 'general_harms' }, content: [] });
    const e = (await new ClaudePrompter({ model: 'claude-haiku-4-5', client: f.client }).write({ line: 'x', draft: 'x', kind: 'image', script: '' }).catch((x: MsgError) => x)) as MsgError;
    expect(say(e.msg, 'fr')).toBe('Claude a refusé d’écrire ce prompt (general_harms).');
    expect(f.calls[0]!.output_config).toBeUndefined();
  });
});

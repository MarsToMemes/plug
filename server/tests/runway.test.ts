/** RunwayGenerator against a fake client: the request it sends, and its errors in French. */
import { TaskFailedError } from '@runwayml/sdk';
import { describe, expect, it } from 'vitest';
import { text, type MsgError } from '../src/messages.ts';
import { RunwayGenerator } from '../src/runway.ts';

const task = (output: string) => ({ id: 't1', createdAt: '', status: 'SUCCEEDED' as const, output: [output], cost: { credits: 60 } });
const fake = (result: () => Promise<unknown>) => {
  const calls: Array<{ kind: string; body: Record<string, unknown> }> = [];
  const res = (kind: string) => ({ create: (body: Record<string, unknown>) => (calls.push({ kind, body }), { waitForTaskOutput: result }) });
  return { calls, client: { textToVideo: res('video'), textToImage: res('image') } as never };
};

describe('RunwayGenerator', () => {
  it('asks Gen-4.5 for 720p footage and Gen-4 Image for a 1080p still', async () => {
    const f = fake(async () => task('https://cdn.runway/x.mp4'));
    const g = new RunwayGenerator({ client: f.client });
    expect(await g.generate({ prompt: '  Une rue de Tokyo la nuit  ', kind: 'video', seconds: 12.4 })).toEqual({ url: 'https://cdn.runway/x.mp4', model: 'gen4.5', credits: 60 });
    expect(f.calls[0]).toEqual({ kind: 'video', body: { model: 'gen4.5', promptText: 'Une rue de Tokyo la nuit', ratio: '1280:720', duration: 10 } });
    await g.generate({ prompt: 'Un comptoir vide', kind: 'image', seconds: 5 });
    expect(f.calls[1]).toEqual({ kind: 'image', body: { model: 'gen4_image', promptText: 'Un comptoir vide', ratio: '1920:1080' } });
  });

  it('explains a failed task in the reader’s language', async () => {
    const failed = new TaskFailedError({ id: 't', createdAt: '', status: 'FAILED', failure: 'content moderation', failureCode: 'SAFETY', cost: { credits: 0 } });
    const e = (await new RunwayGenerator({ client: fake(async () => { throw failed; }).client }).generate({ prompt: 'x', kind: 'video', seconds: 5 }).catch((x: MsgError) => x)) as MsgError;
    expect(text(e.msg, 'fr')).toBe('Runway n’a pas pu générer ce visuel : content moderation (SAFETY).');
    expect(text(e.msg, 'en')).toBe('Runway could not generate this visual: content moderation (SAFETY).');
    await expect(new RunwayGenerator({ client: fake(async () => task('u')).client }).generate({ prompt: '  ', kind: 'image', seconds: 5 })).rejects.toThrow(/Describe what Runway/);
  });
});

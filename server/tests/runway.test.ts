/** RunwayGenerator against a fake client: the request it sends, and its errors in French. */
import RunwayML, { TaskFailedError } from '@runwayml/sdk';
import { describe, expect, it } from 'vitest';
import { text, type MsgError } from '../src/messages.ts';
import { RunwayGenerator } from '../src/runway.ts';

const task = (output: string) => ({ id: 't1', createdAt: '', status: 'SUCCEEDED' as const, output: [output], cost: { credits: 60 } });
const fake = (result: () => Promise<unknown>) => {
  const calls: Array<{ kind: string; body: Record<string, unknown> }> = [];
  const res = (kind: string) => ({ create: (body: Record<string, unknown>) => (calls.push({ kind, body }), Object.assign(Promise.resolve({ id: 't1' }), { waitForTaskOutput: result })) });
  return { calls, client: { textToVideo: res('video'), textToImage: res('image'), imageToVideo: res('animate') } as never };
};

describe('RunwayGenerator', () => {
  it('asks Gen-4.5 for 720p footage and Gen-4 Image for a 1080p still', async () => {
    const f = fake(async () => task('https://cdn.runway/x.mp4'));
    const g = new RunwayGenerator({ client: f.client });
    expect(await g.generate({ prompt: '  Une rue de Tokyo la nuit  ', kind: 'video', seconds: 12.4 })).toEqual({ url: 'https://cdn.runway/x.mp4', model: 'gen4.5', credits: 60, seconds: 10 });
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

  it('animates a picture with Gen-4 Turbo, and asks 5 s once when the length is refused', async () => {
    const image = 'data:image/jpeg;base64,AAAA';
    let n = 0;
    const f = fake(async () => {
      if (n++ === 0) throw new RunwayML.BadRequestError(400, { error: 'duration must be 5 or 10' }, 'duration must be 5 or 10', new Headers());
      return task('https://cdn.runway/a.mp4');
    });
    const out = await new RunwayGenerator({ client: f.client }).generate({ prompt: 'Une rue', kind: 'video', seconds: 3.2, image });
    expect(out).toEqual({ url: 'https://cdn.runway/a.mp4', model: 'gen4_turbo', credits: 60, seconds: 5 });
    expect(f.calls.map((c) => [c.kind, c.body.duration])).toEqual([['animate', 3], ['animate', 5]]);
    expect(f.calls[0]!.body).toMatchObject({ model: 'gen4_turbo', promptImage: image, promptText: 'Une rue', ratio: '1280:720' });
  });

  it('survives a request Runway refuses at once (the SDK reads the answer 5 s later)', async () => {
    const refusal = new RunwayML.AuthenticationError(401, { error: 'bad key' }, 'bad key', new Headers());
    const create = () => {
      const answer = Promise.reject(refusal);
      // Like the SDK: nothing listens to the answer until the first wait is over.
      return Object.assign(answer, { waitForTaskOutput: async () => { await new Promise((r) => setTimeout(r, 50)); return await answer; } });
    };
    const client = { textToVideo: { create }, textToImage: { create }, imageToVideo: { create } } as never;
    const e = (await new RunwayGenerator({ client }).generate({ prompt: 'x', kind: 'image', seconds: 0 }).catch((x: MsgError) => x)) as MsgError;
    expect(text(e.msg, 'fr')).toBe('Clé Runway refusée : vérifiez RUNWAYML_API_SECRET dans server/.env.');
  });
});

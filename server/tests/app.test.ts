/**
 * API tests on the real engine (engine/ must be built: npm run setup-engine)
 * and FFmpeg. ElevenLabs is replaced by a fake fetch.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import { findFfmpeg } from '../src/media.ts';
import type { Describer, DescribeRequest } from '../src/describe.ts';
import type { GenerateRequest, Generator } from '../src/runway.ts';
import type { Project } from '../src/store.ts';

/** A 16-bit mono WAV: bursts of noise (speech) separated by silences. */
function wav(segments: Array<[number, number]>, totalMs: number, rate = 16000): Buffer {
  const n = Math.round((totalMs / 1000) * rate);
  const data = Buffer.alloc(n * 2);
  let seed = 7;
  for (const [a, b] of segments) {
    for (let i = Math.round((a / 1000) * rate); i < Math.round((b / 1000) * rate); i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      data.writeInt16LE(((seed % 16000) - 8000) | 0, i * 2);
    }
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

function multipart(fields: Record<string, string>, file: { name: string; data: Buffer; type: string }) {
  const boundary = '----plugtest';
  const parts: Buffer[] = [];
  for (const [k, v] of Object.entries(fields)) parts.push(Buffer.from(`--${boundary}\r\ncontent-disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  parts.push(Buffer.from(`--${boundary}\r\ncontent-disposition: form-data; name="file"; filename="${file.name}"\r\ncontent-type: ${file.type}\r\n\r\n`), file.data, Buffer.from(`\r\n--${boundary}--\r\n`));
  return { payload: Buffer.concat(parts), headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } };
}

const SCRIPT = '# Le vrai business\n? Comment gagne-t-il sa vie ?\nMcDonald’s n’est pas une entreprise de burgers.\nPlus de 60 % de ses revenus viennent des franchisés.\nIls possèdent le terrain.';

describe('Plug API', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'plug-test-'));
  const base = loadConfig({ DATA_DIR: dataDir });
  const tools = findFfmpeg(base.engineDir);
  let ttsCalls = 0;
  const fakeFetch = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    if (u.includes('/text-to-speech/')) {
      ttsCalls++;
      const body = JSON.parse(String(init!.body)) as { text: string };
      const chars = [...body.text];
      const per = 0.06;
      // Speech for every character, with silence after sentence ends.
      const segs: Array<[number, number]> = [];
      let t = 100;
      chars.forEach((c) => {
        segs.push([t, t + per * 1000]);
        t += per * 1000 + (/[.!?]/.test(c) ? 400 : 0);
      });
      return new Response(JSON.stringify({
        audio_base64: wav(segs, t + 200).toString('base64'),
        alignment: {
          characters: chars,
          character_start_times_seconds: chars.map((_, i) => 0.1 + i * per),
          character_end_times_seconds: chars.map((_, i) => 0.1 + (i + 1) * per),
        },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response('not found', { status: 404 });
  }) as typeof fetch;

  let app: Awaited<ReturnType<typeof buildApp>>;
  beforeAll(async () => {
    app = await buildApp({ config: { ...base, elevenLabsKey: 'test-key', anthropicKey: undefined }, tools, fetch: fakeFetch, inlineJobs: true });
  });
  afterAll(async () => {
    await app.app.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  const run = async (id: string, step: 'direct', body?: object) => {
    const r = await app.app.inject({ method: 'POST', url: `/api/projects/${id}/${step}`, payload: body ?? {} });
    expect(r.statusCode).toBe(202);
    await app.jobs.idle();
    return (await app.app.inject({ method: 'GET', url: `/api/projects/${id}` })).json() as Project;
  };

  it('reports its capabilities', async () => {
    const r = await app.app.inject({ method: 'GET', url: '/api/health' });
    expect(r.json()).toMatchObject({ ok: true, elevenLabs: true, anthropic: false, engineBuilt: true });
  });

  it('validates the project fields', async () => {
    const r = await app.app.inject({ method: 'POST', url: '/api/projects', payload: { pacing: 'turbo' } });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toMatch(/pacing/);
  });

  it('generates an ElevenLabs voice, then an Apple-style plan timed on it', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: { title: 'Test TTS', script: SCRIPT, voice: { mode: 'tts' } } })).json() as Project;
    const p = await run(created.id, 'direct');
    expect(p.job).toMatchObject({ kind: 'direct', status: 'done' });
    expect(p.voiceTrack).toMatchObject({ timing: 'tts', words: 21 });
    expect(p.plan!.shots).toBeGreaterThan(2);
    expect(p.plan!.brain).toBe('heuristic');
    const plan = (await app.app.inject({ method: 'GET', url: `/api/projects/${p.id}/plan` })).json();
    expect(plan.assets.narration.src).toContain(`/api/projects/${p.id}/files/voice.wav`);
    expect(plan.shots.some((s: { block?: { item: string } }) => s.block?.item.startsWith('studio-'))).toBe(true);

    // Same script and voice: the voice is not generated again.
    const calls = ttsCalls;
    await run(p.id, 'direct');
    expect(ttsCalls).toBe(calls);

    const voice = await app.app.inject({ method: 'GET', url: `/api/projects/${p.id}/files/voice.wav`, headers: { range: 'bytes=0-99' } });
    expect(voice.statusCode).toBe(206);
    expect(voice.rawPayload.length).toBe(100);
  }, 60_000);

  it('aligns the script on an uploaded voice without speech recognition', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: { title: 'Test upload', script: SCRIPT, rightsConfirmed: true } })).json() as Project;
    const up = multipart({ role: 'voice' }, { name: 'voix.wav', type: 'audio/wav', data: wav([[200, 2600], [3100, 6000], [6500, 7800]], 8200) });
    const r = await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...up });
    expect(r.statusCode).toBe(201);
    expect(r.json().voice).toEqual({ mode: 'upload' });
    // No ElevenLabs key: the local alignment is used.
    const app2 = await buildApp({ config: { ...base, elevenLabsKey: undefined }, tools });
    await app2.app.inject({ method: 'POST', url: `/api/projects/${created.id}/direct` });
    await app2.jobs.idle();
    const p = app2.store.get(created.id)!;
    await app2.app.close();
    expect(p.job?.error).toBeUndefined();
    expect(p.voiceTrack).toMatchObject({ timing: 'aligned', words: 21 });
    expect(p.voiceTrack!.durationInSeconds).toBeCloseTo(8.2, 1);
  }, 60_000);

  it('refuses a render before a plan, and media without rights', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: { script: SCRIPT } })).json() as Project;
    expect((await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/render` })).statusCode).toBe(400);
    const up = multipart({ role: 'music' }, { name: 'musique.wav', type: 'audio/wav', data: wav([[0, 3000]], 3000) });
    expect((await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...up })).statusCode).toBe(201);
    const r = await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/direct` });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toMatch(/droits/);
  });

  it('validates the edit style, Apple by default', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: {} })).json() as Project;
    expect(created.style).toBe('apple');
    expect((await app.app.inject({ method: 'PATCH', url: `/api/projects/${created.id}`, payload: { style: 'default' } })).json().style).toBe('default');
    expect((await app.app.inject({ method: 'PATCH', url: `/api/projects/${created.id}`, payload: { style: 'vlog' } })).statusCode).toBe(400);
  });

  it('switches an audio file between voice-over and music', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: {} })).json() as Project;
    const up = (name: string) => multipart({ role: 'music' }, { name, type: 'audio/wav', data: wav([[0, 1000]], 1000) });
    let p = (await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...up('a.wav') })).json() as Project;
    const a = p.media[0]!;
    p = (await app.app.inject({ method: 'PATCH', url: `/api/projects/${p.id}/media/${a.id}`, payload: { role: 'voice' } })).json() as Project;
    expect(p.media.find((m) => m.id === a.id)!.role).toBe('voice');
    expect(p.voice).toEqual({ mode: 'upload' });
    // A second audio file set as the voice: the first one becomes the music.
    p = (await app.app.inject({ method: 'POST', url: `/api/projects/${p.id}/media`, ...up('b.wav') })).json() as Project;
    const b = p.media.find((m) => m.originalName === 'b.wav')!;
    p = (await app.app.inject({ method: 'PATCH', url: `/api/projects/${p.id}/media/${b.id}`, payload: { role: 'voice' } })).json() as Project;
    expect(p.media.map((m) => [m.originalName, m.role])).toEqual([['a.wav', 'music'], ['b.wav', 'voice']]);
  });

  it('records what each visual is, and passes it to the engine', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: { script: SCRIPT, voice: { mode: 'none' }, rightsConfirmed: true } })).json() as Project;
    const png = await (async () => {
      const { execFileSync } = await import('node:child_process');
      const f = join(dataDir, 'test.png');
      execFileSync(tools.ffmpeg[0]!, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=320x180', '-frames:v', '1', f]);
      return (await import('node:fs')).readFileSync(f);
    })();
    const up = multipart({ role: 'visual', description: 'le premier restaurant McDonald en 1955' }, { name: 'archive.png', type: 'image/png', data: png });
    let p = (await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...up })).json() as Project;
    const m = p.media[0]!;
    expect(m.nature).toBe('real_photo');
    const bad = await app.app.inject({ method: 'PATCH', url: `/api/projects/${p.id}/media/${m.id}`, payload: { nature: 'real_video' } });
    expect(bad.statusCode).toBe(400);
    p = (await app.app.inject({ method: 'PATCH', url: `/api/projects/${p.id}/media/${m.id}`, payload: { nature: 'generated' } })).json() as Project;
    expect(p.media[0]!.nature).toBe('generated');
    await run(p.id, 'direct');
    const input = JSON.parse((await import('node:fs')).readFileSync(join(dataDir, 'projects', p.id, 'input.json'), 'utf8'));
    expect(input.assets[m.id]).toMatchObject({ nature: 'generated', source: { syntheticMedia: true } });
    expect(input.catalog[0]).toMatchObject({ assetId: m.id, nature: 'generated' });
    // Every shot of the plan says which need and which level of the scale it answers.
    const plan = (await app.app.inject({ method: 'GET', url: `/api/projects/${p.id}/plan` })).json();
    expect(plan.shots.every((s: { mediaTier?: string }) => typeof s.mediaTier === 'string')).toBe(true);
  }, 60_000);

  it('keeps what the author sets on a sentence, and gives it to the engine', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: { script: SCRIPT, voice: { mode: 'none' }, rightsConfirmed: true } })).json() as Project;
    const url = `/api/projects/${created.id}/hints`;
    const line = 'Plus de 60 % de ses revenus viennent des franchisés.';
    const chart = { kind: 'barChart', labels: ['Franchisés', 'Restaurants en propre'], values: [62, 38], unit: '%', source: 'Rapport annuel 2023' };
    let r = await app.app.inject({ method: 'PUT', url, payload: { line, hints: { intent: 'statistic', chart, source: '' } } });
    expect(r.statusCode).toBe(200);
    expect((r.json() as Project).hints).toEqual({ [line]: { intent: 'statistic', chart } });
    expect((await app.app.inject({ method: 'PUT', url, payload: { line, hints: { chart: { ...chart, values: [62] } } } })).json().error).toMatch(/autant de libellés/);
    expect((await app.app.inject({ method: 'PUT', url, payload: { line, hints: { mediaNeed: 'decoration' } } })).statusCode).toBe(400);
    expect((await app.app.inject({ method: 'PUT', url, payload: { line: 'Une phrase absente.', hints: {} } })).statusCode).toBe(400);
    expect((await app.app.inject({ method: 'PUT', url, payload: { line, hints: { media: 'm_nope' } } })).json().error).toMatch(/pas dans le projet/);

    const p = await run(created.id, 'direct');
    const input = JSON.parse((await import('node:fs')).readFileSync(join(dataDir, 'projects', p.id, 'input.json'), 'utf8'));
    expect(input.script.find((b: { text?: string }) => b.text === line).hints).toMatchObject({ intent: 'statistic', chart: { values: [62, 38] } });
    const plan = (await app.app.inject({ method: 'GET', url: `/api/projects/${p.id}/plan` })).json();
    expect(JSON.stringify(plan.shots)).toContain('Rapport annuel 2023');
    // Each sentence knows its script line: the editor opens a shot's line.
    expect(Object.values(p.plan!.units!)).toContain(line);

    // The sentence leaves the script: its hints go with it.
    const edited = (await app.app.inject({ method: 'PATCH', url: `/api/projects/${p.id}`, payload: { script: SCRIPT.replace(line, 'Une autre phrase.') } })).json() as Project;
    expect(edited.hints).toEqual({});
    // null clears a sentence.
    await app.app.inject({ method: 'PUT', url, payload: { line: 'Une autre phrase.', hints: { strike: 'phrase' } } });
    expect(((await app.app.inject({ method: 'PUT', url, payload: { line: 'Une autre phrase.', hints: null } })).json() as Project).hints).toEqual({});
  }, 60_000);

  it('rejects unsupported uploads', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: {} })).json() as Project;
    const bad = multipart({ role: 'visual' }, { name: 'virus.exe', type: 'application/octet-stream', data: Buffer.from('MZ') });
    expect((await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...bad })).statusCode).toBe(400);
    const silent = multipart({ role: 'visual' }, { name: 'son.wav', type: 'audio/wav', data: wav([[0, 500]], 500) });
    expect((await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...silent })).json().error).toMatch(/image ou une vidéo/);
  });
});

describe('automatic description of visuals', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'plug-describe-'));
  const base = loadConfig({ DATA_DIR: dataDir });
  const tools = findFfmpeg(base.engineDir);
  const requests: DescribeRequest[] = [];
  let answer: Awaited<ReturnType<Describer['describe']>> | Error = { description: 'Une file de clients devant un comptoir', tags: ['clients', 'comptoir', 'file'], nature: 'archive' };
  const describer: Describer = { describe: async (r) => { requests.push(r); if (answer instanceof Error) throw answer; return answer; } };
  let app: Awaited<ReturnType<typeof buildApp>>;
  beforeAll(async () => {
    app = await buildApp({ config: { ...base, anthropicKey: undefined }, tools, describer, inlineJobs: true });
  });
  afterAll(async () => {
    await app.app.close();
    rmSync(dataDir, { recursive: true, force: true });
  });
  const picture = async (name: string, video = false) => {
    const { execFileSync } = await import('node:child_process');
    const f = join(dataDir, name);
    execFileSync(tools.ffmpeg[0]!, ['-v', 'error', '-y', '-f', 'lavfi', '-i', `testsrc=s=320x180:d=${video ? 2 : 1}`, ...(video ? ['-pix_fmt', 'yuv420p'] : ['-frames:v', '1']), f]);
    return (await import('node:fs')).readFileSync(f);
  };
  const settle = async (projectId: string) => {
    for (let i = 0; i < 100; i++) {
      const p = (await app.app.inject({ method: 'GET', url: `/api/projects/${projectId}` })).json() as Project;
      if (!p.media.some((m) => m.auto?.status === 'pending')) return p;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('description still pending');
  };

  it('describes an upload in the background, without overriding what the user chose', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: { script: SCRIPT } })).json() as Project;
    const up = multipart({ role: 'visual' }, { name: 'IMG_2044.png', type: 'image/png', data: await picture('a.png') });
    const first = (await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...up })).json() as Project;
    expect(first.media[0]!.auto).toEqual({ status: 'pending' });
    let p = await settle(created.id);
    expect(p.media[0]).toMatchObject({ description: 'Une file de clients devant un comptoir', tags: ['clients', 'comptoir', 'file'], nature: 'archive', auto: { status: 'done' } });
    expect(requests[0]).toMatchObject({ kind: 'image', fileName: 'IMG_2044.png', script: SCRIPT });
    expect(requests[0]!.frames).toHaveLength(1);
    expect(requests[0]!.frames[0]!.subarray(0, 2).toString('hex')).toBe('ffd8'); // JPEG

    // A typed description and a declared nature stay; the tags are added.
    const typed = multipart({ role: 'visual', description: 'le comptoir en 1955', nature: 'real_photo' }, { name: 'b.png', type: 'image/png', data: await picture('b.png') });
    await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...typed });
    p = await settle(created.id);
    expect(p.media[1]).toMatchObject({ description: 'le comptoir en 1955', nature: 'real_photo', natureSet: true, tags: ['clients', 'comptoir', 'file'] });

    // A video is described from three frames.
    const clip = multipart({ role: 'visual' }, { name: 'c.mp4', type: 'video/mp4', data: await picture('c.mp4', true) });
    await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...clip });
    answer = { description: 'Une mire de test', tags: ['mire'] };
    p = await settle(created.id);
    expect(requests.at(-1)!.frames).toHaveLength(3);
    expect(requests.at(-1)!.natures).toEqual(['real_video', 'generated']);
  }, 60_000);

  it('reports a failure, and describes again on request', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: { script: SCRIPT } })).json() as Project;
    answer = new Error('quota dépassé');
    const up = multipart({ role: 'visual' }, { name: 'd.png', type: 'image/png', data: await picture('d.png') });
    await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...up });
    let p = await settle(created.id);
    expect(p.media[0]!.auto).toEqual({ status: 'failed', error: 'quota dépassé' });
    expect(p.media[0]!.description).toBe('d');
    answer = { description: 'Une mire colorée', tags: ['mire', 'couleurs'] };
    const again = await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media/${p.media[0]!.id}/describe` });
    expect(again.statusCode).toBe(202);
    p = await settle(created.id);
    expect(p.media[0]).toMatchObject({ description: 'Une mire colorée', tags: ['mire', 'couleurs'], nature: 'real_photo', auto: { status: 'done' } });
  }, 60_000);
});

describe('visuals generated by Runway', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'plug-runway-'));
  const base = loadConfig({ DATA_DIR: dataDir });
  const tools = findFfmpeg(base.engineDir);
  const asked: GenerateRequest[] = [];
  let clip = '';
  const generator: Generator = { generate: async (r) => { asked.push(r); return { url: clip, model: 'gen4.5', credits: 50 }; } };
  let app: Awaited<ReturnType<typeof buildApp>>;
  beforeAll(async () => {
    const { execFileSync } = await import('node:child_process');
    const f = join(dataDir, 'gen.mp4');
    execFileSync(tools.ffmpeg[0]!, ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=s=320x180:d=2', '-pix_fmt', 'yuv420p', f]);
    clip = `data:video/mp4;base64,${(await import('node:fs')).readFileSync(f).toString('base64')}`;
    app = await buildApp({ config: { ...base, anthropicKey: undefined }, tools, generator, describer: null, inlineJobs: true });
  });
  afterAll(async () => {
    await app.app.close();
    rmSync(dataDir, { recursive: true, force: true });
  });
  const settle = async (id: string) => {
    for (let i = 0; i < 100; i++) {
      const p = (await app.app.inject({ method: 'GET', url: `/api/projects/${id}` })).json() as Project;
      if (!p.generations?.some((g) => g.status === 'pending')) return p;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('generation still pending');
  };

  it('makes a visual for a sentence, which becomes its visual', async () => {
    expect((await app.app.inject({ method: 'GET', url: '/api/health' })).json().runway).toBe(true);
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: { script: SCRIPT, voice: { mode: 'none' } } })).json() as Project;
    const line = 'Ils possèdent le terrain.';
    const r = await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/generate`, payload: { prompt: 'Un terrain vague au coucher du soleil', kind: 'video', seconds: 6, line } });
    expect(r.statusCode).toBe(202);
    const p = await settle(created.id);
    const g = p.generations![0]!;
    expect(g).toMatchObject({ status: 'done', line, kind: 'video' });
    const m = p.media.find((x) => x.id === g.mediaId)!;
    expect(m).toMatchObject({ kind: 'video', nature: 'generated', natureSet: true, description: 'Un terrain vague au coucher du soleil', generated: { provider: 'Runway', model: 'gen4.5', credits: 50 } });
    expect(m.durationInSeconds).toBeGreaterThan(1.5);
    expect(p.hints![line]).toEqual({ media: m.id });
    expect(asked[0]).toEqual({ prompt: 'Un terrain vague au coucher du soleil', kind: 'video', seconds: 6 });
    // A Runway visual needs no rights confirmation: the edit runs.
    const direct = await app.app.inject({ method: 'POST', url: `/api/projects/${p.id}/direct` });
    expect(direct.statusCode).toBe(202);
    await app.jobs.idle();
  }, 60_000);

  it('never generates what must be real (MED-07), and reports failures', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: { script: SCRIPT + '\nRay Kroc vendait des machines à milkshake.', voice: { mode: 'none' } } })).json() as Project;
    await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/direct` });
    await app.jobs.idle();
    const refused = await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/generate`, payload: { prompt: 'Ray Kroc', kind: 'image', line: 'Ray Kroc vendait des machines à milkshake.' } });
    expect(refused.statusCode).toBe(400);
    expect(refused.json().error).toMatch(/montre du réel/);
    clip = 'data:text/plain,pas une video';
    await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/generate`, payload: { prompt: 'Une ville la nuit', kind: 'video' } });
    const p = await settle(created.id);
    expect(p.generations![0]!.status).toBe('failed');
    expect((await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/generate`, payload: { prompt: ' ' } })).statusCode).toBe(400);
  }, 60_000);
});

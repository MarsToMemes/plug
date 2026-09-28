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

  it('rejects unsupported uploads', async () => {
    const created = (await app.app.inject({ method: 'POST', url: '/api/projects', payload: {} })).json() as Project;
    const bad = multipart({ role: 'visual' }, { name: 'virus.exe', type: 'application/octet-stream', data: Buffer.from('MZ') });
    expect((await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...bad })).statusCode).toBe(400);
    const silent = multipart({ role: 'visual' }, { name: 'son.wav', type: 'audio/wav', data: wav([[0, 500]], 500) });
    expect((await app.app.inject({ method: 'POST', url: `/api/projects/${created.id}/media`, ...silent })).json().error).toMatch(/image ou une vidéo/);
  });
});

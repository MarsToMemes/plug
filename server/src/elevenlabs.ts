/**
 * ElevenLabs: generated voice-over with timestamps, and transcription with
 * word timestamps. The key stays on the server (ELEVENLABS_API_KEY).
 */
import type { CharAlignment, SttWord } from './words.ts';

const API = 'https://api.elevenlabs.io/v1';

export interface TtsPiece {
  audio: Buffer;
  alignment: CharAlignment;
}

export class ElevenLabsError extends Error {}

async function failure(res: Response, what: string): Promise<never> {
  let detail = '';
  try {
    detail = (await res.text()).slice(0, 300);
  } catch {}
  throw new ElevenLabsError(`ElevenLabs ${what} failed (${res.status}): ${detail}`);
}

/** One text-to-speech request (MP3 44.1 kHz), with the timing of every character. */
export async function textToSpeech(opts: { key: string; voiceId: string; model: string; text: string; previousText?: string; nextText?: string; fetch?: typeof fetch }): Promise<TtsPiece> {
  const f = opts.fetch ?? fetch;
  const res = await f(`${API}/text-to-speech/${encodeURIComponent(opts.voiceId)}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': opts.key, 'content-type': 'application/json' },
    body: JSON.stringify({
      text: opts.text,
      model_id: opts.model,
      // Continuity of intonation across the pieces of a long script.
      ...(opts.previousText ? { previous_text: opts.previousText } : {}),
      ...(opts.nextText ? { next_text: opts.nextText } : {}),
    }),
  });
  if (!res.ok) await failure(res, 'text-to-speech');
  const body = (await res.json()) as { audio_base64?: string; alignment?: CharAlignment };
  if (!body.audio_base64 || !body.alignment) throw new ElevenLabsError('ElevenLabs text-to-speech: no audio or alignment in the response');
  return { audio: Buffer.from(body.audio_base64, 'base64'), alignment: body.alignment };
}

/** Transcription with word timestamps (model Scribe). */
export async function speechToText(opts: { key: string; audio: Buffer; fileName: string; languageCode?: string; fetch?: typeof fetch }): Promise<SttWord[]> {
  const f = opts.fetch ?? fetch;
  const form = new FormData();
  form.set('model_id', 'scribe_v1');
  form.set('timestamps_granularity', 'word');
  form.set('tag_audio_events', 'false');
  if (opts.languageCode) form.set('language_code', opts.languageCode);
  form.set('file', new Blob([new Uint8Array(opts.audio)]), opts.fileName);
  const res = await f(`${API}/speech-to-text`, { method: 'POST', headers: { 'xi-api-key': opts.key }, body: form });
  if (!res.ok) await failure(res, 'speech-to-text');
  const body = (await res.json()) as { words?: SttWord[] };
  if (!Array.isArray(body.words)) throw new ElevenLabsError('ElevenLabs speech-to-text: no words in the response');
  return body.words;
}

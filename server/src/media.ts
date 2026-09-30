/**
 * Media measurements and conversions, with FFmpeg: the one on the PATH (or
 * $FFMPEG / $FFPROBE), else the build Remotion ships in engine/node_modules.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ffprobeJson, LOUDNESS_TARGETS, loudnormSecondPass, measureLoudness, runFfmpeg, type FfmpegTools } from './engine.ts';
import { MsgError } from './messages.ts';

export function findFfmpeg(engineDir: string, env: Record<string, string | undefined> = process.env): FfmpegTools {
  const onPath = (tool: string) => spawnSync(tool, ['-version'], { stdio: 'ignore' }).status === 0;
  const bundled = join(engineDir, 'node_modules', '@remotion', `compositor-${process.platform}-${process.arch}${process.platform === 'linux' ? '-gnu' : ''}`);
  const pick = (tool: 'ffmpeg' | 'ffprobe') => {
    const explicit = tool === 'ffmpeg' ? env.FFMPEG : env.FFPROBE;
    if (explicit) return explicit;
    if (onPath(tool)) return tool;
    const file = join(bundled, tool);
    if (existsSync(file)) return file;
    throw new Error(`${tool} introuvable : installez FFmpeg ou indiquez son chemin dans $${tool.toUpperCase()}`);
  };
  return { ffmpeg: [pick('ffmpeg')], ffprobe: [pick('ffprobe')] };
}

export const sha256File = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');

export interface Probe {
  kind: 'image' | 'video' | 'audio';
  width?: number;
  height?: number;
  durationInSeconds?: number;
  hasAudio: boolean;
}

const IMAGE_CODECS = new Set(['png', 'mjpeg', 'webp', 'gif', 'bmp', 'tiff']);

export function probe(tools: FfmpegTools, file: string): Probe {
  const info = JSON.parse(ffprobeJson(tools, file)) as {
    streams: Array<{ codec_type: string; codec_name?: string; width?: number; height?: number; duration?: string; nb_frames?: string }>;
    format: { duration?: string; format_name?: string };
  };
  const video = info.streams.find((s) => s.codec_type === 'video');
  const audio = info.streams.find((s) => s.codec_type === 'audio');
  const duration = Number(info.format.duration ?? video?.duration ?? audio?.duration);
  const isImage = !!video && (IMAGE_CODECS.has(video.codec_name ?? '') || /image2|png_pipe|jpeg_pipe|webp_pipe/.test(info.format.format_name ?? '')) && !audio && !(duration > 0.2 && Number(video.nb_frames ?? 1) > 1);
  if (video) {
    return {
      kind: isImage ? 'image' : 'video',
      ...(video.width ? { width: video.width } : {}),
      ...(video.height ? { height: video.height } : {}),
      ...(!isImage && Number.isFinite(duration) ? { durationInSeconds: duration } : {}),
      hasAudio: !!audio,
    };
  }
  if (audio) return { kind: 'audio', ...(Number.isFinite(duration) ? { durationInSeconds: duration } : {}), hasAudio: true };
  throw new MsgError('noStream');
}

/** The voice at -16 LUFS, true peak -1 dBTP (bible MUS-01), WAV 48 kHz mono. */
export function normalizeVoice(tools: FfmpegTools, input: string, output: string): void {
  const target = LOUDNESS_TARGETS.voice;
  const before = measureLoudness(tools, input, target);
  runFfmpeg(tools, ['-y', '-i', input, '-vn', '-af', loudnormSecondPass(before, target), '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', output]);
}

/** Joins audio files end to end into one WAV. */
export function concatAudio(tools: FfmpegTools, inputs: string[], output: string): void {
  if (inputs.length === 1) {
    runFfmpeg(tools, ['-y', '-i', inputs[0]!, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', output]);
    return;
  }
  const filter = `${inputs.map((_, i) => `[${i}:a]`).join('')}concat=n=${inputs.length}:v=0:a=1[a]`;
  runFfmpeg(tools, ['-y', ...inputs.flatMap((f) => ['-i', f]), '-filter_complex', filter, '-map', '[a]', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', output]);
}

/** Mono 16 kHz 16-bit samples of an audio file (for the local alignment). */
export function decodePcm16k(tools: FfmpegTools, input: string): Int16Array {
  const dir = mkdtempSync(join(tmpdir(), 'plug-pcm-'));
  try {
    // WAV rather than raw PCM: Remotion's minimal FFmpeg has no s16le muxer.
    const wav = join(dir, 'a.wav');
    runFfmpeg(tools, ['-y', '-i', input, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]);
    const buf = readFileSync(wav);
    const data = buf.indexOf('data', 12) + 8;
    if (data < 8) throw new Error('decoded WAV without a data chunk');
    const n = Math.floor((buf.length - data) / 2);
    // Copy: the samples may not start on a 2-byte boundary of the ArrayBuffer.
    return new Int16Array(buf.buffer.slice(buf.byteOffset + data, buf.byteOffset + data + n * 2));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function writeJson(file: string, data: unknown): void {
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

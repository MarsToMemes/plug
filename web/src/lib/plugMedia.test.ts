import { describe, expect, it } from 'vitest';
import { detectType, fmtDur, fmtSize } from './plugMedia';

const f = (name: string, type = '') => ({ name, type, size: 1 });

describe('detectType', () => {
  it('uses extension and MIME type', () => {
    expect(detectType(f('a.mp4', 'video/mp4'))).toBe('VIDEO');
    expect(detectType(f('a.MOV'))).toBe('VIDEO');
    expect(detectType(f('a.jpg', 'image/jpeg'))).toBe('IMAGE');
    expect(detectType(f('a.flac'))).toBe('AUDIO');
    expect(detectType(f('a.txt', 'text/plain'))).toBe('TEXT');
  });
  it('treats .srt/.vtt as subtitles whatever the MIME type', () => {
    expect(detectType(f('a.srt', 'text/plain'))).toBe('SUBTITLE');
    expect(detectType(f('a.vtt', ''))).toBe('SUBTITLE');
  });
  it('flags unknown extensions even when the OS reports an image MIME', () => {
    expect(detectType(f('a.psd', 'image/vnd.adobe.photoshop'))).toBe('UNKNOWN');
  });
  it('lets the MIME type win when both are media and disagree', () => {
    expect(detectType(f('a.mp4', 'audio/mp4'))).toBe('AUDIO');
  });
  it('falls back to MIME when there is no extension', () => {
    expect(detectType(f('clip', 'video/webm'))).toBe('VIDEO');
    expect(detectType(f('clip'))).toBe('UNKNOWN');
  });
});

describe('formatters', () => {
  it('formats sizes and durations', () => {
    expect(fmtSize(1.48e9)).toBe('1,5 Go');
    expect(fmtSize(24.8e6)).toBe('24,8 Mo');
    expect(fmtDur(24)).toBe('00:24');
    expect(fmtDur(8 * 60 + 42 + 3600 * 0)).toBe('08:42');
    expect(fmtDur(3725)).toBe('1:02:05');
    expect(fmtDur(null)).toBe('--:--');
  });
});

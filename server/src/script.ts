import type { ScriptBlock } from './engine.ts';

/**
 * The script as the user types it:
 *
 *   # Titre du chapitre
 *   ? Question du chapitre (facultatif, juste après le titre)
 *   Une phrase ou un paragraphe par ligne.
 *
 * Blank lines are ignored. Returns the editor brain's blocks.
 */
export function parseScript(source: string): ScriptBlock[] {
  const blocks: ScriptBlock[] = [];
  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      const title = line.replace(/^#+\s*/, '').trim();
      if (title) blocks.push({ kind: 'chapter', title });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (line.startsWith('?') && last?.kind === 'chapter' && !last.question) {
      const question = line.slice(1).trim();
      if (question) last.question = question;
      continue;
    }
    blocks.push({ kind: 'text', text: line });
  }
  return blocks;
}

/** The narration only: what the voice says, in order. */
export function spokenText(blocks: readonly ScriptBlock[]): string {
  return blocks.flatMap((b) => (b.kind === 'text' ? [b.text] : [])).join('\n');
}

/**
 * Splits the narration into pieces of at most `max` characters, at line or
 * sentence boundaries, for text-to-speech requests.
 */
export function chunkText(text: string, max = 4000): string[] {
  const sentences = text.split('\n').flatMap((line) => line.match(/[^.!?…]+[.!?…]*\s*/g) ?? []).map((s) => s.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && cur.length + 1 + s.length > max) {
      chunks.push(cur);
      cur = '';
    }
    if (s.length > max) {
      // A single sentence longer than a request: cut at spaces.
      for (const word of s.split(/\s+/)) {
        if (cur && cur.length + 1 + word.length > max) {
          chunks.push(cur);
          cur = '';
        }
        cur = cur ? `${cur} ${word}` : word;
      }
      continue;
    }
    cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

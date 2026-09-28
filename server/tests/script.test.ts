import { describe, expect, it } from 'vitest';
import { chunkText, parseScript, spokenText } from '../src/script.ts';

describe('parseScript', () => {
  it('reads chapters, questions and lines', () => {
    const blocks = parseScript('# Le vrai business\n? Comment gagne-t-il de l’argent ?\n\nMcDonald’s n’est pas une chaîne de burgers.\r\nC’est un propriétaire.\n# Suite\nFin.');
    expect(blocks).toEqual([
      { kind: 'chapter', title: 'Le vrai business', question: 'Comment gagne-t-il de l’argent ?' },
      { kind: 'text', text: 'McDonald’s n’est pas une chaîne de burgers.' },
      { kind: 'text', text: 'C’est un propriétaire.' },
      { kind: 'chapter', title: 'Suite' },
      { kind: 'text', text: 'Fin.' },
    ]);
    expect(spokenText(blocks)).toBe('McDonald’s n’est pas une chaîne de burgers.\nC’est un propriétaire.\nFin.');
  });

  it('keeps a question mark line that does not follow a chapter as text', () => {
    expect(parseScript('Bonjour.\n? Vraiment ?')).toEqual([
      { kind: 'text', text: 'Bonjour.' },
      { kind: 'text', text: '? Vraiment ?' },
    ]);
  });
});

describe('chunkText', () => {
  it('cuts at sentence boundaries under the limit', () => {
    const text = 'Une phrase. Deux phrases ! Trois ?\nQuatre.';
    expect(chunkText(text, 20)).toEqual(['Une phrase.', 'Deux phrases !', 'Trois ? Quatre.']);
    expect(chunkText(text).join(' ')).toBe('Une phrase. Deux phrases ! Trois ? Quatre.');
  });

  it('cuts an over-long sentence at spaces', () => {
    const chunks = chunkText('a'.repeat(8) + ' ' + 'b'.repeat(8) + ' ' + 'c'.repeat(8), 18);
    expect(chunks).toEqual(['aaaaaaaa bbbbbbbb', 'cccccccc']);
  });
});

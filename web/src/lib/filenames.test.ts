import { describe, expect, it } from 'vitest';

// macOS and Windows file systems ignore letter case: two modules whose names differ
// only by case (HeroDemo.tsx / heroDemo.ts) make an import resolve to the wrong file
// there, while Linux builds fine. The site then showed a blank page on a Mac.
const files = Object.keys(import.meta.glob('../**/*.{ts,tsx,js,jsx,mjs}'));

describe('source file names', () => {
  it('has no two modules that differ only by letter case', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const file of files) {
      const key = file.replace(/\.(tsx?|jsx?|mjs)$/, '').toLowerCase();
      const other = seen.get(key);
      if (other) clashes.push(`${other} / ${file}`);
      else seen.set(key, file);
    }
    expect(files.length).toBeGreaterThan(10);
    expect(clashes).toEqual([]);
  });
});

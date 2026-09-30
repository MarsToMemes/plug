/**
 * What Runway charged, kept apart from projects: the monthly cap and the average
 * costs still count a generation whose project was deleted. One JSON line per
 * generation in DATA_DIR/runway-ledger.jsonl.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface LedgerEntry {
  at: string;
  projectId: string;
  model: string;
  kind: 'image' | 'video';
  /** Video length asked (a still: 0). */
  seconds: number;
  credits: number;
}

export interface RunwayCosts {
  /** Average credits per second of video, per model (from what Runway charged here). */
  perSecond: Record<string, number>;
  /** Average credits per still, per model. */
  perImage: Record<string, number>;
  /** Credits charged since the first day of this month (local time). */
  monthUsed: number;
  /** RUNWAY_MONTHLY_CREDITS, if set. */
  monthCap?: number;
}

export class RunwayLedger {
  private readonly file: string;
  constructor(dataDir: string) {
    this.file = join(dataDir, 'runway-ledger.jsonl');
  }

  add(e: LedgerEntry): void {
    appendFileSync(this.file, JSON.stringify(e) + '\n');
  }

  entries(): LedgerEntry[] {
    if (!existsSync(this.file)) return [];
    return readFileSync(this.file, 'utf8').split('\n').flatMap((l) => {
      try { return l.trim() ? [JSON.parse(l) as LedgerEntry] : []; } catch { return []; }
    });
  }

  costs(cap?: number, now = new Date()): RunwayCosts {
    const all = this.entries();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const avg = (list: LedgerEntry[], per: (e: LedgerEntry) => number) => {
      const out: Record<string, number> = {};
      for (const model of new Set(list.map((e) => e.model))) {
        const mine = list.filter((e) => e.model === model && per(e) > 0);
        if (mine.length) out[model] = Math.round((mine.reduce((s, e) => s + e.credits / per(e), 0) / mine.length) * 10) / 10;
      }
      return out;
    };
    return {
      perSecond: avg(all.filter((e) => e.kind === 'video'), (e) => e.seconds),
      perImage: avg(all.filter((e) => e.kind === 'image'), () => 1),
      monthUsed: all.filter((e) => Date.parse(e.at) >= monthStart).reduce((s, e) => s + e.credits, 0),
      ...(cap ? { monthCap: cap } : {}),
    };
  }
}

/**
 * Everything the engine writes about a plan reaches the editor in French: the
 * engine runs on French and English scripts, both styles, every pacing, with
 * and without voice, media, hints and Claude, and nothing may be left to the
 * technical log. A new English template in the engine fails here.
 */
import { describe, expect, it } from 'vitest';
import { directEpisode, directEpisodeWithLlm, type AssetRegistry, type BrainInput } from '../src/engine.ts';
import { frDecision, frId, frIssue, frNote } from '../src/fr.ts';
import { withHints } from '../src/hints.ts';
import { frPlanTexts } from '../src/pipeline.ts';
import { parseScript } from '../src/script.ts';

const own = { provider: 'own production', license: 'own', commercialUse: true, attributionRequired: false };
const FR = `# Le vrai business de McDonald's
? Comment gagne-t-il vraiment sa vie ?
McDonald's n'est pas une entreprise de burgers.
Derrière chaque comptoir, il y a autre chose.
Plus de 60 % de ses revenus viennent des franchisés.
# Un empire immobilier construit sur des terrains bien choisis
Ils possèdent le terrain sous plus de la moitié de leurs restaurants.
En 1955, Ray Kroc ouvre son premier restaurant à Des Plaines.
Le rapport annuel le dit clairement.
Les clients attendent au comptoir chaque matin.
Personne ne s'y attendait.
Derrière les burgers, c'est un propriétaire.`;
const EN = `# The real business
McDonald's isn't a burger company.
Over 60% of its revenue comes from franchisees.
They own the land under more than half of their restaurants.
Nobody saw it coming.
Behind the burgers, it's a landlord.`;

const assets: AssetRegistry = {
  queue: { id: 'queue', kind: 'video', src: 'clip.webm', durationInSeconds: 1.5, width: 1920, height: 1080, source: own },
  counter: { id: 'counter', kind: 'image', src: 'a.jpg', width: 1920, height: 1080, source: own },
  fake: { id: 'fake', kind: 'image', src: 'b.jpg', width: 1920, height: 1080, source: { ...own, syntheticMedia: true } },
};
const catalog: BrainInput['catalog'] = [
  { assetId: 'queue', description: 'clients qui attendent au comptoir', tags: ['clients', 'comptoir', 'attendent'], nature: 'real_video' },
  { assetId: 'counter', description: 'un restaurant McDonald en 1955', tags: ['restaurant', '1955'], nature: 'archive' },
  { assetId: 'fake', description: 'burger généré', tags: ['burgers'], nature: 'generated' },
];
const hints = {
  'Plus de 60 % de ses revenus viennent des franchisés.': { chart: { kind: 'barChart' as const, labels: ['Franchisés', 'En propre'], values: [62, 38], source: 'Rapport annuel' } },
  'Ils possèdent le terrain sous plus de la moitié de leurs restaurants.': { share: { value: 55, label: 'des terrains' } },
  'Le rapport annuel le dit clairement.': { documentCard: { header: 'Form 10-K', sentence: 'Nous *possédons* le terrain.' } },
  'Les clients attendent au comptoir chaque matin.': { media: 'queue', mediaStart: 0.5 },
};

function inputs(): BrainInput[] {
  const out: BrainInput[] = [];
  for (const script of [FR, EN])
    for (const style of ['apple', 'default'] as const)
      for (const pacing of ['calm', 'standard', 'dynamic'] as const)
        for (const withMedia of [false, true])
          out.push({
            title: 'Test', script: withHints(parseScript(script), script === FR && withMedia ? hints : undefined),
            assets: withMedia ? assets : {}, ...(withMedia ? { catalog } : {}), style, pacing, captions: true,
          });
  return out;
}

describe('the engine in French', () => {
  it('translates every decision, note and issue of the plans', () => {
    const left = new Set<string>();
    for (const input of inputs()) {
      const r = directEpisode(input);
      const t = frPlanTexts(r, []);
      t.technical.forEach((x) => left.add(x));
      // Quotes of the script (« … ») are the author's words, in their language.
      for (const s of [...t.decisions, ...t.notes, ...t.errors.map((e) => e.message), ...t.warnings.map((e) => e.message)]) expect(s.replace(/«[^»]*»/g, '')).not.toMatch(/\b(the|with|without|shot|no|of)\b/);
    }
    expect([...left]).toEqual([]);
  });

  it('translates the Claude brain decisions', async () => {
    const input = inputs()[0]!;
    const failed = await directEpisodeWithLlm(input, { model: { id: 'test', callTool: async () => { throw new Error('clé refusée'); } } });
    expect(frPlanTexts(failed, []).technical).toEqual([]);
    expect(frDecision('editorial analysis by claude-sonnet-5-5 (partially: 2 problem(s) left)')).toBe('Analyse éditoriale par Claude (claude-sonnet-5-5) : partielle, 2 problème(s) restant(s).');
    expect(frDecision("u4: the model's analysis was rejected, heuristic analysis kept")).toMatch(/^Phrase 4 : l’analyse de Claude est refusée/);
  });

  it('shows the rule of the bible, where, and the measure', () => {
    expect(frIssue({ rule: 'RHY-03', message: 'shots[2].motionSkill: 4.1 s without a motion skill: add movement, a cut or a new element' }))
      .toBe('[RHY-03] Jamais plus de 4 s sans changement visuel (mouvement, nouvel élément, coupe), sauf plan long intentionnel (RHY-04). (plan 3) : 4,1 s');
    expect(frIssue({ rule: 'TECH-08', message: '5.0 s of silence nobody asked for', shotId: 'u2-b' })).toMatch(/\(phrase 2 \(plan b\)\) : 5,0 s$/);
    expect(frIssue({ message: 'no rule' })).toBeNull();
    expect(frNote('u3: [CAP-03] no captions, the on-screen text already says it')).toBe('Phrase 3 : pas de sous-titres, le texte à l’écran le dit déjà (CAP-03).');
    expect(frNote('Pas de clé : déjà en français.')).toBe('Pas de clé : déjà en français.');
    expect(frId('chapter-2 + u7-a')).toBe('carton du chapitre 2 + phrase 7 (plan a)');
  });
});

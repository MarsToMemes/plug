/**
 * The server speaks the reader's language: HTTP errors, stored job messages and
 * failures, and the engine's texts are written when read, in French or English.
 */
import { describe, expect, it } from 'vitest';
import { enIssue, enText, localizeProject } from '../src/i18n.ts';
import { langOf, msg, MsgError, text } from '../src/messages.ts';
import type { Project } from '../src/store.ts';

describe('the language of a request', () => {
  it('follows the site, then the browser, else French', () => {
    expect(langOf({ 'x-plug-lang': 'en', 'accept-language': 'fr-FR,fr;q=0.9' })).toBe('en');
    expect(langOf({ 'accept-language': 'en-GB,en;q=0.9,fr;q=0.8' })).toBe('en');
    expect(langOf({ 'accept-language': 'fr-CA,fr;q=0.9,en;q=0.8' })).toBe('fr');
    expect(langOf({ 'accept-language': 'de-DE,de;q=0.9,fr;q=0.5' })).toBe('fr');
    expect(langOf({ 'accept-language': 'ja-JP' })).toBe('en');
    expect(langOf({})).toBe('fr');
  });
  it('writes a message in either language', () => {
    expect(text(msg('planReady', { n: 7 }), 'fr')).toBe('Plan prêt : 7 plans');
    expect(text(msg('planReady', { n: 7 }), 'en')).toBe('Plan ready: 7 shots');
    expect(new MsgError('noWords').message).toBe('No word detected in the voice-over.');
  });
});

const project = (): Project => ({
  id: 'p1', title: 'T', createdAt: '', updatedAt: '', script: 'Une phrase.', pacing: 'standard', captions: true, llm: false,
  voice: { mode: 'none' }, rightsConfirmed: false,
  media: [{ id: 'm1', role: 'visual', kind: 'image', file: 'm1.jpg', originalName: 'a.jpg', bytes: 1, checksum: 'x', description: '', tags: [], auto: { status: 'failed', error: 'Claude did not answer.', errorMsg: msg('claudeSilent') } }],
  job: { id: 'j', kind: 'direct', status: 'failed', progress: 0.02, message: 'Preparing the voice-over', msg: msg('preparingVoice'), error: 'The script is empty.', errorMsg: msg('emptyScript'), queuedAt: '' },
  plan: {
    createdAt: '', shots: 3, durationInSeconds: 9, valid: true, brain: 'heuristic', raw: true,
    decisions: ['style apple: hard cuts (shot starts unchanged), no burned-in captions, studio blocks timed to the voice', 'u2: J-cut, the number appears on “60” (6 frames into the sentence)'],
    notes: ['Without a voice-over, timings are estimated and the video will be silent.'],
    errors: [],
    warnings: [{ rule: 'RHY-03', message: 'shots[2].motionSkill: 4.1 s without a motion skill: add movement, a cut or a new element' }],
    assetRequests: [],
  },
  render: {
    createdAt: '', planCreatedAt: '', durationInSeconds: 9, draft: true, scale: 0.5, notes: ['the mix is silent: no loudness normalisation'],
    qc: { pass: true, failed: [], warnings: ['5.0 s of silence nobody asked for'], checks: [{ status: 'warn', rule: 'TECH-08', message: '5.0 s of silence nobody asked for', shotId: 'u3' }] },
  },
});

describe('a project as the reader sees it', () => {
  it('in French', () => {
    const p = localizeProject(project(), 'fr');
    expect(p.job).toMatchObject({ message: 'Préparation de la voix off', error: 'Le script est vide.' });
    expect(p.media[0]!.auto!.error).toBe('Claude n’a pas répondu.');
    expect(p.plan!.decisions).toEqual(['Style Apple : coupes franches, pas de sous-titres incrustés, blocs studio calés sur la voix.', 'Phrase 2 : le chiffre apparaît sur « 60 », 6 images après le début de la phrase.']);
    expect(p.plan!.notes).toEqual(['Sans voix off, les durées sont estimées et la vidéo sera muette.']);
    expect(p.plan!.warnings[0]!.message).toMatch(/^\[RHY-03\] Jamais plus de 4 s sans changement visuel.*\(plan 3\) : 4,1 s$/);
    expect(p.render!.qc!.warnings[0]).toMatch(/^\[TECH-08\] .*\(phrase 3\) : 5,0 s$/);
    expect(p.render!.notes).toEqual(['Le mixage est muet : pas de normalisation du volume.']);
  });

  it('in English, and the stored project is unchanged', () => {
    const stored = project();
    const p = localizeProject(stored, 'en');
    expect(p.job).toMatchObject({ message: 'Preparing the voice-over', error: 'The script is empty.' });
    expect(p.plan!.decisions[1]).toBe('Sentence 2: J-cut, the number appears on “60” (6 frames into the sentence)');
    expect(p.plan!.warnings[0]!.message).toBe('[RHY-03] Shot 3: 4.1 s without a motion skill: add movement, a cut or a new element');
    expect(p.render!.qc!.warnings[0]).toBe('[TECH-08] Sentence 3: 5.0 s of silence nobody asked for');
    expect(p.render!.notes).toEqual(['The mix is silent: no loudness normalisation']);
    expect(stored.job!.message).toBe('Preparing the voice-over');
    expect(stored.plan!.decisions[1]).toMatch(/^u2:/);
  });

  it('keeps plans stored in French before this layer', () => {
    const old = { ...project(), plan: { ...project().plan!, raw: undefined, decisions: ['Style Apple : coupes franches.'] } };
    expect(localizeProject(old, 'en').plan!.decisions).toEqual(['Style Apple : coupes franches.']);
  });

  it('cleans the engine wording in English', () => {
    expect(enText('chapter-2: no studio block (missing text or media), engine composition kept')).toBe('Chapter 2 card: no studio block (missing text or media), engine composition kept');
    expect(enIssue({ message: 'the plan is valid' })).toBe('The plan is valid');
  });
});

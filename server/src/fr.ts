/**
 * The engine (studio-engine) writes its decisions, notes and checks in English.
 * Plug shows them in French: an issue tied to a rule of the bible shows the
 * rule's own French text (the bible is written in French), the known decision
 * and note templates are translated here. A text no template matches is
 * returned as null: the caller files it in the technical log, never mixed
 * with the French lists. tests/fr.test.ts runs the engine on many scripts and
 * fails when an English text slips through.
 */
import { getBibleRule } from './engine.ts';

const TYPE: Record<string, string> = {
  image: 'image', video: 'vidéo', text: 'texte', number: 'chiffre', document: 'document',
  chart: 'graphique', map: 'carte', revelation: 'révélation', chapter: 'chapitre',
};

/** `u3` → `phrase 3`, `u3-b` → `phrase 3 (plan b)`, `chapter-2` → `carton du chapitre 2`. */
export function frId(id: string): string {
  return id
    .replace(/\bu(\d+)-([a-z])\b/g, 'phrase $1 (plan $2)')
    .replace(/\bu(\d+)\b/g, 'phrase $1')
    .replace(/\bchapter-(\d+)\b/g, 'carton du chapitre $1');
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Rule = [RegExp, (...m: string[]) => string];

const DECISIONS: Rule[] = [
  [/^no narration transcript: timing estimated at (\d+) words per minute$/, (n) => `Pas de voix off : les durées sont estimées à ${n} mots par minute.`],
  [/^no sound library given: no sound effects$/, () => 'Pas de sonothèque : aucun effet sonore.'],
  [/^style apple: hard cuts \(shot starts unchanged\), no burned-in captions, studio blocks timed to the voice$/, () => 'Style Apple : coupes franches, pas de sous-titres incrustés, blocs studio calés sur la voix.'],
  [/^(\S+): J-cut, the (\w+) appears on “(.*)” \((\d+) frames into the sentence\)$/, (id, type, word, f) => `${cap(frId(id))} : le ${TYPE[type] ?? type} apparaît sur « ${word} », ${f} images après le début de la phrase.`],
  [/^(\S+): ([\d.]+) s of silence before the revelation \((.*)\)$/, (id, s) => `${cap(frId(id))} : ${s.replace('.', ',')} s de silence avant la révélation (musique et effets coupés).`],
  [/^(\S+): strong claim without visual proof in the next sentences \(STORY-05\): “(.*)”$/, (id, t) => `${cap(frId(id))} : affirmation forte sans preuve visuelle dans les phrases suivantes (STORY-05) : « ${t} »`],
  [/^chapter "(.*)" shortened to 6 words on its card \(CHAP-02\)$/, (t) => `Chapitre « ${t} » raccourci à 6 mots sur son carton (CHAP-02).`],
  [/^(\S+): revelation opening a scene has no setup; treated as an important fact$/, (id) => `${cap(frId(id))} : une révélation qui ouvre une scène n’a pas de mise en place ; traitée comme un fait important.`],
  [/^(\S+): (\w+) shot kept on the engine's composition \(no studio block for it(: give hints\.documentCard to rebuild the document)?\)$/, (id, type, doc) => `${cap(frId(id))} : plan ${TYPE[type] ?? type} gardé dans la composition du moteur (pas de bloc studio${doc ? ' : ajoutez une fiche document pour le recomposer' : ''}).`],
  [/^(.+): no studio block \(missing text or media\), engine composition kept$/, (ids) => `${cap(frId(ids.replace(/ \+ /g, ', ')))} : pas de bloc studio (texte ou média manquant), composition du moteur gardée.`],
  [/^(\S+): the model's analysis was rejected, heuristic analysis kept$/, (id) => `${cap(frId(id))} : l’analyse de Claude est refusée, l’analyse automatique est gardée.`],
  [/^the model's scene structure was rejected, heuristic structure rebuilt on its analysis$/, () => 'Le découpage en scènes proposé par Claude est refusé : il est reconstruit à partir de son analyse.'],
  [/^editorial analysis by (\S+)(?: \(partially: (\d+) problem\(s\) left\))?$/, (model, left) => `Analyse éditoriale par Claude (${model})${left ? ` : partielle, ${left} problème(s) restant(s)` : ''}.`],
  [/^LLM unavailable \((.*)\): heuristic brain used$/s, (why) => `Claude indisponible, le cerveau automatique a monté l’épisode. Raison : ${why}`],
];

const NOTES: Rule[] = [
  // Plug's own notes (pipeline.ts)
  [/^Claude \((\S+)\): (\w+), (\d+) call\(s\)$/, (model, accepted, n) => `Claude (${model}) : analyse ${accepted === 'full' ? 'acceptée' : accepted === 'partial' ? 'acceptée en partie' : 'refusée'}, ${n} appel(s).`],
  [/^No ANTHROPIC_API_KEY: the automatic editor \(without Claude\) edited the episode\.$/, () => 'Pas de clé ANTHROPIC_API_KEY : le monteur automatique (sans Claude) a monté l’épisode.'],
  [/^Without a voice-over, timings are estimated and the video will be silent\.$/, () => 'Sans voix off, les durées sont estimées et la vidéo sera muette.'],
  [/^(\S+): \[CAP-03\] no captions, the on-screen text already says it$/, (id) => `${cap(frId(id))} : pas de sous-titres, le texte à l’écran le dit déjà (CAP-03).`],
  [/^(\S+): motion skill "(.*)" not applied, the HyperFrames block animates itself$/, (id) => `${cap(frId(id))} : le bloc studio s’anime lui-même, pas d’animation ajoutée.`],
  [/^(\S+): motion skill "(.*)" not applied \(no skill registry\)$/, (id, s) => `${cap(frId(id))} : animation « ${s} » non appliquée (catalogue absent).`],
  [/^(\S+): unknown transition "(.*)", hard_cut used$/, (id, t) => `${cap(frId(id))} : transition « ${t} » inconnue, coupe franche utilisée.`],
  [/^(\S+): transition shortened from (\d+) frames$/, (id, n) => `${cap(frId(id))} : transition raccourcie (${n} images au départ).`],
  [/^(\S+): sfx "(.*)" unresolved, skipped$/, (id, s) => `${cap(frId(id))} : effet sonore « ${s} » introuvable, ignoré.`],
  [/^(\S+): sfx "(.*)" falls in a controlled silence \(sfx_drop\), skipped$/, (id, s) => `${cap(frId(id))} : effet sonore « ${s} » ignoré, il tombe dans un silence voulu.`],
  [/^(\S+): \[SRC-01\] HyperFrames "(.*)" embeds media \((.*)\): verify the rights before publishing$/, (id, item, media) => `${cap(frId(id))} : le bloc « ${item} » contient des médias (${media}) : vérifiez les droits avant de publier (SRC-01).`],
  [/^ambient_drop silence without an ambience bed: nothing to drop$/, () => 'Silence d’ambiance demandé sans fond d’ambiance : rien à couper.'],
  [/^the mix is silent: no loudness normalisation$/, () => 'Le mixage est muet : pas de normalisation du volume.'],
  [/^a video layer plays its own sound: the audio is rendered by Remotion \(not cached\)$/, () => 'Une vidéo joue son propre son : l’audio est rendu par Remotion (hors cache).'],
  [/^the joined video has (\d+) frames, the plan (\d+)$/, (a, b) => `La vidéo assemblée a ${a} images, le plan ${b}.`],
  [/^scenes\[(\d+)\]\.transitionIn shortened from (\d+) to (\d+) frames to fit the adjacent scenes$/, (i, a, b) => `Scène ${Number(i) + 1} : transition raccourcie de ${a} à ${b} images.`],
  [/^(.*); fell back to "(.*)"( \(safe fallback of (\w+) shots\))?$/, (_why, skill) => `Animation remplacée par « ${skill} » (repli sûr).`],
  [/^invalid motionParams \((.*)\); defaults used$/, () => 'Réglages d’animation invalides : valeurs par défaut utilisées.'],
  [/^(\S+): framing "(.*)" ignored: the shot has no image or video to crop$/, (id) => `${cap(frId(id))} : cadrage ignoré, le plan n’a pas d’image à recadrer.`],
  [/^(\S+): \[CAM-02\] camera "(.*)" ignored: skill "(.*)" already moves the camera$/, (id) => `${cap(frId(id))} : mouvement de caméra ignoré, l’animation bouge déjà l’image (CAM-02).`],
  [/^(\S+): unknown camera move "(.*)", shot left static$/, (id, m) => `${cap(frId(id))} : mouvement de caméra « ${m} » inconnu, plan fixe.`],
  [/^(\S+): camera "(.*)" (?:needs the motion skill registry|unavailable \(.*\)); shot left static$/, (id, m) => `${cap(frId(id))} : mouvement de caméra « ${m} » indisponible, plan fixe.`],
  [/^(\S+): camera "(.*)" fell back to "(.*)"$/, (id, m, f) => `${cap(frId(id))} : mouvement de caméra « ${m} » remplacé par « ${f} ».`],
  [/^(\S+): camera "(\S+)" (.+)$/, (id, m) => `${cap(frId(id))} : mouvement de caméra « ${m} » approché.`],
  [/^(\S+): (.*); no fallback applies, shot left without motion$/, (id) => `${cap(frId(id))} : animation indisponible, plan sans animation.`],
];

function apply(rules: Rule[], text: string): string | null {
  for (const [re, fr] of rules) {
    const m = re.exec(text);
    if (m) return fr(...m.slice(1));
  }
  return null;
}

/** A decision of the brain in French, or null when no template knows it. */
export const frDecision = (text: string): string | null => apply(DECISIONS, text);
/** A note of the compiler or the renderer in French, or null. Plug's own notes are already French. */
export const frNote = (text: string): string | null => (/[éèàùâêîôûçœ«»’]/.test(text) ? text : apply(NOTES, text) ?? apply(DECISIONS, text));

/** Where an issue is: `shots[2]…` → `plan 3`. */
function where(message: string, shotId?: string): string {
  const i = /\bshots\[(\d+)\]/.exec(message);
  if (i) return ` (plan ${Number(i[1]) + 1})`;
  if (shotId) return ` (${frId(shotId)})`;
  return '';
}

/**
 * An issue of the validation or of the quality control, in French: the text of its
 * rule in the bible, where it is. Without a known rule, null.
 */
export function frIssue(issue: { rule?: string; message: string; shotId?: string }): string | null {
  const rule = issue.rule ? getBibleRule(issue.rule) : undefined;
  if (!rule) return null;
  // The measure that triggered it (seconds, dB…), when the message gives one.
  const measure = /(-?\d+(?:\.\d+)?) (s|dBTP|LUFS|dBFS)\b/.exec(issue.message);
  const detail = measure ? ` : ${measure[1].replace('.', ',')} ${measure[2]}` : '';
  return `[${rule.id}] ${rule.text.replace(/`([^`]+)`/g, '$1')}${where(issue.message, issue.shotId)}${detail}`;
}

/** Issues in French; one without a known rule is announced in French and kept, in English, in the technical log. */
export function frIssues<T extends { rule?: string; message: string; shotId?: string }>(issues: T[], technical: string[]): Array<{ message: string; rule?: string }> {
  return issues.map((i) => {
    const fr = frIssue(i);
    if (fr === null) technical.push(i.message);
    return { message: fr ?? 'Point technique à vérifier (détail en anglais dans le journal technique).', ...(i.rule ? { rule: i.rule } : {}) };
  });
}

/** French lists for the editor, and what could not be translated (kept, apart, in English). */
export function frLists(input: { decisions: string[]; notes: string[] }): { decisions: string[]; notes: string[]; technical: string[] } {
  const technical: string[] = [];
  const pick = (list: string[], tr: (s: string) => string | null) =>
    list.flatMap((s) => {
      const fr = tr(s);
      if (fr === null) technical.push(s);
      return fr === null ? [] : [fr];
    });
  return { decisions: pick(input.decisions, frDecision), notes: pick(input.notes, frNote), technical };
}

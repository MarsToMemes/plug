/**
 * What the server says to people, in French and English. A message is a key and
 * its parameters: an HTTP error is written in the language of the request, and a
 * message stored in a project (job progress, a failed job, a description or a
 * generation that failed) is stored as its key and written when the project is
 * read, in the reader's language.
 *
 * The language of a request: X-Plug-Lang (sent by the site, which lets the
 * visitor choose), else the browser's Accept-Language, else French.
 */
export type Lang = 'fr' | 'en';
type P = Record<string, string | number>;
type Text = (p: P) => string;

const CATALOG = {
  projectNotFound: { fr: () => 'Projet introuvable.', en: () => 'Project not found.' },
  fileNotFound: { fr: () => 'Fichier introuvable.', en: () => 'File not found.' },
  mediaNotFound: { fr: () => 'Média introuvable.', en: () => 'Media not found.' },
  badPacing: { fr: () => 'Rythme : calm, standard ou dynamic.', en: () => 'Pacing: calm, standard or dynamic.' },
  badStyle: { fr: () => 'Style : apple ou default.', en: () => 'Style: apple or default.' },
  badVoiceMode: { fr: () => 'Voix : tts, upload ou none.', en: () => 'Voice: tts, upload or none.' },
  badVoiceId: { fr: () => 'ID de voix ElevenLabs invalide.', en: () => 'Invalid ElevenLabs voice ID.' },
  noFile: { fr: () => 'Fichier manquant.', en: () => 'Missing file.' },
  badFormat: { fr: (p) => `Format non pris en charge : ${p.ext || 'inconnu'}.`, en: (p) => `Unsupported format: ${p.ext || 'unknown'}.` },
  badRole: { fr: () => 'Rôle : visual, voice ou music.', en: () => 'Role: visual, voice or music.' },
  tooLarge: { fr: () => 'Fichier trop lourd (4 Go maximum).', en: () => 'File too large (4 GB maximum).' },
  unreadable: { fr: () => 'Fichier illisible.', en: () => 'Unreadable file.' },
  noSound: { fr: () => 'Ce fichier ne contient pas de son.', en: () => 'This file has no sound.' },
  visualKind: { fr: () => 'Un visuel doit être une image ou une vidéo.', en: () => 'A visual must be an image or a video.' },
  jobRunning: { fr: () => 'Une tâche tourne sur ce projet.', en: () => 'A task is running on this project.' },
  busy: { fr: () => 'Une tâche est déjà en cours sur ce projet.', en: () => 'A task is already running on this project.' },
  natureOnlyVisual: { fr: () => 'Seul un visuel a une nature.', en: () => 'Only a visual has a nature.' },
  badNature: { fr: (p) => `Nature : ${p.list}.`, en: (p) => `Nature: ${p.list}.` },
  describeOnlyVisual: { fr: () => 'Seul un visuel se décrit.', en: () => 'Only a visual can be described.' },
  describeNoKey: { fr: () => 'Ajoutez ANTHROPIC_API_KEY dans server/.env pour que Claude décrive les visuels.', en: () => 'Add ANTHROPIC_API_KEY to server/.env for Claude to describe your visuals.' },
  describing: { fr: () => 'Claude décrit déjà ce visuel.', en: () => 'Claude is already describing this visual.' },
  runwayNoKey: { fr: () => 'Ajoutez RUNWAYML_API_SECRET dans server/.env pour générer des visuels avec Runway.', en: () => 'Add RUNWAYML_API_SECRET to server/.env to generate visuals with Runway.' },
  promptEmpty: { fr: () => 'Décrivez ce que Runway doit générer.', en: () => 'Describe what Runway should generate.' },
  lineGone: { fr: () => 'Cette phrase n’est plus dans le script.', en: () => 'This sentence is no longer in the script.' },
  lineMissing: { fr: () => 'Indiquez la phrase du script (line).', en: () => 'Give the script sentence (line).' },
  realSubject: {
    fr: () => 'Cette phrase montre du réel (une personne, une marque, l’histoire, un document, une plateforme) : une image générée ne peut pas la représenter. Cherchez une vraie photo ou vidéo (Wikimedia Commons, kit presse, Pexels).',
    en: () => 'This sentence shows something real (a person, a brand, history, a document, a platform): a generated picture cannot stand for it. Look for a real photo or video (Wikimedia Commons, press kit, Pexels).',
  },
  runwayBudget: { fr: (p) => `Plafond Runway du mois atteint : ${p.used} crédits utilisés sur ${p.cap} (RUNWAY_MONTHLY_CREDITS dans server/.env).`, en: (p) => `Runway monthly cap reached: ${p.used} of ${p.cap} credits used (RUNWAY_MONTHLY_CREDITS in server/.env).` },
  sourceNotImage: { fr: () => 'L’image à animer doit être une image du projet.', en: () => 'The picture to animate must be an image of the project.' },
  promptNoKey: { fr: () => 'Ajoutez ANTHROPIC_API_KEY dans server/.env pour que Claude écrive le prompt.', en: () => 'Add ANTHROPIC_API_KEY to server/.env for Claude to write the prompt.' },
  tooManyGenerations: { fr: () => 'Trois générations sont déjà en cours sur ce projet : attendez qu’une se termine.', en: () => 'Three generations are already running on this project: wait for one to finish.' },
  rightsNeeded: { fr: () => 'Confirmez que vous détenez les droits des médias importés.', en: () => 'Confirm that you own the rights to the imported media.' },
  planFirst: { fr: () => 'Générez d’abord le plan de montage.', en: () => 'Generate the edit plan first.' },
  serverRestarted: { fr: () => 'Le serveur a redémarré pendant la tâche : relancez-la.', en: () => 'The server restarted during the task: run it again.' },
  taskStopped: { fr: (p) => `La tâche s’est arrêtée (code ${p.code}).`, en: (p) => `The task stopped (code ${p.code}).` },
  describeInterrupted: { fr: () => 'Interrompue par un redémarrage du serveur.', en: () => 'Interrupted by a server restart.' },
  generationInterrupted: { fr: () => 'Interrompue par un redémarrage du serveur : relancez-la (Runway a peut-être déjà compté les crédits).', en: () => 'Interrupted by a server restart: run it again (Runway may have charged the credits already).' },
  downloadFailed: { fr: (p) => `Téléchargement du visuel impossible (${p.status}).`, en: (p) => `Could not download the visual (${p.status}).` },
  runwayNoImage: { fr: () => 'Runway a renvoyé un fichier sans image.', en: () => 'Runway returned a file with no picture.' },
  noStream: { fr: () => 'Aucune piste audio ou vidéo dans ce fichier.', en: () => 'No audio or video stream in this file.' },
  // Sentence settings (hints.ts)
  hintText: { fr: (p) => `${p.field} : texte attendu.`, en: (p) => `${p.field}: text expected.` },
  hintNumber: { fr: (p) => `${p.field} : nombre attendu.`, en: (p) => `${p.field}: number expected.` },
  hintObject: { fr: () => 'Réglages : objet attendu.', en: () => 'Settings: object expected.' },
  hintIntent: { fr: (p) => `Rôle inconnu : ${p.value}.`, en: (p) => `Unknown role: ${p.value}.` },
  hintNeed: { fr: (p) => `Besoin d’image inconnu : ${p.value}.`, en: (p) => `Unknown picture need: ${p.value}.` },
  hintMedia: { fr: () => 'Ce visuel n’est pas dans le projet.', en: () => 'This visual is not in the project.' },
  hintStart: { fr: () => 'Le début dans le clip doit être positif (secondes).', en: () => 'The start in the clip must be positive (seconds).' },
  hintChartKind: { fr: () => 'Graphique : barres (barChart), courbe (lineChart) ou camembert (pieChart).', en: () => 'Chart: bars (barChart), line (lineChart) or pie (pieChart).' },
  hintChartRows: { fr: () => 'Graphique : autant de libellés que de valeurs, tous remplis.', en: () => 'Chart: as many labels as values, all filled in.' },
  hintChartMax: { fr: () => 'Graphique : 12 valeurs au plus.', en: () => 'Chart: 12 values at most.' },
  hintShare: { fr: (p) => `Part : une valeur entre 0 et ${p.max}.`, en: (p) => `Share: a value between 0 and ${p.max}.` },
  // Claude's descriptions (describe.ts)
  claudeRefused: { fr: (p) => `Claude a refusé de décrire ce visuel (${p.category || 'sans catégorie'}).`, en: (p) => `Claude declined to describe this visual (${p.category || 'no category'}).` },
  claudeRefusedPrompt: { fr: (p) => `Claude a refusé d’écrire ce prompt (${p.category || 'sans catégorie'}).`, en: (p) => `Claude declined to write this prompt (${p.category || 'no category'}).` },
  claudeCut: { fr: () => 'La réponse de Claude a été coupée.', en: () => 'Claude’s answer was cut off.' },
  claudeSilent: { fr: () => 'Claude n’a pas répondu.', en: () => 'Claude did not answer.' },
  claudeEmpty: { fr: () => 'Description vide.', en: () => 'Empty description.' },
  // Runway (runway.ts)
  runwayFailed: { fr: (p) => `Runway n’a pas pu générer ce visuel${p.failure ? ` : ${p.failure}` : ''}${p.code ? ` (${p.code})` : ''}.`, en: (p) => `Runway could not generate this visual${p.failure ? `: ${p.failure}` : ''}${p.code ? ` (${p.code})` : ''}.` },
  runwayTimeout: { fr: () => 'Runway n’a pas terminé en 15 minutes : réessayez plus tard.', en: () => 'Runway did not finish within 15 minutes: try again later.' },
  runwayBadKey: { fr: () => 'Clé Runway refusée : vérifiez RUNWAYML_API_SECRET dans server/.env.', en: () => 'Runway key refused: check RUNWAYML_API_SECRET in server/.env.' },
  runwayBusy: { fr: () => 'Runway est saturé ou vos crédits sont épuisés : réessayez plus tard.', en: () => 'Runway is busy or your credits have run out: try again later.' },
  runwayRefused: { fr: (p) => `Runway a refusé la demande : ${p.detail}`, en: (p) => `Runway refused the request: ${p.detail}` },
  // Job progress and failures (pipeline.ts)
  queued: { fr: () => 'En attente', en: () => 'Waiting' },
  starting: { fr: () => 'Démarrage', en: () => 'Starting' },
  emptyScript: { fr: () => 'Le script est vide.', en: () => 'The script is empty.' },
  preparingVoice: { fr: () => 'Préparation de la voix off', en: () => 'Preparing the voice-over' },
  voiceReused: { fr: () => 'Voix off inchangée : réutilisée', en: () => 'Voice-over unchanged: reused' },
  ttsNeedsKey: { fr: () => 'La voix IA demande une clé ElevenLabs (ELEVENLABS_API_KEY) sur le serveur. Importez plutôt votre propre voix off.', en: () => 'The AI voice needs an ElevenLabs key (ELEVENLABS_API_KEY) on the server. Import your own voice-over instead.' },
  ttsProgress: { fr: (p) => `Génération de la voix IA (${p.i}/${p.n})`, en: (p) => `Generating the AI voice (${p.i}/${p.n})` },
  noVoiceUploaded: { fr: () => 'Aucune voix off importée.', en: () => 'No voice-over imported.' },
  transcribing: { fr: () => 'Transcription de la voix off (ElevenLabs)', en: () => 'Transcribing the voice-over (ElevenLabs)' },
  aligning: { fr: () => 'Alignement du script sur la voix off', en: () => 'Aligning the script on the voice-over' },
  normalizing: { fr: () => 'Normalisation de la voix (−16 LUFS)', en: () => 'Normalizing the voice (−16 LUFS)' },
  noWords: { fr: () => 'Aucun mot détecté dans la voix off.', en: () => 'No word detected in the voice-over.' },
  claudeWriting: { fr: () => 'Claude écrit l’analyse éditoriale', en: () => 'Claude is writing the editorial analysis' },
  brainEditing: { fr: () => 'Le cerveau éditorial monte l’épisode', en: () => 'The editorial brain is editing the episode' },
  planReady: { fr: (p) => `Plan prêt : ${p.n} plans`, en: (p) => `Plan ready: ${p.n} shots` },
  stillsNeedDrawtext: { fr: () => 'La planche de contrôle demande un FFmpeg complet (filtre drawtext) sur le serveur : installez FFmpeg (apt install ffmpeg, brew install ffmpeg) ou indiquez son chemin avec FFMPEG.', en: () => 'The contact sheet needs a full FFmpeg (drawtext filter) on the server: install FFmpeg (apt install ffmpeg, brew install ffmpeg) or set its path with FFMPEG.' },
  stillsNeedBrowser: { fr: () => 'La planche de contrôle demande Google Chrome : installez-le, ou indiquez un navigateur avec REMOTION_BROWSER.', en: () => 'The contact sheet needs Google Chrome: install it, or set a browser with REMOTION_BROWSER.' },
  stillsBrowser: { fr: () => 'Planche de contrôle : ouverture du navigateur', en: () => 'Contact sheet: opening the browser' },
  stillsCapturing: { fr: () => 'Planche de contrôle : captures des plans', en: () => 'Contact sheet: capturing the shots' },
  stillsFailed: { fr: (p) => `La planche de contrôle a échoué :\n${p.detail}`, en: (p) => `The contact sheet failed:\n${p.detail}` },
  stillsReady: { fr: () => 'Planche prête', en: () => 'Contact sheet ready' },
  renderChunk: { fr: (p) => `Rendu : morceau ${p.i}/${p.n}${p.cached ? ' (cache)' : ''}`, en: (p) => `Rendering: chunk ${p.i}/${p.n}${p.cached ? ' (cached)' : ''}` },
  renderPrepare: { fr: () => 'Préparation du rendu', en: () => 'Preparing the render' },
  renderMix: { fr: () => 'Mixage audio', en: () => 'Mixing the audio' },
  renderConcat: { fr: () => 'Assemblage', en: () => 'Joining the chunks' },
  renderMaster: { fr: () => 'Mastering (−14 LUFS)', en: () => 'Mastering (−14 LUFS)' },
  qualityControl: { fr: () => 'Contrôle qualité', en: () => 'Quality control' },
  qcImpossible: { fr: (p) => `Contrôle qualité impossible : ${p.detail}`, en: (p) => `Quality control could not run: ${p.detail}` },
  videoReady: { fr: () => 'Vidéo prête', en: () => 'Video ready' },
} satisfies Record<string, { fr: Text; en: Text }>;

export type MsgKey = keyof typeof CATALOG;
export interface Msg { key: MsgKey; params?: P }

export const msg = (key: MsgKey, params?: P): Msg => ({ key, ...(params ? { params } : {}) });
export const text = (m: Msg, lang: Lang): string => (CATALOG[m.key]?.[lang] ?? CATALOG[m.key]?.en)?.(m.params ?? {}) ?? m.key;
export const isMsg = (v: unknown): v is Msg => typeof v === 'object' && v !== null && typeof (v as Msg).key === 'string' && (v as Msg).key in CATALOG;

/** An error whose message people read: written in the language of whoever reads it. Its `message` is the English text (logs). */
export class MsgError extends Error {
  readonly msg: Msg;
  constructor(key: MsgKey, params?: P) {
    const m = msg(key, params);
    super(text(m, 'en'));
    this.msg = m;
  }
}

/** The language of a request (see the top of this file). */
export function langOf(headers: Record<string, string | string[] | undefined>): Lang {
  const own = String(headers['x-plug-lang'] ?? '').toLowerCase();
  if (own === 'fr' || own === 'en') return own;
  const accept = String(headers['accept-language'] ?? '');
  for (const part of accept.split(',')) {
    const primary = part.trim().split(/[-_;]/)[0]!.toLowerCase();
    if (primary === 'fr' || primary === 'en') return primary;
  }
  return accept ? 'en' : 'fr';
}

# Plug — serveur

API qui fait tourner le montage de Plug sur **studio-engine** (sous-module `../engine`, dépôt `MarsToMemes/studio-engine`) :

```
script + voix off + médias
  → voix : ElevenLabs (voix IA ou transcription) ou alignement local
  → editor-brain, style Apple (blocs studio calés sur la voix), validé par la bible
  → planche de contrôle (3 images par plan)
  → rendu Remotion par morceaux en cache, mixage, master −14 LUFS, contrôle qualité
```

## Installation

Node ≥ 22.18 (le serveur est en TypeScript exécuté directement par Node), FFmpeg **complet** sur le PATH (la planche de contrôle utilise `drawtext`).

```bash
git submodule update --init          # à la racine du dépôt
cd server
npm install
npm run setup-engine                 # npm ci + build de studio-engine, effets sonores, blocs studio HyperFrames
npm start                            # http://127.0.0.1:8787
```

Puis, dans `../web` : `npm run dev` et ouvrez http://localhost:5173/editeur.

## Variables d'environnement

Sur Mac, elles se mettent dans `server/.env` (modèle : `server/.env.example`, copié par l'installateur), une par ligne : `ANTHROPIC_API_KEY=…`. Ce fichier n'est jamais envoyé sur GitHub.

| Variable | Rôle |
|---|---|
| `ELEVENLABS_API_KEY` | Voix IA générée depuis le script, et transcription mot à mot d'une voix importée. Sans elle : voix importée seulement, alignée localement sur le script (±0,15 s par mot). |
| `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL` | Voix et modèle par défaut (`eleven_multilingual_v2`). |
| `ANTHROPIC_API_KEY` | Claude écrit l'analyse éditoriale (`--llm` d'editor-brain) et décrit chaque visuel importé (description, mots-clés, nature). Sans elle : cerveau heuristique, descriptions à écrire soi-même. |
| `RUNWAYML_API_SECRET` | Runway génère une image ou une vidéo pour une phrase qui n'en a pas, à la demande (bouton dans le panneau de la phrase). Sans elle : pas de génération. |
| `ANTHROPIC_MODEL` | Modèle Claude du cerveau et des descriptions (défaut `claude-sonnet-5-5`). |
| `RENDER_CACHE_GB` | Taille gardée du cache de rendu après chaque rendu, en Go (défaut 10). |
| `PORT`, `HOST` | Écoute (défaut `127.0.0.1:8787`). |
| `MEDIA_BASE_URL` | URL à laquelle le navigateur de rendu joint ce serveur (défaut `http://127.0.0.1:$PORT`). |
| `DATA_DIR` | Projets, médias, plans, rendus (défaut `server/data`). |
| `REMOTION_BROWSER` | Chrome / Chromium pour le rendu et la planche (trouvé seul sur Mac dans /Applications). |
| `FFMPEG`, `FFPROBE` | Chemins de FFmpeg si besoin. |
| `CORS_ORIGINS` | Origines autorisées (défaut : Vite en local). |

## API

| Méthode | Route | |
|---|---|---|
| GET | `/api/health` | clés configurées, moteur construit, blocs studio présents |
| GET / POST | `/api/projects` | liste / création (`title`, `script`, `pacing`, `style` : `apple` ou `default`, `captions`, `llm`, `voice`, `rightsConfirmed`) |
| GET / PATCH / DELETE | `/api/projects/:id` | |
| POST | `/api/projects/:id/media` | multipart : `role` (`visual`, `voice`, `music`), `description`, `nature`, puis `file` |
| POST | `/api/projects/:id/media/:mediaId/describe` | Claude décrit de nouveau le visuel (remplace description et mots-clés ; la nature seulement si vous ne l'avez jamais choisie) |
| POST | `/api/projects/:id/generate` | `{ prompt, kind: video \| image, seconds, line }` : Runway fabrique un visuel ; avec `line`, il devient celui de la phrase. Refusé pour une phrase qui doit montrer du réel (MED-07). |
| PUT | `/api/projects/:id/hints` | `{ line, hints }` : ce que vous fixez sur une phrase du script (`null` efface) |
| PATCH / DELETE | `/api/projects/:id/media/:mediaId` | description, `nature` d'un visuel (`real_video`, `real_photo`, `archive`, `screenshot`, `document`, `generated`), `role` d'un audio (`voice` ⇄ `music`) |
| POST | `/api/projects/:id/direct` | voix → timings → plan style Apple (tâche) |
| POST | `/api/projects/:id/stills` | planche de contrôle (tâche) |
| POST | `/api/projects/:id/render` | `{ "quality": "preview" \| "final" }` : 540p ou 1080p (tâche). Chaque rendu est une version (`renders`, les 4 dernières, avec une vignette). |
| GET | `/api/projects/:id/plan` | le ShotPlan |
| GET | `/api/projects/:id/files/:name` | `voice.wav`, `stills.jpg`, `video-<id>.mp4` et `video-<id>.jpg` (Range) |

Les tâches s'exécutent une par une, dans un thread séparé : le moteur bloque parfois son thread (FFmpeg synchrone), et le rendu lit les médias sur ce même serveur. L'état de la tâche (`job`) est dans le projet ; l'éditeur l'interroge chaque seconde.

## Choix des médias

Le moteur choisit pour chaque phrase le média le plus authentique qui répond à son besoin (bible de studio-engine, §27) : vidéo réelle → photo réelle ou archive → capture d'écran ou document → visualisation de données → visuel généré → motion design. La **nature** de chaque visuel (menu de la médiathèque) compte : un visuel « Généré par IA » n'est jamais utilisé pour présenter une personne réelle, un contexte historique, une plateforme ou un document. Les vidéos réelles sont rendues dans le bloc `studio-video` du style Apple (muettes : la voix off porte le son).

## Indications par phrase

Sur une phrase du script, vous pouvez imposer ce que le moteur devinerait sinon : l'intention (`intent`), le besoin en image (`mediaNeed`), le visuel (`media`) et la seconde où le clip commence (`mediaStart`), un graphique (`chart` : type, libellés, valeurs, unité, titre, source), une part (`share`), une source affichée (`source`), une fiche document (`documentCard`), un mot barré (`strike`). Elles sont rangées par texte de ligne : si vous modifiez la phrase, ses indications disparaissent. Si une ligne contient plusieurs phrases, le moteur les applique à la première.

## Description automatique des visuels

Avec `ANTHROPIC_API_KEY`, chaque visuel importé est regardé par Claude (une image, ou trois images d'une vidéo) : il écrit une description et des mots-clés dans la langue du script, et propose la nature du fichier. Ce que vous avez tapé ou choisi n'est jamais remplacé : une description saisie à l'import reste, une nature choisie reste. Claude ne sait pas toujours reconnaître une image générée par IA : vérifiez la nature des visuels réalistes.

## Visuels générés par Runway

À la demande seulement : chaque génération consomme des crédits Runway. Vidéo : Gen-4.5, 2 à 10 s, 1280×720 (agrandie au rendu 1080p). Image : Gen-4 Image, 1920×1080. Le visuel est rangé dans la médiathèque comme « Généré par IA », avec le modèle et les crédits facturés. Le monteur le place en dernier recours (après vos vraies vidéos, photos, documents et graphiques) et ne l'utilise jamais pour une personne réelle, un fait historique, une plateforme ou un document : Plug refuse d'ailleurs de le générer pour ces phrases. Le contrôle qualité rappelle de signaler sur YouTube un contenu réaliste généré par IA.

## Langue (français / anglais)

Le site s'affiche en français ou en anglais : d'abord le choix du visiteur (bouton FR / EN, mémorisé dans le navigateur), sinon la première langue de son navigateur que Plug parle (`navigator.languages`), sinon l'anglais. Les textes du site sont dans `web/src/i18n/fr.ts` et `en.ts` (mêmes clés, vérifiées à la compilation).

Le serveur répond dans la langue de la requête : `X-Plug-Lang` (envoyé par le site), sinon `Accept-Language`, sinon le français. Ses messages sont dans `src/messages.ts`. Ce qu'il enregistre dans un projet (progression et erreurs des tâches, erreurs de Claude et de Runway) est stocké comme une clé, et ce que le moteur écrit (décisions, contrôles) tel quel, en anglais : tout est écrit dans la langue du lecteur quand le projet est lu (`src/i18n.ts`). En français, les problèmes affichent le texte de la règle de la bible (`src/fr.ts`) ; ce qui n'a pas de traduction va, en anglais, dans le « Journal technique ». `tests/fr.test.ts` fait tourner le moteur sur de nombreux scripts et échoue si un texte n'est pas traduit.

Ce qui reste dans la langue du script, quelle que soit celle du site : la vidéo (cartons de chapitre, titres) et les demandes de médias (« Il manque »).

## Format du script

```
# Titre du chapitre
? Question du chapitre (facultatif)
Une phrase par ligne. Les chiffres en chiffres : « 60 % », pas « soixante pour cent ».
```

## Tests

```bash
npm test          # parseur de script, timings, API (moteur réel, ElevenLabs simulé)
npm run typecheck
```

## Limites connues

- **Pas de comptes ni de paiement** : tout visiteur voit tous les projets. À ne pas exposer sur Internet en l'état.
- **Stockage local** (`DATA_DIR`) et **une machine** : pas encore de stockage objet ni de file de rendus répartie.
- **ElevenLabs** : le format des réponses (voix avec timestamps, transcription Scribe) n'a pas été testé contre le vrai service dans cette version, seulement contre des réponses simulées.
- **Vidéos dans le style Apple** : elles sont décodées par le navigateur du rendu. Sur Mac avec Google Chrome, le MP4 (H.264) passe ; avec un Chromium sans codecs propriétaires (serveur Linux), seules les vidéos WebM (VP9) s'affichent.
- **Runway** n'a pas été testé contre le vrai service dans cette version (clé absente) : le SDK officiel est testé contre un faux serveur Runway local.

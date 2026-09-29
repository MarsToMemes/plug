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

| Variable | Rôle |
|---|---|
| `ELEVENLABS_API_KEY` | Voix IA générée depuis le script, et transcription mot à mot d'une voix importée. Sans elle : voix importée seulement, alignée localement sur le script (±0,15 s par mot). |
| `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL` | Voix et modèle par défaut (`eleven_multilingual_v2`). |
| `ANTHROPIC_API_KEY` | Claude écrit l'analyse éditoriale (`--llm` d'editor-brain). Sans elle : cerveau heuristique. |
| `ANTHROPIC_MODEL` | Modèle Claude du cerveau (défaut `claude-sonnet-5-5`). |
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
| PATCH / DELETE | `/api/projects/:id/media/:mediaId` | description, `nature` d'un visuel (`real_video`, `real_photo`, `archive`, `screenshot`, `document`, `generated`), `role` d'un audio (`voice` ⇄ `music`) |
| POST | `/api/projects/:id/direct` | voix → timings → plan style Apple (tâche) |
| POST | `/api/projects/:id/stills` | planche de contrôle (tâche) |
| POST | `/api/projects/:id/render` | `{ "quality": "preview" \| "final" }` : 540p ou 1080p (tâche). Chaque rendu est une version (`renders`, les 4 dernières, avec une vignette). |
| GET | `/api/projects/:id/plan` | le ShotPlan |
| GET | `/api/projects/:id/files/:name` | `voice.wav`, `stills.jpg`, `video-<id>.mp4` et `video-<id>.jpg` (Range) |

Les tâches s'exécutent une par une, dans un thread séparé : le moteur bloque parfois son thread (FFmpeg synchrone), et le rendu lit les médias sur ce même serveur. L'état de la tâche (`job`) est dans le projet ; l'éditeur l'interroge chaque seconde.

## Choix des médias

Le moteur choisit pour chaque phrase le média le plus authentique qui répond à son besoin (bible de studio-engine, §27) : vidéo réelle → photo réelle ou archive → capture d'écran ou document → visualisation de données → visuel généré → motion design. La **nature** de chaque visuel (menu de la médiathèque) compte : un visuel « Généré par IA » n'est jamais utilisé pour présenter une personne réelle, un contexte historique, une plateforme ou un document. Les vidéos réelles sont rendues dans le bloc `studio-video` du style Apple (muettes : la voix off porte le son).

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
- Les textes produits par studio-engine (demandes d'assets, décisions, contrôle qualité, « Chapter 2 » sur les cartons) sont **en anglais** : c'est le moteur qui les écrit.

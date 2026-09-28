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
| `REMOTION_BROWSER` | Chrome / Chromium Headless Shell pour le rendu et la planche. |
| `FFMPEG`, `FFPROBE` | Chemins de FFmpeg si besoin. |
| `CORS_ORIGINS` | Origines autorisées (défaut : Vite en local). |

## API

| Méthode | Route | |
|---|---|---|
| GET | `/api/health` | clés configurées, moteur construit, blocs studio présents |
| GET / POST | `/api/projects` | liste / création (`title`, `script`, `pacing`, `captions`, `llm`, `voice`, `rightsConfirmed`) |
| GET / PATCH / DELETE | `/api/projects/:id` | |
| POST | `/api/projects/:id/media` | multipart : `role` (`visual`, `voice`, `music`), `description`, `synthetic`, puis `file` |
| PATCH / DELETE | `/api/projects/:id/media/:mediaId` | description, « généré par IA » |
| POST | `/api/projects/:id/direct` | voix → timings → plan style Apple (tâche) |
| POST | `/api/projects/:id/stills` | planche de contrôle (tâche) |
| POST | `/api/projects/:id/render` | `{ "quality": "preview" \| "final" }` : 540p ou 1080p (tâche) |
| GET | `/api/projects/:id/plan` | le ShotPlan |
| GET | `/api/projects/:id/files/:name` | `voice.wav`, `stills.jpg`, `video.mp4` (Range) |

Les tâches s'exécutent une par une, dans un thread séparé : le moteur bloque parfois son thread (FFmpeg synchrone), et le rendu lit les médias sur ce même serveur. L'état de la tâche (`job`) est dans le projet ; l'éditeur l'interroge chaque seconde.

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
- Les textes produits par studio-engine (demandes d'assets, décisions, contrôle qualité, « Chapter 2 » sur les cartons) sont **en anglais** : c'est le moteur qui les écrit.

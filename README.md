# Plug

Plug monte des vidéos documentaires à partir d'un **script** et d'une **voix off** : le moteur `studio-engine` découpe le récit en plans, les cale sur la voix au mot près et les rend en style Apple (typographie, chiffres, images, musique qui respire autour de la voix).

```
web/      site et éditeur (Vite + React), voir web/README.md
server/   API : voix, plan de montage, planche de contrôle, rendu MP4, voir server/README.md
engine/   studio-engine (sous-module git, MarsToMemes/studio-engine)
project/  maquettes Claude Design d'origine (HTML), chats/ : leurs échanges
```

## Installer sur Mac

Intel ou Apple Silicon, macOS 12 ou plus récent, Google Chrome installé. Le dépôt est privé :

1. Sur GitHub, connecté à votre compte, ouvrez `scripts/install-mac.sh` et cliquez sur **Download raw file**.
2. Dans le Terminal :

```bash
bash ~/Downloads/install-mac.sh
```

Le script installe ce qui manque (Git, Node.js 22, FFmpeg, GitHub CLI), vous connecte à GitHub dans le navigateur, prépare Plug dans `~/plug` et met un lanceur **Plug** sur le Bureau : un double-clic démarre le serveur et le site, et ouvre l'éditeur. Clés facultatives dans `~/plug/server/.env` (`ELEVENLABS_API_KEY=…`, `ANTHROPIC_API_KEY=…`).

## Démarrer à la main

```bash
git submodule update --init
cd server && npm install && npm run setup-engine && npm start     # API sur :8787
cd web && npm install && npm run dev                               # http://localhost:5173/editeur
```

Clés facultatives côté serveur : `ELEVENLABS_API_KEY` (voix IA, transcription) et `ANTHROPIC_API_KEY` (réalisation par Claude).

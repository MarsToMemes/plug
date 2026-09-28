# Plug

Plug monte des vidéos documentaires à partir d'un **script** et d'une **voix off** : le moteur `studio-engine` découpe le récit en plans, les cale sur la voix au mot près et les rend en style Apple (typographie, chiffres, images, musique qui respire autour de la voix).

```
web/      site et éditeur (Vite + React), voir web/README.md
server/   API : voix, plan de montage, planche de contrôle, rendu MP4, voir server/README.md
engine/   studio-engine (sous-module git, MarsToMemes/studio-engine)
project/  maquettes Claude Design d'origine (HTML), chats/ : leurs échanges
```

## Démarrer

```bash
git submodule update --init
cd server && npm install && npm run setup-engine && npm start     # API sur :8787
cd web && npm install && npm run dev                               # http://localhost:5173/editeur
```

Clés facultatives côté serveur : `ELEVENLABS_API_KEY` (voix IA, transcription) et `ANTHROPIC_API_KEY` (réalisation par Claude).

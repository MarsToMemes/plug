# Plug — web

Implémentation des maquettes Claude Design (`../project/*.dc.html`) en **Vite + React 19 + TypeScript**.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + build de production dans dist/
npm test             # tests unitaires (détection de type des médias)
npm run fetch-media  # télécharge les photos/vidéos d'exemple dans public/media
```

## Routes

| Route | Maquette |
|---|---|
| `/` | `Plug Accueil.dc.html` (hero animé, dépôt de fichiers, démo éditeur, tarifs) |
| `/editeur` | Studio réel, branché sur l'API (`../server`) : script, voix off, médias, plan style Apple, planche de contrôle, rendu MP4 |
| `/tarifs` (`#packs`) | `Plug Tarifs.dc.html` |
| `/inscription` (`?plan=creator`, `?mode=login`) | `Plug Inscription.dc.html` |

`Plug Editeur v1 (timeline).dc.html` n'est pas implémenté (version remplacée, gardée comme archive).

## Où modifier quoi

- **Médias d'exemple** : `src/media/catalog.ts` (un seul endroit). Les rushes du hero : `src/components/home/demoClips.ts`.
- **Animations** : `heroAnimation.ts` (hero, boucle 12,8 s) et `editorDemo.ts` (section éditeur, 13,6 s). Ce sont des moteurs rAF qui n'écrivent que `transform`/`opacity`/`clip-path`, se mettent en pause hors écran et respectent `prefers-reduced-motion`.
- **Éditeur** : `src/pages/Editeur.tsx`, client de l'API dans `src/lib/api.ts`. En développement, Vite relaie `/api` vers `http://127.0.0.1:8787` (`PLUG_API` pour changer) ; en production, `VITE_API_URL` au build si l'API est sur un autre domaine.
- **Polices** : auto-hébergées via `@fontsource` (aucun appel à Google Fonts).

## Ce qui est réel, ce qui est simulé

- **Réel** : l'éditeur (`/editeur`) monte de vraies vidéos via le serveur `../server` et studio-engine. Voir `../server/README.md`.
- **Simulé** : le dépôt de fichiers de l'accueil (progression minutée, les fichiers ne sont pas envoyés à l'éditeur), les démos animées de l'accueil.
- Connexion Google (sélecteur de comptes fictif) et création de compte.
- Les métadonnées de fichiers sont réelles : vignettes vidéo, dimensions, durées, waveforms, nombre de répliques.

## Médias

Tant que `npm run fetch-media` n'a pas été lancé (il écrit `public/media/manifest.json`), le site charge les fichiers depuis Unsplash / Mixkit (licences libres, usage commercial autorisé).

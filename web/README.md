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
| `/editeur` | `Plug Editeur.dc.html` + `Mediatheque.dc.html` (icône Médias) |
| `/tarifs` (`#packs`) | `Plug Tarifs.dc.html` |
| `/inscription` (`?plan=creator`, `?mode=login`) | `Plug Inscription.dc.html` |

`Plug Editeur v1 (timeline).dc.html` n'est pas implémenté (version remplacée, gardée comme archive).

## Où modifier quoi

- **Médias d'exemple** : `src/media/catalog.ts` (un seul endroit). Les rushes du hero : `src/components/home/demoClips.ts`.
- **Animations** : `heroDemo.ts` (hero, boucle 12,8 s) et `editorDemo.ts` (section éditeur, 13,6 s). Ce sont des moteurs rAF qui n'écrivent que `transform`/`opacity`/`clip-path`, se mettent en pause hors écran et respectent `prefers-reduced-motion`.
- **Médiathèque** : `src/components/editor/Mediatheque.tsx`, logique fichiers dans `src/lib/plugMedia.ts`.
- **Polices** : auto-hébergées via `@fontsource` (aucun appel à Google Fonts).

## Ce qui est simulé (pas de backend)

- Upload (progression minutée), montage IA, export, Shorts, outils IA, packs → toasts de confirmation.
- Connexion Google (sélecteur de comptes fictif) et création de compte.
- Les métadonnées de fichiers sont réelles : vignettes vidéo, dimensions, durées, waveforms, nombre de répliques.
- Transfert accueil → éditeur : les fichiers déposés passent par IndexedDB ; « Ajouter au montage » enregistre la sélection dans `localStorage` (`plug_timeline_media`), aucune timeline ne les affiche encore.

## Médias

Tant que `npm run fetch-media` n'a pas été lancé (il écrit `public/media/manifest.json`), le site charge les fichiers depuis Unsplash / Mixkit (licences libres, usage commercial autorisé).

# Planches fusain — documentaire « Votre sosie existe-t-il ? »

Code Remotion et scripts de préparation des planches en style fusain. Les vidéos rendues ne sont pas versionnées (trop lourdes) : on les régénère.

## Compositions (`remotion/src/Root.tsx`)

| Id | Fichier | Contenu |
|---|---|---|
| `Plate01`, `Charcoal01` | `Plate.tsx`, `CharcoalPlate.tsx` | 01 — Le visage comme combinaison de facteurs |
| `Charcoal02` | `P2.tsx` | 02 — Variation génétique → développement → structure → apparence |
| `Charcoal03` | `P3.tsx` | 03 — Combinatoire des traits (sans chiffre) |
| `Charcoal04` | `P4.tsx` | 04 — Étude 2022 : sosies sans lien de parenté |
| `Charcoal05`, `Charcoal0504` | `P5.tsx` | 05 — Gène → trait naïf, puis réseau |
| `Charcoal06`, `Charcoal060504` | `P6.tsx` | 06 — Zoom vers le génome, trait complexe |
| `Cut060504` | `Cut.tsx` | 06 → 05 → 04 avec zooms et sous-titres |
| `Opening07` | `P7.tsx` | Ouverture « Votre sosie existe-t-il ? » |
| `Charcoal08` | `P8.tsx` | 08 — Comparaison des zones, « FORTE RESSEMBLANCE » |

## Rendu

```bash
cd motion/planches/remotion
ln -s ../../../engine/node_modules node_modules   # ou : npm install
COMP=Charcoal08 node render.mjs out/planche-08.mp4
COMP=Charcoal08 node render.mjs out stills 120,300   # images fixes
```

`render.mjs` pointe vers le Chromium de l'environnement cloud (`/opt/pw-browsers/...`) : à adapter sur une autre machine.

## Préparation des images (`pipeline/`)

Scripts Python (OpenCV, numpy). Ils utilisent encore les chemins absolus de la session où ils ont été écrits (`/home/user/facefx`, `/home/user/brainfx`) : à adapter avant de les relancer.

- `p2/portrait.py` : portrait fusain de la planche 02 à partir de `crop.png` + `mask.png`.
- `p4/make.py` : les deux portraits « sosies » A et B (B = A en miroir, déformé) et leurs repères → `remotion/public/p4`, `remotion/src/p4data.json`.
- `p7/faces.py`, `p7/cards.py` : détection des visages dans les vidéos Pexels et cartes fusain de l'ouverture → `remotion/public/p7` (OpenCV 4, pour CascadeClassifier).
- `cerveau/` : vidéo cerveau/visage (Blender `brain.py`, assemblage `compose.py`), crédits dans `cerveau/CREDITS.md`.

## Sources et licences

- Portrait des planches 02, 04, 05, 06, 08 et des sosies de l'ouverture : vidéo Pexels 4588232, Ketut Subiyanto (licence Pexels).
- Visages de l'ouverture (planche 07) : vidéos Pexels 10224139, 5125842, 6274541, 6277890, 6371970, 6665217, 7534371, 8496459, 8724220, 8724312, 8724313, 8724362 (licence Pexels).
- Polices : Caveat, Caveat Brush, Newsreader, Inter (SIL Open Font License).
- Les « sosies » sont une seule personne dessinée deux fois (miroir + déformation), pas deux vraies personnes.

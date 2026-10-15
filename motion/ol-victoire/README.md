# OL — annonce de victoire « chrome et carbone »

Style `motion-victoire-chrome` (référence : annonce de victoire des Hurricanes). Composition `VictoireChrome`,
1080×1080, 30 i/s, 360 images (12 s), **boucle** (f359 enchaîne sur f0). Pas encore de musique.

- Studio : `npm run studio` · rendu : `npm run render` (ajouter `--browser-executable=...` dans le conteneur).
- Textes (props zod, `src/props.ts`) : LYON (chrome), VICTOIRE, LYONNAIS (lettres géantes), OLYMPIQUE LYONNAIS,
  signature « VICTOIRE DE L'OL ».
- Couleurs relevées sur le logo fourni : rouge `#E5202E`, bleu `#0F23AA`, or `#C88C28` ; carbone teinté bleu nuit.
- Logo en relief : `tools/prepare.py` vectorise le logo par couleur (OpenCV) en couches extrudées
  (`public/club/logo-3d.json`) rendues avec `@remotion/three` (socle doré, face blanche, panneaux rouge/bleu, lettres
  et L en relief, lion doré au-dessus) ; éclairage procédural `RoomEnvironment` (aucun téléchargement).
- Petits logos dessinés (`Icons` dans `src/fx.tsx`) : lion du blason, médaillon « Olympique lyonnais · 1950 »,
  badge « 6★9 » (Rhône).
- Polices : Archivo (OFL) instanciée en Expanded Black / Bold / Medium et Black normal.
- Chaque scène est une fonction pure de l'image absolue `f`, ce qui permet de l'afficher dans les transitions en blocs.

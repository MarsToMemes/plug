# Plug — consignes pour Claude

## Motion design et vidéo

À chaque travail de motion (création, modification ou rendu d'une vidéo) :

1. Charger d'abord le skill `remotion-best-practices` (dans `.claude/skills/`), puis les skills spécialisés qu'il indique (`remotion-markup`, `remotion-captions`, `remotion-render`, etc.).
2. Pour une annonce de but ou de joueur d'un club, charger aussi le skill du style voulu : `motion-goal-card` (carte néon, mot du club, zoom traversant), `motion-retro-print` (affiche sérigraphiée rétro, 3 couleurs, flashs de palette), `motion-glitch-grid` (glitch numérique : mosaïque de blocs, compteur à rouleaux, nom qui se décode, boucle) ou `motion-cinema-brush` (16:9 cinématique sur rushes vidéo : bandes de pinceau, numéro qui irradie, traînée stroboscopique). Pour une annonce de victoire : `motion-victoire-chrome` (carbone et chrome, logo en relief 3D, carte blanche éditoriale, boucle) ou `motion-grunge-pochoir` (portrait 4:5 à 60 i/s, logo et lettres imprimés au pochoir, mot qui se construit en ondulant, slogan en lamelles, plongée finale, boucle). Pour une annonce de jour de match : `motion-jour-de-match` (story 9:16 à 24 i/s, mot répété en rangées, emblème qui se dessine, affiche club vs adversaire, carte d'infos avec photo et texte tapé).
3. HyperFrames est aussi disponible : le catalogue est dans `engine/motion-library/` (`README.md`, `hyperframes/`, `catalog.json`) et les blocs dans `engine/packages/remotion/hyperframes-studio/`. S'en servir quand un élément du catalogue convient mieux qu'un développement sur mesure.

Les skills Remotion viennent de https://github.com/remotion-dev/skills (version 4.0.534). Pour les mettre à jour, recopier le dossier `skills/` de ce dépôt dans `.claude/skills/`.

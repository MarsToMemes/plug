# Plug — consignes pour Claude

## Motion design et vidéo

À chaque travail de motion (création, modification ou rendu d'une vidéo) :

1. Charger d'abord le skill `remotion-best-practices` (dans `.claude/skills/`), puis les skills spécialisés qu'il indique (`remotion-markup`, `remotion-captions`, `remotion-render`, etc.).
2. Pour une annonce de but ou de joueur d'un club, charger aussi le skill du style voulu : `motion-goal-card` (carte néon, mot du club, zoom traversant) `motion-retro-print` (affiche sérigraphiée rétro, 3 couleurs, flashs de palette) ou `motion-glitch-grid` (glitch numérique : mosaïque de blocs, compteur à rouleaux, nom qui se décode, boucle).
3. HyperFrames est aussi disponible : le catalogue est dans `engine/motion-library/` (`README.md`, `hyperframes/`, `catalog.json`) et les blocs dans `engine/packages/remotion/hyperframes-studio/`. S'en servir quand un élément du catalogue convient mieux qu'un développement sur mesure.

Les skills Remotion viennent de https://github.com/remotion-dev/skills (version 4.0.534). Pour les mettre à jour, recopier le dossier `skills/` de ce dépôt dans `.claude/skills/`.

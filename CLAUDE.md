# Plug — consignes pour Claude

## Motion design et vidéo

À chaque travail de motion (création, modification ou rendu d'une vidéo) :

1. Charger d'abord le skill `remotion-best-practices` (dans `.claude/skills/`), puis les skills spécialisés qu'il indique (`remotion-markup`, `remotion-captions`, `remotion-render`, etc.).
2. HyperFrames est aussi disponible : le catalogue est dans `engine/motion-library/` (`README.md`, `hyperframes/`, `catalog.json`) et les blocs dans `engine/packages/remotion/hyperframes-studio/`. S'en servir quand un élément du catalogue convient mieux qu'un développement sur mesure.

Les skills Remotion viennent de https://github.com/remotion-dev/skills (version 4.0.534). Pour les mettre à jour, recopier le dossier `skills/` de ce dépôt dans `.claude/skills/`.

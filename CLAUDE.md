# Plug — consignes pour Claude

## Motion design et vidéo

À chaque travail de motion (création, modification ou rendu d'une vidéo) :

1. Charger d'abord le skill `remotion-best-practices` (dans `.claude/skills/`), puis les skills spécialisés qu'il indique (`remotion-markup`, `remotion-captions`, `remotion-render`, etc.).
2. HyperFrames est aussi disponible : le catalogue est dans `engine/motion-library/` (`README.md`, `hyperframes/`, `catalog.json`) et les blocs dans `engine/packages/remotion/hyperframes-studio/`. S'en servir quand un élément du catalogue convient mieux qu'un développement sur mesure.

3. Le skill `animate` (`.claude/skills/animate`, https://github.com/cth9191/animate, MIT) fait des animations procédurales sur `<canvas>`, rendues en MP4, avec des styles (isométrique, math, riso, croquis, encre hachurée, papier découpé, pixel) et une musique synthétisée. C'est un moteur à part, pas du Remotion : l'utiliser quand un de ses styles convient mieux, ou quand l'utilisateur le demande. Ses outils ont besoin de Playwright installé globalement, à la version du moteur : `npm i -g playwright@1.56.1` (le Chromium est déjà dans `/opt/pw-browsers`, ne pas lancer `playwright install`).

4. anime.js (https://github.com/juliangarnier/anime, MIT, v4.5.0) est installé pour `motion/pricing`. Dans Remotion, ne jamais le laisser tourner sur sa propre horloge : passer par `useAnime()` (`motion/pricing/src/motion/anime.ts`), qui crée la timeline en pause et la positionne sur l'image courante (rendu reproductible). Ses easings et `utils` peuvent aussi servir comme fonctions pures. Le `node_modules` du projet est un lien vers `engine/node_modules` : ne pas y lancer `npm install` (risque de supprimer des paquets du moteur) ; pour réinstaller : `npm pack animejs@4.5.0` puis extraire le paquet dans `engine/node_modules/animejs`.

Les skills Remotion viennent de https://github.com/remotion-dev/skills (version 4.0.534). Pour les mettre à jour, recopier le dossier `skills/` de ce dépôt dans `.claude/skills/`.

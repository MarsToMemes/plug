# Carte « BUUUT » FC Metz

Annonce de but animée, 1080×1080, 30 i/s, 10 s. Construite avec le skill `motion-goal-card`
(`.claude/skills/motion-goal-card/`), qui décrit le découpage scène par scène.

```bash
npm install
npm run studio            # aperçu interactif
node render-all.mjs       # un MP4 par joueur de players.json, dans out/
node render-all.mjs exemple  # un seul joueur (par son id)
```

## Ajouter un joueur

1. Mettre sa photo dans `public/joueurs/` (carrée, 2160 px minimum, joueur de face, buste, détouré sur un décor du club).
2. Ajouter une entrée dans `players.json` : `id`, `firstName`, `lastName`, `number`,
   `playerPhoto` (ex. `"joueurs/nom.jpg"`) et `crestPoint` = position de l'écusson du maillot sur la photo,
   en proportion (0–1) de la largeur et de la hauteur. Les deux zooms visent ce point.

## Encore provisoire

- Photo joueur : silhouette de remplacement tant que `playerPhoto` vaut `null`.
- Emblème final : bouclier neutre (`PLACEHOLDER_MARK` dans `src/scenes/Outro.tsx`), à remplacer par la forme tirée de l'écusson SVG officiel.
- Police : Michroma (licence OFL, `public/fonts/OFL.txt`), à remplacer par la police du club si elle est fournie.
- Palette : palette de travail de `src/theme.ts`, pas la charte certifiée.

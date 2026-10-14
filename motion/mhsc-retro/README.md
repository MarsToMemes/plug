# Annonce de but MHSC — style « sérigraphie rétro »

1200×1200, 30 i/s, 271 images (9 s). Construite avec le skill `motion-retro-print`.

```bash
npm install
npm run studio     # aperçu interactif
npm run render     # out/retro-goal.mp4
```

- Joueur, numéro, textes et palette : props de `RetroGoal` (`src/RetroGoal.tsx`).
- Palette : orange et bleu relevés sur l'écusson (#F06600, #00377B), vieillis en #E2621F / #102B5E + crème #EFE5CF.
  À remplacer par les codes de la charte officielle s'ils sont fournis.
- Polices libres (OFL) dans `public/fonts/` : Bungee, Big Shoulders Display Black, Barlow Condensed, Kaushan Script.
- Le MHSC n'a pas de logo-script : la scène 3 écrit « Paillade » dans une police manuscrite libre.
- Son : effets synthétisés (repris de `motion/metz-but/tools/sfx.py`), pas encore de musique.

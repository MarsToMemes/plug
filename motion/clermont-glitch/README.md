# Annonce de but Clermont Foot 63 — style « glitch numérique »

1080×1080, **24 i/s**, 187 images (7,8 s), en boucle. Construite avec le skill `motion-glitch-grid`.

```bash
npm install
npm run studio     # aperçu interactif
npm run render     # out/glitch-goal.mp4
```

- Joueur, numéro, textes : props de `GlitchGoal` (`src/GlitchGoal.tsx`).
- Palette (`src/theme.ts`) : rouge `#C4053F` et bleu `#0C2C65` relevés sur l'écusson (proches des valeurs publiées
  par les sites de couleurs d'équipes ; pas de charte officielle trouvée). Le bleu remplace le noir du style.
- Trois photos : portrait serré (photo devant la fresque), action en match passée en noir et blanc (trait de pinceau
  et logo incrustés effacés), buste studio détouré pour la carte.
- Motif du club : le cavalier de l'écusson (carte logotype) et les bandes rouge/bleu du maillot (carte joueur) ;
  la chaîne des Puys est dessinée par le code.
- Polices libres (OFL) : Chakra Petch Bold, Saira Semi Condensed.
- Son : « Jackhammer » (Epidemic Sound, fourni), le coup qui suit la montée du morceau tombe sur la première lettre qui claque (f17) ; effets synthétisés en appoint, ≈ −14 LUFS.

# OM — annonce de victoire « grunge pochoir » (DROIT AU BUT)

Style `motion-grunge-pochoir` (référence : annonce de victoire des Brewers). Composition `GrungePochoir`,
1080×1350, **60 i/s**, une boucle de 380 images (6,3 s) jouée deux fois = 760 images (12,7 s). Pas encore de musique.

- Studio : `npm run studio` · rendu : `npm run render` (ajouter `--browser-executable=...` dans le conteneur).
- Textes (props zod, `src/props.ts`) : MARSEILLE / VICTOIRE, slogan « DROIT / AU / BUT » (devise du club).
- Couleurs : encre bleu ciel `#3AA8F0` (rôle du jaune de la référence, plus lumineux que le Bleu Marseille du logo pour
  ressortir sur le gris), blanc ; logo OM fourni (Bleu Marseille `#0E68AC`).
- Textures générées par `tools/textures.py` (béton, toile, ciels d'orage gris et brun, grain de bombe,
  surpulvérisation, carte de coulure) ; bruit fractal isotrope (flou gaussien multi-échelle).
- Pochoir (`Pochoir` dans `src/fx.tsx`) : bords rugueux (turbulence + déplacement), masque de grain qui change toutes
  les 4 images, surpulvérisation (copie floue masquée par des points).
- Polices : Anton (OFL) et Archivo Expanded Black (OFL).
- Chaque temps est une fonction pure de l'image `f` de la boucle ; `<Loop times={2}>` dans `GrungePochoir.tsx`.

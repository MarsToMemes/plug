# Le Braqueur — promo 15 s

Vidéo 1920×1080, 30 i/s, 450 images, dans le style « motion SaaS » (typo cinétique, cartes en 3D, caméra fluide).
Textes, couleurs et police (Outfit) repris de lebraqueur.fr. Le cœur de la vidéo est la fiche joueur du site
(`public/fiche-celebrini.webp`, image de la vitrine) : la caméra s'y déplace et isole chaque mesure (`CAM`, `SPOTS`, `CAPS` dans `src/Promo.tsx`).

```bash
npm run render   # → out/lebraqueur-promo.mp4
```

- Couleurs : `src/theme.ts`. Plans : `src/Promo.tsx`.
- Musique : `public/musique-zoo-extrait.mp3` (Kaaris, « Zoo », extrait fourni par l'utilisateur ; droits à vérifier avant publication). Réglages : `MUSIC_TRIM`, `DROP`, `musicVolume`.

# OM — annonce de but « cinématique coups de pinceau » (Keyliane Abdallah, n° 48)

Style `motion-cinema-brush` (référence : annonce de but des Flyers). Composition `CinemaGoal`, 1920×1080, 30 i/s,
283 images (9,4 s). **Version photos** : pas de rushes vidéo, chaque plan vidéo est remplacé par une parallaxe 2,5D
(joueur détouré + fond rebouché poussés à des vitesses différentes).

- Studio : `npm run studio` · rendu : `npm run render` (ajouter `--browser-executable=...` dans le conteneur).
- Props (zod, modifiables dans le Studio) : `src/props.ts`.
- Assets : `tools/prepare.py` génère le logo en masques, les fonds rebouchés et les textures à partir des détourages
  rembg (`u2net_human_seg`) des 3 photos fournies.
- Couleurs : bleu `#0E68AC` relevé sur le logo fourni (« Bleu Marseille », identité d'avril 2026), or `#D8B73B` relevé
  sur le col du maillot (accents).
- Slogan : « Droit au but », devise historique du club.
- Ville : silhouette de Marseille dessinée en SVG (`Skyline` dans `src/fx.tsx`) faute de photo de la ville.
- Musique : « Stadium Rocker » (Taelimb, Epidemic Sound, fournie). Le coup qui suit le blanc de 97,7–98,25 s tombe
  sur la coupe du slogan (f15) : `trimBefore` 2936 ; le logo s'assemble dans le blanc, sous une aspiration (SFX).
  Volume 0,41.
- Bruitages (seulement ceux qui s'entendent) : whoosh Epidemic sur les volets f40, les entailles f128 et le nom f168 ;
  flash photo Epidemic sur les flashs f112 et f193 ; aspiration (blanc de la musique) et impacts BUT / plan final
  synthétisés. Mixage : −14,0 LUFS, crête −2,0 dBTP. Bruitages Epidemic réutilisables : `motion/bruitages-epidemic/`.
- Slogan en trois lignes de la même police : DROIT / AU / BUT (AU plus petit, aligné à gauche, entre les deux).

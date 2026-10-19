# OL — jour de match

Story 1080×1920, 24 i/s, 233 images (9,7 s), style `motion-jour-de-match` : OL – OGC Nice, dimanche 18 octobre 2026,
20 h 45, Groupama Stadium, Ligue 1 7e journée.

```bash
npm run render   # → out/ol-jourdematch.mp4
```

- Textes et infos : `src/props.ts` (modifiables dans le Studio).
- Image de la carte : `public/images/carte-logo-relief.png` (logo 3D, faute de photo de joueur).
- Emblème vectorisé : `python -I tools/emblem.py` → `src/emblem.json`.
- Pas de musique pour l'instant.

# Adapter la vidéo à un club

## Ce qu'il faut — le point critique : des rushes vidéo

Ce style est construit sur **trois séquences vidéo du joueur**. C'est la différence majeure avec les trois autres
templates (photos). À demander :

| Rush | Durée utile | Contenu idéal |
|------|-------------|---------------|
| 1 | 1 s | Le joueur qui avance vers la caméra (couloir, tunnel, entrée sur la pelouse), fond sombre, ralenti possible. |
| 2 | 1,5 s | Gros plan du visage, regard caméra, légère respiration ; idéalement un changement de lumière. |
| 3 | 3 s | Action : frappe, course ou célébration, **caméra fixe et fond sombre** (pour la traînée stroboscopique). |
| (4) | 1 s | Célébration ou autre plan pour « BUT » (sinon réutiliser le rush 1). |

Formats acceptés : MP4/MOV 1080p minimum, 25–60 i/s (à convertir en 30 i/s, ralentis en 50/60 i/s idéalement).

**Repli si seulement des photos** (à dire clairement à l'utilisateur, le rendu perd beaucoup) :
- rushes 1 et 2 → photos avec lente poussée + flou de profondeur animé (effet « Ken Burns ») ;
- rush 3 → la traînée stroboscopique est impossible avec une photo fixe : remplacer par une photo d'action détourée
  avec 4 copies décalées en x (opacité décroissante) — c'est une imitation, pas le même effet.

## Autres assets

- Logo / écusson en SVG (contour blanc pour le temps 1 ; emblème géant pour le temps 8).
- **Slogan** de la saison ou devise du club (2–3 mots). Sans slogan officiel : demander lequel utiliser, ne pas
  en inventer un qui parlerait au nom du club.
- Photos de la ville / du stade (skyline, pont, monument) pour les duotones.
- Couleurs de la charte, poste du joueur, numéro, musique (la référence a sa propre bande-son, ne pas la réutiliser).

## Props de la composition `CinemaGoal`

`goalWord`, `firstName`, `lastName`, `number`, `position`, `city`, `clubLetters` (nom espacé), `slogan`
(`{top, link, bottom}`), `rush1/2/3` (`{src, trimBefore, playbackRate}`), `cityPhotos`, `palette`.

## Polices (libres)

- Slogan : `Anton` ou `Bebas Neue` en faux italique (`skew -12°`), ou `Barlow Condensed` Black Italic.
- BUT, numéro, nom : `Barlow Condensed` Black / `Big Shoulders Display` Black.
- Petites capitales espacées : `Barlow` SemiBold.

## Formats

La référence est en 16:9 (YouTube, site, écran du stade). Pour les réseaux, produire aussi 1080×1080 et 1080×1920 :
même timing, chaque scène recadrée autour de son centre d'intérêt (visage, numéro, mot).

## Pièges

- Rushes mal étalonnés ou au fond clair : tout le style tombe. Vérifier les rushes avant de commencer.
- `OffthreadVideo` multiples (traînée stroboscopique) : rendu lent ; préparer le rush 3 en 1080p court.
- Les flashs surexposés et la lumière qui brûle doivent rester courts (≤ 5 images) : risque photosensible.
- Ne reprendre ni le logo, ni le slogan, ni les rushes, ni la musique de la référence.

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
- Principe : **parallaxe 2,5D** plutôt qu'un simple zoom. Détourer le joueur (`u2net_human_seg`), reboucher le fond
  derrière lui (remplissage flou normalisé, cf. `motion-glitch-grid`), puis animer deux calques : fond qui pousse
  lentement (×1,00 → ×1,06) et joueur qui pousse plus vite (×1,00 → ×1,12) avec un léger décalage. Ça donne une
  impression de mouvement de caméra ; un zoom à plat sur la photo entière fait diaporama.
- rush 1 → parallaxe + flou de profondeur animé sur le fond seul (14 → 6 px), joueur légèrement flou puis net ;
- rush 2 (visage) → poussée très lente + **balayage de lumière** (dégradé crème en `screen` qui traverse le visage,
  puis le gel orange en diagonale prévu f163–166) : c'est ce qui remplace le changement de lumière du rush ;
- rush 3 → la traînée stroboscopique est impossible avec une photo fixe : photo d'action détourée qui glisse de
  gauche à droite (≈ 120 px sur 3 s) avec 4–5 copies décalées en x, opacité décroissante, teintées orange — c'est une
  imitation, pas le même effet (le corps ne change pas de posture entre les copies) ;
- photos à demander : portrait / visage de face (HD), action **sur fond sombre ou uni** (sinon le détourage et le
  fond rebouché se voient), buste ou entrée sur la pelouse pour le rush 1, et une photo de célébration pour « BUT ».
- Ne pas générer de fausse vidéo du joueur par IA (image → vidéo) sans l'accord explicite du club : c'est l'image
  d'une personne réelle, et les déformations du visage se voient.

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

## Fiche Olympique de Marseille (premier projet : `motion/om-cinema/`, version photos)

- Joueur : Keyliane Abdallah, n° 48, attaquant. Trois photos : séance studio (célébration « dodo », fond orange
  remplacé), célébration en match, action en match (fond rouge sombre flou).
- Répartition : action → rush 1 (haut du corps) et plan final (corps entier, copies fantômes) ; célébration → BUT ;
  studio → gros plan visage. Détourage `u2net_human_seg` propre d'emblée sur les trois (isnet rend le maillot blanc
  transparent sur fond orange : à éviter).
- Palette : bleu du logo fourni `#0E68AC` (« Bleu Marseille ») à la place de l'orange, bleu clair `#2B8FD8` pour la
  bande claire, or `#D8B73B` seulement pour les points. Numéro qui irradie : cœur blanc glacé `#EAF6FF`, halo bleu.
  Les tribunes rouges des photos passent au bleu par un calque `color` sur le fond seul.
- Slogan : « DROIT / AU / BUT » (devise du club) — la ligne 2 « BUT » répond au mot du temps 4.
- Ville : pas de photo accessible (Wikimedia limité) → silhouette SVG (Fort Saint-Jean, Mucem, la Major, mâts,
  Notre-Dame-de-la-Garde, tour CMA CGM). À remplacer par de vraies photos si le club en fournit.
- Musique : le compte Epidemic connecté n'autorise pas le téléchargement ; morceau déjà fourni par l'utilisateur.

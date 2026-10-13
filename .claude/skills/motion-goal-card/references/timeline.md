# Découpage au frame près

Mesuré sur la référence : 1080×1080, 30 i/s, 300 frames (10,0 s), pas de piste audio.
Positions en pixels sur 1080 (diviser par 1080 pour la proportion). Couleurs relevées dans
la référence : elles servent à **calibrer la luminosité et le contraste** ; les teintes, elles,
viennent de la palette du club (`adaptation-club.md`).
Dans ce fichier, MOT_CLUB = le mot du club (4–5 lettres idéalement), MOT_BUT = « BUT » (ou « GOAL »).

## Scène 1 — Arrivée du mot club (f0–14)

- **Fond** : nuit presque noire `#000411` sur les bords, `#04133e` au centre. Grande forme floue
  d'accent (silhouette de l'emblème floutée ~40 px, opacité ~50 %) au centre-gauche, qui dérive
  légèrement. Bruit vidéo + scanlines horizontales fines.
- **f0–1** : fond seul.
- **f2–14** : MOT_CLUB ×3 lignes (mêmes positions qu'en scène 2), couleur primaire **sombre**
  (opacité ~50–60 % sur le fond nuit).
  Révélation **de la droite vers la gauche, lettre par lettre** : f2–4 dernière lettre seule,
  f6–8 deux dernières, f9–11 trois, f12–14 le mot complet.
  Chaque nouvelle lettre arrive avec une **traînée horizontale** (smear ~120–200 px qui se
  résorbe en 2–3 frames). Les 3 lignes sont légèrement désynchronisées (±1 frame) et décalées en x
  (±20 px) pour éviter l'effet « copier-coller ».

## Scène 2 — Mot club plein cadre (f15–21)

- **Coupe sèche** à f15. Fond `#0d0001` (sombre primaire). Coups de pinceau diagonaux primaires
  très sombres en fond (voir scène 6).
- MOT_CLUB ×3 lignes, couleur primaire **vive** (`#b60030` à `#c8102e` dans la référence),
  pleine (pas de contour), italique.
- Lignes centrées horizontalement, **plus larges que le cadre** : environ 1 250 px de large, la première
  et la dernière lettre sont rognées. Centres verticaux ≈ y 110, 540, 970 (pas de 430 px) ;
  hauteur de capitale ≈ 260 px (taille de police ≈ 340 px selon la police).
- f15→21 : la couleur du texte baisse de ~100 % à ~45 % de luminosité (vers `#4e0007`) en easing linéaire ;
  dérive horizontale lente des lignes (≈ −10 px au total).

## Scène 3 — Glitch vers MOT_BUT (f22–36)

- **f22–26** : glitch par tranches. 8–12 bandes horizontales (hauteurs inégales 30–140 px) décalées
  en x de ±40 à ±180 px, nouveau tirage toutes les 2 frames. Dans les bandes, MOT_BUT en
  contour accent apparaît par-dessus le mot club qui s'éteint. Dominante violette
  (mélange accent + primaire, ≈ `#6a2bd0`) pendant 3 frames.
- **f27–36** : MOT_BUT ×5 lignes en **contour** (trait ~4 px), couleur accent assez sombre,
  fond nuit. **La moitié gauche de chaque mot est étirée vers la gauche** (smear 250 px à f27)
  qui se rétracte jusqu'à 0 à f36 (Easing.out(Easing.cubic)). Les lignes ont 1 frame de
  décalage entre elles.
- **Grille des 5 lignes** (garder pour scènes 3–5) : texte aligné à gauche à x ≈ 105, largeur ≈ 850 px,
  centres y ≈ 45, 260, 475, 690, 905 (pas ≈ 215 px), la première ligne est rognée en haut
  et la dernière en bas. Hauteur de capitale ≈ 150 px.

## Scène 4 — Néon MOT_BUT (f37–49)

- MOT_BUT ×5 en **néon** : trait accent vif (`#2a5cff` dans la référence) + halo
  (glow 8 px + 24 px), intérieur transparent.
- Fond qui s'éclaire : nuit `#01081f` → halo accent diffus (`#001f69`) qui **monte du bas-gauche**
  en diagonale, opacité 0 → 0,7 entre f37 et f49 (Easing.inOut(Easing.quad)).
- Quasi statique : légère poussée de toute la grille (scale 1,00 → 1,02).

## Scène 5 — Sortie en smear (f50–57)

- f50–55 : la **moitié droite** des mots s'étire vers la droite (smear 0 → 400 px, Easing.in(Easing.quad)),
  avec copies-échos ; les lettres de droite deviennent illisibles en premier.
- f56 : **coupe** sur le fond de la scène 6 (sombre primaire + pinceaux) avec les restes étirés
  de MOT_BUT en surimpression (opacité 40 %).
- f57 : les restes convergent en traînée horizontale vers le centre = le numéro qui se forme.

## Scène 6 — Numéro (f58–83)

- **Fond** : sombre primaire `#0e0000`–`#1b0000`, 3–4 **coups de pinceau diagonaux** primaires
  (`#5e000a`, flous ~30 px) orientés du haut-gauche vers le bas-droite (~−35°), qui glissent lentement
  vers le bas-droite (≈ 40 px sur la scène).
- **Numéro** (ex. « 43 ») : police display italique, **contour néon** ~6 px, dégradé du
  haut-gauche (violet, ≈ `#8a5cff`) au bas-droite (accent bleu, ≈ `#2a4dff`) ; intérieur rempli
  d'un bleu nuit translucide (`#100335`, opacité ~80 %) avec texture (bruit fin) ; glow double.
- Placement : centré à (540, 540), largeur ≈ 780 px à f58.
- Mouvement : f57 arrive en traînée horizontale (smear 300 px → 0 en 2 frames, ease-out),
  puis poussée **linéaire** scale 1,00 → 1,12 de f58 à f83, avec dérive de −30 px en x.

## Scène 7 — Zoom traversant (f84–96)

- **f84–87** : zoom violent vers un point du numéro (environ le haut du « 3 », 60 % en x, 45 % en y) :
  scale 1,12 → ~8 en 4 frames (Easing.in(Easing.exp)), flou de zoom croissant.
- **f88–92** : plus rien de lisible : grands aplats flous primaire/violet/accent qui se mélangent
  (flou gaussien 40–60 px). À f91–92 l'image de la scène 8 transparaît, très floue.
- **f93–96** : on est **dans la photo, très serré sur l'écusson du maillot** (scale ~4 centré sur
  l'écusson), qui dézoome jusqu'à scale ~1,02 (Easing.out(Easing.exp)), flou de zoom décroissant.
  f96 encore un peu flou, f97 net.

## Scène 8 — Carte joueur (f97–254)

- **Photo** plein cadre : joueur de face, buste, regard caméra, sur un décor du club dans les
  couleurs primaires (couloir, tribune, pelouse floutée). Le joueur occupe ~70 % de la hauteur,
  tête vers y ≈ 120–260, écusson du maillot vers (540, 470).
- Push-in **linéaire** de toute la scène, nom compris : scale 1,02 (f97) → 1,05 (f254).
- **Nom** (apparition f108, posé à f130) :
  - Prénom : petit, capitales, centre (540, 790), hauteur de capitale ≈ 45 px, tracking final ≈ 0,15 em.
  - Nom : grand, capitales, centre (540, 890), largeur finale ≈ 1 000 px (95 % du cadre), hauteur de capitale ≈ 105 px, tracking final ≈ 0,04 em.
  - Animation f108→130 (Easing.out(Easing.cubic)) : tracking de très large (prénom 1,2 em, nom 0,6 em,
    le nom déborde du cadre) vers la valeur finale ; d'abord **contour seul** semi-transparent
    puis remplissage **chrome** (dégradé vertical accent clair → accent profond, ligne de reflet blanche
    au milieu) qui monte en opacité de f114 à f128 ; 2 ou 3 frames de scintillement d'opacité
    (1 → 0,4 → 1) au début.
  - Glow accent autour du nom (12 px, opacité 0,6). Le nom passe **devant** le bas du joueur.

## Scène 9 — Emblème final (f255–299)

- **f255–259** : zoom rapide vers l'écusson du maillot (scale 1,05 → ~5 en 5 frames,
  Easing.in(Easing.cubic)), flou de zoom ; le nom grossit avec et sort par le bas.
- **f260–265** : plein cadre couleur primaire vive (`#be0b2e`) = l'**emblème géant**, si grand que
  seuls ses bords passent dans les coins. À f260 on voit encore une branche sombre en coin.
- **f266–268** : l'emblème rétrécit vite (scale ~12 → ~1,6), en rotation, avec **flou radial**
  (copies tournées ±10° autour du centre) : on découvre le fond sombre primaire.
- **f269–275** : l'emblème central continue de rétrécir et de tourner (scale 1,6 → 0,9, rotation ~90°) ;
  deux copies en sont **éjectées** et tournent en orbite (rayon ≈ 380 px puis qui diminue) avec traînées
  courbes.
- **f276–286** : les copies spiralent vers leurs places finales ; tout le monde se pose
  (Easing.out(Easing.back(1.2)) léger rebond).
  Positions finales de la référence (3 emblèmes) : centres x ≈ 296, 540, 784, y ≈ 545,
  taille ≈ 112 px chacun.
- **f286–299** : tenue immobile. Fond `#0e0000` avec halos primaires diagonaux en haut-gauche (`#5e000a`)
  et bas-droite, texture de fines lignes diagonales.

## Calque permanent — languette sponsor

- Rectangle blanc x 833→1080, y 0→104, bord gauche qui descend en **courbe concave** vers le bas-gauche
  (forme d'onglet arrondi), logo sponsor centré dedans (~70 % de la hauteur).
- Présente de f0 à f299, au-dessus de tout, jamais animée.

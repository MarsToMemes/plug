# Adapter la vidéo à un club

## Props de la composition `GlitchGoal` (schéma zod)

| Prop | Type | Rôle |
|------|------|------|
| `goalWord` | string | Mot qui claque (temps 3–4). « BUT » marche bien (3 lettres : la grille passe à 3 colonnes) ; « GOAL » aussi. |
| `cityWord`, `clubWord` | string | Logotype des temps 1 et 8 (ex. « MONTPELLIER » / « HÉRAULT SC »). |
| `firstName`, `lastName` | string | Carte joueur. Nom long (> 10 lettres) : réduire la taille, garder l'interlettrage. |
| `number` | string | 1 ou 2 chiffres (1 chiffre : une seule case). |
| `position` | string | Petit texte du cadre photo (« ATTAQUANT », « DÉFENSEUR »…). |
| `portrait` | staticFile | **Photo 1** : visage serré, de face, haute définition (temps 4). |
| `actionPhoto` | staticFile | **Photo 2** : action, idéalement vue de dessus ou de profil, passée en noir et blanc (temps 6). |
| `cardPhoto` | staticFile | **Photo 3** : buste détouré, pose dynamique (carte joueur). |
| `cityPhoto` | staticFile | Photo de la ville ou du stade (bas du logotype, en duotone). |
| `emblemSvg` | staticFile | Forme emblématique du club (logotype + vagues) — tirée de l'écusson ou des bandes du maillot. |
| `palette` | objet | `red`, `redDark`, `white`, `black`, `grey`. |

## Palette

- ROUGE = couleur principale du club (la plus forte), ROUGE SOMBRE = la même à ≈ 45 % de luminosité, + BLANC et NOIR.
- Club à deux couleurs fortes (ex. orange et bleu) : la principale remplace le rouge, la seconde remplace le NOIR des
  cases et du fond de la grille de mots. Vérifier le contraste des chiffres dans les cases.

## Polices (libres, fichiers locaux)

- Linéale large et carrée, très grasse, pour lettres, mot, numéro, nom : `Bai Jamjuree` Bold, `Chakra Petch` Bold,
  `Saira` ExtraBold (largeur Expanded si disponible) ou `Russo One`.
- Petits textes espacés : `Saira Semi Condensed` ou `Barlow` Medium.
- Police officielle du club si elle est fournie ; jamais celle d'un autre club.

## Assets à demander

1. **Trois photos différentes du buteur** (portrait serré, action, buste pour la carte). C'est le point le plus
   exigeant de ce style : avec une seule photo, on peut la recadrer trois fois, mais le rendu perd beaucoup — le dire.
2. Écusson / logotype en SVG, et un motif graphique du club (bandes du maillot, forme de l'écusson) pour les vagues.
3. Photo de la ville ou du stade (ou en utiliser une libre de droits, à vérifier).
4. Codes couleur, poste du joueur, musique.

## Pièges

- Le style repose sur des changements **une image sur une** à 24 i/s : ne pas passer à 30 i/s sans recaler toutes les
  tables (sinon le rythme devient mou). Rester en 24 i/s.
- Les mosaïques et tranches sont violentes : elles durent ≤ 0,5 s chacune dans la référence ; ne pas les allonger.
- La photo d'action en noir et blanc doit être nette et contrastée ; une photo floue ou en contre-jour y est très visible.
- La boucle exige f186 = f0 au pixel près : comparer les deux images par différence avant de livrer.
- Ne recopier ni l'aile, ni le logotype, ni la police, ni les photos de la référence.

## Fiche Clermont Foot 63 (premier projet : `motion/clermont-glitch/`)

- Joueur : Florian Bianchini, n° 7 (un seul chiffre : une seule case de rouleau). `goalWord` « BUT » (grille à 3 colonnes).
- Palette : rouge `#C4053F`, bleu `#0C2C65` relevés sur l'écusson fourni ; le bleu tient le rôle du « noir » (cases,
  lettres sombres, lignes) et un bleu très foncé `#061A3D` celui des fonds noirs.
- Une seule photo (studio, fond uni) : déclinée en portrait (recadrage du détourage), noir et blanc (photo d'origine
  recadrée sous les logos incrustés), buste détouré. Le fond uni rend le détourage `u2net_human_seg` propre d'emblée.
- Emblème : le **cavalier** extrait de l'écusson (plus grande composante bleue de la zone centrale) — l'écusson entier
  mettait son « 63 » sur le logotype. Motif de la carte : bandes rouge/blanc/bleu du maillot en courbes, placées
  **sous** le nom (y ≥ 900). Décor bas du logotype : chaîne des Puys dessinée en SVG.
- Piège : un `clipPath: inset(...)` sur un élément centré par `translate(-50%)` se calcule sur sa propre boîte, pas sur
  le cadre — pour une coupe en coordonnées du cadre, mettre le clip sur un `AbsoluteFill` parent.
- Boucle vérifiée : différence f0 / f186 nulle.
- Musique (fournie) : « Eagle » (Epidemic Sound). Accalmie courte (≈ 105,5 s) sous la carte logotype, reprise (106,10 s)
  sur la première lettre qui claque f17 : `trimBefore` = 2529 images à 24 i/s. Fondu sur les 11 dernières images
  (la musique ne boucle pas, seule l'image boucle).

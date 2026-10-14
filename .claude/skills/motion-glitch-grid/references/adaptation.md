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

# Adapter la vidéo à un club

## Props de la composition `RetroGoal` (schéma zod)

| Prop | Type | Rôle |
|------|------|------|
| `goalWord` | string | Mot du but (scènes 1–2). « BUT » (3 lettres) : le mot géant ne remplit plus 2 600 px → passer à « BUUUT » ou augmenter la taille. |
| `firstName`, `lastName` | string | Bandeaux défilants (scènes 1 et 3) et étiquette (scène 4). |
| `number` | string | Scène 3 et carte finale. |
| `hometown` | string | « VILLE, PAYS » sous le numéro. Facultatif : sans valeur, la ligne disparaît. |
| `city`, `clubShort` | string | Petits textes au-dessus/au-dessous du mot (scène 2). |
| `palette` | `{hot, dark, cream}` | Les 3 couleurs (voir règles plus bas). |
| `crestSvg` | staticFile | Écusson, utilisé en filigrane (scène 2) et dans la pastille (scène 4). |
| `scriptLogoSvg` | staticFile + guide | Logo-script du club (scène 3) + polyline de guidage de l'écriture. |
| `ringText` | string | Texte de l'anneau tournant (surnom, devise). |
| `playerPhoto` | staticFile | PNG détouré, buste, ≥ 1 600 px de haut. |
| `fontWide`, `fontCondensed`, `fontSmall` | string | Polices (voir plus bas). |

## Palette

- Trois rôles : **CHAUD** (fond dominant), **SOMBRE** (contraste fort avec CHAUD et CRÈME), **CRÈME** (texte).
  Les prendre dans la charte du club et les « vieillir » légèrement (saturation −10 à −15 %, jamais de blanc pur
  ni de noir pur) pour l'aspect encre.
- Vérifier : CRÈME sur SOMBRE et CRÈME sur CHAUD lisibles (contraste ≥ 3:1 pour les gros textes), SOMBRE sur
  CHAUD lisible (numéro de la scène 3).
- Club bicolore sans couleur claire : la crème reste la 3ᵉ couleur. Club dont les deux couleurs sont sombres :
  le dire à l'utilisateur et proposer d'éclaircir l'une des deux pour CHAUD.

## Polices (fichiers locaux, licence libre)

- Mot géant (étendue, angles arrondis carrés) : `Bungee`, `Russo One`, ou `Unbounded` Black.
- Mot centré, numéro, nom (condensée très grasse) : `Big Shoulders Display` Black, `Saira Extra Condensed` Black,
  ou `Teko` Bold.
- Petites capitales espacées : `Saira Semi Condensed` SemiBold ou `Barlow Condensed` SemiBold.
- La police officielle du club si elle est fournie. Ne jamais reprendre la police propriétaire d'un autre club.
- Charger les TTF complets en local (`@remotion/fonts`), pas le woff2 partiel du CDN Google.

## Assets à demander à l'utilisateur

1. Écusson en SVG (indispensable : filigrane, pastille).
2. Logo-script ou mot-symbole manuscrit du club en SVG (scène 3). S'il n'existe pas : surnom du club dans une
   police script libre, ou bien remplacer l'effet par le surnom en police condensée qui se tape — le dire.
3. Photo officielle du buteur (de face, buste, fond uni de préférence) ; détourage selon
   `motion-goal-card/references/adaptation-club.md`.
4. Prénom, nom, numéro, ville d'origine (facultatif).
5. Codes couleur de la charte.
6. Musique (la référence est muette).

## Pièges

- Le mot géant et les bandeaux doivent **boucler sans saut** : mesurer la largeur d'une unité de texte.
- Les flashs une image sur deux sont violents : rester sur les plages relevées (8 images en scène 1, 5 en scène 3).
  Au-delà, risque de gêne (photosensibilité) et effet amateur.
- Le stroboscope de la photo (f116–118) ne fonctionne que si la photo est nette et bien détourée ; avec une photo
  médiocre, préférer une apparition par coupe simple.
- Ne pas recopier les éléments de marque de la référence (lettrage manuscrit, écusson, police, sponsor maillot).

## Fiche Montpellier HSC (premier projet : `motion/mhsc-retro/`)

- Joueur : Théo Sainte-Luce, n° 17. `goalWord` « BUUUT ».
- Palette : orange `#F06600` et bleu `#00377B` relevés sur l'écusson fourni (pas de charte officielle trouvée en ligne),
  vieillis en CHAUD `#E2621F`, SOMBRE `#102B5E`, CRÈME `#EFE5CF`.
- Pas de logo-script : « Paillade » (surnom historique) en Kaushan Script, révélé par un bord penché qui avance.
- Écusson raster (webp) : version couleur pour la pastille, silhouette (`ecusson-mono.png`, tout sauf le blanc) teintée
  par `mask-image` pour le filigrane ton sur ton.
- Mot centré : taille de police = min(560, 2150 / nombre de lettres) pour garder ≈ 880 px de large.
- Musique (fournie) : « Limitless » (Epidemic Sound). Départ sur un gros coup du morceau (125,2 s), son accalmie
  tombe sous la fin de la scène 2 et la reprise (127,69 s) sur la coupe du numéro f75. Méthode : énergie RMS par pas de
  50 ms, chercher un trou court suivi d'une reprise et le caler sur une coupe forte (f40, f75 ou f110).
- Détourage : `u2net_human_seg` gardait le fond sombre de la tribune sous le lobe de l'oreille (fond foncé + cheveux
  foncés au même endroit). Correction par clé de peau dans la zone, **limitée au bord** (≤ 4 px de la transparence)
  côté oreille dont l'intérieur est ombré, sinon la clé perce le creux de l'oreille ; ne pas faire monter la zone
  dans les cheveux. Toujours vérifier les deux oreilles en gros plan (×3) sur les deux couleurs de fond.

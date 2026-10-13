# Adapter la carte à un club

## Props de la composition `GoalCard` (schéma zod)

| Prop | Type | Rôle |
|------|------|------|
| `clubWord` | string | Mot répété des scènes 1–2 (idéal : 4–5 lettres, plus long = police plus petite = moins d'impact). |
| `goalWord` | string | Mot des scènes 3–5 (« BUT », « BUUUT », « GOAL »). |
| `number` | string | Numéro du buteur (1–2 chiffres). |
| `firstName`, `lastName` | string | Nom affiché en scène 8. Nom long (> 9 lettres) : réduire la taille plutôt que le tracking. |
| `playerPhoto` | staticFile | Photo carrée ≥ 2 160 px, joueur de face, buste, déjà composé sur un décor du club. |
| `crestPoint` | {x, y} en % | Position de l'écusson sur le maillot de la photo (cible des zooms des scènes 7 et 9). |
| `palette` | objet | `primary` (vif), `primaryDark` (pinceaux), `bgDark` (fond sombre), `night` (fond scènes 1/3/4), `accent`, `accentAlt` (2ᵉ teinte du dégradé du numéro), `accentLight` (reflets chrome). |
| `fontFamily` | string | Police display (voir plus bas). |
| `outroMark` | path SVG + disposition | Emblème final : forme(s) et positions finales. |
| `sponsorLogo` | staticFile, optionnel | Logo de la languette ; sans logo, pas de languette. |

## Règles d'adaptation

- **Emblème final** : il doit venir de l'identité du club, pas de la référence. Si l'emblème contient
  un motif répété (étoiles, bandes…), on peut éjecter puis aligner les copies (choréographie de
  la référence). Sinon : une seule forme qui rétrécit avec flou radial, tourne et se pose au centre,
  puis le logo complet du club apparaît par une coupe sèche sous la forme, f286.
- **Police** : la police officielle du club si elle existe et que le club en fournit les fichiers (`loadFont` local).
  Sinon, police Google libre, large et carrée, penchée par `skew` si elle n'a pas d'italique :
  `Michroma` (la plus proche en largeur), `Krona One`, ou `Chakra Petch` Bold Italic (plus étroite).
  Ne jamais utiliser la police propriétaire d'un autre club.
- **Contraste** : si le club n'a qu'une couleur (ex. grenat + blanc), l'accent néon doit rester
  froid et lumineux, sinon les scènes 4, 6 et 8 deviennent ternes. Proposer 2 options à l'utilisateur
  et lui laisser trancher (c'est un choix de marque).
- **Photo** : c'est 50 % du rendu (5 s sur 10). Une photo prise au téléphone ou mal détourée ruine
  la carte, quelle que soit la qualité de l'animation. Le dire à l'utilisateur si la photo ne convient pas.

## Fiche FC Metz (Ligue 2) — choix validés

Projet : `motion/metz-but/` (props dans `players.json`, rendu par joueur avec `node render-all.mjs`).

- `clubWord` **« METZ »**, `goalWord` **« BUUUT »**.
- Palette de travail fournie par l'utilisateur (pas la charte certifiée ; privilégier des codes officiels vérifiables s'ils apparaissent) :
  grenat `#74070B`, grenat profond `#3B0509`, rouge grenat secondaire `#9B1C2C`, or `#D4AF37`,
  blanc cassé `#F5F2ED`, noir profond `#101010`, gris `#777777`.
- Règles de l'utilisateur : le grenat domine et identifie le club ; grenat profond et noir pour les fonds ;
  blanc cassé pour le contraste et la lisibilité ; **l'or avec parcimonie** (mots, filets, contours, transitions) ;
  le rouge secondaire pour les variations et les couches ; contraste suffisant sur mobile.
- Traduction dans la carte :
  - mot club plein en `#9B1C2C` qui s'assombrit ; fonds `#101010` / grenat profond, pinceaux en grenat ;
  - **néon en blanc cassé** (contour + halo blanc cassé, second halo or très léger) : c'est l'accent froid du style ;
  - or seulement : flash de 3 frames dans le glitch, début du dégradé du contour du numéro, ligne de reflet du nom chrome,
    filet sous le nom du club à la fin ;
  - halo montant de la scène 4 en rouge secondaire (pas de bleu).
- Police provisoire : Michroma (OFL, fichier local `public/fonts/`), penchée de −12°. Le fichier woff2 du CDN Google
  ne contient qu'un sous-ensemble : utiliser le TTF complet.
- Emblème final provisoire : bouclier neutre ; à remplacer par la forme tirée de l'écusson SVG officiel. Fin propre à Metz :
  l'emblème rétrécit avec flou en rotation, se pose, remonte, puis filet or + « FC METZ » qui se resserre.
- Encore à fournir : écusson SVG, photos des joueurs, liste prénom/nom/numéro, logo sponsor éventuel.

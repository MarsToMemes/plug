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
- **Détourage des photos joueurs** (dans le scratchpad, venv dédié) : `rembg` modèle `u2net_human_seg`
  (le plus propre sur un buste ; `isnet-general-use` garde des morceaux de décor). Si la photo vient d'un visuel
  déjà composé (texte derrière le joueur), les doigts qui touchent le texte sont mal détourés : refaire ces zones
  seulement par **clé de peau** — alpha = clamp((r − b − 6)/16) × clamp((luminance − 45)/50) — puis garder la seule
  composante connexe du doigt et rogner 1 px du contour. Recadrer au-dessus de tout texte incrusté (nom…).
  Contrôler en gros plan sur fond vert **et** sur fond grenat avant d'intégrer. Le PNG transparent va dans
  `public/joueurs/`, le décor est dessiné par le code (`PlayerDecor`), `crestPoint` = écusson du maillot sur le PNG.
- **Photo** : c'est 50 % du rendu (5 s sur 10). Une photo prise au téléphone ou mal détourée ruine
  la carte, quelle que soit la qualité de l'animation. Le dire à l'utilisateur si la photo ne convient pas.

## Fiche FC Metz (Ligue 2) — choix validés

Projet : `motion/metz-but/` (props dans `players.json`, rendu par joueur avec `node render-all.mjs`).

- `clubWord` **« METZ »**, `goalWord` **« BUUUUT »** (6 lettres : avec 5, la grille ne remplissait pas la largeur).
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
    rien sur la fin (le filet or sous le logotype a été retiré) ;
  - halo montant de la scène 4 en rouge secondaire (pas de bleu).
- Polices (OFL, fichiers locaux `public/fonts/`) : **Unbounded Black (900)**, en instance fixe sans chevauchements
  (`fonttools varLib.instancer Unbounded[wght].ttf wght=900 --remove-overlaps`) — la police variable fait apparaître
  des traits blancs dans les lettres dès qu'on leur met un contour SVG — pour « METZ », le numéro et le nom
  (la puissance du style vient d'une police très grasse) ; Michroma, penchée de −12°, reste pour les néons « BUUUT ».
- Son (`src/SoundTrack.tsx`, rendu avec `Html5Audio` : `<Audio>` de `@remotion/media` fait expirer le rendu à f89) :
  musique fournie par l'utilisateur (Epidemic Sound, `public/music/`), découpée pour que son drop tombe sur la coupe
  « METZ » plein cadre (f15) — repérer le drop par l'énergie RMS (saut le plus fort après une accalmie) ;
  effets synthétisés par `tools/sfx.py` (souffles, impacts, glitch, scintillement) calés sur chaque coupe.
  Cible de mixage : −14 LUFS intégrés, aucun échantillon saturé (mesurer avec `ebur128`).
- Ancienne police provisoire : Michroma seule (OFL, fichier local `public/fonts/`), penchée de −12°. Le fichier woff2 du CDN Google
  ne contient qu'un sous-ensemble : utiliser le TTF complet.
- Emblème final : croix de Lorraine vectorisée depuis le logo fourni (`src/club.ts`), grenat pendant la rotation puis
  blanc cassé quand elle se pose ; puis logotype « Fc Metz » extrait du logo (`public/club/fc-metz-logotype.png`), sans filet (retiré à la demande de l’utilisateur).
  La même croix sert de filigrane derrière le joueur.
- Mot club en **grenat taillé** (choix de l'utilisateur, en écho au surnom « Les Grenats » et aux vitraux de la
  cathédrale) : texture de gemme calculée par `tools/gemme.py` (grandes facettes : densité 34000), découpée dans le
  texte par `GemWord`, avec liseré de lumière, ombre interne et halo. La vidéo démarre directement dessus (miniature
  forte) ; un reflet balaie les facettes, puis la pierre s'allume sur le drop (f15). Pas d'éclats en étoile (retirés à la demande de l'utilisateur).
  Lignes METZ et BUUUUT entièrement dans le cadre en hauteur (l'utilisateur a pris le rognage haut/bas pour un bug).
- **Leçon matière (retour utilisateur)** : une texture plaquée dans une silhouette + halo + liseré clair fait « LED »,
  pas premium. Le rendu crédible vient d'une lettre traitée comme un **objet** : biseau, bords irréguliers, épaisseur
  (flanc sombre), matière qui suit le relief et passe sur les arêtes, une seule lumière, ombre portée, aucun contour.
  Référence donnée : lettres sculptées dans la roche. Mise en œuvre : `tools/lettres3d.py` (écailles du Graoully,
  image RGBA par ligne, graines différentes), prop `clubMaterial: 'ecailles'` ; `'grenat'` = ancienne méthode plaquée.
- **Choix validé : `clubMaterial: 'grenat-relief'`** (défaut) — grenat taillé traité en objet par `tools/gemme3d.py` :
  face facettée (texture `gemme.py` recalculée à la taille du mot), chanfrein qui accroche la lumière, flanc, ombre
  portée, aucun halo ni liseré. Autres options gardées pour comparaison : `'ecailles'`, `'vitrail'` (`tools/vitrail3d.py` :
  verre grenat serti de plombs en relief).
- Joueurs faits : Jessy Deminguet (n° 8). Encore à fournir : les autres joueurs, logo sponsor éventuel.

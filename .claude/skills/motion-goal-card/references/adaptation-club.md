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

## Fiche FC Metz (Ligue 2)

À valider avec l'utilisateur avant de coder : les valeurs ci-dessous sont des propositions, pas la charte officielle.

- `clubWord` : **« METZ »** (4 lettres comme la référence). Autres choix : « FCM », « GRENATS » (7 lettres, plus petit).
- `goalWord` : **« BUT »** (3 lettres : la grille des 5 lignes est moins dense ; compenser par une taille plus grande,
  largeur ≈ 850 px conservée) ou « BUUUT » pour garder la longueur.
- `palette.primary` : grenat. Valeur approchée `#8a1538`, `primaryDark` `#3d0716`, `bgDark` `#120206`.
  **À remplacer par les codes de la charte du club.**
- `palette.accent` — deux options à présenter :
  1. **Blanc-glace** (`#e8f1ff`, glow `#9fc2ff`) : reste dans les couleurs du club (grenat et blanc), plus sobre.
  2. **Bleu électrique** (`#2a5cff`, alt `#8a5cff`) : le contraste maximal de la référence, mais le bleu
     n'appartient pas à l'identité du FC Metz.
- `palette.night` : version très sombre et désaturée du primaire (`#0b0306`) si accent blanc-glace ;
  bleu nuit `#04133e` si accent bleu.
- `outroMark` : forme tirée de l'écusson officiel fourni par le club (fichier SVG). Ne pas redessiner l'écusson de mémoire.
- `sponsorLogo` : uniquement le logo fourni par le club pour ce type de publication.
- Assets à demander : écusson SVG, photo(s) joueur détourée(s) haute définition, codes couleur, police officielle
  éventuelle, logo sponsor maillot ou partenaire réseaux sociaux.

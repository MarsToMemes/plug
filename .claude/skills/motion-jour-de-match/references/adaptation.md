# Adapter la vidéo à un club (en français)

## Textes

| Référence | En français | Remarque |
|-----------|-------------|----------|
| GAMEDAY (mot répété) | **« JOUR DE MATCH »** (ou « MATCHDAY » si le club l'utilise déjà) | 13 caractères : réduire la taille, ou 2 lignes « JOUR DE / MATCH » pour le mot géant du temps 2 |
| WASHINGTON CAPITALS / VS / NEW JERSEY DEVILS | nom complet du club / VS / nom complet de l'adversaire | petites capitales étendues |
| CAPS (nom géant final) | nom court du club : « L'OM », « LYON », « METZ »… | 3–6 caractères idéalement |
| VS NEW JERSEY DEVILS | « VS » + adversaire (ou « CONTRE … ») | |
| SATURDAY, OCTOBER 17 / CAPITAL ONE ARENA / 1:00 PM ET | « SAMEDI 17 OCTOBRE / ORANGE VÉLODROME / 21 H 00 » | format français de la date et de l'heure |
| WATCH: … / LISTEN: … | « À SUIVRE SUR : … » / « À ÉCOUTER SUR : … » | diffuseurs réels |
| Capital One (partenaire) | logo partenaire **uniquement s'il est fourni** | sinon rien |

**Les infos du match (date, heure, stade, adversaire, diffuseurs) sont à demander à l'utilisateur, jamais inventées.**

## Assets à demander

1. Logo du club (PNG haute définition ou SVG) ; logo de l'adversaire (pour la silhouette rouge du temps 5).
2. **Emblème** : forme forte du club pour les silhouettes et le contour (souvent le logo lui-même ; pour un logo rond ou
   un écusson, prendre l'élément central : lion de l'OL, « M » de l'OM…). Le vectoriser en Python.
3. **Photo du joueur** mis en avant (portrait buste, haute définition) — fond libre (elle est cadrée dans un rectangle).
4. Infos du match (voir ci-dessus) + logo partenaire éventuel.
5. Musique (référence muette).

## Palette

ROUGE / BLEU NUIT / BLEU de la référence → les deux couleurs du club + un fond sombre. Club à une seule couleur forte
(OM : bleu) : fonds bleu nuit / bleu club / gris clair, silhouettes en blanc ou en bleu clair, mots rouges → bleu ciel ;
garder **trois fonds bien distincts** pour que les coupes se voient.

## Polices (libres, fichiers locaux)

- Condensée très grasse (mot géant) : `Anton`.
- Étendue italique très grasse (mots secondaires, nom final) : `Archivo` Expanded Black (+ `skewX(-12deg)` pour
  l'italique) ou `Michroma` (plus fine) ; petites capitales : `Archivo` Expanded Bold.
- Police officielle du club si fournie ; jamais celle de la référence.

## Pièges

- 24 i/s : les effets « une image » (lettres, négatif) sont plus visibles qu'à 30 ; garder la même table d'images.
- « JOUR DE MATCH » est long : vérifier que les rangées et la grille restent lisibles ; sinon « MATCHDAY ».
- Le contour de l'emblème doit être **un seul tracé propre** (simplifier fortement, retirer les trous) pour que le
  dessin progressif soit lisible.
- Logo de l'adversaire : seulement en **silhouette** (comme la référence), jamais modifié dans sa forme.
- Ne reprendre ni les logos, ni la photo, ni la police, ni les infos de la référence.

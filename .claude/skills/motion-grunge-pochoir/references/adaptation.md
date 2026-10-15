# Adapter la vidéo à un club (en français)

## Textes

| Référence | En français | Remarque |
|-----------|-------------|----------|
| BREWERS (nom, jaune) | nom court du club : « LYON », « METZ », « LA PAILLADE », « L'OM »… | 4–9 lettres |
| WIN (mot de victoire) | **« VICTOIRE »** (choix déjà fait pour l'OL) ou « GAGNÉ » | 8 lettres : bloc plus large que haut, réduire la taille |
| WIN / OUR / WAY (slogan) | **slogan ou devise du club en 3 mots courts** | le mot du milieu est en police étendue jaune |

Le slogan est la signature du style. Exemples **réels** qui tombent parfaitement en 3 mots : OM « DROIT / AU / BUT ».
Pour les autres clubs : demander leur slogan de saison ou leur devise. **Ne jamais en inventer un** qui parlerait au
nom du club. À défaut, utiliser « VICTOIRE / DE / L'OL » (le mot du milieu court en jaune étendu) — le dire.

## Assets à demander

1. **Logo du club** (PNG haute définition ou SVG) — il sera « imprimé » (grain, manques) par le projet.
2. Slogan / devise (voir ci-dessus).
3. Couleurs : une couleur vive pour l'encre (rôle du jaune) + les couleurs du logo. Club sans couleur vive claire
   (bleu foncé, grenat) : l'encre devient le blanc et la couleur du club passe en accent (mot du milieu) ; vérifier le
   contraste sur fond gris.
4. Option : une photo de ciel / de stade en noir et blanc pour les temps 5–7 (sinon nuages générés).
5. Musique (référence muette).

## Polices (libres, fichiers locaux)

- Condensée très grasse (nom, mot de victoire, mots blancs) : `Anton` ou `Bebas Neue` (plus fine) ; `Oswald` 700 en repli.
- Étendue très grasse (mot du milieu) : `Archivo` Expanded Black (instance statique, cf. `motion/ol-victoire/`).
- Police officielle du club si fournie ; jamais celle de la référence.

## Pièges

- Le grain de pochoir doit rester **lisible** en miniature : grain fin sur les grands mots, pas de manques au milieu
  des lettres fines.
- Les flashs (jaune f48, blanc f74–82, pop f114–122) sont courts : ne pas les allonger (risque photosensible).
- Les filtres SVG (turbulence + déplacement) sur de grandes surfaces coûtent cher au rendu : les limiter au texte et
  au logo, pas au fond ; à 60 i/s, rendre d'abord en `--scale=0.5` pour vérifier.
- La boucle est une **coupe franche** (pas un fondu) : le cadrage de f0 doit être identique à chaque passage.
- Ne reprendre ni le logo, ni le slogan, ni les polices, ni les textures de la référence.

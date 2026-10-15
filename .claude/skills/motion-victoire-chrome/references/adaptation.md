# Adapter la vidéo à un club (en français)

## Textes : de « CANES WIN » au français

| Référence | En français | Remarque |
|-----------|-------------|----------|
| CANES (surnom court, chrome) | surnom ou nom court du club : « METZ », « LA PAILLADE », « LE CF63 »… | 4–8 lettres idéalement |
| WIN (mot rouge, 3 lettres) | **« VICTOIRE »** par défaut | 8 lettres au lieu de 3 : voir ci-dessous |
| HURRICANES WIN (signature) | « NOM VICTOIRE » ou le score « 2–1 · J12 » | petites capitales |
| HURRICANES (nom, cadre, lettres géantes) | nom du club sans « FC » : « MONTPELLIER », « CLERMONT » | 6–11 lettres |
| HOCKEY CLUB (bloc club) | « FOOTBALL CLUB » ou la forme officielle (« FC METZ ») | |
| (titre du post « SIX IN A ROW ») | option : « 6ᵉ VICTOIRE DE SUITE » dans la signature | prop `serie` |

**Le mot de victoire est le point délicat** : « WIN » fait 3 lettres, « VICTOIRE » 8. Avec une linéale étendue, le
mot doit tenir dans ≈ 950 px : sa capitale tombe à ≈ 95 px (contre ≈ 140 px pour WIN au temps 1, ≈ 170 px au temps 5).
Options à proposer à l'utilisateur :
1. **« VICTOIRE »** en largeur normale (pas étendue) — le plus clair, un peu moins massif ;
2. **« GAGNÉ »** ou « ON GAGNE » — plus court, garde la masse ;
3. un mot court du club s'il en a un (chant, cri de supporters) — seulement s'il est réel et fourni.
Caler la taille avec `fitText` de `@remotion/layout-utils` (voir `remotion-markup/measuring-text.md`).
Ne jamais inventer un cri ou un surnom : demander.

## Assets à demander

1. **Logo du club en SVG** (indispensable pour le relief 3D ; sinon PNG haute définition à vectoriser).
2. 3 **petits logos secondaires** (monogramme, écusson de la ville, logo de saison…) — jamais de sponsors sans
   accord ; à défaut : monogramme du club, écusson, étoile ou année de fondation dessinés simplement.
3. Codes couleur (une couleur forte + sombre + clair) ; vérifier le contraste du mot blanc sur bloc couleur.
4. Musique (la référence est muette) ; score / série de victoires si on veut les afficher.

## Palette

ROUGE → couleur principale du club ; ROUGE SOMBRE → la même à ≈ 15 % de luminosité (fond carbone teinté) ; le gris
papier et le chrome restent. Club bleu (OM, Montpellier…) : carbone teinté bleu nuit, chrome inchangé, bloc bleu.
Club à couleur claire (jaune) : bloc jaune + mot noir (pas blanc), vérifier la lisibilité.

## Polices (libres, fichiers locaux)

- Linéale étendue très grasse (CLUB, MOT, NOM, lettres géantes) : `Archivo` axe largeur 125 (Expanded) graisse 800–900
  (instance statique via `fonttools varLib.instancer`, comme pour Metz), ou `Unbounded` Black.
- Petites capitales espacées : `Archivo` Expanded Medium, ou `Michroma`.
- Police officielle du club si fournie ; jamais celle de la référence.

## Pièges

- La 3D (`@remotion/three`) : prévoir un rendu plus lent (concurrence 2), tester le temps 3 seul en premier.
- Le logo extrudé doit rester **reconnaissable** : pas de déformation ; vérifier qu'aucune forme ne manque après la
  vectorisation (trous de l'écusson = `holes` des `Shape`).
- Les clignotements (lavis rouge, lettres géantes) changent à chaque image : rester ≤ 8 images d'affilée (risque
  photosensible), et ne pas les étirer.
- La boucle exige que f359 enchaîne sur f0 : vérifier par différence.
- Ne reprendre ni le logo, ni les petits logos, ni la police, ni le texte de la référence.

## Fiche Olympique lyonnais (premier projet : `motion/ol-victoire/`)

- Mot : « VICTOIRE » (choix de l'utilisateur), en Archivo Black largeur normale calé par `fitText` ; nom en chrome
  « LYON », lettres géantes « LYONNAIS », cadre « OLYMPIQUE LYONNAIS ».
- Couleurs du logo fourni : rouge `#E5202E` (rôle du rouge), bleu `#0F23AA`, or `#C88C28` ; carbone teinté bleu nuit
  `#05081E` au lieu du rouge sombre. Surface du logo 3D : rouge alvéolé (texture dessinée en canvas — une texture
  chargée par `TextureLoader` sort noire car la toile n'est pas redessinée après chargement).
- Logo 3D : vectorisation OpenCV par couleur (`RETR_CCOMP`, trous gérés), couches à hauteurs différentes ; réglages
  qui marchent : `environmentIntensity` 0,32, ACES exposition 0,95, clearcoat ≤ 0,35 (au-delà le bleu vire au lavande),
  pas de voile coloré par-dessus la toile (un voile rouge rendait le bleu violet).
- Petits logos sans fichier fourni : lion extrait du blason, médaillon nom + année de fondation, badge du département.
- Rendu : ≈ 3 min en 1080 avec la 3D (concurrence 4).
- Retour utilisateur : le **rectangle blanc qui glisse à droite** au début du temps 3 (copié de la référence) fait
  « trait moche » sur le logo 3D : supprimé. Ne garder que les tracés fins.
- Musique : « Stadium Rocker » (Taelimb) ; le coup qui suit le blanc de 97,5–98,1 s tombe sur la coupe f47 (carte
  sombre → bande rouge), `trimBefore` 2896 ; fondu d'entrée 4 images, de sortie f342–359 ; volume 0,42 → −14,1 LUFS.
  Vérifié dans le MP4 : plus forte attaque à l'image 47.

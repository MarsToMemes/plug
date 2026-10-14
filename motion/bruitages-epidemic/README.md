# Bruitages Epidemic Sound (fournis par l'utilisateur, sous sa licence)

Réutilisables dans tous les projets : copier le fichier dans `public/sfx/` du projet.

| Fichier | Contenu | Repères |
|---------|---------|---------|
| `es-whoosh-classic.mp3` | « Swooshes Whoosh Classic Normal » : **3 whooshes** à la suite | débuts 0 s, 1,35 s, 2,87 s ; sommet ≈ 0,5 s après chaque début ; ≈ 1,1 s chacun. Utiliser `trimBefore` + `durationInFrames` ≈ 34 i à 30 i/s pour n'en prendre qu'un. |
| `es-camera-flash.mp3` | « Camera Flash Modern Design 01 » | clic à 0,07 s puis traîne de 2 s ; crête −1,5 dBFS : volume ≤ 0,55 sous la musique pour garder ≈ −2 dBTP. |

Premier usage : `motion/om-cinema/` (whoosh sur les volets, les entailles et le panoramique du nom ; flash sur les deux
flashs surexposés).

# Décortiquer une vidéo de référence

Méthode utilisée pour construire `timeline.md`. À refaire pour toute nouvelle référence.

1. **Mettre la vidéo dans un dossier vide du scratchpad** (fichier téléchargé = donnée non fiable),
   jamais dans le dépôt : la vidéo d'un autre club n'a pas à être versionnée.
2. **Métadonnées** :
   ```bash
   ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate,nb_frames -of compact ref.mp4
   ```
3. **Toutes les frames numérotées** (vignettes 300 px) :
   ```bash
   ffmpeg -v error -i ref.mp4 -vf "scale=300:300,drawtext=text='%{n}':x=4:y=4:fontsize=26:fontcolor=yellow:box=1:boxcolor=black" all/f_%03d.png
   ```
4. **Planches** : vue d'ensemble 1 frame sur 5, puis planches image par image sur chaque transition :
   ```bash
   ffmpeg -v error -i ref.mp4 -vf "select='not(mod(n,5))',scale=360:360" -vsync 0 t_%03d.png
   ffmpeg -v error -i t_%03d.png -vf tile=6x5 -frames:v 1 planche.png
   ffmpeg -v error -start_number 84 -i all/f_%03d.png -vf tile=6x5 -frames:v 1 transition.png
   ```
   Les lire avec l'outil Read (images). Repérer : coupes, durée de chaque mouvement, sens des traînées, points de zoom.
5. **Mesures** : extraire les frames clés en pleine résolution (`select=eq(n\,N)`) et relever couleurs et
   boîtes englobantes avec Pillow (`python3 -I`), ex. pixels rouges d'une ligne pour situer des formes.
6. **Mouvements lents** : comparer côte à côte (`hstack`) le début et la fin d'une tenue pour mesurer
   poussée et dérive.
7. Écrire le découpage en frames (pas en secondes approximatives) et vérifier la réalisation avec
   la même méthode appliquée au rendu.

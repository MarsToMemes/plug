# Recettes Remotion des effets

30 i/s, 1920×1080. Palette `P = {club, clubDark, ink, night, glow, white}`.

## 1. Fond texturé à lignes topographiques

Générer une fois une image (outil Python, comme `tools/*.py` des autres projets) : bruit fractal basse fréquence,
puis lignes de niveau `abs(sin(noise × 40))` seuillées en traits fins ; posée en `mixBlendMode: 'overlay'` à 6–10 %
sur les fonds anthracite et orange. Variante animée : translater lentement l'image (±20 px sur la scène).

## 2. Bandes de pinceau à bord sec

Masque PNG (blanc sur transparent) d'un coup de pinceau horizontal à bords déchirés, généré en Python : rectangle
dont les bords haut/bas sont perturbés par du bruit 1D à deux échelles + petites stries (« poils ») qui dépassent.
Utilisation : `<div style={{background: P.club, WebkitMaskImage: url(brush.png), maskSize: '100% 100%'}}>` — la
même forme sert pour les bandes noires, orange, verticales (rotation 90°) et diagonales (rotation 60°).
Révélation : `clipPath: inset(0 ${100 - p}% 0 0)` (la bande « se peint » de gauche à droite).
Bande remplie de vidéo (temps 6) : le `<OffthreadVideo>` dans le même conteneur masqué.

## 3. Lettres qui entrent avec flou de mouvement

```tsx
const x = interpolate(f, [15, 24], [-600, 0], {...clamp, easing: Easing.out(Easing.cubic)});
const v = Math.abs(x - xPrev);                       // vitesse en px/image
<svg><filter id="mb"><feGaussianBlur stdDeviation={`${v * 0.35} 0`} /></filter></svg>
<div style={{translate: `${x}px 0px`, filter: 'url(#mb)'}}>SLOGAN</div>
```
Ou `<HtmlInCanvasMotionBlur>` (`@remotion/motion-blur`, ≥ 4.0.529) si disponible, `shutterAngle` 270.
Contour/ombre du slogan : `WebkitTextStroke: 10px #000` + copie noire décalée (−12, +12) derrière.

## 4. « BUT » translucide qui se fixe (temps 4)

Chaque lettre : `opacity` 0,4 → 1 et couleur `interpolateColors(f, [t, t+6], [P.club, P.white])`, dédoublement :
copie à −80 px en x, opacité 0,35, `filter: blur(6px)`. Mot entier : `scale` 1 → 1,35, `transformOrigin: '0% 100%'`.

## 5. Numéro qui irradie

Trois couches du même numéro :
1. halo : couleur `P.club`, `filter: blur(60px)`, `opacity` 0,9 ;
2. cœur : couleur `P.glow`, `filter: blur(18px) brightness(1.4)` ;
3. contour net : `color: transparent; WebkitTextStroke: 3px #9a9a9a` (un seul chiffre, décalé).
Montée finale (f107–111) : `brightness` 1 → 2,2 sur l'ensemble + voile crème en `mixBlendMode: 'screen'`.

## 6. Flash surexposé (transitions)

Voile `P.glow` en `screen`, opacité 0 → 0,85 → 0 sur 3 images, + `filter: brightness(1.8) saturate(0.6)` sur la scène.

## 7. Étalonnage des rushes

```tsx
<OffthreadVideo src={...} muted style={{filter: 'contrast(1.12) saturate(1.1) brightness(0.92)'}} />
```
+ calque `P.night` en `multiply` sur les ombres (dégradé vertical) et calque `P.club` en `soft-light` à 25 %.
Duotone rouge (temps 9 début) : filtre SVG `feColorMatrix` (niveaux de gris) + `feComponentTransfer` vers
(clubDark → club), opacité du duotone 1 → 0 entre f188 et f195.

## 8. Flou de profondeur variable (rush 1, f195–202)

`filter: blur(${interpolate(f, [195, 202], [14, 0], clamp)}px)` sur le rush, le texte reste net.

## 9. Traînée stroboscopique (temps 9)

Le même rush monté 5 fois, chaque copie décalée dans le temps :
```tsx
{[30, 24, 18, 12, 6].map((lag, i) => (
  <OffthreadVideo key={lag} src={rush3} trimBefore={start - lag} muted
    style={{position: 'absolute', inset: 0, opacity: 0.18 + i * 0.1, mixBlendMode: 'lighten',
            filter: 'sepia(0.6) hue-rotate(-20deg) saturate(2)'}} />
))}
<OffthreadVideo src={rush3} trimBefore={start} muted style={{position: 'absolute', inset: 0}} />
```
Fonctionne si la caméra est **fixe** et le fond sombre (le `lighten` ne laisse passer que le joueur). Avec un fond
clair : détourer le rush (rotoscopie hors Remotion) ou renoncer à l'effet.

## 10. Nom géant texturé (temps 8)

Texture de plâtre générée en Python (bruit + relief éclairé, comme `metz-but/tools/lettres3d.py` mais sans écailles,
juste spatule) puis découpée dans le texte (`backgroundClip: 'text'`), ou image RGBA du nom rendue directement.
Panoramique : `translate` x de +900 → −300 px et `scale` 1,15 → 1 sur f167–182.

## 11. Texte qui défile (tickers) et texte vertical

Comme `Ticker` de `mhsc-retro` : chaîne répétée, `translate` linéaire, police 14 px très espacée. Vertical :
`writingMode: 'vertical-rl'` + `rotate: '180deg'`.

## 12. Barres HUD (temps 9)

SVG : trait vertical 4 px `P.club` (y 230–750), 10 graduations de 8 px, petit texte CLUB vertical ; apparition par
tracé (`strokeDashoffset`) sur f203–210.

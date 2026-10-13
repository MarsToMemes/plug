# Recettes Remotion des effets

Toutes les valeurs animées passent par `useCurrentFrame()` + `interpolate()` (avec `extrapolateLeft`
et `extrapolateRight: "clamp"`). Les extraits sont des points de départ, à mettre à l'échelle du cadre.
Aléatoire uniquement via `random(seed)` de `remotion`.

## 1. Lignes de texte qui débordent

```tsx
<div style={{position: "absolute", left: "50%", top: y, translate: "-50% -50%",
  whiteSpace: "nowrap", fontFamily, fontSize, fontWeight: 900, lineHeight: 1,
  skew: "-12deg 0deg" /* si la police n'a pas d'italique */}}>
  {word}
</div>
```
Une ligne = un nœud JSX (éditable dans Studio). Débordement : `fontSize` choisi pour que la ligne fasse ~115 % du cadre.

## 2. Smear horizontal (traînée qui s'étire)

Deux techniques, à combiner :

**a. Échos directionnels** (traînée d'un seul côté, la plus fidèle) :
```tsx
const ECHOES = 10;
{Array.from({length: ECHOES}).map((_, i) => (
  <div key={i} style={{position: "absolute", inset: 0,
    translate: `${-(i / ECHOES) * smearPx}px 0px`,   // négatif = vers la gauche
    opacity: (1 - i / ECHOES) * 0.35}}>
    {children}
  </div>
))}
<div style={{position: "absolute", inset: 0}}>{children}</div>  {/* copie nette au-dessus */}
```
`smearPx` animé (ex. scène 3 : 250 → 0 sur f27–36). Pour n'étirer que la moitié gauche ou droite d'un mot,
envelopper les échos dans un `clipPath: "inset(0 50% 0 0)"` (gauche) ou `"inset(0 0 0 50%)"` (droite).

**b. Flou anisotrope SVG** (adoucit les échos) :
```tsx
<svg width={0} height={0} style={{position: "absolute"}}>
  <filter id="smearX" x="-50%" width="200%">
    <feGaussianBlur stdDeviation={`${blurX} 0`} />
  </filter>
</svg>
<div style={{filter: "url(#smearX)"}}>…</div>
```
`blurX` animé par frame (0 → 30). Un `id` de filtre unique par instance.

## 3. Glitch par tranches (scène 3)

```tsx
const BANDS = 10;
const tick = Math.floor(frame / 2);            // nouveau tirage toutes les 2 frames
let top = 0;
{Array.from({length: BANDS}).map((_, i) => {
  const h = 3 + random(`h-${i}-${tick}`) * 12; // en %, normaliser pour que la somme = 100
  const dx = (random(`x-${i}-${tick}`) - 0.5) * 2 * amplitude; // amplitude 40→180 px
  const band = (
    <div key={i} style={{position: "absolute", inset: 0,
      clipPath: `inset(${top}% 0 ${100 - top - h}% 0)`, translate: `${dx}px 0px`}}>
      {layer}
    </div>);
  top += h; return band;
})}
```
Dans chaque bande, afficher aléatoirement l'ancien calque (mot club) ou le nouveau (MOT_BUT),
avec une probabilité qui bascule de 0 à 1 sur f22–26. Ajouter une teinte violette en
`mixBlendMode: "screen"` sur 3 frames.

## 4. Néon en contour (MOT_BUT, numéro)

Pour le texte multiple (MOT_BUT), CSS suffit :
```tsx
style={{color: "transparent", WebkitTextStroke: `4px ${accent}`,
  filter: `drop-shadow(0 0 6px ${accent}) drop-shadow(0 0 22px ${accentDeep})`}}
```
Pour le numéro (contour en dégradé + intérieur rempli), passer en SVG :
```tsx
<svg viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="numStroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={accentAlt} />   {/* violet en haut-gauche */}
      <stop offset="1" stopColor={accent} />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="b1" />
      <feGaussianBlur stdDeviation="18" result="b2" />
      <feMerge><feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
  <text x="540" y="540" textAnchor="middle" dominantBaseline="central"
    fontFamily={fontFamily} fontSize={420} fontStyle="italic"
    fill={numberFill} fillOpacity={0.8}
    stroke="url(#numStroke)" strokeWidth={6} filter="url(#glow)">{number}</text>
</svg>
```
Texture de l'intérieur : un `<feTurbulence baseFrequency="0.9" numOctaves="2" seed={…}>` composité
(`feComposite operator="in"`) sur le remplissage, opacité ~15 %.

## 5. Nom en chrome (scène 8)

SVG `<text>` avec :
- `fill="url(#chrome)"` : `linearGradient` vertical — 0 % accent très clair, 45 % accent, 50 % blanc (reflet fin),
  55 % accent profond, 100 % accent.
- `stroke` accent clair 2 px, `filter` glow 12 px.
- `letterSpacing` animé (attribut SVG, en px = em × fontSize), `fillOpacity` 0 → 1 (f114–128),
  `strokeOpacity` 0,5 → 1.
- Scintillement : `opacity` = 1, 0.4, 1 sur f108–110 (valeurs fixes par frame, pas de random).

## 6. Fond : coups de pinceau, halo, grain

- **Pinceaux diagonaux** : 3–4 `div` larges (1 400 × 220 px), `background: linear-gradient(90deg, transparent, ${primaryDark}, transparent)`,
  `rotate: "-35deg"`, `filter: blur(30px)`, `translate` animé lentement.
- **Halo montant** (scène 4) : `radial-gradient` accent centré en bas-gauche, `opacity` animée, `mixBlendMode: "screen"`.
- **Grain** : SVG plein cadre `<feTurbulence type="fractalNoise" baseFrequency="0.8" seed={frame % 7}>`,
  opacité 0,06–0,10, `mixBlendMode: "overlay"`.
- **Scanlines** : `repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 3px)`.

## 7. Zoom traversant (scènes 7 et 9)

```tsx
// Plongée : origine = point visé
<AbsoluteFill style={{transformOrigin: "60% 45%",
  scale: interpolate(frame, [84, 87], [1.12, 8], {extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.in(Easing.exp), output: "perceptual-scale"})}}>
```
- **Flou de zoom** : empiler 6 copies du calque avec `scale` × (1 + i × k), `opacity` décroissante,
  même `transformOrigin` ; `k` suit la vitesse du zoom (0 au repos, ~0,04 au pic).
- Option : `<HtmlInCanvasMotionBlur>` de `@remotion/motion-blur` (Remotion ≥ 4.0.529) avec `shutterAngle` 270,
  `samples` 12 — plus réaliste mais plus coûteux ; garder les copies empilées en repli.
- **Fondu de matière** (f88–92) : `filter: blur(50px) saturate(1.4)` sur les deux calques superposés,
  le calque photo passe de 0 à 1 d'opacité **sous** le flou (le spectateur ne voit pas un fondu, il voit de la couleur).
- **Ressortie** (f93–96) : la photo commence à `scale` 4 avec `transformOrigin` = position de l'écusson
  (ex. `"50% 43%"`), descend à 1,02 en Easing.out(Easing.exp), flou de zoom décroissant.

## 8. Emblème : rétrécissement radial, orbite, pose (scène 9)

- Forme de l'emblème en `path` SVG (fourni par le club, simplifié en aplat d'une couleur).
- **Flou radial** : 7 copies de la forme tournées de −12° à +12° autour de son centre, opacité 0,15 chacune,
  plus la copie nette ; l'écart angulaire suit la vitesse de rotation.
- **Orbite puis pose** pour chaque copie éjectée :
```tsx
const t = frame - 269;
const angle = angle0 + t * 0.35;                       // rad/frame
const radius = interpolate(frame, [269, 280], [380, 120], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
const orbit = {x: 540 + radius * Math.cos(angle), y: 545 + radius * Math.sin(angle)};
const p = interpolate(frame, [276, 286], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp",
  easing: Easing.out(Easing.back(1.2))});
const pos = {x: orbit.x + (target.x - orbit.x) * p, y: orbit.y + (target.y - orbit.y) * p};
```
- **Traînées courbes** : 5 positions passées (frame − 1 … frame − 5) recalculées avec la même formule,
  dessinées en copies d'opacité décroissante.

## 9. Languette sponsor

```tsx
<svg width={247} height={104} style={{position: "absolute", right: 0, top: 0}}>
  <path d="M0 0 H247 V104 H40 C18 104 18 60 0 0 Z" fill="#fff" />
</svg>
```
Logo sponsor en `<Img>` centré dans la partie droite (padding 14 px). Calque le plus haut, hors de tout zoom.

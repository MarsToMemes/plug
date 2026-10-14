# Recettes Remotion des effets

Toutes les valeurs animées passent par `useCurrentFrame()` + `interpolate()` (clamp des deux côtés). Les couleurs
viennent d'un objet `P = {hot, dark, cream}` (palette du club). Les tables d'images sont écrites en dur.

## 1. Palette qui s'inverse une image sur deux

```tsx
const INVERT = new Set([10, 12, 14, 16]);           // scène 1 : images où la bande centrale passe SOMBRE
const inv = INVERT.has(frame);
const band = inv ? P.dark : P.hot;                  // bande centrale
const strip = inv ? P.hot : P.dark;                 // bandeaux haut/bas
const badge = inv ? P.hot : P.dark;
```
Même principe pour la scène 3 (`[76, 78, 80]` = fond SOMBRE / NUM CHAUD) et pour le stroboscope de couleur du mot
de la scène 2 (`STROBE = new Set([46, 47, 48, 50, 57, 64, 71])`). Une seule fonction `pick(frame, set, a, b)`.

## 2. Mot géant qui défile

```tsx
<div style={{position: 'absolute', top: 320, left: 0, whiteSpace: 'nowrap', fontFamily: fontWide, fontWeight: 900,
  fontSize: 700, lineHeight: 0.8, color: P.cream,
  translate: `${interpolate(frame, [0, 39], [680, 680 - 70 * 39])}px 0px`}}>
  {word}
</div>
```
Linéaire, sans easing. Ajuster `fontSize` pour une hauteur de capitale ≈ 560 px avec la police choisie.

## 3. Bandeaux de nom en boucle

```tsx
const unit = `${name} · `;
const text = unit.repeat(12);
// unitWidth mesuré une fois (measureText de @remotion/layout-utils) pour boucler sans saut
const x = -((frame * 6) % unitWidth);
<div style={{translate: `${dir * x}px 0px`, letterSpacing: '0.15em', ...}}>{text}</div>
```

## 4. Badge penché

Parallélogramme en SVG (pas de `skew` CSS : les coins arrondis restent nets) :
```tsx
<svg viewBox="-260 -85 520 170"><path d="M-230 -70 Q-226 -85 -210 -85 H250 Q262 -85 258 -70 L230 70 Q226 85 210 85
  H-250 Q-262 85 -258 70 Z" fill={badge} /></svg>
```
Allongement f28–35 : `scale` en x seul (`scale: \`${sx} 1\``) avec `transformOrigin: 'left center'`.

## 5. Lettres une par image

```tsx
const REVEAL: Record<number, {show: boolean[]; colors: string[]; bg: string}> = {
  41: {show: [false, true, false, false], colors: [..., P.cream, ...], bg: P.hot},
  42: {show: [false, true, true, false], colors: [..., P.hot, P.hot, ...], bg: P.dark},
  43: {show: [true, true, true, true], colors: [P.cream, P.dark, P.cream, P.cream], bg: P.hot},
};
```
Chaque lettre est un `<span>` (largeur conservée, `visibility: hidden` quand cachée) pour que le mot reste centré.
Pour un mot d'une autre longueur (« BUT », « BUUUT »), garder le principe : 1 lettre centrale, puis 2, puis toutes.

## 6. Trame de demi-teintes (ombre et coins)

Motif SVG de points dont le rayon décroît avec un dégradé :
```tsx
<pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <circle cx="6" cy="6" r="4" fill={P.dark} />
</pattern>
<mask id="fade"><rect width="100%" height="100%" fill="url(#fadeGrad)" /></mask>   {/* blanc → noir */}
<rect width="100%" height="100%" fill="url(#dots)" mask="url(#fade)" />
```
Le masque à dégradé donne une densité décroissante. Pour une vraie décroissance de taille de point : seuillage
(`feComponentTransfer` discrète) d'un dégradé multiplié par un motif de points flous — plus fidèle à l'impression.
Ombre de lettre : même trame, découpée par le texte décalé de (+14, +14) px.

## 7. Grain et usure d'impression

- Grain : `feTurbulence` `baseFrequency` 0.9, seuillé (`feComponentTransfer` table) pour ne garder que des points
  épars, en SOMBRE à 25 % sur les aplats clairs et en CRÈME à 15 % sur les aplats sombres ; graine = `frame % 6`.
- Usure des lettres : même bruit seuillé en masque **soustractif** sur le texte (petites lacunes fixes, graine fixe).

## 8. Signature manuscrite qui s'écrit

Il faut le logo-script du club en **SVG**.
- Si c'est un tracé de contour (cas normal) : on révèle par un masque. Dessiner dans un `<mask>` un trait épais
  (≈ 1,5 × l'épaisseur de la lettre) qui suit à peu près le chemin d'écriture, avec `strokeDasharray = L` et
  `strokeDashoffset = L × (1 − p)`, p = progression f76→f101. Le tracé de guidage se dessine à la main une fois
  (polyline de 10–20 points sur le logo).
- Pointe : petit trait SOMBRE flou qui précède la révélation (position = point du guide à p + 0,03).
- Sans SVG du club : ne pas inventer une écriture qui imite un autre club ; remplacer par le surnom du club dans une
  police script libre, en le disant à l'utilisateur.

## 9. Volet de bande crème (sortie scène 3)

```tsx
<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, background: P.cream,
  height: interpolate(frame, [107, 108, 109], [0, 50, 90], clamp)}} />
```

## 10. Panneau qui se redresse (scène 4)

Deux polygones de même nombre de sommets (≈ 16) : la silhouette dentelée et le rectangle à encoche.
Interpolation sommet par sommet de f110 à f117 en **paliers** (`Math.floor`, 1 étape par image) pour garder l'aspect
image par image, puis polygone fixe.

## 11. Machine à écrire

```tsx
const shown = Math.max(0, Math.floor((frame - start) / 2));
<span>{text.slice(0, shown)}</span><span style={{visibility: 'hidden'}}>{text.slice(shown)}</span>
```
La partie cachée réserve la largeur : l'étiquette ne bouge pas pendant la frappe.

## 12. Photo en stroboscope puis poussée

```tsx
const visible = frame >= 116 && frame !== 117;
<Img src={staticFile(photo)} style={{opacity: visible ? 1 : 0, transformOrigin: '30% 100%',
  scale: String(interpolate(frame, [118, 270], [1, 1.05], clamp)),
  translate: `${interpolate(frame, [118, 270], [0, 20], clamp)}px 0px`}} />
```

## 13. Anneau d'écusson qui tourne

Texte circulaire en SVG (`<textPath>` sur un cercle) + 2 cercles, couleur CHAUD foncée (CHAUD × 0,85),
`rotate: \`${frame * 0.1}deg\``. Le texte de l'anneau = surnom ou devise du club (fourni ou validé par l'utilisateur).

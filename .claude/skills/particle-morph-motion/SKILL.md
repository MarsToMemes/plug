---
name: particle-morph-motion
description: Catalogue of "one particle cloud that becomes everything" motion techniques measured frame by frame on a 35 s reference launch film (Cube Motion, every frame an SVG drawn in JavaScript). A fixed set of dots morphs from shape to shape - disc, 3D sphere, swarm, UI cards, a word made of dots, a cube - with scatter/regroup transitions, one dot word morphing into another letter by letter, and an iris flip to a light ending. Use for minimalist product or concept explainers in Plug, data shown as units that regroup, or when the user mentions "Cube Motion", "particules", "nuage de points", "points qui se transforment".
---

# Particle morph motion

Reference: "Cube Motion — an SVG animation library, drawn in JS" by @dwhitedesign (X, 21 Sep
2026), 0:35, 1920×1080, 60 fps. Every frame is an SVG drawn in JavaScript (no After Effects, no
WebGL). Analysed at 4 fps (whole film), 10 fps on five passages and full-resolution stills.
**The reference video is not in the repository and must not be:** we reuse techniques, never
its images, wording or brand.

## 1. The principle

**One cloud of N dots (≈ 1,500–3,000) is the only actor.** Every scene is a *target layout* for the
same dots; a transition moves each dot from its place in layout A to its place in layout B. The
viewer reads continuity: nothing is cut, the material is re-shaped. Text lives on the left, the
shape on the right; one idea per scene, about 3–5 s each.

Palette: near-black ground (#18181b), off-white dots and type, one cool accent (lavender-blue
≈ #8b8cf0) used for the second line of a title, the morphing letters and the final logo; the very
end flips to an off-white ground (#f3f2ef) with the accent as line colour. Type: one neutral
grotesque (Inter-like), title ≈ 110 px, a grey caption ≈ 30 px under it, a lot of empty space.

## 2. The techniques (measured)

### P1 — Disc → seed → starfield → sphere (0:00–1:75)
A solid off-white disc fades in (0.1 s), holds, then shrinks to a dot (ease-in, ≈ 0.5 s) while a
faint hexagonal dot grid fades in behind. The grid rushes toward the camera (dots grow, parallax:
near dots bigger and faster), and the camera pulls back through it until the dots close into a
**Fibonacci sphere** of points, slowly rotating (dots on the far side dimmer: depth fade).

### P2 — Title enters by a rising mask, two lines, accent second line (1:75–3:0)
"Four motions." rises line by line from under a mask (each line ≈ 0.3 s, ease-out); the second
line ("No dials.") in the accent colour arrives 0.35 s later. Exit: the lines lift out upward
through the same mask while the shape breaks.

### P3 — Scatter / regroup transition (4:75–5:75, 9:5–10:75, 26:75–27:75)
The structure loses cohesion: each dot gets a random velocity (deterministic seed) and the cloud
smears into a sweeping arc (all dots share a swirl direction), then regroups into the next shape.
Implementation: `pos = mix(A_i, B_i, ease(u)) + noise_i * sin(PI * u) * spread`, the noise
oriented along a common swirl; dots with motion blur (short streak along velocity) mid-flight.

### P4 — Cloud splits into several objects (5:0–6:5, 23:0–26:5)
The sphere splits into 3–4 smaller spheres at different depths (different sizes and brightness),
which drift apart; later the same small spheres line up as a diagram (one centre, three
satellites, each with a small icon and label). Depth = size + opacity.

### P5 — Shapes as dot outlines: UI cards (7:0–12:5, 19:5–22:75)
The dots re-form into three stacked UI cards drawn as dotted outlines (rectangle border, a 3×3
dot icon, two text bars), tilted in perspective (≈ −8° rotation, slight skew). Each card is
animated with the verb on the left:
- `rise()` "An easy entrance." — cards assemble from scattered dots, rising into place.
- `leave()` "A clean exit." — cards dissolve dot by dot upward and fade.
- `reveal()` "When it enters view." — cards appear one by one as a scroll brings them in.
The verb is the title, the shape performs it (same rule as our "the text describes the motion").

### P6 — A word made of dots morphs into another (13:75–18:0)
"move" is drawn as a dot-matrix word (dots sampled on a grid inside the glyph shapes). The letter
that changes ("v" → "r") explodes into a local swirl while the unchanged letters stay; the new
letter regroups in the accent colour, then "e" re-forms too ("move" → "more"). Only the dots of
the changing letters move: the eye follows the difference.
**Plug use: "129 €" → "214 €" as dot digits, only the changing digits re-form.**

### P7 — Converge → sphere → cube wireframe → iris flip (27:0–30:0)
All objects collapse into one sphere, which squares itself into a cube (dots slide onto the 12
edges, then the dots become continuous lines, white then accent). A white dot grows at the cube's
centre into a disc that floods the frame (iris) and the ground flips to off-white with the cube
now drawn in the accent: the film ends in negative.

### P8 — Logo lock-up (30:0–35:0)
Cube shrinks and moves up, the wordmark rises under it (mask), then the URL and an install
command type on, each 0.4 s apart; 3 s hold.

## 3. Building it in Plug (Remotion)

- A `DotCloud` component: N dots, a list of target layouts (arrays of N points, each layout
  padded/resampled to N), and a timeline of morphs; deterministic noise via `rng`.
- Layout generators: disc, Fibonacci sphere (3D, projected with a slow rotation), hex grid,
  dotted rectangle outline, text sampled into a dot grid (draw the text in an offscreen canvas,
  keep the grid points where alpha > 0.5), cube edges.
- Pair dots between layouts by sorting both on the same key (angle or x then y) so motion stays
  coherent; `pairUnits` in `src/components/morph.tsx` already does a version of this.
- Our existing units morphs (seats ↔ rooms ↔ grid) are the same idea at small N: this skill is
  their large-N, particle version.
- Keep composition first (text block measured, safe area) and run `scripts/qa.mjs`.

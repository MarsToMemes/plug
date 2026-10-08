---
name: motion-reel-techniques
description: Catalogue of "studio showreel" motion techniques measured frame by frame on a 15 s reference reel (tempo-locked cuts, monitor HUD, iris reveal with chromatic edge, letters collapsing into dots, easing comparison with onion skin, swarm merge and match cut, spring shape morph with satellites, Truchet tile field and rotation wave, dot grid to 3D surface, kinetic type on half beats, logo lock-up outro). Use when a Plug video needs high-energy motion design, a hook, a chapter opener or a showreel-like sequence, or when the user mentions "le reel", "showreel", "style reel" or these effects.
---

# Motion reel techniques

Reference: "Claude Motion Reel — made with Opus 5.5" by @stephanlivera (X, 25 Sep 2026), 15 s,
1920×1080, 60 fps. It was analysed frame by frame (10 fps overview + 60 fps on every transition).
**The reference video is not in the repository and must not be:** it belongs to its author. We
reuse techniques, never its assets, its texts or its logo (the asterisk lock-up is a brand mark).

Implement in Remotion with our own primitives (`motion/pricing/src/motion/`: `useT`, `phases`,
`keys`, curves `C`, `Smear` for motion blur, `Camera`/`Layer`) and keep the composition rules of
`docs/motion-language.md` (measure, grid, safe area, QA before motion).

## 1. The grammar that makes it feel "pro"

- **Everything is locked to a tempo.** 128 BPM: beat = 0.469 s = 28.1 frames at 60 fps,
  bar = 1.875 s. Every section cut lands on a bar line (1.88, 5.63, 7.50, 11.25 s = bars 1, 3, 4,
  6). Inside the kinetic-type section, cuts land on **half beats** (every 0.234 s = 14 frames).
  Big motions start on a beat, accents land on the next beat. Build a `beat(n)` / `bar(n)` helper
  and place every key on it; never hand-pick times.
- **One idea per bar, one transformation into the next.** Each section ends by turning its main
  object into the next section's object (asterisk → point → iris; letters → dots → balls;
  balls → one ball → background circle; circle → square → tiles; tiles → dots → 3D grid;
  torus → fly-through → black → type). Almost no plain cuts: they are match cuts.
- **Snap, not glide.** Entries are very fast (4–10 frames) with heavy motion blur, then a hard
  stop and a hold. The blur disappears the instant the object stops (our `Smear` does this).
- **Flat, saturated, few colours**, swapped per section as full-frame backgrounds:
  near-black `#0D0D0F`, red-orange `#F04A3A`, cream `#F1EDE5`, electric blue `#2E2BF2`,
  acid yellow `#DDF542`. Ink is black on light grounds, cream on dark ones. Accent: red-orange.
- **Three type voices**: an extra-wide black grotesque for single words (Google option:
  *Archivo* at wdth 125 / wght 900, or *Unbounded* Black); an italic serif for the human line
  ("motion designer"; we have *Instrument Serif Italic*); a monospace for every label
  (*Geist Mono*, uppercase, tracking ≈ 0.15 em, 13–15 px).

## 2. The monitor HUD (constant frame)

Present on every shot, it sells "made by a studio":

- four thin corner brackets (≈ 20 px legs, 1.5 px) at 44 px from the edges;
- top-left: `NAME` (bold) + `MOTION REEL — 2026` (muted); top-right: `0N — CHAPTER`
  (01 IDENTITY, 02 EASING, 03 MORPHING, 04 SYSTEMS, 05 DEPTH, 06 KINETIC TYPE…), changes on the cut;
- bottom-left: running timecode `00:00:SS:FF` + `60 FPS`; a thin progress line under it that
  grows with the film;
- bottom-right: `128 BPM` + four squares (filled square = current beat) + `BAR n/8`;
- per-section technical captions in the same mono, muted: `MORPH CIRCLE → TRIANGLE`,
  `T 1.00  ROT 000.0°`, `SPRING F=2.6 ζ=0.30`, `270°` / `90°`, `VERTICES 576 · FOCAL 1400`.
  They show the parameters actually driving the animation (live values, not decoration).
- HUD colour follows the ground (cream on dark, black on light), labels at 50–70 % opacity.

## 3. The techniques (measured)

Times are seconds in the reference; frames at 60 fps.

### T1 — Seed → ring → burst (intro, 0.0–1.9)
A 1-px point with a thin ring appears (0.1), ring scales up while the point grows into a red dot
(0.2–0.4); a second wide ring sweeps out (0.5–0.7) as 12 red strokes grow from the centre one after
the other (clockwise stagger ≈ 1 frame each), forming an asterisk. Circular mono text orbits it
(1.0–1.6) and slowly rotates. **Implode**: in 10 frames everything shrinks with rotation and radial
blur into a single white point (1.65–1.80), holds 3 frames.

### T2 — Iris reveal with chromatic edge (1.85–2.05)
From the point, a cream disc expands with a soft **violet/green fringe** (chromatic aberration: the
disc is drawn 3 times, R/G/B offsets of 4–8 px, screen blend, blurred edge). Inside it, a second
disc in the next ground colour (red) expands 2–3 frames later; the next scene is masked by it. Total
≈ 12 frames, ease = expo-out. The title starts arriving *during* the reveal.

### T3 — Word arrival with per-letter blur and width breathing (2.0–3.2)
Letters slide in from the right, staggered ≈ 2 frames, each with horizontal motion blur, overshoot
of a few px and stop. Then the word "breathes": a wave runs along the letters changing each glyph's
**width** (condensed ↔ extended, variable `wdth` axis, or `scaleX` per letter while keeping the
word's total width), 2 cycles. Subtitle in italic serif **types on** word by word with a dot
cursor ("motion . ." → "motion designer").

### T4 — Letters collapse into dots, then soft diagonal wipe (3.2–3.6)
Left to right, every 3 frames, a letter blurs, shrinks into a black dot (scale → 0.12, 6 frames) and
stays as a dot on the baseline. Meanwhile a **diagonal soft-edge wipe** (≈ 20° angle, feather
≈ 150 px) brings the cream ground from the bottom right. The dots then drift on a curve (motion
blur, slight stretch along the velocity) and become the six balls of the next section.
**Strong fit for Plug:** words → data points (seats, rooms, prices).

### T5 — Easing comparison with onion skin (3.6–5.2)
Title in italic serif ("Six ways to get from A to B."). Six rows: red index `01…06`, mono name
(`linear`, `ease-in-out`, `expo-out`, `back-out`, `elastic`, `bounce`), a tiny curve glyph, then a
thin track from A to B with tick marks. Six balls (black / blue / red alternating) run the same
distance in the same duration with their own easing; each leaves **ghost copies** (outline circles
at fixed time steps, fading) and blurs when fast. At B, each ball gets an outline ring when it
lands (overshoot visible on back/elastic/bounce).
**Fit for Plug:** compare price trajectories / demand curves with the same device.

### T6 — Swarm merge → match cut into a new world (5.2–5.6)
The six balls leave their rows, fly along curved paths with strong blur and **merge into one blue
ball** (5.3–5.45), the page dissolves around them; the ball holds, then expands into the full blue
ground with a red glow ring (5.55–5.6): the object *becomes* the next background.

### T7 — Spring morph with satellites (5.6–7.5)
Central cream shape morphs circle → triangle → star → square, one morph per beat, driven by a
**spring** (frequency 2.6, damping 0.30: visible wobble and slight rotation on arrival). Twelve small
satellites on a dashed orbit morph into the same shape, staggered around the circle. Echo outlines
(thin red copies of the previous frames) trail behind the morph. Crosshair lines and degree labels
around. Implementation: resample both outlines to the same number of points (e.g. 128, starting at
the top, same winding) and interpolate; rotate by the spring overshoot. Exit: satellites blur into
radial streaks and vanish, square holds alone, ground cuts to black on the bar (7.5).

### T8 — Subdivide → Truchet field → rotation wave (7.5–9.5)
The square splits into a 3×3 grid (gaps appear), tiles become **Truchet tiles** (quarter-circle
arcs, 2 orientations) that spawn outwards in rings from the centre (each ring 2 frames later),
until the screen is a seamless maze of cream bands (≈ 18 px stroke on ≈ 110 px cells). Then a
**wave front** sweeps across: tiles inside the front turn 90° (eased), shrink slightly and turn
red-orange, then return to cream behind it; the front goes left→right then back. Deterministic
random orientation per cell (seeded).

### T9 — Dissolve to dot grid → 3D surface → shape → fly-through (9.5–11.2)
From the centre, tiles shrink into points (radial dissolve): a regular **dot grid** appears (some
dots red). The grid tilts into perspective (a floor), a sine wave runs through it, then the surface
wraps into a vase/sphere, then a torus, slowly rotating (points only, depth fog, red points
scattered). Finally the camera flies **through** the torus hole (zoom with radial streak blur) to
black (11.1–11.25). Use a small 3D point projector (we already have one in `Scene17.tsx`).

### T10 — Kinetic type on half beats (11.25–13.1)
One word per half beat, each with its own ground and its own entry, all with heavy blur:
- `EASE` on red: overlapping duplicate copies sliding and snapping together (with RGB split);
- `IN.` on black: letters slam in from the right, blur ≈ 40 px, red period dot pops last;
- `EASE` on cream in blue: letters rise from below (vertical blur), slight vertical stretch;
- `OUT.` on blue: arrives from the left with blur and snaps;
- `NEVER` on acid yellow: letters drop in one by one from above along an arc with rotation, then
  the word **multiplies into a scrolling wall** (solid row in the middle, outline rows above and
  below, rows scrolling in alternating directions);
- `LINEAR.` on black: constant-speed slide (literally linear), a thin diagonal line draws a graph
  behind, exits huge and blurred to the left.
The words themselves describe the motion they perform (the text *is* the demo).

### T11 — Logo lock-up outro (13.1–15.0)
Ring burst + particle scatter (small black/blue/red dots) on red; the symbol spins in with a spring;
the word reveals letter by letter **from behind the symbol** (masked, blurred), subtitle types on,
a thin rule draws under it, then one line of mono metadata (`SHOWREEL 2026 · 15 SECONDS · …`).
Hold ≈ 1 s with the symbol slowly rotating and particles settling.

## 4. Using it in Plug

- Pick the technique for its **meaning** (T4 words → data points, T5 comparing trajectories, T6
  merging many into one, T7 one thing becoming another, T8/T9 systems and scale, T10 a hook).
- This language is louder than the pricing documentary's editorial style: use it for hooks,
  chapter openers and key reveals, not for every shot, unless the whole film adopts it.
- Tempo first: choose a BPM that matches the music, then put every key on beats.
- Keep the composition engine and the QA (`scripts/qa.mjs`) for every shot.

## 5. Implemented blocks (motion/pricing)

- `src/reel/beat.ts` — tempo grid: `beat(n)`, `hit(wordSecond)` (snaps a word to the nearest half
  beat within 0.13 s, otherwise keeps the word: the voice always wins). "Subtle Shifts" = 120 BPM,
  first beat 0.42 s.
- `src/reel/Hud.tsx` — the monitor frame (§2), ink colour per ground, live captions.
- `src/reel/Word.tsx` — measured big word, letter by letter: entries `slamR`, `slamL`, `drop`,
  `rise`, `linear`, `type`, `pop`; directional motion blur from each letter's real velocity (SVG
  filter); `breathe` (T3, letters re-packed so the word keeps its width); `collapse` (T4, letters →
  dots); `exit`. `layoutWord()` gives the validated layout (fit to the safe width, optical centre).
- `src/reel/fx.tsx` — `Seed` (T1), `Iris` + `irisRadius` (T2), `Odometer` (rolling digits),
  `Wall` (T10 multiplied word), `wipeMask` (soft diagonal wipe).
- First use: `src/scenes/Hook01.tsx` (the episode's first 27.3 s, on the voice and on the beat).
- Font: Archivo variable (`public/fonts/archivo`, OFL), set at weight 900 and `font-stretch: 125%`
  (`THEME.wide`, `measure()` font `'wide'`).

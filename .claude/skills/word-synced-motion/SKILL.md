---
name: word-synced-motion
description: Catalogue of "word-synced" motion techniques measured frame by frame on a 2:37 reference music video (P(doom), generative three.js, word-synced karaoke type). Every word appears when it is said and lives INSIDE the picture - written by a spark along a curve, laid on a 3D surface or an arc, typed in an AI prompt box with token probabilities, typed into a paper form then stamped, lit by a burning fuse, labelling a diagram as it animates, counted by mechanical odometers. Use for any Plug video built on a voice-over or lyrics with word timings (Whisper), especially documentary explainers, or when the user mentions "karaoke", "P(doom)", "texte synchronisé", "mots synchronisés".
---

# Word-synced motion

Reference: "P(doom) — a generative three.js music video" by @threejs (X, 27 Sep 2026), 2:37,
1280×720, 60 fps, song at 132 BPM. Its own description: "every frame is a function of song time",
"word-synced karaoke type". Analysed at 1 fps (whole film) and 10 fps on 10 passages.
**The reference video is not in the repository and must not be:** it belongs to its authors. We
reuse techniques, never its images, lyrics, characters or jokes.

**Why it matters for Plug:** its palette is ours (near-black, one warm orange, off-white paper),
and its principle fits a voice-over documentary exactly: we already have word timings
(`motion/pricing/voice/transcript.json`, Whisper, `{w, s, e}` per word). Build on
`docs/motion-language.md` (composition and QA first) and `src/motion/` (time, phases, blur).

## 1. The principle

1. **The word appears when it is said** (its onset `s`), never before; letters reveal at the
   speaking rate (between `s` and `e`, letter by letter).
2. **The word lives in the picture**: it is attached to an object of the scene (a curve, a surface,
   a box, a sheet, a cable) and moves with it. A caption floating over a picture is the exception.
3. **Two states per word**: *ghost* (the line already placed, 10–20 % opacity, so the eye knows
   where it goes) → *lit* (full ink at its onset). The key word of the line is *accent*: orange,
   often larger or heavier.
4. **Time is the only input**: every element is a pure function of the voice time (no free-running
   animation); a scene can be re-rendered from any frame.
5. **One scene per line or idea**, cut on phrase boundaries (not every beat); inside a scene the
   camera drifts slowly (dolly, slow orbit) so nothing is ever frozen.

## 2. The techniques (measured)

Times are in the reference.

### W1 — Ghost line, then karaoke light (0:02–0:06, 0:09–0:10, 0:39–0:41)
The full line is laid out first in a dim grey; as each word is said it turns white, the key word
turns orange ("I see sparks of **AGI**"). Variant: the accent word is a separate, much bigger
object ("AGI" ≈ 4× the line size) whose letters build one by one, still ghost until lit.

### W2 — The spark write head (0:00–0:10, 1:42–1:45)
A small bright point (white core, orange glow, a few particles) **draws** the drawing (a
unicorn plotted stroke by stroke next to a code panel listing the drawing commands, each line of
code highlighting when its stroke is drawn) and **writes** the words: the letters drop out of the
spark as it travels. The spark is the visual equivalent of the voice: where it is, things happen.

### W3 — Text riding a curve (0:09–0:11)
A chart (a loss curve with axes and mono labels) is drawn by the spark; the lyric is written on
the curve and follows it, letters rotating with the tangent and climbing when the curve jumps
("There was a s-u-d-d-e-n…"). At the end the camera follows the spark off the chart.
**Plug use: prices written along the price curve, letters jumping with each price rise.**

### W4 — Text laid on a 3D surface (0:11–0:13)
A topographic terrain (contour lines, perspective, slow dolly). The spark descends a line onto it
and writes the lyric along a contour, in perspective ("in your training…"); a second line of the
lyric then rides the slope. Text follows the surface's depth and fog.

### W5 — AI prompt box with live token probabilities (0:17–0:22, 0:53–0:58, 1:29–1:34)
A dark input bar ("› ChatGPT, please don't eat me alive", monospace, caret blinking) on top of a
glowing concentric-rings background. Each word is **typed** at its onset; the word being typed is
orange and underlined, the rest white. A floating panel `p(next | context)` lists 3–5 candidate
next tokens with bars and probabilities (the chosen one highlighted) and updates per word
("computing…" between words). Footer metadata in tiny mono (`PROMPT 01 · T 0.7 · top-p 0.95 ·
seed 0x2A`). When the line overflows, the field scrolls left. Exit: the bar tilts in 3D and flies
into a white flash (hard cut on the flash).
**Plug use: "the algorithm" scenes - the pricing engine choosing the next price with candidate
prices and probabilities.**

### W6 — Flash cut to giant word cards (0:22–0:24, 0:59)
After a white flash, one word per beat on its own full-frame card ("I'M / UPPING / MY / P(DOOM)"),
condensed heavy grotesque, cream on black or black on cream; letters arrive with stacked offset
echoes (3–4 trailing copies, like a step print) and the word can be partly outlined, then filled.

### W7 — Curved text around an object (0:42–0:49)
Letters set on an arc around a glowing ring (a black hole in a warped grid), appearing letter by
letter along the arc as they are said; the next words take the lower arc; the grid bends toward
the object (space warped by it) and the camera slowly orbits.

### W8 — Mechanical odometer (1:06–1:09)
"1E30 FLOP/s": each part of the label lights orange as it is said ("1", "E30", "FLOP", "/s",
with tiny mono glosses under each: *one*, *e*, *thirty*…). Below, a row of physical counter
wheels (cream drums with shading and edges) spin with vertical blur; more and more wheels are
added (the camera pulls back) until the full number of zeros is shown.
**Plug use: prices and quantities as physical counters (we have `PriceCounter`, add drums).**

### W9 — The paper form (1:10–1:13, recalled at 2:35)
A cream sheet ("FORM 7-B", official header, numbered fields, typewriter mono): the line is
**typed into a field** at speaking rate, a checkbox gets an X, a red stamp **slams** ("SAFE
ENOUGH": fast scale-down with motion blur + a 2-frame camera shake + slight rotation), a
signature is **drawn** stroke by stroke. Paper grain, soft vignette, gentle perspective; the
camera glides from field to field. The same sheet returns at the end as a callback.
**Plug use: fare rules, terms and conditions, a hotel booking confirmation, a policy.**

### W10 — A diagram labelled while it works (1:14–1:20)
On paper: a neural network diagram. "Forward" lands above it and the layers light orange one
after the other (the forward pass), each next word lands above the layer it describes; then
"backward" is written **mirrored** while the pass goes back. Next line: a block diagram (von
Neumann) is crossed out by two red strokes when the word "obsolete" is said.
**Plug use: the demand → availability → price loop, lit node by node as the voice names them.**

### W11 — Absurd escalation counter (2:20–2:28)
"P(DOOM)" big mono number on a gauge line: 1.00 → 1.01 → 1.10 → 1.50 → 2.00 → 3.14 → 10 →
1,000 → a wall of zeros (1e30) → 1e1000, the gauge zooming out each time, with tiny deadpan
footnotes. Escalation by successive orders of magnitude, each held about a beat.
**Plug use: a price climbing 129 → 219 → 349 €, held, then exaggerated.**

### W12 — Karaoke by fire (1:42–1:45)
The line is laid along a braided fuse (cable in perspective); the burning spark runs along it and
each letter it passes turns from grey to glowing orange (the flame IS the karaoke cursor); the
last word swells and the camera rushes along the fuse.

### W13 — HUD callouts on a 3D object (0:31–0:37)
A sculpted 3D creature; thin orange leader lines and small boxes label its features (each eye)
with tiny mono values; the lyric is stacked on the left, each word linked to a callout.

### W14 — Opening and closing on the point
The film opens on an orange point at the origin of plot axes and ends on the same point (plus
a "Regenerate" button): a single motif frames the whole piece.

## 3. Style constants

- Ground near-black (#0b0b0c) with a faint grid or contour lines; one accent orange (≈ #ff5a1f,
  with a glow), off-white ink; cream paper sections for documents and diagrams.
- Type: a heavy grotesque for lyrics (white/orange), condensed heavy for the cards, monospace
  for interfaces and metadata, an italic serif for quiet lines ("What did … see?").
- Film finish: slight bloom on lights, vignette, very light grain; motion blur on fast moves.
- Small mono metadata everywhere (axis labels, field numbers, probabilities): it makes the
  picture read as a real instrument.

## 4. Building it in Plug (Remotion)

- Word timings: `voice/transcript.json` segments → words `{w, s, e}` (seconds). Build a helper
  `wordsBetween(a, b)` and a `useWordState(word)` returning `ghost | lit(progress) | done`.
- A `KaraokeLine` component: lays the line out with `measure()` (composition first, QA), draws
  ghosts, lights each word at `s`, letters revealed between `s` and `e`, accent word in orange.
- Attach text to geometry: compute positions along an SVG path (`getPointAtLength` precomputed,
  or the analytic curve) for W3/W7/W12; reuse the 3D projector of `Scene17.tsx` for W4.
- A `Spark` component (core + glow + particles, deterministic with `rng`) used as the write head.
- Keep every element a function of time (`useT`), no free-running animation; respect the safe
  area and run `scripts/qa.mjs` on the passage.

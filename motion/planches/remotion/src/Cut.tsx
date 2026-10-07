import React from 'react';
import { AbsoluteFill, Series, useCurrentFrame } from 'remotion';
import { P4_DURATION, Plate04 } from './P4';
import { P5_DURATION, Plate05 } from './P5';
import { P6_DURATION, Plate06 } from './P6';

/**
 * Planches 06 → 05 → 04, cut like a short: snap punch-in zooms on sentence starts, and clean
 * word-by-word captions (grey → black as each word is "said", punch words in a black pill).
 * The captions follow a written narration; with a recorded voice they would follow its timing.
 */
export const CUT_DURATION = P6_DURATION + P5_DURATION + P4_DURATION;
const O5 = P6_DURATION, O4 = P6_DURATION + P5_DURATION;

type Cue = { at: number; text: string; punch?: boolean; end?: number };
// Narration (French), frame where each line starts.
const CUES: Cue[] = [
  { at: 4, text: 'Ce visage semble unique.' },
  { at: 50, text: 'Mais regardons à l’intérieur.' },
  { at: 120, text: 'Sous la peau, des cellules.' },
  { at: 196, text: 'Et dans chacune, le même génome.' },
  { at: 250, text: 'Il porte de nombreuses petites variations.' },
  { at: 322, text: 'Certaines comptent un peu plus que d’autres.' },
  { at: 392, text: 'Mais aucune ne dessine un visage à elle seule.' },
  { at: 450, text: 'Chacune agit un peu, à plusieurs endroits.' },
  { at: 512, text: 'Et chaque région en reçoit beaucoup.' },
  { at: 566, text: 'C’est ce qu’on appelle un trait complexe.', end: 640 },
  { at: O5 + 10, text: 'On imagine souvent un gène pour le nez,' },
  { at: O5 + 50, text: 'un pour les yeux, un pour la mâchoire.' },
  { at: O5 + 118, text: 'C’est faux.', punch: true },
  { at: O5 + 186, text: 'Des dizaines de gènes agissent en même temps,' },
  { at: O5 + 246, text: 'sur plusieurs régions à la fois.', end: O5 + 296 },
  { at: O5 + 412, text: 'Et pourtant, tout converge vers un seul visage.' },
  { at: O4 + 12, text: 'Imaginez deux personnes sans aucun lien de parenté.' },
  { at: O4 + 118, text: 'Comparez leurs traits, point par point.' },
  { at: O4 + 252, text: 'Les deux visages se superposent presque.' },
  { at: O4 + 392, text: 'En 2022, des chercheurs ont fait le test.' },
  { at: O4 + 452, text: 'D’abord la reconnaissance faciale,' },
  { at: O4 + 504, text: 'puis l’analyse de leur ADN.' },
  { at: O4 + 580, text: 'Plusieurs paires partageaient de nombreux variants.', punch: true },
  { at: O4 + 690, text: 'Sans être de la même famille.', end: CUT_DURATION - 16 },
];
// Words to set in bold inside a line.
const BOLD = new Set(['unique.', 'génome.', 'variations.', 'aucune', 'complexe.', 'faux.', 'dizaines', 'converge', 'parenté.', 'superposent', '2022,', 'ADN.', 'famille.']);

// Camera: snap punch-ins (ease-out over ~6 frames), then a very slow drift.
type Shot = { at: number; s: number; x: number; y: number };
const FACE = { x: 1425, y: 558 };
const SHOTS: Shot[] = [
  { at: 0, s: 1, ...FACE }, { at: 50, s: 1.12, ...FACE }, { at: 196, s: 1, x: 960, y: 540 }, { at: 250, s: 1.14, x: 960, y: 520 },
  { at: 322, s: 1.22, x: 760, y: 500 }, { at: 392, s: 1, x: 960, y: 540 }, { at: 450, s: 1.12, x: 1180, y: 540 }, { at: 566, s: 1.08, x: 960, y: 300 },
  { at: 650, s: 1, x: 960, y: 540 },
  { at: O5 + 10, s: 1.12, x: 700, y: 470 }, { at: O5 + 118, s: 1.2, x: 640, y: 470 }, { at: O5 + 186, s: 1, x: 960, y: 540 },
  { at: O5 + 246, s: 1.12, x: 1200, y: 520 }, { at: O5 + 300, s: 1, x: 960, y: 540 }, { at: O5 + 412, s: 1.15, ...FACE }, { at: O5 + 492, s: 1, x: 960, y: 540 },
  { at: O4 + 12, s: 1.06, x: 960, y: 520 }, { at: O4 + 118, s: 1.12, x: 960, y: 540 }, { at: O4 + 252, s: 1.22, x: 960, y: 560 },
  { at: O4 + 392, s: 1, x: 960, y: 540 }, { at: O4 + 504, s: 1.14, x: 960, y: 560 }, { at: O4 + 580, s: 1.06, x: 960, y: 540 }, { at: O4 + 690, s: 1, x: 960, y: 540 },
];
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
function camera(f: number) {
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1]!.at <= f) i++;
  const cur = SHOTS[i]!, prev = SHOTS[Math.max(0, i - 1)]!;
  const t = expoOut((f - cur.at) / 7);
  const drift = 1 + Math.min(0.03, (f - cur.at) * 0.0004) * (cur.s > 1 ? 1 : 0);
  const s = (prev.s + (cur.s - prev.s) * t) * drift;
  const x = prev.x + (cur.x - prev.x) * t, y = prev.y + (cur.y - prev.y) * t;
  const moving = f - cur.at < 5 && i > 0 && Math.abs(cur.s - prev.s) > 0.04;
  return { s, x, y, blur: moving ? 1.2 * (1 - (f - cur.at) / 5) : 0 };
}

const Captions: React.FC<{ f: number }> = ({ f }) => {
  let i = -1;
  for (let k = 0; k < CUES.length; k++) if (CUES[k]!.at <= f) i = k;
  if (i < 0) return null;
  const cue = CUES[i]!;
  const end = cue.end ?? (CUES[i + 1]?.at ?? CUT_DURATION) - 2;
  if (f > end) return null;
  const words = cue.text.split(' ');
  // Words are "said" at a natural pace (about 3 per second), never slower than the line allows.
  const per = Math.min(9, Math.max(5, (end - cue.at - 12) / words.length));
  const appear = Math.min(1, (f - cue.at) / 4);
  if (cue.punch) {
    const pop = 0.92 + 0.08 * expoOut((f - cue.at) / 6);
    return (
      <div style={{ position: 'absolute', left: 0, width: 1920, bottom: 64, display: 'flex', justifyContent: 'center', opacity: appear }}>
        <div style={{ background: '#161514', color: '#f5f3ee', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 50, letterSpacing: '-0.01em', padding: '14px 30px', borderRadius: 18, transform: `scale(${pop})`, boxShadow: '0 10px 30px rgba(0,0,0,0.18)', maxWidth: 1500, textAlign: 'center' }}>
          {cue.text}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: 0, width: 1920, bottom: 70, display: 'flex', justifyContent: 'center', opacity: appear }}>
      <div style={{ display: 'flex', gap: '0.28em', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1500, fontFamily: 'Inter, sans-serif', fontSize: 50, letterSpacing: '-0.01em', textShadow: '0 0 18px rgba(245,243,238,1), 0 0 6px rgba(245,243,238,1)' }}>
        {words.map((w, k) => {
          const t = f - cue.at - k * per;
          const said = t >= 0;
          const pop = said ? 1 + 0.06 * (1 - expoOut(t / 5)) : 1;
          return (
            <span key={k} style={{ display: 'inline-block', color: said ? '#161514' : '#b8b2a7', fontWeight: BOLD.has(w) ? 800 : 600, transform: `scale(${pop})` }}>{w}</span>
          );
        })}
      </div>
    </div>
  );
};

export const Cut060504: React.FC = () => {
  const f = useCurrentFrame();
  const c = camera(f);
  return (
    <AbsoluteFill style={{ background: '#f5f3ee', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transformOrigin: `${c.x}px ${c.y}px`, transform: `scale(${c.s})`, filter: c.blur > 0.05 ? `blur(${c.blur}px)` : undefined }}>
        <Series>
          <Series.Sequence durationInFrames={P6_DURATION}><Plate06 captioned /></Series.Sequence>
          <Series.Sequence durationInFrames={P5_DURATION}><Plate05 startSketched captioned /></Series.Sequence>
          <Series.Sequence durationInFrames={P4_DURATION}><Plate04 aDrawn captioned /></Series.Sequence>
        </Series>
      </AbsoluteFill>
      <Captions f={f} />
    </AbsoluteFill>
  );
};

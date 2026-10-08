import React from 'react';
import { AbsoluteFill } from 'remotion';
import { S01 } from '../data/scene01';
import { measure } from '../layout/measure';
import { C, clamp, mix, useT } from '../motion/time';
import { beat, hit } from '../reel/beat';
import { Iris, Odometer, Seed, Wall, irisRadius, wipeMask } from '../reel/fx';
import { Hud } from '../reel/Hud';
import { Word, layoutWord } from '../reel/Word';
import { THEME } from '../theme';

/**
 * Hook — the first 27.3 s of the episode in the reel language (skill motion-reel-techniques),
 * on the narration's own timing (voice second = scene second). Every cut and accent is on the
 * music's grid (120 BPM, half beats), snapped to the word that says it (beat.hit).
 *
 * "Vous l'avez probablement déjà vécu" seed → iris · "vous cherchez un billet d'avion" route ·
 * "287 euros" slam → "vous fermez l'application" letters collapse into dots, wipe to black ·
 * "quelques heures plus tard" time runs · "341 euros" digits roll · "le lendemain, 476 euros"
 * rise + wall · "l'avion / le siège / le trajet" one word per beat, each doing what it says ·
 * "pourquoi le prix change-t-il ?" · "qui décide de ce prix ?" closes into the ring (bridge 01 → 02).
 */
const BLUE = '#2f2cf2';
const DARK = THEME.bg, CREAM = THEME.ink, ORANGE = THEME.accent;

// Voice words (voice/transcript.json) → grid hits.
const T = {
  seed: 0.05, rays: beat(0), implode: hit(1.92), // "vécu" 1.48
  route: hit(2.44), // "vous cherchez"
  p287: hit(4.44), close: hit(6.08), wipe: hit(6.32),
  later: 7.90, back: hit(9.18),
  p341: hit(10.22),
  next: hit(11.86), p476: hit(13.34), wall: hit(13.34) + 0.25,
  still: hit(14.78),
  plane: hit(16.0), seat: hit(17.74), trip: hit(19.74), same: hit(20.44),
  why: hit(21.56), price: hit(22.22), change: hit(23.48), mark: hit(24.14),
  who: hit(24.42), qui: hit(25.40), decide: hit(25.58), dece: hit(26.04), ring: 26.45,
};

type Shot = { from: number; ground: string; hud: string; caption?: { left?: string; right?: string } };
const SHOTS: Shot[] = [
  { from: 0, ground: DARK, hud: CREAM },
  { from: T.route, ground: ORANGE, hud: DARK, caption: { left: 'Recherche · aller simple · 1 adulte' } },
  { from: T.p287, ground: CREAM, hud: DARK, caption: { left: 'Prix affiché', right: '287 €' } },
  { from: T.wipe + 0.2, ground: DARK, hud: CREAM, caption: { left: 'Application fermée' } },
  { from: T.p341, ground: ORANGE, hud: DARK, caption: { left: 'Écart', right: '+19 %' } },
  { from: T.next, ground: BLUE, hud: CREAM, caption: { left: 'Écart', right: '+66 %' } },
  { from: T.still, ground: DARK, hud: CREAM },
  { from: T.seat, ground: CREAM, hud: DARK, caption: { left: 'Siège', right: 'identique' } },
  { from: T.trip, ground: ORANGE, hud: DARK, caption: { left: 'Trajet', right: 'identique' } },
  { from: T.same, ground: DARK, hud: CREAM, caption: { left: 'Différence', right: 'aucune' } },
  { from: T.why, ground: ORANGE, hud: DARK },
  { from: T.who, ground: DARK, hud: CREAM },
];
const shotAt = (t: number) => [...SHOTS].reverse().find((s) => t >= s.from)!;

/** A full-frame ground. `push`: a slow camera push from that time, so a held word never freezes. */
const Ground: React.FC<{ color: string; children?: React.ReactNode; style?: React.CSSProperties; push?: [number, number] }> = ({ color, children, style, push }) => (
  <div style={{ position: 'absolute', inset: 0, background: color, overflow: 'hidden', ...style }}>
    {push ? <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + 0.035 * Math.max(0, push[1] - push[0])})` }}>{children}</div> : children}
  </div>
);

export const Hook01: React.FC = () => {
  const t = useT() / 1000;
  const shot = shotAt(t);
  const end = C.exit(clamp((t - T.ring) / 0.4)); // the question closes towards the ring
  const QD = pair('Qui', 'Décide', 250);
  return (
    <AbsoluteFill style={{ background: DARK }}>
      {/* A — seed (0 → 2.4) */}
      {t < T.route + 0.5 && <Ground color={DARK} style={{ transform: 'scale(1.7)' }}><Seed t={t} at={T.seed} rays={T.rays} implode={T.implode} label="287 € · 341 € · 476 € · 287 € · 341 € · 476 € · " /></Ground>}

      {/* B — route, opened by the iris */}
      {t >= T.route && t < T.p287 && (
        <>
          <Iris t={t} at={T.route} />
          <Ground color={ORANGE} style={{ clipPath: `circle(${irisRadius(t, T.route)}px at 960px 540px)` }}><Route t={t} /></Ground>
        </>
      )}

      {/* C — 287 €, then the letters collapse into dots and the app closes (diagonal wipe) */}
      {t >= T.p287 && t < T.wipe + 0.5 && (
        <Ground color={CREAM} push={[T.p287, t]}>
          <Word text="287 €" t={t} at={T.p287} size={330} color={DARK} entry="slamR" stagger={0.03} collapse={T.close} />
        </Ground>
      )}
      {t >= T.wipe && t < T.p341 && <Ground color={DARK} style={t < T.wipe + 0.4 ? wipeMask(t, T.wipe) : undefined}><Later t={t} /></Ground>}

      {/* E — 341 €: the digits roll from 287 */}
      {t >= T.p341 && t < T.next && (
        <Ground color={ORANGE} push={[T.p341, t]}>
          <Odometer t={t} at={T.p341 - 0.05} from={287} to={341} size={330} cx={960} cy={540} color={DARK} dur={0.42} />
        </Ground>
      )}

      {/* F — the next day, 476 € rises and multiplies */}
      {t >= T.next && t < T.still && (
        <Ground color={BLUE} push={[T.next, t]}>
          <Wall t={t} at={T.wall} text="476 €" size={150} cy={540} color={CREAM} rows={3} />
          <Word text="Le lendemain" t={t} at={T.next} size={110} font="serif" italic color={CREAM} entry="type" stagger={0.022} cy={540} exit={{ at: T.p476 - 0.22, to: 'up', dur: 0.16 }} />
          <Word text="476 €" t={t} at={T.p476} size={300} color={CREAM} entry="rise" stagger={0.03} />
        </Ground>
      )}

      {/* G — "et pourtant" */}
      {t >= T.still && t < T.plane && (
        <Ground color={DARK}>
          <Word text="Et pourtant" t={t} at={T.still} size={110} font="serif" italic color={CREAM} entry="type" stagger={0.03} />
        </Ground>
      )}

      {/* H — same plane / seat / trip: one word per beat, each doing what it says */}
      {t >= T.plane && t < T.seat && (
        <Ground color={DARK} push={[T.plane, t]}>
          <Same t={t} at={T.plane} noun="Avion" entry="linear" color={ORANGE} ink={CREAM} />
        </Ground>
      )}
      {t >= T.seat && t < T.trip && (
        <Ground color={CREAM} push={[T.seat, t]}>
          <Same t={t} at={T.seat} noun="Siège" entry="drop" color={DARK} ink={DARK} />
        </Ground>
      )}
      {t >= T.trip && t < T.same && (
        <Ground color={ORANGE} push={[T.trip, t]}>
          <Same t={t} at={T.trip} noun="Trajet" entry="slamR" color={DARK} ink={DARK} track />
        </Ground>
      )}
      {t >= T.same && t < T.why && <Ground color={DARK}><Stack t={t} /></Ground>}

      {/* I — why does the price change? */}
      {t >= T.why && t < T.who && (
        <Ground color={ORANGE} push={[T.why, t]}>
          <Word text="Pourquoi" t={t} at={T.why} size={250} color={DARK} entry="drop" stagger={0.04} dur={0.26} cy={470} exit={{ at: T.change - 0.12, to: 'up', dur: 0.16 }} />
          <Word text="Change-t-il ?" t={t} at={T.change} size={190} color={DARK} entry="slamR" stagger={0.028} cy={470} breathe={[T.change + 0.3, T.change + 1.0]} />
          <Word text="le prix, lui," t={t} at={T.price} size={72} font="serif" italic color={DARK} entry="type" stagger={0.03} cy={700} />
        </Ground>
      )}

      {/* J — who decides? then it closes into the ring of the next scene */}
      {t >= T.who && (
        <Ground color={DARK} style={{ transform: `scale(${mix(1, 0.25, end)})`, opacity: 1 - end, filter: end > 0 ? `blur(${(end * 8).toFixed(1)}px)` : undefined }}>
          <Word text="Et surtout" t={t} at={T.who} size={110} font="serif" italic color={CREAM} entry="type" stagger={0.03} exit={{ at: T.qui - 0.25, to: 'fade', dur: 0.1 }} />
          <Word text="Qui" t={t} at={T.qui} size={QD.size} color={CREAM} entry="slamL" stagger={0.03} cy={450} align="left" left={QD.a} />
          <Word text="décide" t={t} at={T.decide} size={QD.size} color={ORANGE} entry="slamR" stagger={0.03} cy={450} align="left" left={QD.b} />
          <Word text="de ce prix ?" t={t} at={T.dece} size={72} font="serif" italic color={CREAM} entry="type" stagger={0.03} cy={680} />
        </Ground>
      )}

      <Hud t={t} total={S01.duration / 30} ink={shot.hud} title="Prix" subtitle="Tarification dynamique" chapter="00 — Prologue" caption={shot.caption} opacity={clamp((t - 0.15) / 0.4) * (1 - clamp((t - 26.1) / 0.3))} />
    </AbsoluteFill>
  );
};

/** Two big words side by side on one line: the size that fits the safe width, centred together with a measured gap. */
function pair(a: string, b: string, max: number) {
  const w = (size: number) => { const wa = layoutWord({ text: a, size }).width, wb = layoutWord({ text: b, size }).width; return { wa, wb, total: wa + 0.3 * size + wb }; };
  const m = w(max);
  const size = m.total > 1696 ? Math.floor(max * 1696 / m.total) : max;
  const { wa, total } = w(size);
  const x = 960 - total / 2;
  return { size, a: x, b: x + wa + 0.3 * size };
}

/** B — "Paris ——— New York": the two cities slam in, the line draws between them. */
const Route: React.FC<{ t: number }> = ({ t }) => {
  const size = 120, gap = 220;
  const wa = layoutWord({ text: S01.route.from, size }).width, wb = layoutWord({ text: S01.route.to, size }).width;
  const x = 960 - (wa + gap + wb) / 2;
  const line = C.inOut(clamp((t - T.route - 0.3) / 0.45));
  return (
    <>
      <Word text={S01.route.from} t={t} at={T.route + 0.08} size={size} color={DARK} entry="slamL" stagger={0.025} align="left" left={x} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <line x1={x + wa + 40} y1={540} x2={x + wa + 40 + (gap - 80) * line} y2={540} stroke={DARK} strokeWidth={4} />
        {line > 0.95 && <path d={`M${x + wa + gap - 58},528 L${x + wa + gap - 40},540 L${x + wa + gap - 58},552`} fill="none" stroke={DARK} strokeWidth={4} />}
      </svg>
      <Word text={S01.route.to} t={t} at={T.route + 0.45} size={size} color={DARK} entry="slamR" stagger={0.025} align="left" left={x + wa + gap} />
    </>
  );
};

/** D — the dots of 287 € become a time line that runs faster and faster: "quelques heures plus tard". */
const Later: React.FC<{ t: number }> = ({ t }) => {
  const L = layoutWord({ text: '287 €', size: 330 });
  const dots = L.glyphs.filter((g) => g.ch !== ' ').map((g) => L.left + g.cx);
  const gather = C.inOut(clamp((t - T.wipe - 0.3) / 0.6));
  const y = mix(L.baseline - L.cap / 2, 600, gather);
  const run = clamp((t - T.later) / (T.back - T.later));
  const speed = run < 1 ? Math.pow(run, 2.2) : 1;
  const stop = C.settle(clamp((t - T.back) / 0.4));
  // Time accelerates (ticks scroll faster and faster), then brakes hard on "vous revenez".
  const scroll = Math.pow(run, 3.2) * 9000 + stop * 160;
  const hours = t >= T.back ? 5 : Math.min(5, Math.floor(speed * 5));
  const lineO = clamp((t - T.later + 0.3) / 0.4);
  const words = [['Quelques', 7.90], ['heures', 8.12], ['plus', 8.28], ['tard,', 8.56]] as const;
  const shown = words.filter(([, s]) => t >= s).map(([w]) => w).join(' ');
  // Typed word by word, the line stays where the whole sentence is centred (no jump).
  const full = layoutWord({ text: words.map(([w]) => w).join(' '), size: 72, font: 'serif', italic: true, upper: false });
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <line x1={160} y1={600} x2={160 + 1600 * lineO} y2={600} stroke={CREAM} strokeOpacity={0.5} strokeWidth={2} />
        {lineO > 0 && Array.from({ length: 60 }, (_, k) => {
          const x = 160 + (((k * 48 - scroll) % 1600) + 1600) % 1600;
          const major = k % 6 === 0;
          return <line key={k} x1={x} y1={600} x2={x} y2={major ? 570 : 588} stroke={CREAM} strokeOpacity={(major ? 0.9 : 0.45) * lineO} strokeWidth={major ? 2.4 : 1.4} />;
        })}
        {dots.map((x, k) => <circle key={k} cx={mix(x, 960 + (k - 1.5) * 38, gather)} cy={y} r={mix(330 * 0.07, 9, gather)} fill={k === dots.length - 1 && run > 0 ? ORANGE : CREAM} />)}
      </svg>
      {shown && <Word text={shown} t={t} at={7.9} size={72} font="serif" italic color={CREAM} entry="type" stagger={0} cy={420} align="left" left={full.left + measure(words[0][0], full.style).inkLeft} upper={false} />}
      {t >= T.later && <div style={{ position: 'absolute', left: 0, right: 0, top: 660, textAlign: 'center', fontFamily: THEME.mono, fontSize: 30, letterSpacing: '0.2em', color: CREAM, opacity: lineO }}>+{String(hours).padStart(2, '0')} H</div>}
    </>
  );
};

/** H — "<noun> … le même": the noun performs its own meaning, then the italic "même" lands on its left (the order of the voice). */
const Same: React.FC<{ t: number; at: number; noun: string; entry: 'linear' | 'drop' | 'slamR'; color: string; ink: string; track?: boolean }> = ({ t, at, noun, entry, color, ink, track }) => {
  const size = 230;
  const gap = 56;
  const mm = measure('même', { size: 96, font: 'serif', italic: true, upper: false });
  const wn = layoutWord({ text: noun, size }).width;
  const total = mm.inkWidth + gap + wn;
  const x = 960 - total / 2;
  const line = C.inOut(clamp((t - at) / 0.5));
  return (
    <>
      {track && <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}><line x1={112} y1={680} x2={112 + 1696 * line} y2={680} stroke={ink} strokeWidth={4} /><circle cx={112 + 1696 * line} cy={680} r={10} fill={ink} /></svg>}
      <Word text="même" t={t} at={at + 0.5} size={96} font="serif" italic color={ink} entry="type" stagger={0.02} align="left" left={x} cy={540} upper={false} />
      <Word text={noun} t={t} at={at} size={size} color={color} entry={entry} stagger={entry === 'linear' ? 0 : 0.035} dur={entry === 'linear' ? 0.42 : 0.24} align="left" left={x + mm.inkWidth + gap} cy={540} />
    </>
  );
};

/** H4 — "n'a pas changé": the three identical lines stack, one per half beat, centred as one block. */
const Stack: React.FC<{ t: number }> = ({ t }) => {
  const nouns = ['Avion', 'Siège', 'Trajet'] as const;
  const mm = measure('même', { size: 64, font: 'serif', italic: true, upper: false }).inkWidth;
  const wn = Math.max(...nouns.map((w) => layoutWord({ text: w, size: 110 }).width));
  const gap = 40, x = 960 - (mm + gap + wn) / 2;
  return (
    <>
      {nouns.map((w, k) => (
        <React.Fragment key={w}>
          <Word text="même" t={t} at={T.same + k * 0.25} size={64} font="serif" italic color={CREAM} entry="type" stagger={0} align="left" left={x} cy={400 + k * 140} upper={false} />
          <Word text={w} t={t} at={T.same + k * 0.25} size={110} color={k === 2 ? ORANGE : CREAM} entry="slamR" stagger={0.02} align="left" left={x + mm + gap} cy={400 + k * 140} />
        </React.Fragment>
      ))}
    </>
  );
};

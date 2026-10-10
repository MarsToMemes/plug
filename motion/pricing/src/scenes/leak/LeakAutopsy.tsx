import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../../theme';

/**
 * LeakAutopsy — « autopsie d'un euro » : the price examined as a piece of evidence. Flat editorial 2D.
 *
 * A banal product (real photo, cut out) in the middle of an off-white case file. Thin orange frames close
 * in, one after the other, on zones of the product; each opens a rectangular window with a real close-up
 * (material, assembly, packaging, label). The windows slide on the page, overlap, are cut by masks, and
 * compose an analysis board. Then four black bands cover the product, each revealing a cost category
 * (MATIÈRES, FABRICATION, EMBALLAGE, ACHEMINEMENT — categories only, no amount). Strong moment: the bands
 * part, the product is there, intact, with the note « le prix de vente n'est pas le coût total de la
 * chaîne ». Exit: the FABRICATION band stretches into a line that leads to the next sequence.
 *
 * Images, zones, words, note and every cue are props (seconds). No depth, no glow, no fake data.
 */
export type Zone = { x: number; y: number; w: number; h: number }; // in the product image, 0–1
export type Macro = { src: string | null /* null: placeholder until a real photo exists */; label: string; zone: Zone; pos?: string /* CSS object-position of the close-up */ };
export type AutopsyTiming = {
  product: number; // the product appears
  inspect: number; step: number; // first frame on a zone; interval between zones
  clear: number; // the board clears (windows slide away)
  bands: number; bandStep: number; // the four bands, one after the other
  part: number; // the bands part: the product, intact
  note: number; // the annotation
  exit: number; exitDur: number; // FABRICATION becomes a line
  end: number;
};
export type AutopsyProps = {
  product: { src: string; aspect: number /* width / height of the image */ };
  macros: Macro[]; // four
  words: string[]; // four
  note: string;
  file: string; // dossier label, top left
  credit: string; // small credit line (photos)
  timing: AutopsyTiming;
};

export const AUTOPSY_FPS = 60;
export const AUTOPSY_DEFAULTS: AutopsyProps = {
  // A fidget spinner in its zip case (Gpkp, CC BY-SA 4.0). The close-ups are crops of the two photos of
  // this same spinner: real details of the object shown. No photo of its label exists: placeholder.
  product: { src: 'autopsy/product.png', aspect: 1696 / 740 },
  macros: [
    { src: 'autopsy/macro-matiere.jpg', label: 'MATIÈRE PLASTIQUE', zone: { x: 0.768, y: 0.299, w: 0.147, h: 0.324 } },
    { src: 'autopsy/macro-assemblage.jpg', label: 'ASSEMBLAGE', zone: { x: 0.65, y: 0.326, w: 0.118, h: 0.257 } },
    { src: 'autopsy/macro-emballage.jpg', label: 'EMBALLAGE', zone: { x: 0.473, y: 0.272, w: 0.065, h: 0.65 } },
    { src: null, label: 'ÉTIQUETTE', zone: { x: 0.0, y: 0.0, w: 1, h: 1 } },
  ],
  words: ['MATIÈRES', 'FABRICATION', 'EMBALLAGE', 'ACHEMINEMENT'],
  note: 'LE PRIX DE VENTE N’EST PAS LE COÛT TOTAL DE LA CHAÎNE.',
  file: 'PIÈCE À CONVICTION — 1 €',
  credit: 'PHOTOS : GPKP — CC BY-SA 4.0 — WIKIMEDIA COMMONS',
  timing: { product: 0.2, inspect: 1.2, step: 1.05, clear: 5.6, bands: 6.1, bandStep: 0.38, part: 8.3, note: 8.9, exit: 10.9, exitDur: 1.0, end: 12.4 },
};

// ---------------------------------------------------------------- palette, grid
const PAPER = '#EEEBE4', INK = '#151515', ORANGE = '#FF5A1F', MUTED = '#8A867E', RULE = '#CFCAC0';
const M = 96, GW = 1920 - 2 * M;
const DISPLAY = 'Archivo, Geist, Helvetica, sans-serif';
// The product: centred, its box height fixed (the bands are built around it).
const PH = 380;

// ---------------------------------------------------------------- easing
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bez = (a: number, b: number, c: number, d: number) => (u: number) => {
  const X = clamp(u); let lo = 0, hi = 1;
  for (let k = 0; k < 26; k++) { const s = (lo + hi) / 2, x = 3 * a * s * (1 - s) ** 2 + 3 * c * s * s * (1 - s) + s ** 3; if (x < X) lo = s; else hi = s; }
  const s = (lo + hi) / 2; return 3 * b * s * (1 - s) ** 2 + 3 * d * s * s * (1 - s) + s ** 3;
};
const hard = bez(0.8, 0, 0.1, 1), slide = bez(0.65, 0, 0.12, 1), draw = bez(0.5, 0, 0.2, 1);
const span = (t: number, a: number, d: number) => clamp((t - a) / d);

const Mono: React.FC<{ x: number; y: number; children: React.ReactNode; color?: string; anchor?: 'start' | 'end' | 'middle'; size?: number }> = ({ x, y, children, color = MUTED, anchor = 'start', size = 15 }) => (
  <text x={x} y={y} fontFamily={THEME.mono} fontWeight={500} fontSize={size} letterSpacing="0.22em" fill={color} textAnchor={anchor}>{children}</text>
);

/** A rectangle drawn as a thin orange frame: four corners first, then the sides close. */
const Frame: React.FC<{ x: number; y: number; w: number; h: number; u: number; color?: string; sw?: number }> = ({ x, y, w, h, u, color = ORANGE, sw = 2 }) => {
  if (u <= 0) return null;
  const c = Math.min(w, h) * 0.18, k = clamp(u * 1.6), s = clamp((u - 0.45) / 0.55);
  const L = (x1: number, y1: number, x2: number, y2: number, f: number) => <line x1={x1} y1={y1} x2={lerp(x1, x2, f)} y2={lerp(y1, y2, f)} stroke={color} strokeWidth={sw} strokeLinecap="square" />;
  return (
    <g>
      {/* corners */}
      {L(x, y, x + c, y, k)}{L(x, y, x, y + c, k)}{L(x + w, y, x + w - c, y, k)}{L(x + w, y, x + w, y + c, k)}
      {L(x, y + h, x + c, y + h, k)}{L(x, y + h, x, y + h - c, k)}{L(x + w, y + h, x + w - c, y + h, k)}{L(x + w, y + h, x + w, y + h - c, k)}
      {/* sides closing in from the corners */}
      {s > 0 && <>{L(x + c, y, x + w / 2, y, s)}{L(x + w - c, y, x + w / 2, y, s)}{L(x + c, y + h, x + w / 2, y + h, s)}{L(x + w - c, y + h, x + w / 2, y + h, s)}
        {L(x, y + c, x, y + h / 2, s)}{L(x, y + h - c, x, y + h / 2, s)}{L(x + w, y + c, x + w, y + h / 2, s)}{L(x + w, y + h - c, x + w, y + h / 2, s)}</>}
    </g>
  );
};

// Window slots on the board (screen px): two columns either side of the product, slightly overlapping.
const SLOTS = [
  { x: 1920 - M - 520, y: 128, w: 520, h: 300, from: 1 },
  { x: M, y: 140, w: 500, h: 330, from: -1 },
  { x: M + 60, y: 560, w: 440, h: 320, from: -1 },
  { x: 1920 - M - 470, y: 640, w: 470, h: 250, from: 1 },
];

export const LeakAutopsy: React.FC<Partial<AutopsyProps>> = (props) => {
  const p: AutopsyProps = { ...AUTOPSY_DEFAULTS, ...props, timing: { ...AUTOPSY_DEFAULTS.timing, ...props.timing } };
  const T = p.timing;
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  const t = frame / fps;

  // ---- the product box (screen)
  const pw = PH * p.product.aspect, px = 960 - pw / 2, py = 540 - PH / 2 + 10;
  const zoneRect = (z: Zone) => ({ x: px + z.x * pw, y: py + z.y * PH, w: z.w * pw, h: z.h * PH });
  const appear = hard(span(t, T.product, 0.7)); // revealed by a mask rising from the base, no fade
  const exitU = hard(span(t, T.exit, T.exitDur));
  // As the bands part, the product slides left a little: the note takes the right column, never over the photo.
  const SHIFT = 230, shiftX = -SHIFT * hard(span(t, T.part, 0.75));

  // ---- bands: four strips over the product block; they part on « part »
  const BH = 118, B0 = 540 - 2 * BH, partU = hard(span(t, T.part, 0.75)), PART = 255;
  const bandY = (i: number) => B0 + i * BH + (i < 2 ? -PART : PART) * partU;
  const bandX = (i: number) => { // in from alternate sides, braking hard
    const u = slide(span(t, T.bands + i * T.bandStep, 0.5));
    return (i % 2 === 0 ? -1 : 1) * (1 - u) * (GW + 2 * M);
  };
  const wordU = (i: number) => hard(span(t, T.bands + i * T.bandStep + 0.18, 0.5));

  // ---- exit: the FABRICATION band stretches across, thins to a line, the rest leaves
  const others = hard(span(t, T.exit, T.exitDur * 0.6));
  const fab = { x0: lerp(M, -40, exitU), x1: lerp(1920 - M, 1960, exitU), y: bandY(1) + BH / 2, h: lerp(BH, 6, hard(span(t, T.exit + T.exitDur * 0.35, T.exitDur * 0.65))) };
  const lineShift = lerp(0, 540 - fab.y, hard(span(t, T.exit + T.exitDur * 0.45, T.exitDur * 0.55))); // the line settles on the frame's axis

  const boardOn = t < T.clear + 0.8;
  const clearU = slide(span(t, T.clear, 0.6));

  return (
    <AbsoluteFill style={{ background: PAPER, overflow: 'hidden' }}>
      {/* ---- dossier: hairlines and labels */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: 1 - others }}>
        <rect x={M} y={92} width={GW * draw(span(t, T.product, 0.9))} height={1} fill={RULE} />
        <rect x={M} y={1080 - 92} width={GW * draw(span(t, T.product + 0.1, 0.9))} height={1} fill={RULE} />
        {t > T.product + 0.15 && <>
          <Mono x={M} y={72} color={INK}>{p.file}</Mono>
          <Mono x={1920 - M} y={72} anchor="end">PLUG LEAK — DOSSIER</Mono>
          {p.credit && <Mono x={1920 - M} y={1080 - 64} anchor="end" size={12}>{p.credit}</Mono>}
        </>}
      </svg>

      {/* ---- the product (real photo, cut out); a soft contact shadow, no glow */}
      {t < T.exit + T.exitDur * 0.6 && (
        <div style={{ position: 'absolute', left: px, top: py, width: pw, height: PH, clipPath: `inset(${(1 - appear) * 100}% 0 0 0)`, transform: `translate(${shiftX}px, ${(1 - appear) * 30}px) scale(${lerp(1, 0.96, others)})` }}>
          <Img src={staticFile(p.product.src)} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 18px 22px rgba(40,30,20,0.18))' }} />
        </div>
      )}

      {/* ---- the inspection: frames on zones, windows on the board */}
      {boardOn && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          {p.macros.slice(0, 4).map((m, i) => {
            const t0 = T.inspect + i * T.step, z = zoneRect(m.zone), fU = draw(span(t, t0, 0.35));
            const active = t >= t0 && t < t0 + T.step + 0.1 && t < T.clear;
            return <g key={i} opacity={t < T.clear ? 1 : 1 - clearU}>
              <Frame {...z} u={fU} color={active ? ORANGE : '#E7A27E'} sw={active ? 2.5 : 1.5} />
              {fU > 0.5 && <Mono x={z.x} y={z.y - 10} color={active ? ORANGE : MUTED} size={13}>{String(i + 1).padStart(2, '0')}</Mono>}
            </g>;
          })}
        </svg>
      )}
      {boardOn && p.macros.slice(0, 4).map((m, i) => {
        const s = SLOTS[i]!, t0 = T.inspect + i * T.step + 0.22;
        const u = slide(span(t, t0, 0.55)); // the window slides in along the page…
        const open = hard(span(t, t0 + 0.12, 0.5)); // …and its mask opens from the side it came from
        const out = s.from * clearU * (1920 / 2 + s.w); // the board clears: windows slide off the way they came
        if (u <= 0) return null;
        const x = s.x + s.from * (1 - u) * 420 + out;
        const clip = s.from < 0 ? `inset(0 ${(1 - open) * 100}% 0 0)` : `inset(0 0 0 ${(1 - open) * 100}%)`;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: s.y, width: s.w, height: s.h + 34, zIndex: 2 + i }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: s.w, height: s.h, background: INK, clipPath: clip, boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
              {m.src ? <Img src={staticFile(m.src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: m.pos ?? '50% 50%', transform: `scale(${1.06 - 0.06 * span(t, t0, 2.5)})` }} />
                : <div style={{ position: 'absolute', inset: 0, background: PAPER, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: THEME.mono, fontSize: 13, lineHeight: 1.7, letterSpacing: '0.2em', color: MUTED }}>PHOTO DE L’ÉTIQUETTE<br />DU PRODUIT RÉEL À INSÉRER</div>}
              <div style={{ position: 'absolute', inset: 0, border: m.src ? `2px solid ${ORANGE}` : `2px dashed ${ORANGE}` }} />
            </div>
            <div style={{ position: 'absolute', left: 0, top: s.h + 10, fontFamily: THEME.mono, fontSize: 14, letterSpacing: '0.22em', color: INK, clipPath: clip, whiteSpace: 'nowrap' }}>
              <span style={{ color: ORANGE }}>{String(i + 1).padStart(2, '0')}</span>&nbsp;&nbsp;{m.label}
            </div>
          </div>
        );
      })}

      {/* ---- the bands, the words, the note */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        <defs>
          {p.words.slice(0, 4).map((_, i) => <clipPath key={i} id={`band${i}`}><rect x={M + bandX(i)} y={bandY(i)} width={GW} height={BH} /></clipPath>)}
        </defs>
        {t >= T.bands && p.words.slice(0, 4).map((w, i) => {
          if (i === 1 && t >= T.exit) return null; // drawn as the line below
          const y = bandY(i), x = M + bandX(i), wu = wordU(i), gone = others * (i < 2 ? -1 : 1) * 400;
          return (
            <g key={i} transform={`translate(0 ${gone})`} opacity={t >= T.exit ? 1 - others : 1}>
              <rect x={x} y={y} width={GW} height={BH - 6} fill={INK} />
              {/* the word slides out of the band's left edge, inside its mask */}
              <g clipPath={`url(#band${i})`}>
                <text x={x + 40 - (1 - wu) * 900} y={y + BH / 2 + 26} fontFamily={DISPLAY} fontWeight={800} fontSize={74} letterSpacing="0.01em" fill={PAPER}>{w}</text>
                <text x={x + GW - 36} y={y + BH / 2 + 6} fontFamily={THEME.mono} fontSize={14} letterSpacing="0.22em" fill="#8E8A82" textAnchor="end" opacity={wu >= 1 ? 1 : 0}>CATÉGORIE DE COÛT {String(i + 1).padStart(2, '0')}</text>
              </g>
            </g>
          );
        })}
        {/* The note, beside the intact product. */}
        {t >= T.note && t < T.exit + T.exitDur && (() => {
          const lines = splitNote(p.note), nu = (k: number) => hard(span(t, T.note + k * 0.12, 0.55));
          const x = 960 + pw / 2 - SHIFT + 80, y0 = 540 - (lines.length * 58) / 2 + 40;
          return (
            <g opacity={1 - others}>
              <rect x={x} y={y0 - 54} width={56 * hard(span(t, T.note, 0.4))} height={4} fill={ORANGE} />
              {lines.map((l, k) => (
                <g key={k}>
                  <clipPath id={`note${k}`}><rect x={x} y={y0 + k * 58 - 50} width={640} height={62} /></clipPath>
                  <text clipPath={`url(#note${k})`} x={x} y={y0 + k * 58 + 62 * (1 - nu(k))} fontFamily={DISPLAY} fontWeight={700} fontSize={44} fill={INK}>{l}</text>
                </g>
              ))}
            </g>
          );
        })()}
        {/* Exit: FABRICATION stretches into the line that leads on. */}
        {t >= T.exit && (
          <g transform={`translate(0 ${lineShift})`}>
            <rect x={fab.x0} y={fab.y - fab.h / 2} width={fab.x1 - fab.x0} height={fab.h} fill={INK} />
            <clipPath id="fabWord"><rect x={fab.x0} y={fab.y - fab.h / 2} width={fab.x1 - fab.x0} height={fab.h} /></clipPath>
            <text clipPath="url(#fabWord)" x={M + 40 - 2200 * hard(span(t, T.exit, T.exitDur * 0.4))} y={fab.y + 26} fontFamily={DISPLAY} fontWeight={800} fontSize={74} fill={PAPER}>{p.words[1]}</text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

/** Two or three balanced lines for the note. */
function splitNote(s: string) {
  const w = s.split(' '), out: string[] = [];
  let cur = '';
  for (const x of w) { if ((cur + ' ' + x).trim().length > 20) { out.push(cur.trim()); cur = x; } else cur += ' ' + x; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * The drawing: an original ink caricature (tall flat-topped head, heavy lids, long nose,
 * big ears, thin neck), on a 600 x 800 plate. Contours are paths; tone is engraved hatching
 * generated line by line inside regions, the way an etcher lays it down.
 */
export const PLATE_W = 600;
export const PLATE_H = 800;

const mirrorD = (d: string) =>
  d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(PLATE_W - Number(x)).toFixed(1)},${y}`);
export const both = (d: string) => [d, mirrorD(d)];

export const FACE =
  'M210,170 C206,260 200,350 198,430 C196,490 212,548 234,592 C248,620 264,640 286,644 L314,644 C336,640 352,620 366,592 C388,548 404,490 402,430 C400,350 394,260 390,170 C372,150 228,150 210,170 Z';
const EAR = 'M204,352 C168,318 128,332 132,392 C136,452 156,500 200,512';
const EAR_FILL = EAR + ' C198,470 200,400 204,352 Z';
const NECK = 'M286,640 C284,690 284,720 280,752 L326,752 C322,720 320,690 318,640 Z';
const SHIRT = 'M120,800 C176,782 236,768 266,752 L280,756 L326,756 L334,752 C364,768 424,782 480,800 Z';

/** Everything the tone may cover: head, ears, neck, shirt. */
export const SIL_PATHS = () => [FACE, ...both(EAR_FILL), NECK, SHIRT];

export type Stroke = { d: string; w: number; o?: number; color?: 'ink' | 'sepia' | 'graphite' };
export type Fill = { d: string; fill: string; o?: number };
export type Tone = { d: string; angle: number; gap: number; w?: number; o?: number; cross?: number; crossGap?: number };

export type LayerId = 'silhouette' | 'bone' | 'skin' | 'cheeks' | 'shape' | 'jaw' | 'nose' | 'eyes' | 'hair';
export interface LayerDef {
  id: LayerId;
  n?: string;
  name?: string;
  desc?: string;
  /** Where the callout points, on the plate. */
  anchor?: [number, number];
  /** Final opacity once combined (the skull ends as a watermark under the skin). */
  final?: number;
  strokes: Stroke[];
  fills: Fill[];
  tones: Tone[];
  /** Fills drawn above the strokes (pupils, nostrils). */
  topFills?: Fill[];
  /** Short vertical strokes (hair). */
  bristles?: boolean;
}

const s = (d: string, w = 1.6, o?: number): Stroke => ({ d, w, ...(o !== undefined ? { o } : {}) });
const ss = (d: string, w = 1.6, o?: number) => both(d).map((x) => s(x, w, o));
const sep = (d: string, w = 1.3): Stroke => ({ d, w, color: 'sepia' });

export const PAPER = '#efe6d2';
export const INK = '#1d1a16';
export const SEPIA = '#a2442a';
export const WASH = '#d9ccb3';
export const GRAPHITE = '#8a8172';
const PAPER_FILL = '#f2e9d5';
const g = (d: string, w = 1.1, o = 0.8): Stroke => ({ d, w, o, color: 'graphite' });

export const LAYERS: LayerDef[] = [
  {
    // The artist's construction: an oval, the axis, the lines of eyes, nose and mouth.
    id: 'silhouette',
    strokes: [
      g('M300,146 C384,146 408,300 404,430 C400,566 360,648 300,648 C240,648 200,566 196,430 C192,300 216,146 300,146 Z', 1.3),
      g('M300,124 L300,668', 0.9, 0.6),
      g('M184,402 L416,402', 0.9, 0.6),
      g('M236,502 L364,502', 0.8, 0.5),
      g('M246,570 L354,570', 0.8, 0.5),
      g('M150,380 C140,420 150,470 190,500', 1.0, 0.6),
      g('M450,380 C460,420 450,470 410,500', 1.0, 0.6),
      g('M288,640 L282,752', 1.0, 0.7),
      g('M314,640 L322,752', 1.0, 0.7),
      g('M130,798 C220,766 380,766 470,798', 1.1, 0.7),
    ],
    fills: [],
    tones: [],
  },
  {
    id: 'bone', n: '08', name: 'Structure osseuse', desc: 'Le crâne fixe l’architecture : orbites, pommettes, mâchoire.', anchor: [246, 420], final: 0.13,
    strokes: [
      sep('M220,182 C216,270 212,350 210,424 C208,470 218,510 232,540'),
      sep('M380,182 C384,270 388,350 390,424 C392,470 382,510 368,540'),
      sep('M220,182 C256,160 344,160 380,182'),
      ...both('M228,404 C230,382 248,372 266,374 C284,376 294,390 292,410 C290,430 274,442 256,442 C238,442 226,428 228,404 Z').map((d) => sep(d)),
      sep('M300,452 C290,468 282,490 286,506 C292,514 298,512 300,508 C302,512 308,514 314,506 C318,490 310,468 300,452 Z'),
      ...both('M212,462 C230,470 252,472 272,466').map((d) => sep(d)),
      ...both('M232,540 C240,584 254,616 274,628 L300,632').map((d) => sep(d, 1.5)),
      sep('M258,534 C278,528 322,528 342,534'),
      { d: 'M262,548 L338,548', w: 1.1, color: 'sepia' },
    ],
    fills: [],
    tones: [],
  },
  {
    id: 'skin', n: '06', name: 'Pigmentation', desc: 'La mélanine fixe la teinte de la peau, de l’iris et des cheveux. Ici, les valeurs du clair au sombre.', anchor: [222, 300],
    strokes: [
      ...[244, 262, 281, 300, 318].map((y, i) => s(`M${236 + (i % 3) * 5},${y + (i % 2) * 2} C${266},${y - 6 + (i % 3) * 3} ${304},${y + 4 - (i % 2) * 5} ${364 - (i % 2) * 8},${y - 2}`, 0.9, 0.6)),
      s('M246,338 C276,333 324,333 354,338', 0.8, 0.5),
      s('M300,352 C298,362 300,370 298,378', 1.0, 0.55),
      s('M288,356 C290,364 290,372 292,378', 0.8, 0.45),
    ],
    fills: [],
    tones: [
      { d: 'M196,170 L238,170 C232,280 228,360 230,440 C232,500 246,560 266,610 L262,660 L192,660 Z', angle: 62, gap: 4.6, cross: -28, crossGap: 7.5 },
      { d: 'M404,170 L370,170 C374,280 376,360 374,440 C372,500 360,560 340,610 L344,660 L408,660 Z', angle: 62, gap: 6.2, o: 0.8 },
      { d: 'M222,408 C222,384 244,376 264,378 C286,380 302,392 300,412 C298,434 280,446 258,446 C236,446 222,430 222,408 Z', angle: -48, gap: 4.2 },
      { d: 'M300,412 C300,390 318,378 338,378 C360,378 378,388 378,408 C378,430 362,446 340,446 C318,446 300,432 300,412 Z', angle: -48, gap: 5 },
      { d: 'M216,386 C250,376 350,376 384,386 L384,398 C350,392 250,392 216,398 Z', angle: 82, gap: 3.4 },
      { d: 'M312,420 C318,456 322,482 326,500 L314,506 C312,474 308,446 304,420 Z', angle: 72, gap: 3.4 },
      { d: 'M282,522 C292,530 308,530 318,522 L316,548 L284,548 Z', angle: -42, gap: 3.8 },
      { d: 'M266,594 C288,608 312,608 334,594 L332,618 L268,618 Z', angle: 44, gap: 3.8 },
      { d: 'M236,500 C246,530 254,550 262,566 L272,544 C262,524 254,508 248,494 Z', angle: 58, gap: 3.8 },
      { d: 'M364,500 C354,530 346,550 338,566 L328,544 C338,524 346,508 352,494 Z', angle: 58, gap: 4.8 },
      { d: 'M286,644 L318,644 L316,712 C306,690 294,672 286,664 Z', angle: 45, gap: 2.8, cross: -45, crossGap: 3.2 },
      { d: 'M190,372 C166,370 158,404 168,438 C176,462 188,474 200,476 L204,372 Z', angle: 70, gap: 3.6 },
      { d: 'M410,372 C434,370 442,404 432,438 C424,462 412,474 400,476 L396,372 Z', angle: 70, gap: 4.6 },
      { d: SHIRT, angle: 76, gap: 7, o: 0.55 },
      { d: 'M266,752 L280,756 L292,800 L246,800 Z', angle: 40, gap: 3.4 },
    ],
  },
  {
    id: 'cheeks', n: '05', name: 'Pommettes', desc: 'Hauteur et saillie des os zygomatiques.', anchor: [236, 470],
    strokes: [
      ...ss('M214,452 C230,474 252,486 274,488', 1.7),
      ...ss('M222,474 C234,494 248,504 262,508', 1.0, 0.55),
      ...ss('M206,430 C214,450 222,462 232,470', 0.9, 0.45),
      ...ss('M240,530 C238,552 240,572 246,590', 1.0, 0.5),
    ],
    fills: [],
    tones: [],
  },
  {
    id: 'shape', n: '01', name: 'Forme du visage', desc: 'Largeur, longueur et proportions de la tête.', anchor: [204, 300],
    strokes: [
      s(FACE, 2.6),
      ...ss(EAR, 2.4),
      ...ss('M190,372 C166,370 158,404 168,438 C176,462 188,474 200,476', 1.5),
      ...ss('M182,400 C176,414 178,430 186,440', 1.1, 0.7),
      s('M286,644 C284,690 284,720 280,752', 1.9),
      s('M318,644 C320,690 322,720 326,752', 1.9),
      s('M120,800 C176,782 236,768 266,752 L292,792 L300,770 L308,792 L334,752 C364,768 424,782 480,800', 1.9),
      s('M300,770 L300,800', 1.2),
      ...ss('M174,360 C160,384 160,420 172,446', 1.0, 0.6),
      s('M292,668 C290,700 288,724 286,746', 0.9, 0.5),
      s('M312,668 C314,700 316,724 318,746', 0.9, 0.5),
      ...ss('M190,786 C214,778 236,770 252,760', 0.9, 0.55),
    ],
    fills: [SHIRT, NECK, FACE, ...both(EAR_FILL)].map((d) => ({ d, fill: PAPER_FILL })),
    tones: [],
  },
  {
    id: 'jaw', n: '04', name: 'Mâchoire', desc: 'Angle et largeur de la mandibule, forme du menton et des lèvres.', anchor: [252, 618],
    strokes: [
      ...ss('M234,592 C248,620 264,640 286,644 L300,644', 3.2),
      s('M262,566 C280,556 294,560 300,562 C306,560 320,556 338,566', 1.9),
      s('M254,573 C276,564 324,564 346,573', 2.6),
      ...ss('M254,573 C248,580 246,588 248,596', 2.0),
      s('M270,586 C288,598 312,598 330,586', 1.4, 0.75),
      s('M276,618 C290,624 310,624 324,618', 1.2, 0.6),
      s('M300,612 C298,622 300,630 299,638', 1.0, 0.5),
      ...ss('M262,600 C270,616 282,628 292,634', 0.9, 0.45),
      ...ss('M272,486 C252,520 248,560 262,590', 2.0),
      s('M295,532 L293,552', 1.0, 0.6),
      s('M305,532 L307,552', 1.0, 0.6),
    ],
    fills: [],
    tones: [],
  },
  {
    id: 'nose', n: '03', name: 'Nez', desc: 'Longueur, largeur des narines, profil de l’arête.', anchor: [300, 506],
    strokes: [
      s('M290,404 C288,440 286,470 282,492', 2.0),
      s('M312,404 C314,440 316,470 320,492', 1.2, 0.55),
      s('M280,494 C276,508 286,520 300,520 C314,520 324,508 320,494', 2.0),
      ...ss('M282,500 C266,498 262,514 276,520 C282,522 288,520 292,516', 1.9),
    ],
    fills: [],
    tones: [],
    topFills: both('M282,516 C286,511 294,512 295,517 C291,520 285,520 282,516 Z').map((d) => ({ d, fill: INK })),
  },
  {
    id: 'eyes', n: '02', name: 'Yeux', desc: 'Écartement, forme des paupières, couleur de l’iris.', anchor: [262, 404],
    strokes: [
      ...ss('M232,399 C246,388 278,388 292,399', 3.0),
      ...ss('M236,408 C250,416 276,416 290,406', 1.3),
      ...ss('M230,392 C246,374 280,374 296,392', 1.4),
      ...ss('M238,420 C252,432 278,430 292,418', 1.2, 0.7),
      ...ss('M242,432 C258,444 282,440 296,428', 1.0, 0.45),
      ...ss('M246,444 C262,454 284,450 298,440', 0.9, 0.35),
      ...ss('M226,400 C218,398 212,394 208,388', 1.0, 0.6),
      ...ss('M226,408 C218,410 212,412 206,414', 0.9, 0.5),
      ...ss('M232,388 C244,368 282,366 298,384', 0.9, 0.45),
    ],
    fills: both('M234,402 C246,390 276,388 290,400 C276,412 248,414 234,402 Z').map((d) => ({ d, fill: '#f5eddb' })),
    topFills: [
      ...both('M214,368 C236,356 270,356 298,370 L298,382 C270,370 238,370 216,380 Z').map((d) => ({ d, fill: INK })),
    ],
  },
  {
    id: 'hair', n: '07', name: 'Cheveux', desc: 'Couleur, épaisseur, implantation.', anchor: [300, 150],
    strokes: [s('M204,186 C248,172 352,172 396,186', 1.6)],
    fills: [{ d: 'M204,186 L208,138 C250,118 350,114 394,134 L396,186 C352,172 248,172 204,186 Z', fill: '#3b342b' }],
    tones: [],
    bristles: true,
  },
];

/** Anatomical stacking, back to front (the exploded view spreads them in this order). */
export const STACK: LayerId[] = ['silhouette', 'shape', 'bone', 'skin', 'cheeks', 'jaw', 'nose', 'eyes', 'hair'];
/** Order of arrival, as in the brief. */
export const ORDER: LayerId[] = ['shape', 'eyes', 'nose', 'jaw', 'cheeks', 'skin', 'hair', 'bone'];

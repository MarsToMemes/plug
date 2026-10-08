/**
 * The episode cut on the voice-over (voice/transcript.json, word timings from Whisper).
 * Scenes follow the order of the narration. Each passage: which scene (and which part of it),
 * when it starts in the voice, and anchors [scene frame, voice second] that pin a visual beat
 * to the word that says it. Between anchors the scene's own time is stretched linearly.
 */
export type Passage = { scene: string; from?: number; to?: number; start: number; anchors?: Array<[number, number]> };

export const VOICE = {
  end: 602.5, // the voice ends at 597.3; the last image holds, then fades to black
  passages: [
    { scene: '01', start: 0 }, // built on the narration's own timing
    { scene: '02', start: 27.3, anchors: [[132, 33.0], [236, 35.1], [300, 35.6], [404, 36.6], [540, 38.3], [640, 40.6], [700, 42.8]] },
    { scene: '04', start: 44.2, anchors: [[60, 46.68], [400, 51.5], [424, 52.78], [452, 54.0], [580, 58.2], [760, 64.54]] },
    { scene: '05', start: 65.6, anchors: [[96, 68.4], [132, 69.72], [214, 70.6], [300, 72.0], [540, 74.76], [556, 75.6], [610, 77.6], [690, 82.1], [760, 85.6]] },
    { scene: '06', start: 90.4, anchors: [[20, 92.12], [60, 95.48], [246, 105.2], [440, 115.4], [536, 121.1], [604, 123.4], [672, 125.4], [740, 127.0], [800, 129.0]] },
    { scene: '07', start: 131.4, anchors: [[110, 138.4], [208, 148.74], [214, 150.3], [344, 152.6], [484, 153.74], [540, 154.4]] }, // then on the voice's own timing
    { scene: '08', start: 203.9, anchors: [[84, 210.3], [262, 213.0], [404, 215.72], [520, 220.5], [600, 222.7]] },
    { scene: '10', start: 238.3 }, // built on the narration's own timing
    { scene: '19', start: 275.3 }, // built on the narration's own timing
    { scene: '09', start: 310.8, anchors: [[70, 312.0], [270, 321.0], [560, 333.46], [640, 335.5]] },
    { scene: '03', start: 352.4, anchors: [[96, 357.3], [576, 376.1], [584, 378.7], [640, 381.0], [690, 383.9]] },
    { scene: '11', start: 386.7, anchors: [[130, 395.0], [360, 408.0], [430, 411.48], [456, 413.0]] },
    { scene: '13', start: 416.9, anchors: [[90, 420.38], [170, 422.96], [500, 430.0], [560, 431.1], [600, 432.8], [640, 438.1]] },
    { scene: '12', start: 440.8, anchors: [[54, 442.8], [354, 448.5], [386, 449.7], [450, 451.0], [640, 455.48], [664, 455.6]] },
    { scene: '14', to: 67, start: 457.1, anchors: [] }, // the question and "pas forcément" (the card)
    { scene: 'sc', start: 464.4 }, // the price curve written by the spark, on the narration's own timing (SparkCurve)
    { scene: '20', start: 489.6 }, // the ticket at 219 €, built on the narration's own timing
    { scene: '17', from: 24, start: 505.0, anchors: [[40, 505.9], [160, 512.5], [250, 513.9], [310, 518.8], [370, 521.5], [410, 522.8]] },
    { scene: '15', start: 525.5, anchors: [[50, 527.2], [190, 535.9], [400, 545.7], [412, 546.5], [486, 550.18]] },
    { scene: '18', from: 0, to: 660, start: 553.9, anchors: [[110, 556.94], [250, 563.2], [380, 567.02], [510, 569.66], [650, 573.9]] },
    { scene: '16', start: 579.8, anchors: [[20, 580.2], [170, 582.5], [300, 585.0], [460, 587.8], [500, 588.78], [590, 590.66]] },
    { scene: '18', from: 660, to: 980, start: 592.5, anchors: [[680, 595.2], [780, 597.4], [870, 599.0], [930, 600.6]] },
  ] as Passage[],
};

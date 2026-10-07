import React from 'react';
import { Composition, continueRender, delayRender, staticFile } from 'remotion';
import { DURATION, Plate } from './Plate';
import { CHARCOAL_DURATION, CharcoalPlate } from './CharcoalPlate';
import { P2_DURATION, Plate02 } from './P2';
import { P3_DURATION, Plate03 } from './P3';
import { P4_DURATION, Plate04 } from './P4';
import { P5_DURATION, Plate05 } from './P5';
import { P6_DURATION, Plate06 } from './P6';
import { CUT_DURATION, Cut060504 } from './Cut';
import { P7_DURATION, Plate07 } from './P7';
import { Series } from 'remotion';
import { P8_DURATION, Plate08 } from './P8';

// Fonts are local files (public/fonts): the render never depends on the network.
const fonts: Array<[string, string, string, string]> = [
  ['Newsreader', 'cY9AfjOCX1hbuyalUrK4397yjA.woff2', 'normal', '200 800'],
  ['Newsreader', 'cY9XfjOCX1hbuyalUrK439vogqCz_goCYw7oRYCJFYYzbA.woff2', 'italic', '200 800'],
  ['Inter', 'UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2', 'normal', '100 900'],
  ['Caveat Brush', 'CaveatBrush-400.woff2', 'normal', '400'],
  ['Caveat', 'Caveat-400.woff2', 'normal', '400 700'],
];
const handle = delayRender('fonts');
Promise.all(
  fonts.map(([family, file, style, weight]) => {
    const f = new FontFace(family, `url(${staticFile('fonts/' + file)})`, { style, weight });
    return f.load().then((loaded) => document.fonts.add(loaded));
  }),
).then(() => continueRender(handle));

export const Root: React.FC = () => (
  <>
    <Composition id="Plate01" component={Plate} width={1920} height={1080} fps={30} durationInFrames={DURATION} />
    <Composition id="Charcoal08" component={Plate08} width={1920} height={1080} fps={30} durationInFrames={P8_DURATION} />
    <Composition id="Opening07" component={Plate07} width={1920} height={1080} fps={30} durationInFrames={P7_DURATION} />
    <Composition id="Cut060504" component={Cut060504} width={1920} height={1080} fps={30} durationInFrames={CUT_DURATION} />
    <Composition id="Charcoal06" component={Plate06} width={1920} height={1080} fps={30} durationInFrames={P6_DURATION} />
    <Composition id="Charcoal060504" component={() => (
      <Series>
        <Series.Sequence durationInFrames={P6_DURATION}><Plate06 /></Series.Sequence>
        <Series.Sequence durationInFrames={P5_DURATION}><Plate05 startSketched /></Series.Sequence>
        <Series.Sequence durationInFrames={P4_DURATION}><Plate04 aDrawn /></Series.Sequence>
      </Series>
    )} width={1920} height={1080} fps={30} durationInFrames={P6_DURATION + P5_DURATION + P4_DURATION} />
    <Composition id="Charcoal05" component={Plate05} width={1920} height={1080} fps={30} durationInFrames={P5_DURATION} />
    <Composition id="Charcoal0504" component={() => (
      <Series>
        <Series.Sequence durationInFrames={P5_DURATION}><Plate05 /></Series.Sequence>
        <Series.Sequence durationInFrames={P4_DURATION}><Plate04 aDrawn /></Series.Sequence>
      </Series>
    )} width={1920} height={1080} fps={30} durationInFrames={P5_DURATION + P4_DURATION} />
    <Composition id="Charcoal04" component={Plate04} width={1920} height={1080} fps={30} durationInFrames={P4_DURATION} />
    <Composition id="Charcoal03" component={Plate03} width={1920} height={1080} fps={30} durationInFrames={P3_DURATION} />
    <Composition id="Charcoal02" component={Plate02} width={1920} height={1080} fps={30} durationInFrames={P2_DURATION} />
    <Composition id="Charcoal01" component={CharcoalPlate} width={1920} height={1080} fps={30} durationInFrames={CHARCOAL_DURATION} />
  </>
);

import React from 'react';
import { Composition, Folder, continueRender, delayRender, staticFile } from 'remotion';
import { Scene01 } from './scenes/Scene01';
import { Library } from './scenes/Library';
import { S01 } from './data/scene01';
import { Scene02 } from './scenes/Scene02';
import { S02 } from './data/scene02';

// Local fonts: the render never depends on the network.
const fonts: Array<[string, string, string, string]> = [
  ['Newsreader', 'Newsreader.woff2', 'normal', '200 800'],
  ['Newsreader', 'Newsreader-Italic.woff2', 'italic', '200 800'],
  ['Inter', 'Inter.woff2', 'normal', '100 900'],
];
const handle = delayRender('fonts');
Promise.all(fonts.map(([family, file, style, weight]) => new FontFace(family, `url(${staticFile('fonts/' + file)})`, { style, weight }).load().then((f) => document.fonts.add(f)))).then(() => continueRender(handle));

export const Root: React.FC = () => (
  <>
    <Folder name="Scenes">
      <Composition id="Scene01" component={Scene01} width={1920} height={1080} fps={30} durationInFrames={S01.duration} />
      <Composition id="Scene02" component={Scene02} width={1920} height={1080} fps={30} durationInFrames={S02.duration} />
    </Folder>
    <Composition id="Library" component={Library} width={1920} height={1080} fps={30} durationInFrames={90} />
  </>
);

import React from 'react';
import { Composition, Folder, continueRender, delayRender, staticFile } from 'remotion';
import { Scene01 } from './scenes/Scene01';
import { Library } from './scenes/Library';
import { S01 } from './data/scene01';
import { Scene02 } from './scenes/Scene02';
import { S02 } from './data/scene02';
import { Scene03 } from './scenes/Scene03';
import { S03 } from './data/scene03';
import { Scene04 } from './scenes/Scene04';
import { S04 } from './data/scene04';
import { Scene05 } from './scenes/Scene05';
import { S05 } from './data/scene05';
import { Scene06 } from './scenes/Scene06';
import { S06 } from './data/scene06';
import { Scene07 } from './scenes/Scene07';
import { S07 } from './data/scene07';
import { Scene08 } from './scenes/Scene08';
import { S08 } from './data/scene08';
import { Scene09 } from './scenes/Scene09';
import { S09 } from './data/scene09';
import { Scene10 } from './scenes/Scene10';
import { S10 } from './data/scene10';
import { Scene11 } from './scenes/Scene11';
import { S11 } from './data/scene11';
import { Scene12 } from './scenes/Scene12';
import { S12 } from './data/scene12';
import { Scene13 } from './scenes/Scene13';
import { S13 } from './data/scene13';
import { Scene14 } from './scenes/Scene14';
import { S14 } from './data/scene14';
import { Scene15 } from './scenes/Scene15';
import { S15 } from './data/scene15';
import { Scene16 } from './scenes/Scene16';
import { S16 } from './data/scene16';
import { Scene17 } from './scenes/Scene17';
import { S17 } from './data/scene17';
import { Scene18 } from './scenes/Scene18';
import { S18 } from './data/scene18';
import { Scene19 } from './scenes/Scene19';
import { S19 } from './data/scene19';
import { Scene20 } from './scenes/Scene20';
import { TitleLab, TITLE_LAB_STEP } from './scenes/TitleLab';
import { Benchmark, BENCHMARK_FRAMES } from './scenes/Benchmark';
import { PresetLab, PRESET_NAMES, PRESET_STEP } from './scenes/PresetLab';
import { S20 } from './data/scene20';
import { EPISODE_DURATION, Episode } from './scenes/Episode';
import { VOICE_DURATION, VoiceEpisode } from './scenes/VoiceEpisode';

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
      <Composition id="Scene03" component={Scene03} width={1920} height={1080} fps={30} durationInFrames={S03.duration} />
      <Composition id="Scene04" component={Scene04} width={1920} height={1080} fps={30} durationInFrames={S04.duration} />
      <Composition id="Scene05" component={Scene05} width={1920} height={1080} fps={30} durationInFrames={S05.duration} />
      <Composition id="Scene06" component={Scene06} width={1920} height={1080} fps={30} durationInFrames={S06.duration} />
      <Composition id="Scene07" component={Scene07} width={1920} height={1080} fps={30} durationInFrames={S07.duration} />
      <Composition id="Scene08" component={Scene08} width={1920} height={1080} fps={30} durationInFrames={S08.duration} />
      <Composition id="Scene09" component={Scene09} width={1920} height={1080} fps={30} durationInFrames={S09.duration} />
      <Composition id="Scene10" component={Scene10} width={1920} height={1080} fps={30} durationInFrames={S10.duration} />
      <Composition id="Scene11" component={Scene11} width={1920} height={1080} fps={30} durationInFrames={S11.duration} />
      <Composition id="Scene12" component={Scene12} width={1920} height={1080} fps={30} durationInFrames={S12.duration} />
      <Composition id="Scene13" component={Scene13} width={1920} height={1080} fps={30} durationInFrames={S13.duration} />
      <Composition id="Scene14" component={Scene14} width={1920} height={1080} fps={30} durationInFrames={S14.duration} />
      <Composition id="Scene15" component={Scene15} width={1920} height={1080} fps={30} durationInFrames={S15.duration} />
      <Composition id="Scene16" component={Scene16} width={1920} height={1080} fps={30} durationInFrames={S16.duration} />
      <Composition id="Scene17" component={Scene17} width={1920} height={1080} fps={30} durationInFrames={S17.duration} />
      <Composition id="Scene18" component={Scene18} width={1920} height={1080} fps={30} durationInFrames={S18.duration} />
      <Composition id="Scene19" component={Scene19} width={1920} height={1080} fps={30} durationInFrames={S19.duration} />
      <Composition id="PresetLab" component={PresetLab} width={1920} height={1080} fps={30} durationInFrames={PRESET_STEP * PRESET_NAMES.length} />
      <Composition id="Benchmark" component={Benchmark} width={1920} height={1080} fps={30} durationInFrames={BENCHMARK_FRAMES} />
      <Composition id="TitleLab" component={TitleLab} width={1920} height={1080} fps={30} durationInFrames={TITLE_LAB_STEP * 6} />
      <Composition id="Scene20" component={Scene20} width={1920} height={1080} fps={30} durationInFrames={S20.duration} />
    </Folder>
    <Composition id="VoiceEpisode" component={VoiceEpisode} width={1920} height={1080} fps={30} durationInFrames={VOICE_DURATION} />
    <Composition id="Episode" component={Episode} width={1920} height={1080} fps={30} durationInFrames={EPISODE_DURATION} />
    <Composition id="Library" component={Library} width={1920} height={1080} fps={30} durationInFrames={90} />
  </>
);

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
import { BenchmarkLayouts } from './scenes/benchmark/Layouts';
import { AnimeCheck } from './scenes/AnimeCheck';
import { IconCheck } from './scenes/IconCheck';
import { FontCheck } from './scenes/FontCheck';
import { MotionCheck } from './scenes/MotionCheck';
import { Hook01 } from './scenes/Hook01';
import { ShopScroll, SHOP } from './scenes/shop/ShopScroll';
import { ShopGrid, GRID } from './scenes/shop/ShopGrid';
import { ShopPrice, PRICE } from './scenes/shop/ShopPrice';
import { ShopTimer, TIMER } from './scenes/shop/ShopTimer';
import { ShopNotif, NOTIF } from './scenes/shop/ShopNotif';
import { ShopData, DATA } from './scenes/shop/ShopData';
import { ShopCart, CART } from './scenes/shop/ShopCart';
import { ShopThreshold, THRESHOLD } from './scenes/shop/ShopThreshold';
import { ShopHand, HAND } from './scenes/shop/ShopHand';
import { ShopOutro, OUTRO } from './scenes/shop/ShopOutro';
import { ShopReward, REWARD } from './scenes/shop/ShopReward';
import { SPARK_FROM, SPARK_TO, SparkCurve } from './scenes/SparkCurve';
import { S20 } from './data/scene20';
import { EPISODE_DURATION, Episode } from './scenes/Episode';
import { VOICE_DURATION, VoiceEpisode } from './scenes/VoiceEpisode';

// Local fonts (copied from github.com/google/fonts, OFL): the render never depends on the network.
//   Instrument Serif — editorial display serif for the big titles (roman + italic for emphasis)
//   Geist            — modern grotesque for figures and text (variable 100–900)
//   Geist Mono       — data labels, counters, small captions (variable 100–900)
//   Archivo          — extra-wide black grotesque of the reel language (variable width 62–125 %)
const fonts: Array<[string, string, string, string, string?]> = [
  ['Instrument Serif', 'instrumentserif/InstrumentSerif-Regular.ttf', 'normal', '400'],
  ['Instrument Serif', 'instrumentserif/InstrumentSerif-Italic.ttf', 'italic', '400'],
  ['Geist', 'geist/Geist[wght].ttf', 'normal', '100 900'],
  ['Geist Mono', 'geistmono/GeistMono[wght].ttf', 'normal', '100 900'],
  ['Newsreader', 'Newsreader.woff2', 'normal', '200 800'],
  ['Inter', 'Inter.woff2', 'normal', '100 900'],
  ['Archivo', 'archivo/Archivo[wdth,wght].ttf', 'normal', '100 900', '62% 125%'],
];
const handle = delayRender('fonts');
Promise.all(fonts.map(([family, file, style, weight, stretch]) => new FontFace(family, `url(${staticFile('fonts/' + file)})`, { style, weight, ...(stretch ? { stretch } : {}) }).load().then((f) => document.fonts.add(f)))).then(() => continueRender(handle));

export const Root: React.FC = () => (
  <>
    <Folder name="Scenes">
      <Composition id="Scene01" component={Scene01} width={1920} height={1080} fps={30} durationInFrames={S01.duration} />
      <Composition id="SparkCurve" component={SparkCurve} width={1920} height={1080} fps={30} durationInFrames={Math.round((SPARK_TO - SPARK_FROM) * 30)} />
      <Composition id="ShopReward" component={ShopReward} width={1920} height={1080} fps={REWARD.fps} durationInFrames={REWARD.fps * REWARD.seconds} />
      <Composition id="ShopOutro" component={ShopOutro} width={1920} height={1080} fps={OUTRO.fps} durationInFrames={Math.round(OUTRO.fps * OUTRO.seconds)} />
      <Composition id="ShopHand" component={ShopHand} width={1920} height={1080} fps={HAND.fps} durationInFrames={HAND.fps * HAND.seconds} />
      <Composition id="ShopThreshold" component={ShopThreshold} width={1920} height={1080} fps={THRESHOLD.fps} durationInFrames={Math.round(THRESHOLD.fps * THRESHOLD.seconds)} />
      <Composition id="ShopCart" component={ShopCart} width={1920} height={1080} fps={CART.fps} durationInFrames={Math.round(CART.fps * CART.seconds)} />
      <Composition id="ShopData" component={ShopData} width={1920} height={1080} fps={DATA.fps} durationInFrames={Math.round(DATA.fps * DATA.seconds)} />
      <Composition id="ShopNotif" component={ShopNotif} width={1920} height={1080} fps={NOTIF.fps} durationInFrames={Math.round(NOTIF.fps * NOTIF.seconds)} />
      <Composition id="ShopTimer" component={ShopTimer} width={1920} height={1080} fps={TIMER.fps} durationInFrames={Math.round(TIMER.fps * TIMER.seconds)} />
      <Composition id="ShopPrice" component={ShopPrice} width={1920} height={1080} fps={PRICE.fps} durationInFrames={Math.round(PRICE.fps * PRICE.seconds)} />
      <Composition id="ShopGrid" component={ShopGrid} width={1920} height={1080} fps={GRID.fps} durationInFrames={Math.round(GRID.fps * GRID.seconds)} />
      <Composition id="ShopScroll" component={ShopScroll} width={1920} height={1080} fps={SHOP.fps} durationInFrames={SHOP.fps * SHOP.seconds} />
      <Composition id="Hook01" component={Hook01} width={1920} height={1080} fps={30} durationInFrames={S01.duration} />
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
      <Composition id="MotionCheck" component={MotionCheck} width={1920} height={1080} fps={30} durationInFrames={45} />
      <Composition id="FontCheck" component={FontCheck} width={1920} height={1080} fps={30} durationInFrames={1} />
      <Composition id="IconCheck" component={IconCheck} width={1920} height={1080} fps={30} durationInFrames={1} />
      <Composition id="AnimeCheck" component={AnimeCheck} width={1920} height={1080} fps={30} durationInFrames={40} />
      <Composition id="BenchmarkLayouts" component={BenchmarkLayouts} width={1920} height={1080} fps={30} durationInFrames={7} defaultProps={{ qa: true }} />
      <Composition id="BenchmarkLayoutsClean" component={BenchmarkLayouts} width={1920} height={1080} fps={30} durationInFrames={7} defaultProps={{ qa: false }} />
      <Composition id="PresetLab" component={PresetLab} width={1920} height={1080} fps={30} durationInFrames={PRESET_STEP * PRESET_NAMES.length} />
      <Composition id="Benchmark" component={Benchmark} width={1920} height={1080} fps={30} durationInFrames={BENCHMARK_FRAMES} defaultProps={{ qa: false }} />
      <Composition id="BenchmarkQA" component={Benchmark} width={1920} height={1080} fps={30} durationInFrames={BENCHMARK_FRAMES} defaultProps={{ qa: true }} />
      <Composition id="TitleLab" component={TitleLab} width={1920} height={1080} fps={30} durationInFrames={TITLE_LAB_STEP * 6} />
      <Composition id="Scene20" component={Scene20} width={1920} height={1080} fps={30} durationInFrames={S20.duration} />
    </Folder>
    <Composition id="VoiceEpisode" component={VoiceEpisode} width={1920} height={1080} fps={30} durationInFrames={VOICE_DURATION} />
    <Composition id="Episode" component={Episode} width={1920} height={1080} fps={30} durationInFrames={EPISODE_DURATION} />
    <Composition id="Library" component={Library} width={1920} height={1080} fps={30} durationInFrames={90} />
  </>
);

import { useEffect, useRef } from 'react';
import { photo, type PhotoKey } from '../../media/catalog';
import { WAVE_BARS } from './demoClips';
import { startEditorDemo } from './editorDemo';
import { useT } from '../../i18n';

/** V1 clips in timeline order, with their slot [left %, width %]. */
const CLIPS: [PhotoKey, number, number][] = [['walk', 0, 16], ['tokyo', 16, 20], ['food', 36, 14], ['tower', 50, 18], ['temple', 68, 12], ['city', 80, 20]];
export default function EditorShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const d = useT().demo;
  useEffect(() => (ref.current ? startEditorDemo(ref.current, d) : undefined), [d]);

  return (
    <div ref={ref} className="es" role="img" aria-label={d.editorLabel}>
      <div className="es-bar">
        <span className="es-dots"><span /><span /><span /></span>
        <span className="es-file">{d.file}</span>
        <span className="es-pill"><span data-a="sdot" className="es-pill__dot" /><span data-a="status">{d.ready}</span></span>
        <span data-a="tc" className="es-tc">00:00:00</span>
      </div>

      <div className="es-view">
        <div data-a="stage" className="es-stage">
          {CLIPS.map(([k]) => <img key={k} data-a="shot" className="es-fill es-shot" src={photo(k, k === 'tokyo' ? 1400 : 720)} alt="" />)}
          <div data-a="desat" className="es-fill es-desat" />
          <div data-a="tint" className="es-fill es-tint" />
          <div data-a="vig" className="es-fill es-vig" />
        </div>
        <div data-a="grain" className="es-grain" />
        <div data-a="lbt" className="es-lb es-lb--top" />
        <div data-a="lbb" className="es-lb es-lb--bottom" />
        <div className="es-title">
          <span data-a="kicker" className="es-kicker">{d.kicker}</span>
          <div className="es-mask"><div data-a="t1" className="es-title__line es-title__line--gold">{d.title1}</div></div>
          <div className="es-mask"><div data-a="t2" className="es-title__line">{d.title2}</div></div>
          <span data-a="rule" className="es-rule" />
        </div>
        <div data-a="cap" className="es-cap">{d.caption.map(w => <span key={w} data-a="word">{w}</span>)}</div>
        <img data-a="raw" className="es-fill es-raw" src={photo('tokyo', 1400)} alt="" />
        <div data-a="veil" className="es-fill es-veil" />
        <div data-a="box" className="es-box" style={{ left: '52%', top: '40%', width: '17%', height: '40%' }}><span>{d.subject}</span></div>
        <div data-a="box" className="es-box es-box--soft" style={{ left: '14%', top: '14%', width: '30%', height: '44%' }}><span>{d.scene}</span></div>
        <div data-a="div" className="es-fill es-divider"><div className="es-divider__line" /><div className="es-divider__knob">‹›</div></div>
        <span data-a="lraw" className="es-tag es-tag--raw">{d.rawFootage}</span>
        <span data-a="lai" className="es-tag es-tag--ai">{d.aiEdit}</span>
        <div data-a="exp" className="es-exp">
          <span data-a="expt">{d.exporting} 0 %</span>
          <span className="es-exp__track"><span data-a="expb" /></span>
        </div>
      </div>

      <div data-full="1" className="es-bin">
        <span>{d.media}</span>
        {CLIPS.map(([k]) => <img key={k} data-a="bin" src={photo(k, 360)} alt="" />)}
      </div>

      <div className="es-tl">
        <span /><div className="es-ruler" />
        <span>T1</span>
        <div className="es-track es-track--t1">
          <div data-a="tb" className="es-tb" style={{ left: '4%', width: '30%', background: '#7c4dff' }}>{d.title1} {d.title2}</div>
          <div data-a="tb" className="es-tb" style={{ left: '40%', width: '42%', background: '#5b3bb8' }}>{d.captions}</div>
        </div>
        <span>V1</span>
        <div className="es-track es-track--v1">
          {CLIPS.map(([k, l, w], i) => (
            <div key={k} data-a="clip" className="es-clip" style={{ left: l + '%', width: i === CLIPS.length - 1 ? w + '%' : `calc(${w}% - 2px)` }}>
              <img src={photo(k, 360)} alt="" />
              <span data-a="cbar" className="es-clip__bar" />
            </div>
          ))}
          {[16, 36, 50, 68, 80].map(l => <span key={l} data-a="cut" className="es-cut" style={{ left: l + '%' }} />)}
          <span data-a="scan" className="es-scan" />
        </div>
        <span data-full="1">{d.effects}</span>
        <div data-full="1" className="es-track--fx">
          {([[d.fx[0], 33], [d.fx[1], 49], [d.fx[2], 64], [d.fx[3], 80]] as const).map(([t, l]) => <span key={t} data-a="fx" style={{ left: l + '%' }}>{t}</span>)}
        </div>
        <span>A1</span>
        <div className="es-track es-track--a1">
          <div data-a="wave" className="es-wave">{WAVE_BARS.map((h, i) => <span key={i} style={{ height: h }} />)}</div>
        </div>
        <span data-full="1">A2</span>
        <div data-full="1" className="es-track es-track--a2">
          <div data-a="music" className="es-music">{d.musicTrack}</div>
        </div>
        <div data-a="ph" className="es-ph"><div><span data-a="phh" /></div></div>
      </div>
    </div>
  );
}

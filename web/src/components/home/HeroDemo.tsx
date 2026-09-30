import { useEffect, useRef, type CSSProperties } from 'react';
import { photo } from '../../media/catalog';
import { DEMO_CLIPS, HERO_CL, HERO_TIMELINE, WAVE_BARS } from './demoClips';
import { startHeroDemo } from './heroAnimation';
import { useT } from '../../i18n';

// Art-directed placement of the floating rush cards (same order as DEMO_CLIPS).
// m=0 cards are hidden when the demo is narrow.
const CARD_POS: { pos: CSSProperties; z: number; tilt: string; m: 0 | 1 }[] = [
  { pos: { left: '-4%', top: 0, width: '30%' }, z: 1, tilt: 'rotate(-4deg) scale(.95)', m: 1 },
  { pos: { right: '-3%', top: '8%', width: '28%' }, z: 3, tilt: 'rotate(3deg) scale(1.05)', m: 1 },
  { pos: { right: '-4%', bottom: '30%', width: '24%' }, z: 1, tilt: 'rotate(-2deg) scale(.85)', m: 0 },
  { pos: { left: '-7%', bottom: '12%', width: '26%' }, z: 3, tilt: 'rotate(5deg) scale(.9)', m: 1 },
  { pos: { right: '9%', bottom: 0, width: '20%' }, z: 1, tilt: 'rotate(-3deg) scale(.85)', m: 0 }
];

const byId = Object.fromEntries(DEMO_CLIPS.map(c => [c.id, c]));
export default function HeroDemo({ speed = 1 }: { speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const d = useT().demo;
  useEffect(() => (ref.current ? startHeroDemo(ref.current, { speed, status: d.heroStatus }) : undefined), [speed, d]);

  return (
    <div ref={ref} className="hd" aria-label={d.heroLabel} role="img">
      {DEMO_CLIPS.map((c, i) => {
        const cp = CARD_POS[i];
        return (
          <div key={c.id} data-h="card" data-m={cp.m} className="hd-card" style={{ ...cp.pos, zIndex: cp.z }}>
            <div data-h="cin" className="hd-card__in" style={{ transform: cp.tilt }}>
              <img src={photo(c.photo, 360)} alt="" />
              <span data-h="cscan" className="hd-card__scan" />
              <span data-h="cbadge" className="hd-card__badge">{c.score}</span>
              <div className="hd-card__bar"><span className="hd-card__play" /><span className="hd-card__label">{d.clips[c.id] ?? c.label}</span><span className="hd-card__dur">{c.dur}</span></div>
            </div>
          </div>
        );
      })}

      <div data-h="panel" className="hd-panel">
        <div className="hd-status">
          <span className="hd-ai">{d.ai}</span>
          <span data-h="st" className="hd-status__text">{d.heroStatus[0]}</span>
          <span data-h="ok" className="hd-status__ok">✓</span>
          <span data-h="pct" className="hd-status__pct">—</span>
        </div>
        <div className="hd-prog"><div data-h="prog" /></div>

        <div className="hd-view">
          {HERO_TIMELINE.map(id => <img key={id} data-h="shot" className="hd-fill hd-shot" src={photo(byId[id].photo, 720)} alt="" />)}
          <div data-h="tint" className="hd-fill hd-tint" />
          <div data-h="vig" className="hd-fill hd-vig" />
          <div data-h="lbt" className="hd-lb hd-lb--top" />
          <div data-h="lbb" className="hd-lb hd-lb--bottom" />
          <div className="hd-title">
            <div className="hd-mask"><div data-h="lt1" className="hd-title__line hd-title__line--gold">{d.title1}</div></div>
            <div className="hd-mask"><div data-h="lt2" className="hd-title__line">{d.title2}</div></div>
            <span data-h="ltr" className="hd-title__rule" />
          </div>
          <div data-h="cap" className="hd-cap">{d.caption.map(w => <span key={w} data-h="w">{w}</span>)}</div>
          <img data-h="raw" className="hd-fill hd-raw" src={photo('tokyo', 720)} alt="" />
          <div data-h="veil" className="hd-fill hd-veil" />
          <div data-h="box" className="hd-box"><span>{d.subject}</span></div>
          <div data-h="dv" className="hd-fill hd-divider"><div className="hd-divider__line" /><span className="hd-divider__tag">{d.aiEdit}</span></div>
          <span data-h="lraw" className="hd-rawtag">{d.raw}</span>
        </div>

        <div className="hd-tl">
          <span>{d.video}</span>
          <div className="hd-tl__video">
            {HERO_TIMELINE.map((id, j) => {
              const [l, w] = HERO_CL[j];
              return (
                <div key={id} data-h="clip" className="hd-clip" style={{ left: l + '%', width: j === HERO_CL.length - 1 ? w + '%' : `calc(${w}% - 2px)` }}>
                  <img src={photo(byId[id].photo, 360)} alt="" />
                </div>
              );
            })}
            {[24, 42, 64].map(l => <span key={l} data-h="cut" className="hd-cut" style={{ left: l + '%' }} />)}
          </div>
          <span>{d.captions}</span>
          <div className="hd-tl__caps">
            {[[6, 26], [36, 20], [60, 34]].map(([l, w]) => <span key={l} data-h="cb" style={{ left: l + '%', width: w + '%' }} />)}
          </div>
          <span>{d.music}</span>
          <div className="hd-tl__music">
            <div data-h="wave" className="hd-wave">{WAVE_BARS.slice(0, 64).map((h, i) => <span key={i} style={{ height: h }} />)}</div>
          </div>
          <span data-h="fxl">{d.effects}</span>
          <div data-h="fxt" className="hd-tl__fx">
            {([[d.fx[0], 20], [d.fx[1], 43], [d.fx[2], 66]] as const).map(([t, l]) => <span key={t} data-h="fx" style={{ left: l + '%' }}>{t}</span>)}
          </div>
          <div data-h="ph" className="hd-ph"><div><span /></div></div>
        </div>
      </div>
    </div>
  );
}

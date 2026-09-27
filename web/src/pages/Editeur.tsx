import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Mediatheque, { type LibraryItem } from '../components/editor/Mediatheque';
import { photo, video, videoPoster, type PhotoKey } from '../media/catalog';
import { readUpload, TIMELINE_KEY, writeUpload } from '../lib/plugMedia';
import './editeur.css';

const BGS = [
  'radial-gradient(70% 60% at 30% 25%,#ff9ec8 0%,rgba(255,158,200,0) 60%),radial-gradient(60% 60% at 80% 80%,#7c4dff 0%,rgba(124,77,255,0) 70%),linear-gradient(160deg,#5b2fb8,#c04c8a)',
  'radial-gradient(60% 60% at 70% 30%,#ffd29a 0%,rgba(255,210,154,0) 60%),linear-gradient(160deg,#b0356f,#4d1636)',
  'radial-gradient(60% 60% at 30% 70%,#8fb6ff 0%,rgba(143,182,255,0) 60%),linear-gradient(160deg,#2a1540,#6b4fa8)',
  'radial-gradient(60% 60% at 60% 40%,#ff8f8f 0%,rgba(255,143,143,0) 60%),linear-gradient(160deg,#3b1a5c,#ff6fb0)',
  'radial-gradient(60% 60% at 40% 30%,#c9f0ff 0%,rgba(201,240,255,0) 55%),linear-gradient(160deg,#0f3340,#8a5cff)'
];
const NEW_IMGS: PhotoKey[] = ['city', 'food', 'tower', 'street', 'alley'];
const TITLES = ['[48 HEURES] À TOKYO', 'LE [VRAI] PRIX DU RAMEN', 'CE QUE [PERSONNE] NE MONTRE', '[3 QUARTIERS] EN UNE NUIT', 'LA [FIN] DU VOYAGE'];
const STYLES = ['Vlog', 'Tuto', 'Podcast', 'Gaming', 'Documentaire'];
const FORMATS = ['16:9 YouTube', '9:16 Shorts', '1:1'];
const MUSIC = ['Lo-fi', 'Cinématique', 'Électro', 'Sans musique'];
const GEN_STEPS = ['Analyse des rushes…', 'Détection des temps morts…', 'Choix des meilleures prises…', 'Montage et rythme…', 'Sous-titres…'];
const ICONS = {
  montage: 'M4 5h16v14H4z M4 9h16 M9 5v4 M15 5v4 M10 13l4 2-4 2z',
  shorts: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M11 10l3 2-3 2z',
  texte: 'M4 20h4L19 9l-4-4L4 16z M14 6l4 4',
  medias: 'M7 7h13v13H7z M4 17V4h13 M10 16l3-3 2 2 2-2 3 3',
  packs: 'M12 3.5l2.5 5.2 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8z'
};
const RAIL: [Rail, string][] = [['montage', 'Montage'], ['shorts', 'Shorts'], ['texte', 'Titres & sous-titres'], ['medias', 'Médias'], ['packs', 'Packs']];
const TABS: [Tab, string][] = [['video', 'Montage vidéo'], ['shorts', 'Shorts'], ['tools', 'Outils IA']];
const MOMENTS: [string, string, PhotoKey][] = [['Arrivée à Shibuya', '02:14 – 02:44', 'city'], ['Ramen à Shinjuku', '11:05 – 11:35', 'food'], ['Vue depuis la tour', '24:40 – 25:10', 'tokyo'], ['Temple Senso-ji', '33:02 – 33:32', 'temple']];
const SUB_STYLES: [string, string, string, 'uppercase' | 'none'][] = [['Karaoké', 'Poppins', '#FFD35C', 'uppercase'], ['Minimal', "'DM Sans', Manrope, sans-serif", '#fff', 'none'], ['Néon', 'Poppins', '#ff8fb9', 'uppercase'], ['Classique', 'Georgia', '#fff', 'none']];
const PACKS: [string, string, PhotoKey][] = [['Motion Pop', 'Transitions et zooms punchy', 'concert'], ['Cinéma', 'Étalonnage et barres cinéma', 'cinema'], ['Vlog Voyage', 'Cartes, titres et lower thirds', 'travel'], ['Néon Night', 'Glow et textes lumineux', 'neon']];
const TOOLS: [string, string][] = [['Suppression des silences', 'Coupe les blancs et hésitations'], ['Recadrage automatique', 'Suit le visage en 9:16'], ['Amélioration audio', 'Réduit le bruit, égalise la voix'], ['Traduction des sous-titres', 'Anglais, espagnol, allemand'], ['Miniature IA', '3 propositions de miniatures']];

type Rail = 'montage' | 'shorts' | 'texte' | 'medias' | 'packs' | 'outils';
type Tab = 'video' | 'shorts' | 'tools';
interface Version { name: string; desc: string; dur: string; bg: string; title: string; img: string; vid?: string }

/** "[mot]" in a title is highlighted in yellow, per the video charter. */
const segs = (t: string) => t.split(/(\[[^\]]*\])/).filter(Boolean).map(p => (p[0] === '[' ? { t: p.slice(1, -1), c: '#FFD35C' } : { t: p, c: '#fff' }));
const toggleIn = (list: number[], i: number) => (list.includes(i) ? list.filter(x => x !== i) : [...list, i]);

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={'ed-switch' + (on ? ' is-on' : '')} onClick={onClick}><span /></button>;
}

function Seg({ options, value, onPick }: { options: string[]; value: number; onPick: (i: number) => void }) {
  return (
    <div className="ed-seg">
      {options.map((o, i) => <button key={o} type="button" aria-pressed={value === i} className={value === i ? 'is-on' : ''} onClick={() => onPick(i)}>{o}</button>)}
    </div>
  );
}

export default function Editeur() {
  const [scale, setScale] = useState(1);
  const [tab, setTab] = useState<Tab>('video');
  const [rail, setRail] = useState<Rail>('montage');
  const [ai, setAi] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [style, setStyle] = useState(0), [format, setFormat] = useState(0), [music, setMusic] = useState(0);
  const [rythme, setRythme] = useState(62);
  const [prompt, setPrompt] = useState('Vlog de voyage dynamique. Garde les réactions spontanées, coupe les silences et les hésitations, accroche forte dans les 5 premières secondes, sous-titres animés.');
  const [versions, setVersions] = useState<Version[]>(() => [
    { name: 'Version C', desc: 'Nerveux · 38 coupes', dur: '09:12', bg: BGS[1], title: TITLES[1], img: videoPoster('nightStreet'), vid: video('nightStreet') },
    { name: 'Version B', desc: 'Équilibré · 31 coupes', dur: '10:04', bg: BGS[2], title: TITLES[3], img: photo('crossing', 1400), vid: video('crossing') },
    { name: 'Version A', desc: 'Posé · 24 coupes', dur: '11:47', bg: BGS[0], title: TITLES[0], img: photo('tokyo', 1400), vid: video('tokyo') }
  ]);
  const [sel, setSel] = useState(0);
  const [gen, setGen] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0.18);
  const [toast, setToast] = useState('');
  const [file, setFile] = useState('tokyo_vlog_rush.mp4');
  const [shDur, setShDur] = useState(1), [moms, setMoms] = useState([0, 2]);
  const [subSt, setSubSt] = useState(0), [subPos, setSubPos] = useState(1), [kw, setKw] = useState(true);
  const [pack, setPack] = useState(0), [tools, setTools] = useState([0, 2]);

  const vidRef = useRef<HTMLVideoElement>(null);
  const timers = useRef({ iv: 0, giv: 0, tt: 0 });

  const flash = (m: string) => {
    clearTimeout(timers.current.tt); setToast(m);
    timers.current.tt = window.setTimeout(() => setToast(''), 2400);
  };

  // Fixed 1440×900 app frame, scaled down to fit the window.
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 24) / 1440, (window.innerHeight - 24) / 900));
    fit(); window.addEventListener('resize', fit);
    const tm = timers.current;
    return () => { window.removeEventListener('resize', fit); clearInterval(tm.iv); clearInterval(tm.giv); clearTimeout(tm.tt); };
  }, []);

  // Upload handed over from the homepage.
  useEffect(() => {
    const up = readUpload(); if (!up) return;
    setFile(up.name);
    if (up.count > 1) setRail('medias');
    if (up.fresh !== false) { flash('Import terminé · 3 versions proposées'); writeUpload({ ...up, fresh: false }); }
  }, []);

  const cur = versions[sel];

  useEffect(() => {
    const v = vidRef.current; if (!v) return;
    if (playing && v.paused) v.play().catch(() => {});
    if (!playing && !v.paused) v.pause();
  });

  const togglePlay = () => {
    if (playing) { clearInterval(timers.current.iv); setPlaying(false); return; }
    setPlaying(true);
    timers.current.iv = window.setInterval(() => setT(x => {
      const n = x + 0.002;
      if (n >= 1) { clearInterval(timers.current.iv); setPlaying(false); return 1; }
      return n;
    }), 60);
  };

  // Simulated AI edit: progress, then a new version is prepended and selected.
  const versionsRef = useRef(versions); versionsRef.current = versions;
  const generate = () => {
    if (gen !== null) return;
    let g = 0; setGen(0);
    timers.current.giv = window.setInterval(() => {
      g += 1.5 + Math.random() * 3;
      if (g < 100) { setGen(g); return; }
      clearInterval(timers.current.giv);
      const n = versionsRef.current.length, cuts = Math.round(18 + rythme * 0.3);
      const v: Version = {
        name: 'Version ' + String.fromCharCode(65 + n), desc: STYLES[style] + ' · ' + cuts + ' coupes',
        dur: String(Math.round(13 - rythme / 14)).padStart(2, '0') + ':' + String(10 + (n * 17) % 49).padStart(2, '0'),
        bg: BGS[n % 5], title: TITLES[n % 5], img: photo(NEW_IMGS[(n - 3) % NEW_IMGS.length], 1400)
      };
      setVersions(vs => [v, ...vs]);
      setGen(null); setSel(0); setT(0);
      flash(v.name + ' prête');
    }, 110);
  };

  const onLibAdd = (items: LibraryItem[]) => {
    try { localStorage.setItem(TIMELINE_KEY, JSON.stringify(items.map(i => ({ id: i.id, name: i.name, type: i.type, duration: i.duration })))); } catch { /* storage disabled */ }
  };

  const pickRail = (id: Rail) => { setRail(id); setTab(id === 'shorts' ? 'shorts' : 'video'); };
  const pickTab = (id: Tab) => { setTab(id); setRail(({ video: 'montage', shorts: 'shorts', tools: 'outils' } as const)[id]); };

  const [mm, ss] = cur.dur.split(':').map(Number), tot = mm * 60 + ss, now = Math.round(tot * t);
  const tcNow = String(Math.floor(now / 60)).padStart(2, '0') + ':' + String(now % 60).padStart(2, '0');
  let seed = sel * 7 + 3;
  const clips = Array.from({ length: 22 }, (_, i) => { seed = (seed * 9301 + 49297) % 233280; return { f: 1 + (seed % 5), h: 14 + (seed % 16), done: i / 22 < t }; });
  const rv = rythme < 34 ? 'Posé' : rythme < 67 ? 'Équilibré' : 'Nerveux';
  const rows: [string, string, string[], number, (i: number) => void, string][] = [
    ['style', 'Style de montage', STYLES, style, setStyle, 'linear-gradient(135deg,#ff9ec8,#7c4dff)'],
    ['format', 'Format', FORMATS, format, setFormat, 'linear-gradient(135deg,#8fb6ff,#5b2fb8)'],
    ['music', 'Musique', MUSIC, music, setMusic, 'linear-gradient(135deg,#ffd29a,#f07aa8)']
  ];
  const isMedias = rail === 'medias';
  const CTA = ({ children, onClick, glow }: { children: string; onClick: () => void; glow?: boolean }) => (
    <><div className="ed-spacer" /><button type="button" className={'ed-cta' + (glow ? ' ed-cta--glow' : '')} onClick={onClick}>{children}</button></>
  );

  return (
    <div className="ed-screen">
      <div className="ed" style={{ transform: `scale(${scale})` }} data-screen-label="Éditeur">
        <Link to="/" className="ed-logo" aria-label="Plug, accueil"><span><span /></span></Link>
        <div className="ed-tabs" role="tablist">
          {TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => pickTab(id)}>{label}</button>)}
        </div>
        <div className="ed-top">
          <span className="ed-top__label">Montage IA restant</span>
          <span className="ed-top__quota">3h06</span>
          <Link to="/tarifs" className="ed-top__pro">Passer Pro</Link>
          <button type="button" className="ed-top__export" onClick={() => flash('Export 1080p lancé · ' + cur.name)}>Exporter</button>
          <span className="ed-top__avatar" aria-label="Compte SN">SN</span>
        </div>

        <nav className="ed-rail" aria-label="Outils">
          {RAIL.map(([id, label]) => (
            <button key={id} type="button" title={label} aria-label={label} aria-pressed={rail === id} className={rail === id ? 'is-on' : ''} onClick={() => pickRail(id)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[id as keyof typeof ICONS]} /></svg>
            </button>
          ))}
        </nav>

        <section className="ed-panel" hidden={isMedias} data-screen-label="Réglages">
          {rail === 'shorts' && (
            <>
              <h1>Créer des Shorts</h1>
              <div className="ed-box"><span className="ed-box__label">Durée</span><Seg options={['15 s', '30 s', '60 s']} value={shDur} onPick={setShDur} /></div>
              <div className="ed-hint">Moments forts détectés</div>
              {MOMENTS.map(([label, tc, img], i) => {
                const on = moms.includes(i);
                return (
                  <button key={label} type="button" aria-pressed={on} className={'ed-moment' + (on ? ' is-on' : '')} onClick={() => setMoms(m => toggleIn(m, i))}>
                    <img src={photo(img, 360)} alt="" />
                    <div><span>{label}</span><span className="ed-mono">{tc}</span></div>
                    <span className="ed-moment__dot" />
                  </button>
                );
              })}
              <CTA onClick={() => flash(moms.length ? moms.length + ' Shorts en préparation' : 'Sélectionnez au moins un moment')}>{'Générer ' + moms.length + ' Short' + (moms.length > 1 ? 's' : '')}</CTA>
            </>
          )}
          {rail === 'texte' && (
            <>
              <h1>Titres &amp; sous-titres</h1>
              <div className="ed-substyles">
                {SUB_STYLES.map(([label, font, c, tt], i) => (
                  <button key={label} type="button" aria-pressed={subSt === i} className={subSt === i ? 'is-on' : ''} onClick={() => setSubSt(i)}>
                    <span style={{ fontFamily: font, color: c, textTransform: tt }}>Bonjour Tokyo</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="ed-box"><span className="ed-box__label">Position</span><Seg options={['Haut', 'Centre', 'Bas']} value={subPos} onPick={setSubPos} /></div>
              <div className="ed-box ed-box--row"><span className="ed-box__label ed-grow">Mots-clés en couleur</span><Toggle on={kw} onClick={() => setKw(!kw)} label="Mots-clés en couleur" /></div>
              <CTA onClick={() => flash('Sous-titres « ' + SUB_STYLES[subSt][0] + ' » appliqués')}>Appliquer aux sous-titres</CTA>
            </>
          )}
          {rail === 'packs' && (
            <>
              <h1>Packs</h1>
              {PACKS.map(([name, desc, img], i) => (
                <button key={name} type="button" aria-pressed={pack === i} className={'ed-pack' + (pack === i ? ' is-on' : '')} onClick={() => setPack(i)}>
                  <img src={photo(img, 360)} alt="" />
                  <div><span>{name}</span><span className="ed-sub">{desc}</span></div>
                  <span className="ed-pack__state">{pack === i ? 'Sélectionné' : ''}</span>
                </button>
              ))}
              <Link to="/tarifs#packs" className="ed-link">Voir tous les packs →</Link>
              <CTA onClick={() => flash('Pack ' + PACKS[pack][0] + ' appliqué')}>Appliquer le pack</CTA>
            </>
          )}
          {rail === 'outils' && (
            <>
              <h1>Outils IA</h1>
              {TOOLS.map(([label, desc], i) => (
                <div key={label} className="ed-tool">
                  <div><span>{label}</span><span className="ed-sub">{desc}</span></div>
                  <Toggle on={tools.includes(i)} onClick={() => setTools(x => toggleIn(x, i))} label={label} />
                </div>
              ))}
              <CTA onClick={() => flash(tools.length ? tools.length + ' outil(s) IA en cours' : 'Activez au moins un outil')}>{'Lancer ' + tools.length + ' outil' + (tools.length > 1 ? 's' : '')}</CTA>
            </>
          )}
          {rail === 'montage' && (
            <>
              <h1>Monter la vidéo</h1>
              <div className="ed-brief">
                <div className="ed-brief__file">
                  <img src={photo('tokyo', 360)} alt="" />
                  <div><div className="ed-ellipsis">{file}</div><div className="ed-sub ed-mono">rush · 42:18</div></div>
                  <Link to="/#upload">Changer</Link>
                </div>
                <div className="ed-brief__sep" />
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} placeholder="Décrivez le montage souhaité" aria-label="Consigne de montage" />
                <div className="ed-brief__ai">
                  <Toggle on={ai} onClick={() => setAi(!ai)} label="Suggestions IA" />
                  <span>Suggestions IA</span>
                  <button type="button" title="Améliorer la consigne" aria-label="Améliorer la consigne" onClick={() => { setPrompt(p => p.replace(/\s*$/, '') + ' Ajoute des zooms punchy sur les moments forts et une fin avec appel à s’abonner.'); flash('Consigne enrichie par l’IA'); }}>✦</button>
                </div>
              </div>
              {rows.map(([id, label, list, value, set, sw]) => {
                const isOpen = open === id;
                return (
                  <div key={id} className="ed-row">
                    <button type="button" aria-expanded={isOpen} className="ed-row__head" onClick={() => setOpen(isOpen ? null : id)}>
                      <span className="ed-row__sw" style={{ background: sw }} />
                      <span className="ed-grow">{label}</span>
                      <span className="ed-row__val">{list[value]}</span>
                      <span className="ed-row__chev" style={{ transform: `rotate(${isOpen ? 90 : 0}deg)` }}>›</span>
                    </button>
                    {isOpen && (
                      <div className="ed-row__opts">
                        {list.map((o, i) => <button key={o} type="button" aria-pressed={value === i} className={value === i ? 'is-on' : ''} onClick={() => { set(i); setOpen(null); }}>{o}</button>)}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="ed-box">
                <div className="ed-rythme__head"><span>Rythme des coupes</span><span className="ed-mono">{rv}</span></div>
                <div className="ed-range">
                  <div className="ed-range__track" />
                  <div className="ed-range__fill" style={{ width: rythme + '%' }} />
                  <input type="range" min={0} max={100} value={rythme} onChange={e => setRythme(+e.target.value)} aria-label="Rythme des coupes" />
                </div>
                <div className="ed-rythme__scale"><span>Posé</span><span>Équilibré</span><span>Nerveux</span></div>
              </div>
              <CTA glow onClick={generate}>{gen !== null ? 'Montage en cours… ' + Math.round(gen) + '%' : 'Lancer le montage IA'}</CTA>
            </>
          )}
        </section>

        <section className="ed-preview" hidden={isMedias} style={{ background: cur.bg }} data-screen-label="Aperçu">
          <img src={cur.img} alt="" />
          {cur.vid && <video key={cur.vid} ref={vidRef} src={cur.vid} poster={cur.img} muted loop playsInline />}
          <div className="ed-preview__shade" />
          <div className="ed-preview__top">
            <span>{cur.name}</span>
            <span className="ed-mono">{tcNow} / {cur.dur}</span>
          </div>
          <div className="ed-preview__title"><div>{segs(cur.title).map((s, i) => <span key={i} style={{ color: s.c }}>{s.t}</span>)}</div></div>
          <button type="button" className="ed-preview__play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Lecture'}>{playing ? '❚❚' : '▶'}</button>
          <div className="ed-preview__bottom">
            <div className="ed-chips">{[FORMATS[format].split(' ')[0], STYLES[style], '1080p'].map(c => <span key={c}>{c}</span>)}</div>
            <div className="ed-preview__prompt">{prompt}</div>
            <div className="ed-scrub" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setT(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); }}
              role="slider" tabIndex={0} aria-label="Position de lecture" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(t * 100)}
              onKeyDown={e => { if (e.key === 'ArrowRight') setT(x => Math.min(1, x + 0.02)); if (e.key === 'ArrowLeft') setT(x => Math.max(0, x - 0.02)); }}>
              {clips.map((k, i) => <div key={i} style={{ flex: `${k.f} 1 0`, height: k.h, background: k.done ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.35)' }} />)}
              <div className="ed-scrub__head" style={{ left: (t * 100).toFixed(2) + '%' }} />
            </div>
          </div>
        </section>

        <section className="ed-lib" hidden={!isMedias} data-screen-label="Médiathèque">
          <Mediatheque onAdd={onLibAdd} />
        </section>

        <section className="ed-versions" data-screen-label="Versions">
          <button type="button" className="ed-new" onClick={generate}>
            {gen !== null ? (
              <><span className="ed-new__pct">{Math.round(gen) + '%'}</span><span>{GEN_STEPS[Math.min(4, Math.floor(gen / 20))]}</span></>
            ) : (
              <>
                <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true"><path d="M12 3.5l2.5 5.2 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8z" /><path d="M4 3v3M2.5 4.5h3M20 2v3M18.5 3.5h3" strokeLinecap="round" /></svg>
                <span>Nouvelle version</span>
              </>
            )}
          </button>
          {versions.slice(0, 3).map((v, i) => (
            <button key={v.name} type="button" aria-pressed={i === sel} className={'ed-ver' + (i === sel ? ' is-on' : '')} style={{ background: v.bg }} onClick={() => { setSel(i); setT(0); }}>
              <img src={v.img} alt="" />
              {v.vid && <span className="ed-ver__vid">VIDÉO</span>}
              <span className="ed-ver__shade" />
              <span className="ed-ver__dur">{v.dur}</span>
              <span className="ed-ver__txt"><span>{v.name}</span><span>{v.desc}</span></span>
            </button>
          ))}
          <Link to="/tarifs#packs" className="ed-promo">
            <div className="ed-promo__head"><span>Packs Motion &amp; Style</span><span className="ed-promo__arrow">→</span></div>
            <div className="ed-promo__art">
              <img src={photo('concert', 360)} alt="" className="ed-promo__a" />
              <img src={photo('studio', 360)} alt="" className="ed-promo__b" />
              <span className="ed-promo__badge"><span>40</span><span>presets</span></span>
            </div>
          </Link>
        </section>

        {toast && <div className="ed-toast" role="status">{toast}</div>}
      </div>
    </div>
  );
}

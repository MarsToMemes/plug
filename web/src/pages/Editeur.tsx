import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Mediatheque from '../components/editor/Mediatheque';
import { api, jobActive, type EditStyle, type Health, type Pacing, type Plan, type PlanShot, type Project, type RenderInfo, type VoiceMode } from '../lib/api';
import './editeur.css';

const PROJECT_KEY = 'plug.project';
const EXAMPLE_SCRIPT = `# Le vrai business de McDonald's
? Comment McDonald's gagne-t-il vraiment de l'argent ?
McDonald's n'est pas une entreprise de burgers.
Derrière chaque comptoir, il y a autre chose.
Plus de 60 % de ses revenus viennent des franchisés.
# L'empire immobilier
? Jusqu'où va-t-il ?
Ils possèdent le terrain sous plus de la moitié de leurs restaurants.
Derrière les burgers, c'est un propriétaire.`;

const BGS = [
  'radial-gradient(70% 60% at 30% 25%,#ff9ec8 0%,rgba(255,158,200,0) 60%),radial-gradient(60% 60% at 80% 80%,#7c4dff 0%,rgba(124,77,255,0) 70%),linear-gradient(160deg,#5b2fb8,#c04c8a)',
  'radial-gradient(60% 60% at 70% 30%,#ffd29a 0%,rgba(255,210,154,0) 60%),linear-gradient(160deg,#b0356f,#4d1636)',
  'radial-gradient(60% 60% at 30% 70%,#8fb6ff 0%,rgba(143,182,255,0) 60%),linear-gradient(160deg,#2a1540,#6b4fa8)',
  'radial-gradient(60% 60% at 60% 40%,#ff8f8f 0%,rgba(255,143,143,0) 60%),linear-gradient(160deg,#3b1a5c,#ff6fb0)'
];
const ICONS = {
  montage: 'M4 5h16v14H4z M4 9h16 M9 5v4 M15 5v4 M10 13l4 2-4 2z',
  voix: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z M5 11a7 7 0 0 0 14 0 M12 18v3',
  texte: 'M4 20h4L19 9l-4-4L4 16z M14 6l4 4',
  medias: 'M7 7h13v13H7z M4 17V4h13 M10 16l3-3 2 2 2-2 3 3',
  controle: 'M9 6h11 M9 12h11 M9 18h11 M4 6l1 1 2-2 M4 12l1 1 2-2 M4 18l1 1 2-2'
};
type Rail = keyof typeof ICONS;
type Tab = 'video' | 'stills';
const RAIL: [Rail, string][] = [['montage', 'Montage'], ['voix', 'Voix off'], ['texte', 'Titres & sous-titres'], ['medias', 'Médias'], ['controle', 'Plan et contrôle']];
const TABS: [Tab, string][] = [['video', 'Montage vidéo'], ['stills', 'Planche de contrôle']];
const STYLES: [EditStyle, string][] = [['apple', 'Apple'], ['default', 'Classique']];
const VOICES: [VoiceMode, string][] = [['tts', 'Voix IA'], ['upload', 'Ma voix'], ['none', 'Sans voix']];
const PACING_AT: Record<Pacing, number> = { calm: 17, standard: 50, dynamic: 83 };
const JOB_LABEL = { direct: 'Montage', stills: 'Planche de contrôle', render: 'Rendu' } as const;
const TIMING_LABEL = { tts: 'timings fournis par la voix IA', stt: 'transcription ElevenLabs', aligned: 'alignement local (±0,15 s par mot)' } as const;

const fmt = (s: number) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
/** "[mot]" in a title is highlighted in yellow, per the video charter. */
const segs = (t: string) => t.split(/(\[[^\]]*\])/).filter(Boolean).map(p => (p[0] === '[' ? { t: p.slice(1, -1), c: '#FFD35C' } : { t: p, c: '#fff' }));
const firstLine = (script: string) => script.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('#') && !l.startsWith('?')) ?? '';
const versionFile = (r: RenderInfo) => r.file ?? 'video.mp4';
const versionKey = (r: RenderInfo) => r.id ?? r.createdAt;

function Toggle({ on, onClick, label, disabled }: { on: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className={'ed-switch' + (on ? ' is-on' : '')} onClick={onClick}><span /></button>;
}

function Seg<T extends string>({ options, value, onPick }: { options: [T, string][]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="ed-seg">
      {options.map(([v, label]) => <button key={v} type="button" aria-pressed={value === v} className={value === v ? 'is-on' : ''} onClick={() => onPick(v)}>{label}</button>)}
    </div>
  );
}

/** What a shot shows: its text, the text or figure of its studio block, its media, else its type. */
function shotLabel(s: PlanShot, p: Project): string {
  const v = s.block?.variables ?? {};
  const blockText = typeof v.text === 'string' ? v.text.replace(/[|*]/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const figure = v.to !== undefined ? `${v.prefix ?? ''}${v.to}${v.suffix ?? ''}` : '';
  return s.text || blockText || figure || (s.media ? p.media.find(m => m.id === s.media)?.description ?? '' : '') || s.type;
}

export default function Editeur() {
  const [scale, setScale] = useState(1);
  const [tab, setTab] = useState<Tab>('video');
  const [rail, setRail] = useState<Rail>('montage');
  const [open, setOpen] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [p, setP] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [draft, setDraft] = useState<{ title: string; script: string } | null>(null);
  const [selVer, setSelVer] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const vidRef = useRef<HTMLVideoElement>(null);
  const musicInput = useRef<HTMLInputElement>(null);
  const voiceInput = useRef<HTMLInputElement>(null);
  const timers = useRef({ toast: 0, save: 0 });

  const flash = (m: string) => {
    clearTimeout(timers.current.toast); setToast(m);
    timers.current.toast = window.setTimeout(() => setToast(''), 2600);
  };
  const fail = (e: unknown) => setError((e as Error).message);

  // Fixed 1440×900 app frame, scaled down to fit the window.
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 24) / 1440, (window.innerHeight - 24) / 900));
    fit(); window.addEventListener('resize', fit);
    const tm = timers.current;
    return () => { window.removeEventListener('resize', fit); clearTimeout(tm.toast); clearTimeout(tm.save); };
  }, []);

  const openProject = useCallback((project: Project) => {
    setP(project); setDraft({ title: project.title, script: project.script }); setPlan(null); setError('');
    setSelVer(null); setPlaying(false); setT(0);
    try { localStorage.setItem(PROJECT_KEY, project.id); } catch { /* storage disabled */ }
    if (project.plan) api.plan(project.id).then(setPlan).catch(() => setPlan(null));
    setTab(project.render || !project.stills ? 'video' : 'stills');
  }, []);

  // Start: capabilities, projects, last project (or a new one with the example script).
  // Once only, even when StrictMode runs effects twice: it may create a project.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api.health().then(setHealth).catch(fail);
    (async () => {
      const list = await api.list();
      setProjects(list);
      let last: string | null = null;
      try { last = localStorage.getItem(PROJECT_KEY); } catch { /* storage disabled */ }
      openProject(list.find(x => x.id === last) ?? list[0] ?? (await api.create({ title: 'Mon premier épisode', script: EXAMPLE_SCRIPT })));
    })().catch(fail);
  }, [openProject]);

  // Follow the running job.
  const active = jobActive(p ?? undefined);
  useEffect(() => {
    if (!p || !active) return;
    const iv = window.setInterval(async () => {
      try {
        const next = await api.get(p.id);
        setP(next);
        if (!jobActive(next)) {
          const j = next.job!;
          if (j.status === 'failed') setError(`${JOB_LABEL[j.kind]} : ${j.error ?? 'échec'}`);
          else {
            flash(`${JOB_LABEL[j.kind]} terminé`);
            if (j.kind === 'direct') api.plan(next.id).then(setPlan).catch(() => {});
            if (j.kind === 'stills') setTab('stills');
            if (j.kind === 'render') { setSelVer(null); setTab('video'); setT(0); }
          }
        }
      } catch (e) { fail(e); }
    }, 1000);
    return () => clearInterval(iv);
    // Only the project and whether a job runs restart the polling.
  }, [p?.id, active]);

  const patch = async (fields: Parameters<typeof api.update>[1]) => {
    if (!p) return;
    try { setP(await api.update(p.id, fields)); } catch (e) { fail(e); }
  };
  // Title and script are saved 600 ms after the last keystroke.
  const edit = (fields: { title?: string; script?: string }) => {
    if (!draft) return;
    setDraft({ ...draft, ...fields });
    clearTimeout(timers.current.save);
    timers.current.save = window.setTimeout(() => patch(fields), 600);
  };
  const flush = async () => {
    clearTimeout(timers.current.save);
    if (p && draft && (draft.title !== p.title || draft.script !== p.script)) await patch(draft);
  };

  const start = async (kind: 'direct' | 'stills' | 'preview' | 'final') => {
    if (!p || active) return;
    setError('');
    try {
      await flush();
      const job = kind === 'direct' ? await api.direct(p.id) : kind === 'stills' ? await api.stills(p.id) : await api.render(p.id, kind);
      setP({ ...p, job });
    } catch (e) { fail(e); }
  };

  const uploadAudio = async (file: File | undefined, role: 'voice' | 'music') => {
    if (!p || !file) return;
    flash(`Import de ${file.name}…`);
    try { setP(await api.upload(p.id, file, role)); flash(role === 'voice' ? 'Voix off importée' : 'Musique importée'); } catch (e) { fail(e); }
  };

  const newProject = async () => {
    try {
      await flush();
      const created = await api.create({ title: 'Nouvel épisode', script: '' });
      setProjects(await api.list()); openProject(created); setRail('montage');
    } catch (e) { fail(e); }
  };
  const switchProject = async (id: string) => {
    await flush();
    try { openProject(await api.get(id)); setProjects(await api.list()); } catch (e) { fail(e); }
  };

  // The player follows the real video.
  useEffect(() => {
    const v = vidRef.current; if (!v) return;
    if (playing && v.paused) v.play().catch(() => setPlaying(false));
    if (!playing && !v.paused) v.pause();
  });

  if (!p || !draft) {
    return <div className="ed-screen"><div className="ed-loading">{error || 'Chargement du studio…'}</div></div>;
  }

  const style = p.style ?? 'apple';
  const renders = p.renders?.length ? p.renders : p.render ? [p.render] : [];
  const letter = (r: RenderInfo) => 'Version ' + String.fromCharCode(65 + renders.length - 1 - renders.indexOf(r));
  const cur = renders.find(r => versionKey(r) === selVer) ?? renders[0];
  const voiceFile = p.media.find(m => m.role === 'voice');
  const music = p.media.find(m => m.role === 'music');
  const job = active ? p.job! : null;
  const jobPct = job ? Math.round((job.progress || 0) * 100) : 0;
  const planStale = !!p.plan && draft.script !== p.script;
  const curStale = !!cur && !!p.plan && cur.planCreatedAt !== p.plan.createdAt;
  const needsRights = p.media.some(m => m.role !== 'voice') && !p.rightsConfirmed;
  const isMedias = rail === 'medias';
  const showVideo = tab === 'video' && cur;
  const showStills = tab === 'stills' && p.stills;
  const total = cur?.durationInSeconds ?? p.plan?.durationInSeconds ?? 0;
  const frames = plan?.shots.reduce((s, x) => s + x.durationInFrames, 0) ?? 0;
  const clips = plan?.shots.map((s, i) => ({ f: s.durationInFrames, h: s.block || s.type === 'number' || s.type === 'chart' ? 22 : s.type === 'chapter' ? 28 : 16, done: frames > 0 && plan.shots.slice(0, i).reduce((a, x) => a + x.durationInFrames, 0) / frames < t, label: shotLabel(s, p) })) ?? [];
  const voiceLabel = p.voice.mode === 'tts' ? 'Voix IA ElevenLabs' : p.voice.mode === 'upload' ? voiceFile?.originalName ?? 'Aucune voix importée' : 'Sans voix off';
  const voiceSub = p.voiceTrack && p.voice.mode !== 'none' ? `voix · ${fmt(p.voiceTrack.durationInSeconds)}` : p.voice.mode === 'upload' && voiceFile?.durationInSeconds ? `voix · ${fmt(voiceFile.durationInSeconds)}` : p.voice.mode === 'tts' ? (health?.elevenLabs ? 'générée au montage' : 'clé ElevenLabs absente') : 'durées estimées';
  const rythme = PACING_AT[p.pacing];
  const rv = p.pacing === 'calm' ? 'Posé' : p.pacing === 'standard' ? 'Équilibré' : 'Nerveux';
  const rows: [string, string, [string, string][], string, (v: string) => void, string][] = [
    ['style', 'Style de montage', STYLES, style, v => patch({ style: v as EditStyle }), 'linear-gradient(135deg,#ff9ec8,#7c4dff)'],
    ['voice', 'Voix off', VOICES, p.voice.mode, v => { patch({ voice: { mode: v as VoiceMode, ...(p.voice.voiceId ? { voiceId: p.voice.voiceId } : {}) } }); if (v === 'upload' && !voiceFile) voiceInput.current?.click(); }, 'linear-gradient(135deg,#8fb6ff,#5b2fb8)'],
    ['music', 'Musique', [['none', 'Sans musique'], ...(music ? [[music.id, music.originalName] as [string, string]] : []), ['import', music ? 'Remplacer…' : 'Importer…']], music?.id ?? 'none',
      v => { if (v === 'import') musicInput.current?.click(); else if (v === 'none' && music) api.removeMedia(p.id, music.id).then(setP, fail); }, 'linear-gradient(135deg,#ffd29a,#f07aa8)']
  ];
  const seek = (x: number) => {
    const f = Math.max(0, Math.min(1, x));
    setT(f);
    if (vidRef.current && total) vidRef.current.currentTime = f * total;
  };
  const CTA = ({ children, onClick, disabled }: { children: string; onClick: () => void; disabled?: boolean }) => (
    <><div className="ed-spacer" /><button type="button" className="ed-cta ed-cta--glow" disabled={disabled} onClick={onClick}>{children}</button></>
  );

  return (
    <div className="ed-screen">
      <div className="ed" style={{ transform: `scale(${scale})` }} data-screen-label="Éditeur">
        <input ref={musicInput} type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg" hidden onChange={e => { void uploadAudio(e.target.files?.[0], 'music'); e.target.value = ''; }} />
        <input ref={voiceInput} type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg" hidden onChange={e => { void uploadAudio(e.target.files?.[0], 'voice'); e.target.value = ''; }} />

        <Link to="/" className="ed-logo" aria-label="Plug, accueil"><span><span /></span></Link>
        <div className="ed-tabs" role="tablist">
          {TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => { setTab(id); if (isMedias) setRail('montage'); }}>{label}</button>)}
        </div>
        <div className="ed-top">
          <span className="ed-top__label">Projet</span>
          <select className="ed-top__select" value={p.id} onChange={e => switchProject(e.target.value)} aria-label="Projet">
            {(projects.some(x => x.id === p.id) ? projects : [p, ...projects]).map(x => <option key={x.id} value={x.id}>{x.id === p.id ? draft.title || 'Sans titre' : x.title}</option>)}
          </select>
          <button type="button" className="ed-top__pro" onClick={newProject}>+ Nouveau</button>
          {cur && cur.scale >= 1 && !curStale
            ? <a className="ed-top__export" href={api.fileUrl(p.id, versionFile(cur), cur.createdAt)} download={`${draft.title || 'episode'}.mp4`}>Télécharger</a>
            : <button type="button" className="ed-top__export" disabled={!p.plan || active || needsRights} onClick={() => start('final')}>Exporter</button>}
        </div>

        <nav className="ed-rail" aria-label="Outils">
          {RAIL.map(([id, label]) => (
            <button key={id} type="button" title={label} aria-label={label} aria-pressed={rail === id} className={rail === id ? 'is-on' : ''} onClick={() => setRail(id)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[id]} /></svg>
            </button>
          ))}
        </nav>

        <section className="ed-panel" hidden={isMedias} data-screen-label="Réglages">
          {rail === 'montage' && (
            <>
              <h1>Monter la vidéo</h1>
              <div className="ed-brief">
                <div className="ed-brief__file">
                  {cur?.poster ? <img src={api.fileUrl(p.id, cur.poster)} alt="" /> : <span className="ed-brief__thumb" style={{ background: BGS[0] }} />}
                  <div><div className="ed-ellipsis">{voiceLabel}</div><div className="ed-sub ed-mono">{voiceSub}</div></div>
                  <button type="button" className="ed-brief__change" onClick={() => setRail('voix')}>Changer</button>
                </div>
                <div className="ed-brief__sep" />
                <textarea value={draft.script} onChange={e => edit({ script: e.target.value })} rows={5} placeholder={'# Chapitre\n? Question du chapitre\nUne phrase par ligne.'} aria-label="Script" spellCheck />
                <div className="ed-brief__ai">
                  <Toggle on={p.llm && !!health?.anthropic} disabled={!health?.anthropic} onClick={() => patch({ llm: !p.llm })} label="Réalisation par Claude" />
                  <span>{health?.anthropic ? 'Réalisation par Claude' : 'Réalisation par Claude (clé absente)'}</span>
                </div>
              </div>
              {rows.map(([id, label, list, value, set, sw]) => {
                const isOpen = open === id;
                return (
                  <div key={id} className="ed-row">
                    <button type="button" aria-expanded={isOpen} className="ed-row__head" onClick={() => setOpen(isOpen ? null : id)}>
                      <span className="ed-row__sw" style={{ background: sw }} />
                      <span className="ed-grow">{label}</span>
                      <span className="ed-row__val ed-ellipsis">{list.find(([v]) => v === value)?.[1]}</span>
                      <span className="ed-row__chev" style={{ transform: `rotate(${isOpen ? 90 : 0}deg)` }}>›</span>
                    </button>
                    {isOpen && (
                      <div className="ed-row__opts">
                        {list.map(([v, o]) => <button key={v} type="button" aria-pressed={value === v} className={value === v ? 'is-on' : ''} onClick={() => { set(v); setOpen(null); }}>{o}</button>)}
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
                  <input type="range" min={0} max={100} value={rythme} aria-label="Rythme des coupes"
                    onChange={e => { const v = +e.target.value; const pace: Pacing = v < 34 ? 'calm' : v < 67 ? 'standard' : 'dynamic'; if (pace !== p.pacing) patch({ pacing: pace }); }} />
                </div>
                <div className="ed-rythme__scale"><span>Posé</span><span>Équilibré</span><span>Nerveux</span></div>
              </div>
              <CTA disabled={active || !draft.script.trim()} onClick={() => start('direct')}>{job?.kind === 'direct' ? `Montage en cours… ${jobPct} %` : p.plan ? (planStale ? 'Relancer le montage IA' : 'Refaire le montage IA') : 'Lancer le montage IA'}</CTA>
            </>
          )}

          {rail === 'voix' && (
            <>
              <h1>Voix off</h1>
              <div className="ed-box"><Seg options={VOICES} value={p.voice.mode} onPick={v => patch({ voice: { mode: v, ...(p.voice.voiceId ? { voiceId: p.voice.voiceId } : {}) } })} /></div>
              {p.voice.mode === 'tts' && (
                <div className="ed-box">
                  <span className="ed-box__label">Voix ElevenLabs</span>
                  <input className="ed-input" defaultValue={p.voice.voiceId ?? ''} placeholder="ID de voix (vide : voix par défaut)" aria-label="ID de voix ElevenLabs"
                    onBlur={e => { const v = e.target.value.trim(); if (v !== (p.voice.voiceId ?? '')) patch({ voice: { mode: 'tts', ...(v ? { voiceId: v } : {}) } }); }} />
                  <span className="ed-sub">{health?.elevenLabs ? 'Générée à partir du script, puis réutilisée tant que le texte ne change pas.' : 'Clé ELEVENLABS_API_KEY absente sur le serveur : importez votre voix.'}</span>
                </div>
              )}
              {p.voice.mode === 'upload' && (
                <>
                  <button type="button" className="ed-pack" onClick={() => voiceInput.current?.click()}>
                    <span className="ed-pack__art" style={{ background: BGS[2] }} />
                    <div><span>{voiceFile ? voiceFile.originalName : 'Importer la voix off'}</span><span className="ed-sub">{voiceFile?.durationInSeconds ? `${fmt(voiceFile.durationInSeconds)} · ` : ''}WAV, MP3, M4A</span></div>
                    <span className="ed-pack__state">{voiceFile ? 'Remplacer' : 'Choisir'}</span>
                  </button>
                  <div className="ed-hint">{health?.elevenLabs ? 'La voix est transcrite par ElevenLabs pour caler chaque mot.' : 'Sans clé ElevenLabs, le script est aligné sur les pauses de la voix : lisez-le tel quel.'}</div>
                </>
              )}
              {p.voice.mode === 'none' && <div className="ed-hint">Sans voix off, les durées sont estimées et la vidéo est muette (hors musique).</div>}
              {p.voiceTrack && p.voice.mode !== 'none' && <div className="ed-box"><span className="ed-box__label">Voix prête</span><span className="ed-sub">{fmt(p.voiceTrack.durationInSeconds)} · {p.voiceTrack.words} mots · {TIMING_LABEL[p.voiceTrack.timing]} · −16 LUFS</span></div>}
            </>
          )}

          {rail === 'texte' && (
            <>
              <h1>Titres &amp; sous-titres</h1>
              <div className="ed-box">
                <span className="ed-box__label">Titre de l’épisode</span>
                <input className="ed-input" value={draft.title} onChange={e => edit({ title: e.target.value })} aria-label="Titre de l’épisode" />
              </div>
              <div className="ed-box ed-box--row"><span className="ed-box__label ed-grow">Sous-titres</span><Toggle on={p.captions} onClick={() => patch({ captions: !p.captions })} label="Sous-titres" /></div>
              <div className="ed-hint">{style === 'apple' ? 'Le style Apple n’incruste pas de sous-titres : le texte est déjà à l’écran.' : 'Sous-titres mot à mot, omis quand le texte à l’écran dit la même chose.'}</div>
              <div className="ed-box">
                <span className="ed-box__label">Écrire le script</span>
                <span className="ed-sub"><span className="ed-mono">#</span> titre de chapitre · <span className="ed-mono">?</span> question du chapitre, juste après · une phrase par ligne · les chiffres en chiffres (« 60 % », pas « soixante pour cent »).</span>
              </div>
            </>
          )}

          {rail === 'controle' && (
            <>
              <h1>Plan et contrôle</h1>
              {!p.plan && <div className="ed-hint">Aucun plan pour l’instant : écrivez le script, puis « Lancer le montage IA ».</div>}
              {p.plan && (
                <div className="ed-box">
                  <span className="ed-box__label">{p.plan.shots} plans · {fmt(p.plan.durationInSeconds)}</span>
                  <span className="ed-sub">{STYLES.find(([v]) => v === style)?.[1]} · {p.plan.brain === 'llm' ? 'réalisé par Claude' : 'cerveau heuristique'} · {p.plan.valid ? 'validation finale OK' : 'validation finale : à corriger'}</span>
                  {planStale && <span className="ed-warn">Le script a changé depuis ce plan : relancez le montage.</span>}
                </div>
              )}
              {plan && (
                <div className="ed-shots">
                  {plan.shots.map((s, i) => (
                    <div key={s.id} className="ed-shot" title={Object.values(s.reasons ?? {}).join('\n')}>
                      <span className="ed-mono ed-shot__n">{String(i + 1).padStart(2, '0')}</span>
                      <div><span className="ed-ellipsis">{shotLabel(s, p)}</span><span className="ed-sub">{s.block?.item.replace(/^studio-/, '') ?? s.type}{s.editorialIntent ? ` · ${s.editorialIntent}` : ''}</span></div>
                      <span className="ed-mono ed-shot__d">{(s.durationInFrames / plan.fps).toFixed(1)} s</span>
                    </div>
                  ))}
                </div>
              )}
              {p.plan && (
                <>
                  <Issues title="À corriger" items={p.plan.errors.map(e => (e.rule ? `[${e.rule}] ` : '') + e.message)} tone="err" />
                  <Issues title="Il manque" items={p.plan.assetRequests.map(r => r.description)} tone="warn" />
                  <Issues title="Avertissements" items={p.plan.warnings.map(e => (e.rule ? `[${e.rule}] ` : '') + e.message)} tone="warn" collapsed />
                  <Issues title="Choix du monteur" items={[...p.plan.notes, ...p.plan.decisions]} tone="info" collapsed />
                </>
              )}
              {cur?.qc && <Issues title={cur.qc.pass ? 'Contrôle qualité : réussi' : 'Contrôle qualité : échec'} items={[...cur.qc.failed, ...cur.qc.warnings]} tone={cur.qc.pass ? 'info' : 'err'} collapsed={cur.qc.pass} />}
            </>
          )}
        </section>

        <section className="ed-preview" hidden={isMedias} style={{ background: showVideo ? '#09080a' : BGS[renders.length % BGS.length] }} data-screen-label="Aperçu">
          {showVideo && (
            <video key={versionKey(cur)} ref={vidRef} src={api.fileUrl(p.id, versionFile(cur), cur.createdAt)} playsInline className="ed-preview__video"
              onTimeUpdate={e => setT(total ? e.currentTarget.currentTime / total : 0)} onEnded={() => setPlaying(false)} onClick={() => setPlaying(!playing)} />
          )}
          {showStills && <div className="ed-sheet"><img src={api.fileUrl(p.id, 'stills.jpg', p.stills!.createdAt)} alt="Planche de contrôle : trois images par plan" /></div>}
          {!showStills && <div className="ed-preview__shade" />}
          <div className="ed-preview__top">
            <span>{showStills ? 'Planche de contrôle' : cur ? `${letter(cur)} · ${cur.scale >= 1 ? '1080p' : '540p'}` : draft.title || 'Sans titre'}</span>
            {!showStills && <span className="ed-mono">{fmt(t * total)} / {fmt(total)}</span>}
          </div>
          {!showVideo && !showStills && (
            <div className="ed-preview__title">
              <div>
                {segs(draft.title || 'Sans titre').map((s, i) => <span key={i} style={{ color: s.c }}>{s.t}</span>)}
                <span className="ed-preview__hint">{tab === 'stills' ? 'Pas encore de planche : « Planche de contrôle » à droite' : p.plan ? 'Pas encore de vidéo : « Nouvelle version » à droite' : 'Écrivez le script, puis « Lancer le montage IA »'}</span>
              </div>
            </div>
          )}
          {showVideo && <button type="button" className="ed-preview__play" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Lecture'}>{playing ? '❚❚' : '▶'}</button>}
          {!showStills && (
            <div className="ed-preview__bottom">
              <div className="ed-chips">{['16:9', STYLES.find(([v]) => v === (cur?.style ?? style))?.[1] ?? 'Apple', cur ? (cur.scale >= 1 ? '1080p' : '540p') : 'pas encore rendu', ...(curStale ? ['plan plus ancien'] : [])].map(c => <span key={c}>{c}</span>)}</div>
              <div className="ed-preview__prompt">{firstLine(draft.script)}</div>
              {clips.length > 0 && (
                <div className="ed-scrub" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width); }}
                  role="slider" tabIndex={0} aria-label="Position de lecture" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(t * 100)}
                  onKeyDown={e => { if (e.key === 'ArrowRight') seek(t + 0.02); if (e.key === 'ArrowLeft') seek(t - 0.02); }}>
                  {clips.map((k, i) => <div key={i} title={k.label} style={{ flex: `${k.f} 1 0`, height: k.h, background: k.done ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.35)' }} />)}
                  <div className="ed-scrub__head" style={{ left: (t * 100).toFixed(2) + '%' }} />
                </div>
              )}
            </div>
          )}
        </section>

        <section className="ed-lib" hidden={!isMedias} data-screen-label="Médiathèque">
          <Mediatheque project={p} onChange={setP} onError={fail} />
        </section>

        <section className="ed-versions" data-screen-label="Versions">
          <button type="button" className="ed-new" disabled={!p.plan || (active && job?.kind !== 'render') || needsRights} onClick={() => start('preview')}
            title={needsRights ? 'Confirmez les droits des médias (Médias)' : undefined}>
            {job?.kind === 'render' ? (
              <><span className="ed-new__pct">{jobPct + '%'}</span><span>{job.message}</span></>
            ) : (
              <>
                <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true"><path d="M12 3.5l2.5 5.2 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8z" /><path d="M4 3v3M2.5 4.5h3M20 2v3M18.5 3.5h3" strokeLinecap="round" /></svg>
                <span>Nouvelle version</span>
                <span className="ed-new__sub">{p.plan ? 'Aperçu 540p' : 'Montez d’abord l’épisode'}</span>
              </>
            )}
          </button>
          {[0, 1, 2].map(i => {
            const v = renders[i];
            if (!v) return <div key={i} className="ed-ver ed-ver--empty" style={{ background: BGS[(i + 1) % BGS.length] }}><span className="ed-ver__shade" /><span className="ed-ver__txt"><span>Version à venir</span><span>Chaque rendu devient une version</span></span></div>;
            const on = v === cur;
            return (
              <button key={versionKey(v)} type="button" aria-pressed={on} className={'ed-ver' + (on ? ' is-on' : '')} style={{ background: BGS[i % BGS.length] }}
                onClick={() => { setSelVer(versionKey(v)); setTab('video'); setT(0); setPlaying(false); }}>
                {v.poster && <img src={api.fileUrl(p.id, v.poster)} alt="" />}
                <span className="ed-ver__vid">{v.scale >= 1 ? '1080P' : '540P'}</span>
                <span className="ed-ver__shade" />
                <span className="ed-ver__dur">{fmt(v.durationInSeconds)}</span>
                <span className="ed-ver__txt"><span>{letter(v)}</span><span>{STYLES.find(([s]) => s === (v.style ?? 'apple'))?.[1]}{v.shots ? ` · ${v.shots} plans` : ''}</span></span>
              </button>
            );
          })}
          <button type="button" className="ed-promo" disabled={!p.plan || (active && job?.kind !== 'stills')}
            onClick={() => (p.stills && tab !== 'stills' ? setTab('stills') : start('stills'))}>
            <div className="ed-promo__head"><span>Planche de contrôle</span><span className="ed-promo__arrow">{job?.kind === 'stills' ? jobPct + '%' : '→'}</span></div>
            <div className="ed-promo__art">
              {p.stills
                ? <><img src={api.fileUrl(p.id, 'stills.jpg', p.stills.createdAt)} alt="" className="ed-promo__a" /><img src={api.fileUrl(p.id, 'stills.jpg', p.stills.createdAt)} alt="" className="ed-promo__b ed-promo__b--low" /></>
                : <><span className="ed-promo__a" style={{ background: BGS[1] }} /><span className="ed-promo__b" style={{ background: BGS[3] }} /></>}
              <span className="ed-promo__badge"><span>3</span><span>par plan</span></span>
            </div>
          </button>
        </section>

        {error && <div className="ed-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Fermer">×</button></div>}
        {toast && <div className="ed-toast" role="status">{toast}</div>}
      </div>
    </div>
  );
}

function Issues({ title, items, tone, collapsed }: { title: string; items: string[]; tone: 'err' | 'warn' | 'info'; collapsed?: boolean }) {
  const [isOpen, setOpen] = useState(!collapsed);
  if (!items.length) return null;
  return (
    <div className={`ed-issues ed-issues--${tone}`}>
      <button type="button" aria-expanded={isOpen} onClick={() => setOpen(!isOpen)}><span className="ed-grow">{title}</span><span className="ed-mono">{items.length}</span><span className="ed-row__chev" style={{ transform: `rotate(${isOpen ? 90 : 0}deg)` }}>›</span></button>
      {isOpen && <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>}
    </div>
  );
}

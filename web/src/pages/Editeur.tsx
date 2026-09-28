import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, jobActive, type Health, type Pacing, type Plan, type PlanShot, type Project, type ProjectMedia, type ProjectPatch, type VoiceMode } from '../lib/api';
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

type Rail = 'script' | 'voix' | 'medias' | 'plan';
type View = 'video' | 'stills';

const ICONS: Record<Rail, string> = {
  script: 'M4 20h4L19 9l-4-4L4 16z M14 6l4 4',
  voix: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z M5 11a7 7 0 0 0 14 0 M12 18v3',
  medias: 'M7 7h13v13H7z M4 17V4h13 M10 16l3-3 2 2 2-2 3 3',
  plan: 'M9 6h11 M9 12h11 M9 18h11 M4 6l1 1 2-2 M4 12l1 1 2-2 M4 18l1 1 2-2'
};
const RAIL: [Rail, string][] = [['script', 'Script'], ['voix', 'Voix off'], ['medias', 'Médias'], ['plan', 'Plan et contrôle']];
const PACINGS: [Pacing, string][] = [['calm', 'Posé'], ['standard', 'Équilibré'], ['dynamic', 'Nerveux']];
const VOICES: [VoiceMode, string][] = [['tts', 'Voix IA'], ['upload', 'Ma voix'], ['none', 'Sans voix']];
const JOB_LABEL = { direct: 'Montage', stills: 'Planche de contrôle', render: 'Rendu' } as const;
const TIMING_LABEL = { tts: 'timings fournis par la voix IA', stt: 'transcription ElevenLabs', aligned: 'alignement local (±0,15 s par mot)' } as const;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const mb = (b: number) => (b > 1e9 ? `${(b / 1e9).toFixed(1)} Go` : `${Math.max(0.1, b / 1e6).toFixed(1)} Mo`);

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

function Drop({ accept, multiple, onFiles, children }: { accept: string; multiple?: boolean; onFiles: (f: File[]) => void; children: ReactNode }) {
  const [over, setOver] = useState(false);
  return (
    <label className={'ed-drop' + (over ? ' is-over' : '')}
      onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onFiles([...e.dataTransfer.files]); }}>
      <input type="file" accept={accept} multiple={multiple} onChange={e => { onFiles([...(e.target.files ?? [])]); e.target.value = ''; }} />
      {children}
    </label>
  );
}

export default function Editeur() {
  const [scale, setScale] = useState(1);
  const [rail, setRail] = useState<Rail>('script');
  const [view, setView] = useState<View>('video');
  const [health, setHealth] = useState<Health | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [p, setP] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [draft, setDraft] = useState<{ title: string; script: string } | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [uploading, setUploading] = useState('');
  const toastTimer = useRef(0);
  const saveTimer = useRef(0);

  const flash = (m: string) => {
    clearTimeout(toastTimer.current); setToast(m);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  };
  const fail = (e: unknown) => setError((e as Error).message);

  // Fixed 1440×900 app frame, scaled down to fit the window.
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - 24) / 1440, (window.innerHeight - 24) / 900));
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const open = useCallback((project: Project) => {
    setP(project); setDraft({ title: project.title, script: project.script }); setPlan(null); setError('');
    try { localStorage.setItem(PROJECT_KEY, project.id); } catch { /* storage disabled */ }
    if (project.plan) api.plan(project.id).then(setPlan).catch(() => setPlan(null));
    setView(project.render ? 'video' : 'stills');
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
      const found = list.find(x => x.id === last) ?? list[0];
      open(found ?? (await api.create({ title: 'Mon premier épisode', script: EXAMPLE_SCRIPT })));
    })().catch(fail);
  }, [open]);

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
            if (j.kind === 'direct') { api.plan(next.id).then(setPlan).catch(() => {}); setRail('plan'); }
            if (j.kind === 'stills') setView('stills');
            if (j.kind === 'render') setView('video');
          }
        }
      } catch (e) { fail(e); }
    }, 1000);
    return () => clearInterval(iv);
    // Only the project and whether a job runs restart the polling.
  }, [p?.id, active]);

  const patch = async (fields: ProjectPatch) => {
    if (!p) return;
    try { setP(await api.update(p.id, fields)); } catch (e) { fail(e); }
  };
  // Title and script are saved 600 ms after the last keystroke.
  const edit = (fields: { title?: string; script?: string }) => {
    if (!draft) return;
    const next = { ...draft, ...fields };
    setDraft(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => patch(fields), 600);
  };
  const flush = async () => {
    clearTimeout(saveTimer.current);
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

  const upload = async (files: File[], role: 'visual' | 'voice' | 'music') => {
    if (!p) return;
    setError('');
    let cur = p;
    for (const [i, f] of files.entries()) {
      setUploading(`Import ${files.length > 1 ? `${i + 1}/${files.length} ` : ''}: ${f.name}`);
      try { cur = await api.upload(cur.id, f, role); setP(cur); } catch (e) { fail(e); break; }
    }
    setUploading('');
  };

  const newProject = async () => {
    try {
      await flush();
      const created = await api.create({ title: 'Nouvel épisode', script: '' });
      setProjects(await api.list()); open(created); setRail('script');
    } catch (e) { fail(e); }
  };
  const switchProject = async (id: string) => {
    await flush();
    try { open(await api.get(id)); setProjects(await api.list()); } catch (e) { fail(e); }
  };

  if (!p || !draft) {
    return <div className="ed-screen"><div className="ed-loading">{error || 'Chargement du studio…'}</div></div>;
  }

  const visuals = p.media.filter(m => m.role === 'visual');
  const voiceFile = p.media.find(m => m.role === 'voice');
  const music = p.media.find(m => m.role === 'music');
  const planStale = !!p.plan && (draft.script !== p.script);
  const renderStale = !!p.render && !!p.plan && p.render.planCreatedAt !== p.plan.createdAt;
  const stillsStale = !!p.stills && !!p.plan && p.stills.planCreatedAt !== p.plan.createdAt;
  const totalFrames = plan?.shots.reduce((s, x) => s + x.durationInFrames, 0) ?? 0;
  const needsRights = p.media.some(m => m.role !== 'voice') && !p.rightsConfirmed;
  const version = (s?: { createdAt: string }) => s?.createdAt;
  const showVideo = view === 'video' && p.render;
  const showStills = view === 'stills' && p.stills;
  const CTA = ({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) => (
    <><div className="ed-spacer" /><button type="button" className="ed-cta ed-cta--glow" disabled={disabled} onClick={onClick}>{children}</button></>
  );

  return (
    <div className="ed-screen">
      <div className="ed" style={{ transform: `scale(${scale})` }} data-screen-label="Éditeur">
        <Link to="/" className="ed-logo" aria-label="Plug, accueil"><span><span /></span></Link>
        <div className="ed-project">
          <select value={p.id} onChange={e => switchProject(e.target.value)} aria-label="Projet">
            {(projects.some(x => x.id === p.id) ? projects : [p, ...projects]).map(x => <option key={x.id} value={x.id}>{x.id === p.id ? draft.title || 'Sans titre' : x.title}</option>)}
          </select>
          <button type="button" onClick={newProject}>+ Nouveau</button>
        </div>
        <div className="ed-top">
          {health && (
            <>
              <span className={'ed-cap' + (health.elevenLabs ? ' is-on' : '')} title="ELEVENLABS_API_KEY sur le serveur">Voix IA</span>
              <span className={'ed-cap' + (health.anthropic ? ' is-on' : '')} title="ANTHROPIC_API_KEY sur le serveur">Claude</span>
              {!health.studioBlocks && <span className="ed-cap is-warn" title="npm run setup-engine dans server/">Blocs Apple absents</span>}
            </>
          )}
          {p.render && !p.render.draft && p.render.scale >= 1 && !renderStale
            ? <a className="ed-top__export" href={api.fileUrl(p.id, 'video.mp4', version(p.render))} download={`${draft.title || 'episode'}.mp4`}>Télécharger le MP4</a>
            : <button type="button" className="ed-top__export" disabled={!p.plan || active} onClick={() => start('final')}>Exporter en 1080p</button>}
        </div>

        <nav className="ed-rail" aria-label="Étapes">
          {RAIL.map(([id, label]) => (
            <button key={id} type="button" title={label} aria-label={label} aria-pressed={rail === id} className={rail === id ? 'is-on' : ''} onClick={() => setRail(id)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[id]} /></svg>
            </button>
          ))}
        </nav>

        <section className="ed-panel" data-screen-label="Réglages">
          {rail === 'script' && (
            <>
              <h1>Script</h1>
              <input className="ed-title" value={draft.title} onChange={e => edit({ title: e.target.value })} placeholder="Titre de l'épisode" aria-label="Titre de l'épisode" />
              <div className="ed-brief">
                <textarea value={draft.script} onChange={e => edit({ script: e.target.value })} rows={11} placeholder={'# Chapitre\n? Question du chapitre\nUne phrase par ligne.'} aria-label="Script" spellCheck />
              </div>
              <div className="ed-hint"><span className="ed-mono">#</span> chapitre · <span className="ed-mono">?</span> question du chapitre · une phrase par ligne. Les chiffres s'écrivent en chiffres (« 60 % »).</div>
              <div className="ed-box"><span className="ed-box__label">Rythme</span><Seg options={PACINGS} value={p.pacing} onPick={v => patch({ pacing: v })} /></div>
              <div className="ed-box ed-box--row"><span className="ed-box__label ed-grow">Sous-titres</span><Toggle on={p.captions} onClick={() => patch({ captions: !p.captions })} label="Sous-titres" /></div>
              <div className="ed-box ed-box--row">
                <div className="ed-grow"><div className="ed-box__label">Réalisation par Claude</div><div className="ed-sub">{health?.anthropic ? 'Claude écrit l’analyse, les règles de la bible la vérifient' : 'Clé ANTHROPIC_API_KEY absente : cerveau heuristique'}</div></div>
                <Toggle on={p.llm && !!health?.anthropic} disabled={!health?.anthropic} onClick={() => patch({ llm: !p.llm })} label="Réalisation par Claude" />
              </div>
              <CTA disabled={active || !draft.script.trim()} onClick={() => start('direct')}>{p.plan ? 'Refaire le montage' : 'Monter l’épisode'}</CTA>
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
                  <div className="ed-sub">{health?.elevenLabs ? 'La voix est générée à partir du script, puis réutilisée tant que le texte ne change pas.' : 'Clé ELEVENLABS_API_KEY absente sur le serveur : importez votre voix.'}</div>
                </div>
              )}
              {p.voice.mode === 'upload' && (
                <>
                  <Drop accept=".wav,.mp3,.m4a,.aac,.flac,.ogg,audio/*" onFiles={f => f[0] && upload([f[0]], 'voice')}>
                    <strong>{voiceFile ? 'Remplacer la voix off' : 'Importer la voix off'}</strong>
                    <span>WAV, MP3, M4A · lue mot à mot sur le script</span>
                  </Drop>
                  {voiceFile && <div className="ed-file"><span className="ed-ellipsis">{voiceFile.originalName}</span><span className="ed-sub ed-mono">{fmt(voiceFile.durationInSeconds ?? 0)} · {mb(voiceFile.bytes)}</span></div>}
                  <div className="ed-hint">{health?.elevenLabs ? 'La voix est transcrite par ElevenLabs pour caler chaque mot.' : 'Sans clé ElevenLabs, le script est aligné sur les pauses de la voix : lisez-le tel quel.'}</div>
                </>
              )}
              {p.voice.mode === 'none' && <div className="ed-hint">Sans voix off, les durées sont estimées et la vidéo est muette (hors musique).</div>}
              {p.voiceTrack && <div className="ed-box"><span className="ed-box__label">Voix prête</span><span className="ed-sub">{fmt(p.voiceTrack.durationInSeconds)} · {p.voiceTrack.words} mots · {TIMING_LABEL[p.voiceTrack.timing]} · −16 LUFS</span></div>}

              <div className="ed-hint">Musique de fond</div>
              <Drop accept=".wav,.mp3,.m4a,.aac,.flac,.ogg,audio/*" onFiles={f => f[0] && upload([f[0]], 'music')}>
                <strong>{music ? 'Remplacer la musique' : 'Importer une musique'}</strong>
                <span>Baissée sous la voix, relancée dans les pauses</span>
              </Drop>
              {music && <MediaRow m={music} project={p} onChange={setP} onError={fail} />}
            </>
          )}

          {rail === 'medias' && (
            <>
              <h1>Médias</h1>
              <Drop accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,image/*,video/*" multiple onFiles={f => upload(f, 'visual')}>
                <strong>Ajouter des images ou des vidéos</strong>
                <span>Décrivez chacune : le monteur les place sur la phrase qui en parle</span>
              </Drop>
              {visuals.length === 0 && <div className="ed-hint">Sans média, le style Apple monte l’épisode en typographie, chiffres et graphiques.</div>}
              {visuals.map(m => <MediaRow key={m.id} m={m} project={p} onChange={setP} onError={fail} />)}
              <label className="ed-rights">
                <input type="checkbox" checked={p.rightsConfirmed} onChange={e => patch({ rightsConfirmed: e.target.checked })} />
                <span>Je détiens les droits de ces médias (ou une licence qui autorise l’usage commercial).</span>
              </label>
            </>
          )}

          {rail === 'plan' && (
            <>
              <h1>Plan et contrôle</h1>
              {!p.plan && <div className="ed-hint">Aucun plan pour l’instant : écrivez le script, puis « Monter l’épisode ».</div>}
              {p.plan && (
                <>
                  <div className="ed-box">
                    <span className="ed-box__label">{p.plan.shots} plans · {fmt(p.plan.durationInSeconds)}</span>
                    <span className="ed-sub">Style Apple · {p.plan.brain === 'llm' ? 'réalisé par Claude' : 'cerveau heuristique'} · {p.plan.valid ? 'validation finale OK' : 'validation finale : à corriger'}</span>
                    {planStale && <span className="ed-warn">Le script a changé depuis ce plan : refaites le montage.</span>}
                  </div>
                  <Issues title="À corriger" items={p.plan.errors.map(e => (e.rule ? `[${e.rule}] ` : '') + e.message)} tone="err" />
                  <Issues title="Il manque" items={p.plan.assetRequests.map(r => r.description)} tone="warn" />
                  <Issues title="Avertissements" items={p.plan.warnings.map(e => (e.rule ? `[${e.rule}] ` : '') + e.message)} tone="warn" collapsed />
                  <Issues title="Choix du monteur" items={[...p.plan.notes, ...p.plan.decisions]} tone="info" collapsed />
                </>
              )}
              {p.render?.qc && (
                <Issues title={p.render.qc.pass ? 'Contrôle qualité : réussi' : 'Contrôle qualité : échec'} items={[...p.render.qc.failed, ...p.render.qc.warnings]} tone={p.render.qc.pass ? 'info' : 'err'} collapsed={p.render.qc.pass} />
              )}
            </>
          )}
        </section>

        <section className="ed-preview ed-stage" data-screen-label="Aperçu">
          {showVideo && <video key={version(p.render)} src={api.fileUrl(p.id, 'video.mp4', version(p.render))} controls playsInline />}
          {showStills && <div className="ed-sheet"><img src={api.fileUrl(p.id, 'stills.jpg', version(p.stills))} alt="Planche de contrôle : trois images par plan" /></div>}
          {!showVideo && !showStills && (
            <div className="ed-empty">
              <ol>
                <li className={p.plan ? 'is-done' : ''}><span>1</span>Script et voix off, puis « Monter l’épisode »</li>
                <li className={p.stills ? 'is-done' : ''}><span>2</span>Planche de contrôle : 3 images par plan, en une minute</li>
                <li className={p.render ? 'is-done' : ''}><span>3</span>Aperçu 540p, puis export 1080p masterisé</li>
              </ol>
            </div>
          )}
          <div className="ed-stage__top">
            <div className="ed-seg ed-seg--glass">
              <button type="button" className={view === 'video' ? 'is-on' : ''} disabled={!p.render} onClick={() => setView('video')}>Vidéo</button>
              <button type="button" className={view === 'stills' ? 'is-on' : ''} disabled={!p.stills} onClick={() => setView('stills')}>Planche</button>
            </div>
            {view === 'video' && p.render && <span className="ed-pill">{p.render.scale >= 1 ? '1080p' : 'Aperçu 540p'} · {fmt(p.render.durationInSeconds)}{p.render.loudness ? ` · ${p.render.loudness.integrated.toFixed(1)} LUFS` : ''}{renderStale ? ' · plan plus ancien' : ''}</span>}
            {view === 'stills' && stillsStale && <span className="ed-pill">Planche d’un plan plus ancien</span>}
          </div>
          {(active || uploading) && (
            <div className="ed-job" role="status">
              <div className="ed-job__label">{uploading || `${JOB_LABEL[p.job!.kind]} · ${p.job!.message}`}</div>
              {!uploading && <div className="ed-job__bar"><div style={{ width: `${Math.round((p.job!.progress || 0) * 100)}%` }} /></div>}
            </div>
          )}
        </section>

        <section className="ed-shots" data-screen-label="Plans">
          <div className="ed-shots__head"><span>Plans</span>{plan && <span className="ed-mono">{plan.shots.length} · {fmt(totalFrames / plan.fps)}</span>}</div>
          <div className="ed-shots__list">
            {!plan && <div className="ed-sub">Le plan de montage s’affichera ici.</div>}
            {plan?.shots.map((s, i) => (
              <div key={s.id} className="ed-shot" title={Object.values(s.reasons ?? {}).join('\n')}>
                <span className="ed-shot__n ed-mono">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <span className="ed-ellipsis">{shotLabel(s, p)}</span>
                  <span className="ed-sub">{s.block?.item.replace(/^studio-/, '') ?? s.type}{s.editorialIntent ? ` · ${s.editorialIntent}` : ''}</span>
                </div>
                <span className="ed-shot__d ed-mono">{(s.durationInFrames / plan.fps).toFixed(1)} s</span>
              </div>
            ))}
          </div>
          <div className="ed-actions">
            <button type="button" disabled={!p.plan || active} onClick={() => start('stills')}>Planche de contrôle</button>
            <button type="button" disabled={!p.plan || active || needsRights} onClick={() => start('preview')}>Aperçu 540p</button>
          </div>
        </section>

        {error && <div className="ed-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Fermer">×</button></div>}
        {toast && <div className="ed-toast" role="status">{toast}</div>}
      </div>
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

function Issues({ title, items, tone, collapsed }: { title: string; items: string[]; tone: 'err' | 'warn' | 'info'; collapsed?: boolean }) {
  const [open, setOpen] = useState(!collapsed);
  if (!items.length) return null;
  return (
    <div className={`ed-issues ed-issues--${tone}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}><span className="ed-grow">{title}</span><span className="ed-mono">{items.length}</span><span className="ed-row__chev" style={{ transform: `rotate(${open ? 90 : 0}deg)` }}>›</span></button>
      {open && <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>}
    </div>
  );
}

function MediaRow({ m, project, onChange, onError }: { m: ProjectMedia; project: Project; onChange: (p: Project) => void; onError: (e: unknown) => void }) {
  const url = api.mediaUrl(project.id, m.file);
  return (
    <div className="ed-media">
      {m.kind === 'image' && <img src={url} alt="" />}
      {m.kind === 'video' && <video src={url} muted preload="metadata" />}
      {m.kind === 'audio' && <span className="ed-media__audio">♪</span>}
      <div>
        {m.role === 'visual'
          ? <input className="ed-input" defaultValue={m.description} placeholder="Ce que montre ce média" aria-label={`Description de ${m.originalName}`}
              onBlur={e => { if (e.target.value !== m.description) api.updateMedia(project.id, m.id, { description: e.target.value }).then(onChange, onError); }} />
          : <span className="ed-ellipsis">{m.originalName}</span>}
        <span className="ed-sub ed-mono">{m.width ? `${m.width}×${m.height}` : ''}{m.durationInSeconds ? ` · ${fmt(m.durationInSeconds)}` : ''} · {mb(m.bytes)}</span>
        {m.role === 'visual' && (
          <label className="ed-media__ai"><input type="checkbox" checked={!!m.synthetic} onChange={e => api.updateMedia(project.id, m.id, { synthetic: e.target.checked }).then(onChange, onError)} /> Généré par IA</label>
        )}
      </div>
      <button type="button" className="ed-media__del" aria-label={`Retirer ${m.originalName}`} onClick={() => api.removeMedia(project.id, m.id).then(onChange, onError)}>×</button>
    </div>
  );
}

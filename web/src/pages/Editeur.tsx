import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Mediatheque from '../components/editor/Mediatheque';
import SentenceEditor from '../components/editor/SentenceEditor';
import { LangSwitch, useLang, useT } from '../i18n';
import type { Dict } from '../i18n/fr';
import { api, hintKey, jobActive, type EditStyle, type Intent, type Health, type Pacing, type Plan, type PlanShot, type Project, type RenderInfo, type VoiceMode } from '../lib/api';
import './editeur.css';

const PROJECT_KEY = 'plug.project';

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
const RAILS: Rail[] = ['montage', 'voix', 'texte', 'medias', 'controle'];
const TABS: Tab[] = ['video', 'stills'];
const STYLE_IDS: EditStyle[] = ['apple', 'default'];
const VOICE_IDS: VoiceMode[] = ['tts', 'upload', 'none'];
const PACING_AT: Record<Pacing, number> = { calm: 17, standard: 50, dynamic: 83 };
const blockOf = (s: PlanShot) => s.block?.item.replace(/^studio-/, '') ?? '';
const intentOf = (t: Dict, i?: string) => (i && i in t.labels.intents ? t.labels.intents[i as Intent].toLowerCase() : '');
/** Why a shot looks this way, from the plan's structured fields (in the language of the site). */
function shotWhy(t: Dict, s: PlanShot): string {
  const w = t.editor.why, sep = t.common.decimal === ',' ? ' : ' : ': ';
  return [
    s.editorialIntent && `${w.role}${sep}${intentOf(t, s.editorialIntent)}`,
    s.mediaNeed && s.mediaNeed !== 'none' && `${w.need}${sep}${t.labels.needs[s.mediaNeed].toLowerCase()}`,
    s.mediaTier && `${w.image}${sep}${t.labels.tiers[s.mediaTier]}`,
    s.block && `${w.block}${sep}${t.labels.blocks[blockOf(s)] ?? s.block.item}`,
  ].filter(Boolean).join('\n');
}

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

/** The text lines of a script, read like the server's parseScript: a `?` line right after a chapter title is its question. */
function scriptLines(script: string): string[] {
  const out: string[] = [];
  let afterChapter = false;
  for (const raw of script.split('\n')) {
    const line = hintKey(raw);
    if (!line) continue;
    if (line.startsWith('#')) { afterChapter = line.replace(/^#+/, '').trim() !== ''; continue; }
    if (line.startsWith('?') && afterChapter) { afterChapter = false; continue; }
    afterChapter = false;
    out.push(line);
  }
  return out;
}

/** What a shot shows: its text, the text or figure of its studio block, its media, else its type. */
function shotLabel(t: Dict, s: PlanShot, p: Project): string {
  const v = s.block?.variables ?? {};
  const blockText = typeof v.text === 'string' ? v.text.replace(/[|*]/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const figure = v.to !== undefined ? `${v.prefix ?? ''}${v.to}${v.suffix ?? ''}` : '';
  return s.text || blockText || figure || (s.media ? p.media.find(m => m.id === s.media)?.description ?? '' : '') || (s.metadata?.unit ? p.plan?.units?.[s.metadata.unit] : '') || (t.labels.types[s.type] ?? s.type);
}

export default function Editeur() {
  const T = useT(), E = T.editor;
  const STYLES: [EditStyle, string][] = STYLE_IDS.map(id => [id, E.styles[id]]);
  const VOICES: [VoiceMode, string][] = VOICE_IDS.map(id => [id, E.voices[id]]);
  // A decimal number shown to the user, with the separator of the language.
  const dec = (n: number) => n.toFixed(1).replace('.', T.common.decimal);
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
  const [sentence, setSentence] = useState<string | null>(null);
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
    setSelVer(null); setPlaying(false); setT(0); setSentence(null);
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
      openProject(list.find(x => x.id === last) ?? list[0] ?? (await api.create({ title: E.firstEpisode, script: E.exampleScript })));
    })().catch(fail);
    // Once, with the language of the first visit (the example project is created then).
  }, [openProject]);

  // The server writes the project's messages in the reader's language: read it again when the language changes.
  const { lang } = useLang();
  const langSeen = useRef(lang);
  useEffect(() => {
    if (langSeen.current === lang) return;
    langSeen.current = lang;
    if (p) api.get(p.id).then(setP).catch(fail);
    // Only the language triggers this.
  }, [lang]);

  // Follow the running job.
  const active = jobActive(p ?? undefined);
  // Claude describing an import, or Runway generating a visual: the editor follows them too.
  const describing = !!p?.media.some(m => m.auto?.status === 'pending') || !!p?.generations?.some(g => g.status === 'pending');
  useEffect(() => {
    if (!p || (!active && !describing)) return;
    const iv = window.setInterval(async () => {
      try {
        const next = await api.get(p.id);
        setP(next);
        if (active && !jobActive(next)) {
          const j = next.job!;
          if (j.status === 'failed') setError(`${E.jobs[j.kind]}${T.common.decimal === ',' ? ' : ' : ': '}${j.error ?? E.jobFailed}`);
          else {
            flash(E.jobDone(E.jobs[j.kind]));
            if (j.kind === 'direct') api.plan(next.id).then(setPlan).catch(() => {});
            if (j.kind === 'stills') setTab('stills');
            if (j.kind === 'render') { setSelVer(null); setTab('video'); setT(0); }
          }
        }
      } catch (e) { fail(e); }
    }, 1000);
    return () => clearInterval(iv);
    // Only the project, whether a job runs and whether Claude describes restart the polling.
  }, [p?.id, active, describing]);

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
    flash(E.importing(file.name));
    try { setP(await api.upload(p.id, file, role)); flash(role === 'voice' ? E.voiceImported : E.musicImported); } catch (e) { fail(e); }
  };

  const newProject = async () => {
    try {
      await flush();
      const created = await api.create({ title: E.newEpisode, script: '' });
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
    return <div className="ed-screen"><div className="ed-loading">{error || E.loading}</div></div>;
  }

  const style = p.style ?? 'apple';
  const renders = p.renders?.length ? p.renders : p.render ? [p.render] : [];
  const letter = (r: RenderInfo) => E.version(String.fromCharCode(65 + renders.length - 1 - renders.indexOf(r)));
  const cur = renders.find(r => versionKey(r) === selVer) ?? renders[0];
  const voiceFile = p.media.find(m => m.role === 'voice');
  const music = p.media.find(m => m.role === 'music');
  const job = active ? p.job! : null;
  const jobPct = job ? Math.round((job.progress || 0) * 100) : 0;
  const planStale = !!p.plan && draft.script !== p.script;
  // The text lines of the script (not chapters or questions), as the server keys them.
  const lines = scriptLines(draft.script);
  const lineOf = (s: PlanShot) => (s.metadata?.unit ? p.plan?.units?.[s.metadata.unit] : undefined);
  // The line must be saved on the server before hints can be set on it.
  const openSentence = async (line: string) => { await flush(); setSentence(line); };
  const curStale = !!cur && !!p.plan && cur.planCreatedAt !== p.plan.createdAt;
  // Imported files need the rights confirmation; a Runway visual comes with Runway's terms.
  const needsRights = p.media.some(m => m.role !== 'voice' && !m.generated) && !p.rightsConfirmed;
  const isMedias = rail === 'medias';
  const showVideo = tab === 'video' && cur;
  const showStills = tab === 'stills' && p.stills;
  const total = cur?.durationInSeconds ?? p.plan?.durationInSeconds ?? 0;
  const frames = plan?.shots.reduce((s, x) => s + x.durationInFrames, 0) ?? 0;
  const clips = plan?.shots.map((s, i) => ({ f: s.durationInFrames, h: s.block || s.type === 'number' || s.type === 'chart' ? 22 : s.type === 'chapter' ? 28 : 16, done: frames > 0 && plan.shots.slice(0, i).reduce((a, x) => a + x.durationInFrames, 0) / frames < t, label: shotLabel(T, s, p) })) ?? [];
  const voiceLabel = p.voice.mode === 'tts' ? E.aiVoice : p.voice.mode === 'upload' ? voiceFile?.originalName ?? E.noVoiceImported : E.noVoice;
  const voiceSub = p.voiceTrack && p.voice.mode !== 'none' ? E.voiceSub(fmt(p.voiceTrack.durationInSeconds)) : p.voice.mode === 'upload' && voiceFile?.durationInSeconds ? E.voiceSub(fmt(voiceFile.durationInSeconds)) : p.voice.mode === 'tts' ? (health?.elevenLabs ? E.voiceAtEdit : E.noElevenKey) : E.estimated;
  const rythme = PACING_AT[p.pacing];
  const rv = E.pace[p.pacing];
  const rows: [string, string, [string, string][], string, (v: string) => void, string][] = [
    ['style', E.rowStyle, STYLES, style, v => patch({ style: v as EditStyle }), 'linear-gradient(135deg,#ff9ec8,#7c4dff)'],
    ['voice', E.rowVoice, VOICES, p.voice.mode, v => { patch({ voice: { mode: v as VoiceMode, ...(p.voice.voiceId ? { voiceId: p.voice.voiceId } : {}) } }); if (v === 'upload' && !voiceFile) voiceInput.current?.click(); }, 'linear-gradient(135deg,#8fb6ff,#5b2fb8)'],
    ['music', E.rowMusic, [['none', E.noMusic], ...(music ? [[music.id, music.originalName] as [string, string]] : []), ['import', music ? E.replace : E.import]], music?.id ?? 'none',
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
      <div className="ed" style={{ transform: `scale(${scale})` }} data-screen-label={T.nav.editor}>
        <input ref={musicInput} type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg" hidden onChange={e => { void uploadAudio(e.target.files?.[0], 'music'); e.target.value = ''; }} />
        <input ref={voiceInput} type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg" hidden onChange={e => { void uploadAudio(e.target.files?.[0], 'voice'); e.target.value = ''; }} />

        <Link to="/" className="ed-logo" aria-label={T.common.home}><span><span /></span></Link>
        <div className="ed-tabs" role="tablist">
          {TABS.map(id => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => { setTab(id); if (isMedias) setRail('montage'); }}>{E.tabs[id]}</button>)}
        </div>
        <div className="ed-top">
          <LangSwitch className="ed-lang" />
          <span className="ed-top__label">{E.project}</span>
          <select className="ed-top__select" value={p.id} onChange={e => switchProject(e.target.value)} aria-label={E.project}>
            {(projects.some(x => x.id === p.id) ? projects : [p, ...projects]).map(x => <option key={x.id} value={x.id}>{x.id === p.id ? draft.title || T.common.untitled : x.title}</option>)}
          </select>
          <button type="button" className="ed-top__pro" onClick={newProject}>{E.newProject}</button>
          {cur && cur.scale >= 1 && !curStale
            ? <a className="ed-top__export" href={api.fileUrl(p.id, versionFile(cur), cur.createdAt)} download={`${draft.title || 'episode'}.mp4`}>{E.download}</a>
            : <button type="button" className="ed-top__export" disabled={!p.plan || active || needsRights} onClick={() => start('final')}>{E.export}</button>}
        </div>

        <nav className="ed-rail" aria-label={E.tools}>
          {RAILS.map(id => (
            <button key={id} type="button" title={E.rails[id]} aria-label={E.rails[id]} aria-pressed={rail === id} className={rail === id ? 'is-on' : ''} onClick={() => setRail(id)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[id]} /></svg>
            </button>
          ))}
        </nav>

        <section className="ed-panel" hidden={isMedias} data-screen-label={E.tools}>
          {sentence && (
            <SentenceEditor key={sentence} project={p} line={sentence} busy={active} canGenerate={!!health?.runway} onClose={() => setSentence(null)} onSaved={setP}
              onRerun={() => { setSentence(null); void start('direct'); }} />
          )}
          {!sentence && rail === 'montage' && (
            <>
              <h1>{E.montageTitle}</h1>
              <div className="ed-brief">
                <div className="ed-brief__file">
                  {cur?.poster ? <img src={api.fileUrl(p.id, cur.poster)} alt="" /> : <span className="ed-brief__thumb" style={{ background: BGS[0] }} />}
                  <div><div className="ed-ellipsis">{voiceLabel}</div><div className="ed-sub ed-mono">{voiceSub}</div></div>
                  <button type="button" className="ed-brief__change" onClick={() => setRail('voix')}>{E.change}</button>
                </div>
                <div className="ed-brief__sep" />
                <textarea value={draft.script} onChange={e => edit({ script: e.target.value })} rows={5} placeholder={E.scriptPlaceholder} aria-label={E.script} spellCheck />
                <div className="ed-brief__ai">
                  <Toggle on={p.llm && !!health?.anthropic} disabled={!health?.anthropic} onClick={() => patch({ llm: !p.llm })} label={E.claude} />
                  <span>{health?.anthropic ? E.claude : E.claudeNoKey}</span>
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
                <div className="ed-rythme__head"><span>{E.rhythm}</span><span className="ed-mono">{rv}</span></div>
                <div className="ed-range">
                  <div className="ed-range__track" />
                  <div className="ed-range__fill" style={{ width: rythme + '%' }} />
                  <input type="range" min={0} max={100} value={rythme} aria-label={E.rhythm}
                    onChange={e => { const v = +e.target.value; const pace: Pacing = v < 34 ? 'calm' : v < 67 ? 'standard' : 'dynamic'; if (pace !== p.pacing) patch({ pacing: pace }); }} />
                </div>
                <div className="ed-rythme__scale"><span>{E.pace.calm}</span><span>{E.pace.standard}</span><span>{E.pace.dynamic}</span></div>
              </div>
              <CTA disabled={active || !draft.script.trim()} onClick={() => start('direct')}>{job?.kind === 'direct' ? E.editing(jobPct) : p.plan ? (planStale ? E.rerun : E.redo) : E.run}</CTA>
            </>
          )}

          {!sentence && rail === 'voix' && (
            <>
              <h1>{E.voiceTitle}</h1>
              <div className="ed-box"><Seg options={VOICES} value={p.voice.mode} onPick={v => patch({ voice: { mode: v, ...(p.voice.voiceId ? { voiceId: p.voice.voiceId } : {}) } })} /></div>
              {p.voice.mode === 'tts' && (
                <div className="ed-box">
                  <span className="ed-box__label">{E.elevenVoice}</span>
                  <input className="ed-input" defaultValue={p.voice.voiceId ?? ''} placeholder={E.voiceIdPlaceholder} aria-label={E.voiceIdLabel}
                    onBlur={e => { const v = e.target.value.trim(); if (v !== (p.voice.voiceId ?? '')) patch({ voice: { mode: 'tts', ...(v ? { voiceId: v } : {}) } }); }} />
                  <span className="ed-sub">{health?.elevenLabs ? E.ttsHint : E.ttsNoKey}</span>
                </div>
              )}
              {p.voice.mode === 'upload' && (
                <>
                  <button type="button" className="ed-pack" onClick={() => voiceInput.current?.click()}>
                    <span className="ed-pack__art" style={{ background: BGS[2] }} />
                    <div><span>{voiceFile ? voiceFile.originalName : E.importVoice}</span><span className="ed-sub">{voiceFile?.durationInSeconds ? `${fmt(voiceFile.durationInSeconds)} · ` : ''}WAV, MP3, M4A</span></div>
                    <span className="ed-pack__state">{voiceFile ? E.replaceShort : E.choose}</span>
                  </button>
                  <div className="ed-hint">{health?.elevenLabs ? E.sttHint : E.alignHint}</div>
                </>
              )}
              {p.voice.mode === 'none' && <div className="ed-hint">{E.noVoiceHint}</div>}
              {p.voiceTrack && p.voice.mode !== 'none' && <div className="ed-box"><span className="ed-box__label">{E.voiceReady}</span><span className="ed-sub">{fmt(p.voiceTrack.durationInSeconds)} · {p.voiceTrack.words} {E.words} · {E.timing[p.voiceTrack.timing]} · −16 LUFS</span></div>}
            </>
          )}

          {!sentence && rail === 'texte' && (
            <>
              <h1>{E.textTitle}</h1>
              <div className="ed-box">
                <span className="ed-box__label">{E.episodeTitle}</span>
                <input className="ed-input" value={draft.title} onChange={e => edit({ title: e.target.value })} aria-label={E.episodeTitle} />
              </div>
              <div className="ed-box ed-box--row"><span className="ed-box__label ed-grow">{E.captions}</span><Toggle on={p.captions} onClick={() => patch({ captions: !p.captions })} label={E.captions} /></div>
              <div className="ed-hint">{style === 'apple' ? E.captionsApple : E.captionsDefault}</div>
              <div className="ed-box">
                <span className="ed-box__label">{E.writeScript}</span>
                <span className="ed-sub"><span className="ed-mono">#</span> {E.scriptHelp[0]} · <span className="ed-mono">?</span> {E.scriptHelp[1]} · {E.scriptHelp[2]} · {E.scriptHelp[3]}.</span>
              </div>
              {lines.length > 0 && (
                <div className="ed-box">
                  <span className="ed-box__label">{E.sentences}</span>
                  <span className="ed-sub">{E.sentencesHint}</span>
                  <div className="se-list">
                    {lines.map((l, i) => {
                      const h = p.hints?.[l];
                      return (
                        <button key={i} type="button" className="se-item" onClick={() => void openSentence(l)}>
                          <span className="ed-grow">{l}</span>
                          {h && <span className="se-item__tag">{E.settings(Object.keys(h).length)}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {!sentence && rail === 'controle' && (
            <>
              <h1>{E.controlTitle}</h1>
              {!p.plan && <div className="ed-hint">{E.noPlan}</div>}
              {p.plan && (
                <div className="ed-box">
                  <span className="ed-box__label">{E.shots(p.plan.shots)} · {fmt(p.plan.durationInSeconds)}</span>
                  <span className="ed-sub">{E.styles[style]} · {p.plan.brain === 'llm' ? E.byClaude : E.automatic} · {p.plan.valid ? E.valid : E.invalid}</span>
                  {planStale && <span className="ed-warn">{E.stale}</span>}
                </div>
              )}
              {plan && (
                <div className="ed-shots">
                  {plan.shots.map((s, i) => (
                    <button key={s.id} type="button" className="ed-shot" title={shotWhy(T, s)}
                      disabled={!lineOf(s)} onClick={() => { const l = lineOf(s); if (l) void openSentence(l); }}>
                      <span className="ed-mono ed-shot__n">{String(i + 1).padStart(2, '0')}</span>
                      <div><span className="ed-ellipsis">{shotLabel(T, s, p)}</span><span className="ed-sub">{s.mediaTier ? T.labels.tiers[s.mediaTier] : T.labels.types[s.type] ?? s.type}{s.block ? ` · ${T.labels.blocks[blockOf(s)] ?? s.block.item}` : ''}{s.editorialIntent ? ` · ${intentOf(T, s.editorialIntent)}` : ''}</span></div>
                      <span className="ed-mono ed-shot__d">{dec(s.durationInFrames / plan.fps)} s</span>
                    </button>
                  ))}
                </div>
              )}
              {p.plan && (
                <>
                  <Issues title={E.toFix} items={p.plan.errors.map(e => e.message)} tone="err" />
                  <Issues title={E.missing} items={p.plan.assetRequests.map(r => r.description)} tone="warn" />
                  <Issues title={E.warnings} items={p.plan.warnings.map(e => e.message)} tone="warn" collapsed />
                  <Issues title={E.choices} items={[...p.plan.notes, ...p.plan.decisions]} tone="info" collapsed />
                  <Issues title={E.technical} items={p.plan.technical ?? []} tone="info" collapsed />
                </>
              )}
              {cur?.qc && <Issues title={cur.qc.pass ? E.qcPass : E.qcFail} items={[...cur.qc.failed, ...cur.qc.warnings]} tone={cur.qc.pass ? 'info' : 'err'} collapsed={cur.qc.pass} />}
            </>
          )}
        </section>

        <section className="ed-preview" hidden={isMedias} style={{ background: showVideo ? '#09080a' : BGS[renders.length % BGS.length] }} data-screen-label={E.preview540}>
          {showVideo && (
            <video key={versionKey(cur)} ref={vidRef} src={api.fileUrl(p.id, versionFile(cur), cur.createdAt)} playsInline className="ed-preview__video"
              onTimeUpdate={e => setT(total ? e.currentTarget.currentTime / total : 0)} onEnded={() => setPlaying(false)} onClick={() => setPlaying(!playing)} />
          )}
          {showStills && <div className="ed-sheet"><img src={api.fileUrl(p.id, 'stills.jpg', p.stills!.createdAt)} alt={E.stillsAlt} /></div>}
          {!showStills && <div className="ed-preview__shade" />}
          <div className="ed-preview__top">
            <span>{showStills ? E.stillsTitle : cur ? `${letter(cur)} · ${cur.scale >= 1 ? '1080p' : '540p'}` : draft.title || T.common.untitled}</span>
            {!showStills && <span className="ed-mono">{fmt(t * total)} / {fmt(total)}</span>}
          </div>
          {!showVideo && !showStills && (
            <div className="ed-preview__title">
              <div>
                {segs(draft.title || T.common.untitled).map((s, i) => <span key={i} style={{ color: s.c }}>{s.t}</span>)}
                <span className="ed-preview__hint">{tab === 'stills' ? E.noStills : p.plan ? E.noVideo : E.writeFirst}</span>
              </div>
            </div>
          )}
          {showVideo && <button type="button" className="ed-preview__play" onClick={() => setPlaying(!playing)} aria-label={playing ? E.pause : E.play}>{playing ? '❚❚' : '▶'}</button>}
          {!showStills && (
            <div className="ed-preview__bottom">
              <div className="ed-chips">{['16:9', E.styles[cur?.style ?? style], cur ? (cur.scale >= 1 ? '1080p' : '540p') : E.notRendered, ...(curStale ? [E.olderPlan] : [])].map(c => <span key={c}>{c}</span>)}</div>
              <div className="ed-preview__prompt">{firstLine(draft.script)}</div>
              {clips.length > 0 && (
                <div className="ed-scrub" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width); }}
                  role="slider" tabIndex={0} aria-label={E.position} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(t * 100)}
                  onKeyDown={e => { if (e.key === 'ArrowRight') seek(t + 0.02); if (e.key === 'ArrowLeft') seek(t - 0.02); }}>
                  {clips.map((k, i) => <div key={i} title={k.label} style={{ flex: `${k.f} 1 0`, height: k.h, background: k.done ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.35)' }} />)}
                  <div className="ed-scrub__head" style={{ left: (t * 100).toFixed(2) + '%' }} />
                </div>
              )}
            </div>
          )}
        </section>

        <section className="ed-lib" hidden={!isMedias} data-screen-label={E.rails.medias}>
          <Mediatheque project={p} onChange={setP} onError={fail} canDescribe={!!health?.anthropic} />
        </section>

        <section className="ed-versions" data-screen-label="Versions">
          <button type="button" className="ed-new" disabled={!p.plan || (active && job?.kind !== 'render') || needsRights} onClick={() => start('preview')}
            title={needsRights ? E.confirmRights : undefined}>
            {job?.kind === 'render' ? (
              <><span className="ed-new__pct">{jobPct + '%'}</span><span>{job.message}</span></>
            ) : (
              <>
                <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true"><path d="M12 3.5l2.5 5.2 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8z" /><path d="M4 3v3M2.5 4.5h3M20 2v3M18.5 3.5h3" strokeLinecap="round" /></svg>
                <span>{E.newVersion}</span>
                <span className="ed-new__sub">{p.plan ? E.preview540 : E.editFirst}</span>
              </>
            )}
          </button>
          {[0, 1, 2].map(i => {
            const v = renders[i];
            if (!v) return <div key={i} className="ed-ver ed-ver--empty" style={{ background: BGS[(i + 1) % BGS.length] }}><span className="ed-ver__shade" /><span className="ed-ver__txt"><span>{E.versionSoon}</span><span>{E.versionHint}</span></span></div>;
            const on = v === cur;
            return (
              <button key={versionKey(v)} type="button" aria-pressed={on} className={'ed-ver' + (on ? ' is-on' : '')} style={{ background: BGS[i % BGS.length] }}
                onClick={() => { setSelVer(versionKey(v)); setTab('video'); setT(0); setPlaying(false); }}>
                {v.poster && <img src={api.fileUrl(p.id, v.poster)} alt="" />}
                <span className="ed-ver__vid">{v.scale >= 1 ? '1080P' : '540P'}</span>
                <span className="ed-ver__shade" />
                <span className="ed-ver__dur">{fmt(v.durationInSeconds)}</span>
                <span className="ed-ver__txt"><span>{letter(v)}</span><span>{E.styles[v.style ?? 'apple']}{v.shots ? ` · ${E.shots(v.shots)}` : ''}</span></span>
              </button>
            );
          })}
          <button type="button" className="ed-promo" disabled={!p.plan || (active && job?.kind !== 'stills')}
            onClick={() => (p.stills && tab !== 'stills' ? setTab('stills') : start('stills'))}>
            <div className="ed-promo__head"><span>{E.stillsTitle}</span><span className="ed-promo__arrow">{job?.kind === 'stills' ? jobPct + '%' : '→'}</span></div>
            <div className="ed-promo__art">
              {p.stills
                ? <><img src={api.fileUrl(p.id, 'stills.jpg', p.stills.createdAt)} alt="" className="ed-promo__a" /><img src={api.fileUrl(p.id, 'stills.jpg', p.stills.createdAt)} alt="" className="ed-promo__b ed-promo__b--low" /></>
                : <><span className="ed-promo__a" style={{ background: BGS[1] }} /><span className="ed-promo__b" style={{ background: BGS[3] }} /></>}
              <span className="ed-promo__badge"><span>3</span><span>{E.perShot}</span></span>
            </div>
          </button>
        </section>

        {error && <div className="ed-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label={T.common.close}>×</button></div>}
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

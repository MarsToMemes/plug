import { useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { api, NATURE_LABEL, NATURES_OF, type MediaNature, type Project, type ProjectMedia } from '../../lib/api';
import { fmtDur, fmtSize } from '../../lib/plugMedia';
import './mediatheque.css';

type Kind = ProjectMedia['kind'];
type Filter = 'ALL' | Kind;
type Sort = 'date' | 'name' | 'type' | 'duration' | 'size';

const ICON: Record<Kind, string> = {
  video: 'M3 6h13v12H3z M16 10l5-3v10l-5-3z',
  image: 'M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M15.5 8.5h.01',
  audio: 'M4 10v4 M8 7v10 M12 4v16 M16 8v8 M20 11v2'
};
const ORDER: Kind[] = ['video', 'image', 'audio'];
const SEC_LABEL: Record<Kind, string> = { video: 'VIDÉO', image: 'IMAGE', audio: 'AUDIO' };
const ACCEPT = '.mp4,.mov,.m4v,.webm,.jpg,.jpeg,.png,.webp,.gif,.mp3,.wav,.m4a,.aac,.flac,.ogg,video/*,image/*,audio/*';
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|flac|ogg)$/i;

const COMPARE: Record<Sort, (a: ProjectMedia, b: ProjectMedia) => number> = {
  date: () => 0, // server order is the import order; reversed below
  name: (a, b) => a.originalName.localeCompare(b.originalName, 'fr', { numeric: true }),
  type: (a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind),
  duration: (a, b) => (b.durationInSeconds || 0) - (a.durationInSeconds || 0),
  size: (a, b) => b.bytes - a.bytes
};

const Svg = ({ d, size = 18, sw = 1.6 }: { d: string; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

const plural = (n: number, one: string, many: string) => n + ' ' + (n > 1 ? many : one);

/** Decorative waveform, stable for a given name (the real one would need decoding the file). */
const pseudoWave = (name: string) => {
  let s = 0;
  for (const ch of name) s = (s * 31 + ch.charCodeAt(0)) % 99991;
  return Array.from({ length: 56 }, (_, i) => { s = (s * 9301 + 49297) % 233280; return 0.25 + 0.75 * Math.abs(Math.sin(i / 4 + s / 5e4)) * (0.5 + (s % 100) / 200); });
};

/** Declared nature, else from the old "généré par IA" flag and the kind. */
const natureOf = (m: ProjectMedia): MediaNature => m.nature ?? (m.synthetic ? 'generated' : m.kind === 'video' ? 'real_video' : 'real_photo');

interface Pending { id: string; name: string; kind: Kind; progress: number; error?: string; file: File }

/**
 * The project's media library: imports sent to the Plug server (real progress), filters,
 * search, sort, multi-select. Visuals carry a description the editor brain matches to the
 * narration; an audio file is the voice-over or the music.
 */
export default function Mediatheque({ project, onChange, onError }: { project: Project; onChange: (p: Project) => void; onError: (e: unknown) => void }) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('date');
  const [closed, setClosed] = useState<Partial<Record<Kind, boolean>>>({});
  const [sel, setSel] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [play, setPlay] = useState<string | null>(null);
  const [playT, setPlayT] = useState(0);
  const [toast, setToast] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const toastT = useRef(0);
  const projectRef = useRef(project); projectRef.current = project;

  const flash = (m: string) => { clearTimeout(toastT.current); setToast(m); toastT.current = window.setTimeout(() => setToast(''), 2600); };

  // One upload at a time: each returns the updated project, the next one starts from it.
  const upload = async (list: Pending[]) => {
    for (const it of list) {
      const role = it.kind === 'audio' ? 'music' : 'visual';
      try {
        const next = await api.upload(projectRef.current.id, it.file, role, f => setPending(ps => ps.map(x => (x.id === it.id ? { ...x, progress: f } : x))));
        onChange(next);
        setPending(ps => ps.filter(x => x.id !== it.id));
      } catch (e) {
        setPending(ps => ps.map(x => (x.id === it.id ? { ...x, error: (e as Error).message } : x)));
      }
    }
  };

  const addFiles = (files: ArrayLike<File> | null | undefined) => {
    const list = Array.from(files || []).map((file, k): Pending => ({
      id: `up${Date.now()}${k}`, name: file.name, file, progress: 0,
      kind: file.type.startsWith('audio/') || AUDIO_EXT.test(file.name) ? 'audio' : file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(file.name) ? 'video' : 'image'
    }));
    if (!list.length) return;
    setPending(ps => [...list, ...ps]);
    void upload(list);
  };

  const remove = async (ids: string[]) => {
    let cur = projectRef.current;
    for (const id of ids) {
      if (play === id) { audio.current?.pause(); setPlay(null); }
      try { cur = await api.removeMedia(cur.id, id); } catch (e) { onError(e); break; }
    }
    onChange(cur);
    setSel(s => s.filter(x => !ids.includes(x)));
  };

  const setRole = (m: ProjectMedia) => api.updateMedia(project.id, m.id, { role: m.role === 'voice' ? 'music' : 'voice' })
    .then(p => { onChange(p); flash(m.role === 'voice' ? 'Utilisé comme musique' : 'Utilisé comme voix off'); }, onError);

  const togglePlay = (m: ProjectMedia) => {
    let a = audio.current;
    if (!a) {
      a = audio.current = new Audio();
      a.ontimeupdate = () => setPlayT(a!.duration ? a!.currentTime / a!.duration : 0);
      a.onended = () => { setPlay(null); setPlayT(0); };
      a.onerror = () => { setPlay(null); flash('Lecture impossible'); };
    }
    if (play === m.id) { if (a.paused) a.play().catch(() => {}); else a.pause(); return; }
    a.pause(); a.src = api.mediaUrl(project.id, m.file); a.play().catch(() => {});
    setPlay(m.id); setPlayT(0);
  };

  const media = project.media;
  const counts = useMemo(() => {
    const c: Record<Kind, number> = { video: 0, image: 0, audio: 0 };
    media.forEach(m => c[m.kind]++);
    return c;
  }, [media]);
  const vis = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const list = media.filter(m => (filter === 'ALL' || m.kind === filter) && (!qq || m.originalName.toLowerCase().includes(qq) || m.description.toLowerCase().includes(qq)));
    return sort === 'date' ? list.reverse() : list.sort(COMPARE[sort]);
  }, [media, filter, q, sort]);

  const counter = [
    counts.video && plural(counts.video, 'vidéo', 'vidéos'),
    counts.image && plural(counts.image, 'image', 'images'),
    counts.audio && plural(counts.audio, 'audio', 'audios')
  ].filter(Boolean).join(' · ') || 'Aucun média';
  const FILTERS: [Filter, string, number][] = [['ALL', 'TOUT', media.length], ['video', 'VIDÉO', counts.video], ['image', 'IMAGE', counts.image], ['audio', 'AUDIO', counts.audio]];
  const anySel = sel.length > 0;

  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files');
  const onDragEnter = (e: DragEvent) => { e.preventDefault(); dragCount.current++; if (!drag && hasFiles(e)) setDrag(true); };
  const onDragOver = (e: DragEvent) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; };
  const onDragLeave = () => { dragCount.current = Math.max(0, dragCount.current - 1); if (!dragCount.current) setDrag(false); };
  const onDrop = (e: DragEvent) => { e.preventDefault(); dragCount.current = 0; setDrag(false); addFiles(e.dataTransfer?.files); };

  const toggleSel = (id: string) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  const keys = (id: string) => (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSel(id); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); void remove([id]); }
  };
  const meta = (m: ProjectMedia) => [
    m.kind !== 'image' && m.durationInSeconds ? fmtDur(m.durationInSeconds) : '',
    m.kind !== 'audio' && m.width ? `${m.width} × ${m.height}` : '',
    fmtSize(m.bytes)
  ].filter(Boolean).join(' · ');

  const renderVisual = (m: ProjectMedia) => {
    const selected = sel.includes(m.id), url = api.mediaUrl(project.id, m.file);
    return (
      <div key={m.id} role="button" tabIndex={0} aria-pressed={selected} aria-label={`${m.kind === 'video' ? 'Vidéo' : 'Image'}, ${m.originalName}${selected ? ', sélectionné' : ''}`}
        className={'mc mc--visual' + (selected ? ' is-sel' : '')} onClick={() => toggleSel(m.id)} onKeyDown={keys(m.id)}>
        <div className="mc__thumb">
          {m.kind === 'image' ? <img src={url} loading="lazy" alt="" /> : <video src={`${url}#t=0.5`} muted preload="metadata" />}
          {m.kind === 'video' && m.durationInSeconds != null && <span className="mc__dur">{fmtDur(m.durationInSeconds)}</span>}
          <span className="mc__badge"><Svg d={ICON[m.kind]} size={10} sw={2} />{SEC_LABEL[m.kind]}</span>
          <span className="mc__chk" aria-hidden="true">{selected ? '✓' : ''}</span>
        </div>
        <div className="mc__foot">
          <div className="mc__txt">
            <span className="mc__name" title={m.originalName}>{m.originalName}</span>
            <span className="mc__meta">{meta(m)}</span>
            <input className="mc__desc" defaultValue={m.description} placeholder="Ce que montre ce média" aria-label={`Description de ${m.originalName}`}
              onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
              onBlur={e => { if (e.target.value !== m.description) api.updateMedia(project.id, m.id, { description: e.target.value }).then(onChange, onError); }} />
            <select className="mc__nature" value={natureOf(m)} aria-label={`Nature de ${m.originalName}`} title="Le monteur préfère le média le plus authentique"
              onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
              onChange={e => api.updateMedia(project.id, m.id, { nature: e.target.value as MediaNature }).then(onChange, onError)}>
              {NATURES_OF[m.kind === 'video' ? 'video' : 'image'].map(n => <option key={n} value={n}>{NATURE_LABEL[n]}</option>)}
            </select>
          </div>
          <button type="button" className="mc__x" onClick={e => { e.stopPropagation(); void remove([m.id]); }} aria-label={'Retirer ' + m.originalName}>×</button>
        </div>
      </div>
    );
  };

  const renderAudio = (m: ProjectMedia) => {
    const selected = sel.includes(m.id), playing = play === m.id, wf = pseudoWave(m.originalName);
    return (
      <div key={m.id} role="button" tabIndex={0} aria-pressed={selected} aria-label={`Audio, ${m.originalName}${selected ? ', sélectionné' : ''}`}
        className={'mc mc--row mc--audio' + (selected ? ' is-sel' : '')} onClick={() => toggleSel(m.id)} onKeyDown={keys(m.id)}>
        <button type="button" className="mc__pbtn" onClick={e => { e.stopPropagation(); togglePlay(m); }} aria-label={(playing ? 'Pause ' : 'Écouter ') + m.originalName}>{playing && !audio.current?.paused ? '❚❚' : '▶'}</button>
        <div className="mc__col">
          <div className="mc__line">
            <span className="mc__ico"><Svg d={ICON.audio} size={13} sw={2} /></span>
            <span className="mc__name" title={m.originalName}>{m.originalName}</span>
            <button type="button" className="mc__role" title={m.role === 'voice' ? 'Utiliser comme musique' : 'Utiliser comme voix off'} onClick={e => { e.stopPropagation(); void setRole(m); }}>{m.role === 'voice' ? 'VOIX OFF' : 'MUSIQUE'} ⇄</button>
          </div>
          <div className="mc__wave" aria-hidden="true">
            {wf.map((v, k) => <span key={k} style={{ height: Math.max(10, v * 100).toFixed(0) + '%', background: playing && k / wf.length < playT ? '#fff' : '#5a4d78' }} />)}
          </div>
          <div className="mc__line mc__line--meta">
            <span className="mc__meta mc__grow">{meta(m)}</span>
            <span className="mc__st is-ok">PRÊT</span>
          </div>
        </div>
        <button type="button" className="mc__x" onClick={e => { e.stopPropagation(); void remove([m.id]); }} aria-label={'Retirer ' + m.originalName}>×</button>
      </div>
    );
  };

  const renderPending = (it: Pending) => (
    <div key={it.id} className={'mc mc--row mc--doc' + (it.error ? ' is-err' : '')}>
      <span className="mc__docico"><Svg d={ICON[it.kind]} /></span>
      <div className="mc__col mc__col--tight">
        <div className="mc__line"><span className="mc__name" title={it.name}>{it.name}</span><span className="mc__tag">{SEC_LABEL[it.kind]}</span></div>
        {it.error
          ? <span className="mc__meta">{it.error}</span>
          : <><span className="mc__st">{it.progress < 1 ? `Import… ${Math.round(it.progress * 100)} %` : 'Analyse…'}</span><span className="mc__bar mc__bar--thin"><span style={{ width: `${Math.round(it.progress * 100)}%` }} /></span></>}
      </div>
      {it.error && <button type="button" className="mc__x" onClick={() => setPending(ps => ps.filter(x => x.id !== it.id))} aria-label={'Retirer ' + it.name}>×</button>}
    </div>
  );

  const groups = ORDER.map(t => ({ t, list: vis.filter(m => m.kind === t) })).filter(g => g.list.length);

  return (
    <div className={'ml' + (anySel ? ' has-sel' : '') + (drag ? ' is-drag' : '')} onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <input ref={input} type="file" multiple accept={ACCEPT} hidden aria-label="Importer des médias" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />

      <div className="ml-head">
        <div className="ml-head__title">
          <span className="ml-kicker">MÉDIATHÈQUE</span>
          <span className="ml-counter" aria-live="polite">{counter}</span>
        </div>
        <div className="ml-tools">
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un média…" aria-label="Rechercher un média" className="ml-input ml-input--search" />
          <select value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Trier" className="ml-input">
            <option value="date">Date d’ajout</option><option value="name">Nom</option><option value="type">Type</option><option value="duration">Durée</option><option value="size">Taille</option>
          </select>
          <button type="button" className="ml-browse" onClick={() => input.current?.click()}>Parcourir</button>
        </div>
      </div>

      <div role="tablist" aria-label="Filtrer par type" className="ml-filters">
        {FILTERS.map(([id, label, count]) => (
          <button key={id} type="button" role="tab" aria-selected={filter === id} className={filter === id ? 'is-on' : ''} onClick={() => setFilter(id)}>{label}<span>{count}</span></button>
        ))}
      </div>

      {media.some(m => m.role !== 'voice') && (
        <label className="ml-rights">
          <input type="checkbox" checked={project.rightsConfirmed} onChange={e => api.update(project.id, { rightsConfirmed: e.target.checked }).then(onChange, onError)} />
          Je détiens les droits de ces médias (ou une licence qui autorise l’usage commercial).
        </label>
      )}

      {anySel && (
        <div className="ml-selbar">
          <span>{plural(sel.length, 'sélectionné', 'sélectionnés')}</span>
          <button type="button" className="ml-selbar__btn" onClick={() => setSel(vis.map(m => m.id))}>Tout sélectionner</button>
          <button type="button" className="ml-selbar__btn ml-selbar__btn--danger" onClick={() => void remove(sel)}>Retirer du projet</button>
          <button type="button" className="ml-selbar__x" onClick={() => setSel([])} aria-label="Désélectionner">×</button>
        </div>
      )}

      <div className="ml-body">
        {pending.length > 0 && <div className="ml-grid ml-grid--doc">{pending.map(renderPending)}</div>}

        {media.length === 0 && pending.length === 0 && (
          <div className="ml-empty">
            <div className="ml-empty__icons" aria-hidden="true">{ORDER.map(t => <span key={t}><Svg d={ICON[t]} /></span>)}</div>
            <span className="ml-empty__title">DÉPOSEZ VOS MÉDIAS</span>
            <span className="ml-empty__text">Glissez-déposez vos images, vidéos, voix off et musiques ici. Décrivez chaque visuel : le monteur le place sur la phrase qui en parle.</span>
            <span className="ml-empty__or">ou</span>
            <button type="button" className="ml-browse ml-browse--lg" onClick={() => input.current?.click()}>Parcourir les fichiers</button>
            <span className="ml-empty__formats">Formats : MP4 · MOV · WEBM · JPG · PNG · WEBP · MP3 · WAV · M4A</span>
          </div>
        )}

        {groups.map(({ t, list }) => {
          const open = !closed[t];
          return (
            <section key={t} className="ml-sec" aria-label={SEC_LABEL[t] + ', ' + list.length + ' fichiers'}>
              <button type="button" className="ml-sec__head" aria-expanded={open} onClick={() => setClosed(c => ({ ...c, [t]: open }))}>
                <Svg d={ICON[t]} size={15} sw={1.7} />
                <span>{SEC_LABEL[t]} · {list.length}</span>
                <span className="ml-sec__rule" />
                <span className="ml-sec__chev" style={{ transform: `rotate(${open ? 90 : 0}deg)` }}>›</span>
              </button>
              {open && (t === 'audio'
                ? <div className="ml-grid ml-grid--audio">{list.map(renderAudio)}</div>
                : <div className="ml-grid ml-grid--visual">{list.map(renderVisual)}</div>)}
            </section>
          );
        })}

        {media.length > 0 && vis.length === 0 && <div className="ml-nomatch">Aucun média ne correspond.</div>}
      </div>

      {drag && (
        <div className="ml-drop">
          <div>
            <span className="ml-drop__title">Déposez vos médias ici</span>
            <span className="ml-drop__types">IMAGE · VIDÉO · VOIX OFF · MUSIQUE</span>
          </div>
        </div>
      )}

      {toast && <div role="status" className="ml-toast">{toast}</div>}
    </div>
  );
}

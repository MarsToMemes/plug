import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from 'react';
import {
  ACCEPT, MAX_SIZE, fmtDur, fmtSize, normalize, processItem, take,
  type MediaItem, type MediaType
} from '../../lib/plugMedia';
import { makeWav, pseudoWave, remoteSamples, SAMPLE_SRT } from './samples';
import './mediatheque.css';

const ICON: Record<MediaType, string> = {
  VIDEO: 'M3 6h13v12H3z M16 10l5-3v10l-5-3z',
  IMAGE: 'M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M15.5 8.5h.01',
  AUDIO: 'M4 10v4 M8 7v10 M12 4v16 M16 8v8 M20 11v2',
  SUBTITLE: 'M3 5h18v14H3z M7 12h4 M13 12h4 M7 15.5h10',
  TEXT: 'M5 5h14 M12 5v14 M9 19h6',
  UNKNOWN: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5 M12 16.5h.01'
};
const ORDER: MediaType[] = ['VIDEO', 'IMAGE', 'AUDIO', 'SUBTITLE', 'TEXT', 'UNKNOWN'];
const SEC_LABEL: Record<MediaType, string> = { VIDEO: 'VIDÉO', IMAGE: 'IMAGE', AUDIO: 'AUDIO', SUBTITLE: 'SOUS-TITRES', TEXT: 'TEXTE', UNKNOWN: 'NON PRIS EN CHARGE' };
const BADGE: Record<MediaType, string> = { VIDEO: 'VIDÉO', IMAGE: 'IMAGE', AUDIO: 'AUDIO', SUBTITLE: 'SOUS-TITRE', TEXT: 'TEXTE', UNKNOWN: 'NON SUPPORTÉ' };
const TYPE_NAME: Record<MediaType, string> = { VIDEO: 'Vidéo', IMAGE: 'Image', AUDIO: 'Audio', SUBTITLE: 'Sous-titres', TEXT: 'Texte', UNKNOWN: 'Fichier non pris en charge' };
const STATUS_LABEL = { READY: 'PRÊT', ERROR: 'ERREUR' } as const;
const UNSUPPORTED = 'Type de fichier non pris en charge';
const TOO_BIG = 'Fichier trop volumineux (max 10 Go)';

type Filter = 'ALL' | 'VIDEO' | 'IMAGE' | 'AUDIO' | 'SUBTITLE';
type Sort = 'date' | 'name' | 'type' | 'duration' | 'size';

/** Item handed to the timeline (no File object). */
export type LibraryItem = Omit<MediaItem, 'file'>;

const Svg = ({ d, size = 18, sw = 1.6 }: { d: string; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

const COMPARE: Record<Sort, (a: MediaItem, b: MediaItem) => number> = {
  date: (a, b) => b.addedAt - a.addedAt,
  name: (a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }),
  type: (a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type),
  duration: (a, b) => (b.duration || 0) - (a.duration || 0),
  size: (a, b) => b.size - a.size
};

let pendingTake: Promise<File[]> | null = null;

const plural = (n: number, one: string, many: string) => n + ' ' + (n > 1 ? many : one);

/**
 * Media library: multi-file drop (video, image, audio, subtitles), type detection, simulated upload,
 * real metadata (thumbnails, durations, waveforms, cue counts), filters, search, sort, multi-select.
 */
export default function Mediatheque({ onAdd }: { onAdd?: (items: LibraryItem[]) => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('date');
  const [closed, setClosed] = useState<Partial<Record<MediaType, boolean>>>({});
  const [sel, setSel] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const [dup, setDup] = useState<MediaItem[] | null>(null);
  const [play, setPlay] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [playT, setPlayT] = useState(0);
  const [toast, setToast] = useState('');

  const input = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items); itemsRef.current = items;
  const tick = useRef(0), toastT = useRef(0), dragCount = useRef(0);
  const queue = useRef<string[]>([]), running = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const playRef = useRef(play); playRef.current = play;

  const flash = useCallback((m: string) => {
    clearTimeout(toastT.current); setToast(m);
    toastT.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const revoke = (i: MediaItem) => {
    if (i.url?.startsWith('blob:')) URL.revokeObjectURL(i.url);
    if (i.thumbnail?.startsWith('blob:') && i.thumbnail !== i.url) URL.revokeObjectURL(i.thumbnail);
  };

  const patch = useCallback((id: string, p: Partial<MediaItem>) => {
    if (!itemsRef.current.some(i => i.id === id)) { if (p.thumbnail?.startsWith('blob:')) URL.revokeObjectURL(p.thumbnail); return; }
    setItems(list => list.map(i => (i.id === id ? { ...i, ...p } : i)));
  }, []);

  // Metadata extraction, three files at a time.
  const pump = useCallback(() => {
    while (running.current < 3 && queue.current.length) {
      const id = queue.current.shift()!, it = itemsRef.current.find(i => i.id === id); if (!it) continue;
      running.current++;
      Promise.resolve().then(() => processItem(it))
        .then(meta => patch(id, { ...meta, thumbnail: meta.thumbnail || it.preset || null, status: 'READY' }))
        .catch((e: Error) => patch(id, { status: 'ERROR', error: e?.message || 'Fichier corrompu', thumbnail: it.preset || null }))
        .finally(() => { running.current--; pump(); });
    }
  }, [patch]);

  // Simulated upload progress (no server yet); bigger files take longer.
  const step = useCallback(() => {
    const up = itemsRef.current.filter(i => i.status === 'UPLOADING');
    if (!up.length) { clearInterval(tick.current); tick.current = 0; return; }
    const inc = new Map(up.map(it => [it.id, Math.max(2, 34 / (1 + it.size / 15e6)) * (0.6 + Math.random() * 0.8)]));
    const done = new Set(up.filter(it => it.uploadProgress + inc.get(it.id)! >= 100).map(it => it.id));
    setItems(list => list.map(it => {
      if (it.status !== 'UPLOADING' || !inc.has(it.id)) return it;
      if (done.has(it.id)) return { ...it, uploadProgress: 100, status: 'PROCESSING' };
      return { ...it, uploadProgress: Math.min(99, it.uploadProgress + inc.get(it.id)!) };
    }));
    if (done.size) { queue.current.push(...done); pump(); }
  }, [pump]);

  const ensureTick = useCallback(() => { if (!tick.current) tick.current = window.setInterval(step, 120); }, [step]);

  const ingest = useCallback((list: MediaItem[]) => {
    list.forEach(it => {
      if (it.type === 'UNKNOWN') { it.status = 'ERROR'; it.error = UNSUPPORTED; return; }
      if (it.size > MAX_SIZE) { it.status = 'ERROR'; it.error = TOO_BIG; return; }
      if (!it.url && it.file && (it.type === 'VIDEO' || it.type === 'IMAGE' || it.type === 'AUDIO')) it.url = URL.createObjectURL(it.file);
    });
    setItems(s => [...list, ...s]);
    ensureTick();
  }, [ensureTick]);

  const addFiles = useCallback((list: ArrayLike<File> | null | undefined) => {
    const arr = Array.from(list || []); if (!arr.length) return;
    const keys = new Set(itemsRef.current.map(i => i.key)), seen = new Set<string>(), fresh: MediaItem[] = [], dups: MediaItem[] = [];
    arr.forEach(f => { const it = normalize(f); if (keys.has(it.key) || seen.has(it.key)) dups.push(it); else { seen.add(it.key); fresh.push(it); } });
    if (fresh.length) ingest(fresh);
    if (dups.length) setDup(d => [...(d || []), ...dups]);
  }, [ingest]);

  // Files dropped on the homepage (shared promise so StrictMode's double mount does not lose them).
  useEffect(() => {
    let alive = true;
    if (!pendingTake) { pendingTake = take(); pendingTake.finally(() => setTimeout(() => { pendingTake = null; }, 0)); }
    pendingTake.then(files => { if (alive && files.length) { addFiles(files); flash(files.length + ' fichier(s) importé(s) depuis l’accueil'); } });
    return () => { alive = false; };
  }, [addFiles, flash]);

  useEffect(() => () => {
    clearInterval(tick.current); clearTimeout(toastT.current);
    audio.current?.pause();
    itemsRef.current.forEach(revoke);
  }, []);

  const remove = (ids: string[]) => {
    const set = new Set(ids);
    if (playRef.current && set.has(playRef.current)) { audio.current?.pause(); setPlay(null); }
    setItems(list => list.map(i => (set.has(i.id) ? { ...i, removing: true } : i)));
    setSel(s => s.filter(x => !set.has(x)));
    setTimeout(() => {
      itemsRef.current.filter(i => set.has(i.id)).forEach(revoke);
      setItems(list => list.filter(i => !set.has(i.id)));
    }, 180);
  };

  const retry = (id: string) => { setItems(list => list.map(i => (i.id === id ? { ...i, status: 'UPLOADING', uploadProgress: 0, error: null } : i))); ensureTick(); };
  const toggleSel = (id: string) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const togglePlay = (id: string) => {
    const it = itemsRef.current.find(i => i.id === id);
    if (!it || it.status !== 'READY' || !it.url) { flash('Aperçu audio indisponible'); return; }
    let a = audio.current;
    if (!a) {
      a = audio.current = new Audio();
      a.ontimeupdate = () => setPlayT(a!.duration ? a!.currentTime / a!.duration : 0);
      a.onended = () => { setPlay(null); setPlayT(0); };
      a.onerror = () => { if (playRef.current) { setPlay(null); flash('Lecture impossible'); } };
    }
    if (playRef.current === id) {
      if (a.paused) { a.play().catch(() => {}); setPaused(false); } else { a.pause(); setPaused(true); }
      return;
    }
    a.pause(); a.src = it.url; a.play().catch(() => {});
    setPlay(id); setPlayT(0); setPaused(false);
  };

  const loadSamples = () => {
    const remote = remoteSamples().map(([name, type, mimeType, size, url, preset], k) => ({
      ...normalize({ name, type: mimeType, size, lastModified: 100 + k }), type, url, preset, file: null
    }));
    ingest(remote);
    addFiles([makeWav(8), new File([SAMPLE_SRT], 'tokyo_vlog.fr.srt', { type: 'application/x-subrip', lastModified: 2 }), new File(['plug'], 'notes_montage.psd', { type: 'image/vnd.adobe.photoshop', lastModified: 3 })]);
  };

  // Dev helper: window.__plugLibStress(150) fills the library to check performance.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __plugLibStress?: (n?: number) => number };
    w.__plugLibStress = (n = 120) => {
      const types: MediaType[] = ['VIDEO', 'IMAGE', 'IMAGE', 'VIDEO', 'AUDIO', 'SUBTITLE'];
      const thumbs = remoteSamples().map(s => s[5]);
      const list = Array.from({ length: n }, (_, k): MediaItem => {
        const type = types[k % types.length], ext = { VIDEO: 'mp4', IMAGE: 'jpg', AUDIO: 'mp3', SUBTITLE: 'srt' }[type as 'VIDEO'];
        const it = normalize({ name: type.toLowerCase() + '_' + String(k + 1).padStart(3, '0') + '.' + ext, type: '', size: 1e6 + (k * 7919 % 90) * 1e6, lastModified: 1000 + k });
        return { ...it, type, status: 'READY', uploadProgress: 100, thumbnail: type === 'VIDEO' || type === 'IMAGE' ? thumbs[k % thumbs.length] : null, duration: type === 'VIDEO' || type === 'AUDIO' ? 5 + (k * 37) % 600 : null, width: 1920, height: 1080, cues: type === 'SUBTITLE' ? 40 + k : null };
      });
      setItems(s => [...list, ...s]);
      return n;
    };
    return () => { delete w.__plugLibStress; };
  }, []);

  // ---------- derived ----------
  const counts = useMemo(() => {
    const c = Object.fromEntries(ORDER.map(t => [t, 0])) as Record<MediaType, number>;
    items.forEach(i => c[i.type]++);
    return c;
  }, [items]);
  const names = useMemo(() => { const m: Record<string, number> = {}; items.forEach(i => { m[i.name] = (m[i.name] || 0) + 1; }); return m; }, [items]);
  const vis = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const inFilter = (i: MediaItem) => filter === 'ALL' || i.type === filter || (filter === 'SUBTITLE' && i.type === 'TEXT');
    return items.filter(i => inFilter(i) && (!qq || i.name.toLowerCase().includes(qq))).sort(COMPARE[sort]);
  }, [items, filter, q, sort]);

  const anySel = sel.length > 0;
  const subCount = counts.SUBTITLE + counts.TEXT;
  const counter = [
    counts.VIDEO && plural(counts.VIDEO, 'vidéo', 'vidéos'),
    counts.IMAGE && plural(counts.IMAGE, 'image', 'images'),
    counts.AUDIO && plural(counts.AUDIO, 'audio', 'audios'),
    subCount && plural(subCount, 'sous-titre', 'sous-titres'),
    counts.UNKNOWN && plural(counts.UNKNOWN, 'non pris en charge', 'non pris en charge')
  ].filter(Boolean).join(' · ') || 'Aucun média';
  const FILTERS: [Filter, string, number][] = [['ALL', 'TOUT', items.length], ['VIDEO', 'VIDÉO', counts.VIDEO], ['IMAGE', 'IMAGE', counts.IMAGE], ['AUDIO', 'AUDIO', counts.AUDIO], ['SUBTITLE', 'SOUS-TITRES', subCount]];

  const addSel = () => {
    const chosen = items.filter(i => sel.includes(i.id)), ok = chosen.filter(i => i.status === 'READY');
    if (!ok.length) { flash('Aucun média prêt dans la sélection'); return; }
    onAdd?.(ok.map(({ file: _file, ...r }) => r));
    flash(plural(ok.length, 'média ajouté', 'médias ajoutés') + ' au montage' + (chosen.length > ok.length ? ' · ' + (chosen.length - ok.length) + ' pas encore prêt(s)' : ''));
    setSel([]);
  };

  // ---------- drag & drop over the whole library ----------
  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files');
  const onDragEnter = (e: DragEvent) => { e.preventDefault(); dragCount.current++; if (!drag && hasFiles(e)) setDrag(true); };
  const onDragOver = (e: DragEvent) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; };
  const onDragLeave = () => { dragCount.current = Math.max(0, dragCount.current - 1); if (!dragCount.current) setDrag(false); };
  const onDrop = (e: DragEvent) => { e.preventDefault(); dragCount.current = 0; setDrag(false); addFiles(e.dataTransfer?.files); };

  // ---------- card view-model ----------
  const card = (i: MediaItem) => {
    const selected = sel.includes(i.id), busy = i.status === 'UPLOADING' || i.status === 'PROCESSING', err = i.status === 'ERROR', ready = i.status === 'READY';
    const statusLabel = i.status === 'UPLOADING' ? 'Import… ' + Math.round(i.uploadProgress) + '%' : i.status === 'PROCESSING' ? 'Traitement…' : STATUS_LABEL[i.status];
    const parts: string[] = [];
    if ((i.type === 'VIDEO' || i.type === 'AUDIO') && i.duration != null) parts.push(fmtDur(i.duration));
    if (i.type === 'IMAGE' && i.width) parts.push(i.width + ' × ' + i.height);
    if (i.type === 'SUBTITLE' && i.cues != null) parts.push(plural(i.cues, 'réplique', 'répliques'));
    if (i.type === 'SUBTITLE' && i.lang) parts.push(i.lang);
    if (i.type === 'TEXT' && i.cues != null) parts.push(i.cues + ' mots');
    parts.push(fmtSize(i.size));
    if (names[i.name] > 1) parts.push('nom en double');
    return {
      selected, busy, err, ready, statusLabel,
      meta: err && i.type !== 'VIDEO' && i.type !== 'IMAGE' ? i.error + ' · ' + fmtSize(i.size) : parts.join(' · '),
      canRetry: err && !!i.file && i.type !== 'UNKNOWN' && i.error !== UNSUPPORTED && i.error !== TOO_BIG,
      pct: (i.status === 'UPLOADING' ? i.uploadProgress : busy ? 100 : 0) + '%',
      aria: TYPE_NAME[i.type] + ', ' + i.name + ', ' + (err ? i.error : statusLabel) + (selected ? ', sélectionné' : ''),
      cls: 'mc' + (selected ? ' is-sel' : '') + (err ? ' is-err' : '') + (i.removing ? ' is-removing' : ''),
      onClick: () => toggleSel(i.id),
      onKey: (e: KeyboardEvent) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSel(i.id); }
        else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove([i.id]); }
      },
      onRemove: (e: MouseEvent) => { e.stopPropagation(); remove([i.id]); }
    };
  };

  const Remove = ({ i, onClick }: { i: MediaItem; onClick: (e: MouseEvent) => void }) => (
    <button type="button" className="mc__x" onClick={onClick} aria-label={'Retirer ' + i.name}>×</button>
  );

  const renderVisual = (i: MediaItem) => {
    const c = card(i);
    return (
      <div key={i.id} role="button" tabIndex={0} aria-pressed={c.selected} aria-label={c.aria} className={c.cls + ' mc--visual'} onClick={c.onClick} onKeyDown={c.onKey}>
        <div className="mc__thumb">
          {i.thumbnail
            ? <img src={i.thumbnail} loading="lazy" alt="" />
            : <div className="mc__noimg"><Svg d={ICON[i.type]} size={26} sw={1.4} /></div>}
          {i.type === 'VIDEO' && (
            <>
              {!c.busy && !c.err && <div className="mc__play"><span><span /></span></div>}
              {c.ready && i.duration != null && <span className="mc__dur">{fmtDur(i.duration)}</span>}
            </>
          )}
          <span className="mc__badge"><Svg d={ICON[i.type]} size={10} sw={2} />{BADGE[i.type]}</span>
          <span className="mc__chk" aria-hidden="true">{c.selected ? '✓' : ''}</span>
          {c.busy && (
            <div className="mc__busy">
              <span>{c.statusLabel}</span>
              <span className="mc__bar"><span style={{ width: c.pct }} /></span>
            </div>
          )}
          {c.err && (
            <div className="mc__err">
              <span>{i.error}</span>
              {c.canRetry && <button type="button" onClick={e => { e.stopPropagation(); retry(i.id); }}>Réessayer</button>}
            </div>
          )}
        </div>
        <div className="mc__foot">
          <div className="mc__txt">
            <span className="mc__name" title={i.name}>{i.name}</span>
            <span className="mc__meta">{c.meta}</span>
          </div>
          <Remove i={i} onClick={c.onRemove} />
        </div>
      </div>
    );
  };

  const renderAudio = (i: MediaItem) => {
    const c = card(i), playing = play === i.id && !paused, wf = i.waveform || pseudoWave(i.name);
    return (
      <div key={i.id} role="button" tabIndex={0} aria-pressed={c.selected} aria-label={c.aria} className={c.cls + ' mc--row mc--audio'} onClick={c.onClick} onKeyDown={c.onKey}>
        <button type="button" className="mc__pbtn" disabled={!c.ready} onClick={e => { e.stopPropagation(); togglePlay(i.id); }} aria-label={(playing ? 'Pause ' : 'Écouter ') + i.name}>{playing ? '❚❚' : '▶'}</button>
        <div className="mc__col">
          <div className="mc__line">
            <span className="mc__ico"><Svg d={ICON.AUDIO} size={13} sw={2} /></span>
            <span className="mc__name" title={i.name}>{i.name}</span>
            <span className="mc__tag">AUDIO</span>
          </div>
          <div className="mc__wave" aria-hidden="true">
            {wf.map((v, k) => (
              <span key={k} style={{ height: Math.max(10, v * 100).toFixed(0) + '%', background: play === i.id && k / wf.length < playT ? '#fff' : c.ready ? (i.waveform ? '#8a72c4' : '#5a4d78') : '#34303a' }} />
            ))}
          </div>
          <div className="mc__line mc__line--meta">
            <span className="mc__meta mc__grow">{c.meta}</span>
            <span className={'mc__st' + (c.ready ? ' is-ok' : c.err ? ' is-ko' : '')}>{c.statusLabel}</span>
          </div>
          {c.busy && <span className="mc__bar mc__bar--thin"><span style={{ width: c.pct }} /></span>}
        </div>
        <Remove i={i} onClick={c.onRemove} />
      </div>
    );
  };

  const renderDoc = (i: MediaItem) => {
    const c = card(i);
    return (
      <div key={i.id} role="button" tabIndex={0} aria-pressed={c.selected} aria-label={c.aria} className={c.cls + ' mc--row mc--doc'} onClick={c.onClick} onKeyDown={c.onKey}>
        <span className="mc__docico"><Svg d={ICON[i.type]} /></span>
        <div className="mc__col mc__col--tight">
          <div className="mc__line">
            <span className="mc__name" title={i.name}>{i.name}</span>
            <span className="mc__tag">{BADGE[i.type]}</span>
          </div>
          <span className="mc__meta">{c.meta}</span>
          {c.busy && <span className="mc__st">{c.statusLabel}</span>}
        </div>
        <Remove i={i} onClick={c.onRemove} />
      </div>
    );
  };

  const groups = ORDER.map(t => ({ t, list: vis.filter(i => i.type === t) })).filter(g => g.list.length);

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

      {anySel && (
        <div className="ml-selbar">
          <span>{plural(sel.length, 'sélectionné', 'sélectionnés')}</span>
          <button type="button" className="ml-selbar__add" onClick={addSel}>Ajouter au montage</button>
          <button type="button" className="ml-selbar__btn" onClick={() => setSel(vis.map(i => i.id))}>Tout sélectionner</button>
          <button type="button" className="ml-selbar__btn ml-selbar__btn--danger" onClick={() => remove(sel)}>Retirer du projet</button>
          <button type="button" className="ml-selbar__x" onClick={() => setSel([])} aria-label="Désélectionner">×</button>
        </div>
      )}

      <div className="ml-body">
        {items.length === 0 && (
          <div className="ml-empty">
            <div className="ml-empty__icons" aria-hidden="true">
              {(['VIDEO', 'IMAGE', 'AUDIO', 'SUBTITLE'] as MediaType[]).map(t => <span key={t}><Svg d={ICON[t]} /></span>)}
            </div>
            <span className="ml-empty__title">DÉPOSEZ VOS MÉDIAS</span>
            <span className="ml-empty__text">Glissez-déposez vos vidéos, images, fichiers audio et sous-titres ici</span>
            <span className="ml-empty__or">ou</span>
            <button type="button" className="ml-browse ml-browse--lg" onClick={() => input.current?.click()}>Parcourir les fichiers</button>
            <span className="ml-empty__formats">Formats : MP4 · MOV · WEBM · JPG · PNG · MP3 · WAV · SRT · VTT</span>
            <button type="button" className="ml-empty__samples" onClick={loadSamples}>Essayer avec des exemples</button>
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
              {open && (
                t === 'VIDEO' || t === 'IMAGE' ? <div className="ml-grid ml-grid--visual">{list.map(renderVisual)}</div>
                  : t === 'AUDIO' ? <div className="ml-grid ml-grid--audio">{list.map(renderAudio)}</div>
                    : <div className="ml-grid ml-grid--doc">{list.map(renderDoc)}</div>
              )}
            </section>
          );
        })}

        {items.length > 0 && vis.length === 0 && <div className="ml-nomatch">Aucun média ne correspond.</div>}
      </div>

      {drag && (
        <div className="ml-drop">
          <div>
            <span className="ml-drop__title">Déposez vos médias ici</span>
            <span className="ml-drop__types">VIDÉO · IMAGE · AUDIO · SOUS-TITRES</span>
          </div>
        </div>
      )}

      {dup && dup.length > 0 && (
        <div className="ml-modal" role="dialog" aria-modal="true" aria-labelledby="ml-dup-title">
          <div>
            <span id="ml-dup-title" className="ml-modal__title">Déjà ajouté</span>
            <span className="ml-modal__text">
              {dup.length === 1 ? '« ' + dup[0].name + ' » est déjà dans la médiathèque.'
                : dup.length + ' fichiers sont déjà dans la médiathèque : ' + dup.slice(0, 3).map(d => d.name).join(', ') + (dup.length > 3 ? '…' : '') + '.'}
            </span>
            <div className="ml-modal__actions">
              <button type="button" className="ml-modal__cancel" onClick={() => setDup(null)}>Annuler</button>
              <button type="button" className="ml-modal__ok" autoFocus onClick={() => { const d = dup; setDup(null); ingest(d.map(x => ({ ...x, key: x.key + '#' + x.id }))); }}>Garder les deux</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div role="status" className="ml-toast">{toast}</div>}
    </div>
  );
}

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { photo } from '../../media/catalog';
import { ACCEPT, fmtSize, stash, writeUpload } from '../../lib/plugMedia';

type Phase = 'idle' | 'uploading' | 'done';

/** Whether a finished upload opens the editor by itself (the prototype's "autoRedirect" tweak). */
const AUTO_REDIRECT = true;

/**
 * "Essayez maintenant" drop zone. The upload is simulated (no server yet): files are kept in
 * IndexedDB and handed to the editor's media library, then the editor opens.
 */
export default function UploadCard() {
  const nav = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState({ name: '', size: 0, url: null as string | null });
  const timers = useRef<{ iv?: number; to?: number }>({});

  const clear = () => { clearInterval(timers.current.iv); clearTimeout(timers.current.to); };
  useEffect(() => clear, []);
  useEffect(() => () => { if (file.url) URL.revokeObjectURL(file.url); }, [file.url]);

  const start = (name: string, size: number, url: string | null, count = 1) => {
    clear();
    setPhase('uploading'); setDrag(false); setProgress(0); setFile({ name, size, url });
    writeUpload({ name, size, count });
    let p = 0;
    timers.current.iv = window.setInterval(() => {
      p = Math.min(100, p + 4 + Math.random() * 9);
      setProgress(p);
      if (p >= 100) {
        clearInterval(timers.current.iv);
        setPhase('done');
        if (AUTO_REDIRECT) timers.current.to = window.setTimeout(() => nav('/editeur'), 1800);
      }
    }, 160);
  };

  const pick = (list: FileList | null | undefined) => {
    const fs = Array.from(list || []); if (!fs.length) return;
    const f = fs[0], total = fs.reduce((a, x) => a + x.size, 0);
    stash(fs).catch(() => {});
    start(fs.length > 1 ? fs.length + ' fichiers' : f.name, total, fs.length === 1 && f.type.startsWith('video') ? URL.createObjectURL(f) : null, fs.length);
  };

  const reset = () => { clear(); setPhase('idle'); setProgress(0); setFile({ name: '', size: 0, url: null }); };
  const onDragOver = (e: DragEvent) => { e.preventDefault(); if (!drag) setDrag(true); };
  const onDrop = (e: DragEvent) => { e.preventDefault(); pick(e.dataTransfer.files); };
  const pct = Math.round(progress) + '%';

  return (
    <div id="upload" className="glass-card glass-card--upload">
      <div>
        <div className="glass-card__title">Essayez maintenant</div>
        <div className="glass-card__sub">Déposez un rush, l’éditeur s’ouvre avec votre vidéo.</div>
      </div>

      {phase === 'idle' && (
        <div className={'dz' + (drag ? ' is-drag' : '')} onDragOver={onDragOver} onDragLeave={() => setDrag(false)} onDrop={onDrop} onClick={() => input.current?.click()}>
          <div className="dz__icon">
            <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M13 18 V5 M7 10 L13 4 L19 10 M4 20 V22 H22 V20" fill="none" stroke="#6a36c9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="dz__title">{drag ? 'Relâchez pour importer' : 'Glissez-déposez votre vidéo ici'}</div>
          <div className="dz__hint">MP4, MOV ou MKV · votre vidéo reste privée</div>
          <div className="dz__actions">
            <button type="button" className="dz__btn dz__btn--dark" onClick={e => { e.stopPropagation(); input.current?.click(); }}>Choisir un fichier</button>
            <button type="button" className="dz__btn dz__btn--light" onClick={e => { e.stopPropagation(); start('vlog_tokyo_rush.mp4', 1480000000, null); }}>Utiliser une vidéo exemple</button>
          </div>
        </div>
      )}
      <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={e => { pick(e.target.files); e.target.value = ''; }} aria-label="Importer des fichiers" />

      {phase !== 'idle' && (
        <>
          <div className="up">
            <div className="up__thumb">
              <img src={photo('tokyo', 360)} alt="" />
              {file.url && <video src={file.url} muted />}
            </div>
            <div className="up__body">
              <div className="up__row"><span className="up__name">{file.name}</span><span className="up__size">{fmtSize(file.size)}</span></div>
              <div className="up__prog">
                <div className="up__track" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Import"><div style={{ width: pct }} /></div>
                <span className="up__pct">{pct}</span>
              </div>
              <div className="up__status" aria-live="polite">{phase === 'done' ? 'Prêt. Ouverture de l’éditeur…' : 'Import et analyse de la vidéo…'}</div>
            </div>
          </div>
          {phase === 'done' && (
            <div className="up__actions">
              <Link to="/editeur" className="up__open">Ouvrir dans l’éditeur →</Link>
              <button type="button" className="up__change" onClick={reset}>Changer</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

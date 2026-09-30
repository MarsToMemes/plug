import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { api } from '../../lib/api';

/** Same key as the editor: it opens the last project. */
const PROJECT_KEY = 'plug.project';

/**
 * "Try it now": a real project is created on the Plug server with the
 * script typed here, then the editor opens on it.
 */
export default function ScriptCard() {
  const nav = useNavigate();
  const t = useT(), c = t.scriptCard;
  // Null until the visitor types: the sample follows the language of the site.
  const [typed, setTyped] = useState<string | null>(null);
  const script = typed ?? c.sample;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = async () => {
    setBusy(true); setError('');
    try {
      const title = script.split('\n').find(l => l.trim().startsWith('#'))?.replace(/^#+/, '').trim() || c.newEpisode;
      const p = await api.create({ title, script });
      try { localStorage.setItem(PROJECT_KEY, p.id); } catch { /* storage disabled: the editor opens the newest project */ }
      nav('/editeur');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div id="essai" className="glass-card glass-card--upload">
      <div>
        <div className="glass-card__title">{c.title}</div>
        <div className="glass-card__sub">{c.sub}</div>
      </div>
      <textarea className="sc__area" value={script} onChange={e => setTyped(e.target.value)} rows={7} aria-label={c.label} spellCheck />
      {error && <div className="sc__err" role="alert">{error}</div>}
      <div className="dz__actions sc__actions">
        <button type="button" className="dz__btn dz__btn--dark" disabled={busy || !script.trim()} onClick={() => void open()}>{busy ? c.opening : c.open}</button>
        <button type="button" className="dz__btn dz__btn--light" onClick={() => setTyped('')}>{c.clear}</button>
      </div>
    </div>
  );
}

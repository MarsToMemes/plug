import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

/** Same key as the editor: it opens the last project. */
const PROJECT_KEY = 'plug.project';

const SAMPLE = `# Le vrai business de McDonald's
? Comment gagne-t-il vraiment sa vie ?
McDonald's n'est pas une entreprise de burgers.
Plus de 60 % de ses revenus viennent des franchisés.
Ils possèdent le terrain sous plus de la moitié de leurs restaurants.`;

/**
 * "Essayez maintenant": a real project is created on the Plug server with the
 * script typed here, then the editor opens on it.
 */
export default function ScriptCard() {
  const nav = useNavigate();
  const [script, setScript] = useState(SAMPLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = async () => {
    setBusy(true); setError('');
    try {
      const title = script.split('\n').find(l => l.trim().startsWith('#'))?.replace(/^#+/, '').trim() || 'Nouvel épisode';
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
        <div className="glass-card__title">Essayez maintenant</div>
        <div className="glass-card__sub">Collez votre script : une phrase par ligne, # pour un chapitre.</div>
      </div>
      <textarea className="sc__area" value={script} onChange={e => setScript(e.target.value)} rows={7} aria-label="Votre script" spellCheck />
      {error && <div className="sc__err" role="alert">{error}</div>}
      <div className="dz__actions sc__actions">
        <button type="button" className="dz__btn dz__btn--dark" disabled={busy || !script.trim()} onClick={() => void open()}>{busy ? 'Ouverture…' : 'Monter ce script →'}</button>
        <button type="button" className="dz__btn dz__btn--light" onClick={() => setScript('')}>Effacer</button>
      </div>
    </div>
  );
}

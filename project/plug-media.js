// Plug media helpers: type detection, metadata extraction, hand-off between pages.
(function () {
  const EXT = {
    VIDEO: ['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv'],
    IMAGE: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
    AUDIO: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'],
    SUBTITLE: ['srt', 'vtt'],
    TEXT: ['txt']
  };
  const ACCEPT = Object.values(EXT).flat().map(e => '.' + e).join(',') + ',video/*,image/*,audio/*,text/vtt';
  const MAX_SIZE = 10 * 1024 ** 3;
  const ext = name => (name.split('.').pop() || '').toLowerCase();
  const byExt = e => Object.keys(EXT).find(k => EXT[k].includes(e)) || null;
  const byMime = m => {
    if (!m) return null;
    if (m === 'text/vtt' || m === 'application/x-subrip' || m === 'text/srt') return 'SUBTITLE';
    if (m.startsWith('video/')) return 'VIDEO';
    if (m.startsWith('image/')) return 'IMAGE';
    if (m.startsWith('audio/')) return 'AUDIO';
    if (m === 'text/plain') return 'TEXT';
    return null;
  };
  function detectType(file) {
    const hasExt = /\.[a-z0-9]{1,6}$/i.test(file.name), e = byExt(ext(file.name)), m = byMime(file.type);
    if (hasExt && !e) return 'UNKNOWN';                 // e.g. .psd reported as image/* by the OS
    if (e === 'SUBTITLE') return 'SUBTITLE';            // .srt often arrives as text/plain or empty
    if (m && e && m !== e && !(m === 'TEXT')) return m; // mime wins when both are media and disagree
    return e || m || 'UNKNOWN';
  }
  const key = f => f.name + '|' + f.size + '|' + (f.lastModified || 0);
  let n = 0;
  const uid = () => 'm' + Date.now().toString(36) + (n++).toString(36);
  function normalize(file) {
    return { id: uid(), name: file.name, type: detectType(file), mimeType: file.type || '', size: file.size, duration: null, thumbnail: null, waveform: null, status: 'UPLOADING', uploadProgress: 0, addedAt: Date.now(), key: key(file), file, url: null, width: null, height: null, cues: null, lang: null, error: null };
  }
  const timeout = (p, ms, msg) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error(msg)), ms))]);
  const canvasBlob = (c, type, q) => new Promise(r => c.toBlob(b => r(b ? URL.createObjectURL(b) : null), type || 'image/jpeg', q || 0.78));
  function videoMeta(url) {
    return timeout(new Promise((res, rej) => {
      const v = document.createElement('video');
      v.muted = true; v.preload = 'metadata'; v.playsInline = true; v.src = url;
      v.onerror = () => rej(new Error('Vidéo illisible'));
      v.onloadedmetadata = () => { v.currentTime = Math.min(1, (v.duration || 2) * 0.1); };
      v.onseeked = async () => {
        const out = { duration: v.duration, width: v.videoWidth, height: v.videoHeight, thumbnail: null };
        try {
          const w = 320, h = Math.round(w * (v.videoHeight || 9) / (v.videoWidth || 16));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(v, 0, 0, w, h);
          out.thumbnail = await canvasBlob(c);
        } catch (e) { out.thumbFailed = true; }
        v.removeAttribute('src'); v.load();
        res(out);
      };
    }), 12000, 'Analyse vidéo expirée');
  }
  function imageMeta(url, file) {
    return timeout(new Promise((res, rej) => {
      const i = new Image();
      i.onerror = () => rej(new Error('Image illisible'));
      i.onload = async () => {
        const out = { width: i.naturalWidth, height: i.naturalHeight, thumbnail: url };
        const e = ext(file.name);
        if (file.size > 1.5e6 && e !== 'gif' && e !== 'svg') {
          try {
            const w = 480, h = Math.round(w * i.naturalHeight / i.naturalWidth);
            const c = document.createElement('canvas'); c.width = w; c.height = h;
            c.getContext('2d').drawImage(i, 0, 0, w, h);
            out.thumbnail = (await canvasBlob(c)) || url; out.ownThumb = out.thumbnail !== url;
          } catch (err) {}
        }
        res(out);
      };
      i.src = url;
    }), 12000, 'Analyse image expirée');
  }
  let actx = null;
  async function audioMeta(url, file) {
    const duration = await timeout(new Promise((res, rej) => {
      const a = new Audio(); a.preload = 'metadata';
      a.onloadedmetadata = () => res(a.duration); a.onerror = () => rej(new Error('Audio illisible')); a.src = url;
    }), 10000, 'Analyse audio expirée');
    let waveform = null;
    if (file.size < 60e6) {
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const buf = await actx.decodeAudioData(await file.arrayBuffer());
        const d = buf.getChannelData(0), N = 56, step = Math.floor(d.length / N) || 1, peaks = [];
        for (let i = 0; i < N; i++) { let m = 0; for (let j = i * step, e = Math.min(d.length, j + step); j < e; j += 16) { const v = Math.abs(d[j]); if (v > m) m = v; } peaks.push(m); }
        const mx = Math.max(...peaks) || 1; waveform = peaks.map(p => p / mx);
      } catch (e) { waveform = null; }
    }
    return { duration, waveform };
  }
  const LANG = { fr: /\b(le|la|les|des|est|et|une|pas|vous|je)\b/g, en: /\b(the|and|you|is|to|of|it|that|what)\b/g, es: /\b(el|los|que|es|una|por|para|pero)\b/g, de: /\b(der|die|und|das|ist|nicht|ich|sie)\b/g };
  const LNAME = { fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch' };
  async function subtitleMeta(file) {
    const text = await file.slice(0, 3e6).text();
    const cues = (text.match(/-->/g) || []).length;
    let lang = null;
    const m = file.name.toLowerCase().match(/[._-](fr|en|es|de)[._-]/);
    if (m) lang = m[1];
    else {
      const sample = text.slice(0, 20000).toLowerCase(); let best = 0;
      for (const k in LANG) { const c = (sample.match(LANG[k]) || []).length; if (c > best && c > 5) { best = c; lang = k; } }
    }
    if (!cues && ext(file.name) !== 'txt') throw new Error('Aucun sous-titre détecté');
    return { cues, lang: lang ? LNAME[lang] : null };
  }
  async function textMeta(file) {
    const t = await file.slice(0, 2e6).text();
    return { cues: t.split(/\s+/).filter(Boolean).length };
  }
  async function process(item) {
    const f = item.file || { name: item.name, size: item.size };
    if (item.type === 'VIDEO') return videoMeta(item.url);
    if (item.type === 'IMAGE') return imageMeta(item.url, f);
    if (item.type === 'AUDIO') return audioMeta(item.url, f);
    if (item.type === 'SUBTITLE') return subtitleMeta(f);
    if (item.type === 'TEXT') return textMeta(f);
    return {};
  }
  const fmtSize = b => b >= 1e9 ? (b / 1e9).toFixed(1) + ' Go' : b >= 1e6 ? (b / 1e6).toFixed(1) + ' Mo' : Math.max(1, Math.round(b / 1e3)) + ' Ko';
  const fmtDur = s => {
    if (s == null || !isFinite(s)) return '--:--';
    s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60, p = x => String(x).padStart(2, '0');
    return h ? h + ':' + p(m) + ':' + p(ss) : p(m) + ':' + p(ss);
  };
  // Hand-off of dropped files from the homepage to the editor (IndexedDB keeps File objects).
  const db = () => new Promise((res, rej) => { const r = indexedDB.open('plug', 1); r.onupgradeneeded = () => r.result.createObjectStore('pending'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  async function stash(files) {
    const d = await db();
    await new Promise((res, rej) => { const tx = d.transaction('pending', 'readwrite'); tx.objectStore('pending').put(Array.from(files), 'files'); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  }
  async function take() {
    try {
      const d = await db();
      return await new Promise(res => {
        const tx = d.transaction('pending', 'readwrite'), st = tx.objectStore('pending'), g = st.get('files');
        g.onsuccess = () => { st.delete('files'); res(g.result || []); }; g.onerror = () => res([]);
      });
    } catch (e) { return []; }
  }
  window.PlugMedia = { EXT, ACCEPT, MAX_SIZE, detectType, normalize, process, fmtSize, fmtDur, stash, take, key };
})();

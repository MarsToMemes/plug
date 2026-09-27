// "L'éditeur Plug" showcase: a 13.6 s loop of a full edit (import → analysis → AI edit →
// title → before/after → export), with a subtle 3D tilt on hover. Elements are tagged data-a="…".

const LOOP = 13.6;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const E = {
  o3: (x: number) => 1 - Math.pow(1 - x, 3),
  io: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  expo: (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x))
};
/** Clip slots on V1 [left %, width %]. */
const CL: [number, number][] = [[0, 16], [16, 20], [36, 14], [50, 18], [68, 12], [80, 20]];
const SUB = ['ANALYZING', 'SELECTING BEST SHOTS', 'BUILDING RHYTHM', 'ADDING MOTION', 'COLOR GRADING', 'SOUND DESIGN'];

const GRAIN_SVG = "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";

type El = HTMLElement;

export function startEditorDemo(root: HTMLElement): () => void {
  const all = (k: string) => Array.from(root.querySelectorAll<El>(`[data-a="${k}"]`));
  const one = (k: string) => root.querySelector<El>(`[data-a="${k}"]`)!;
  const A = {
    clip: all('clip'), cbar: all('cbar'), cut: all('cut'), tb: all('tb'), fx: all('fx'), bin: all('bin'), shot: all('shot'), word: all('word'), box: all('box'),
    scan: one('scan'), wave: one('wave'), music: one('music'), ph: one('ph'), phh: one('phh'), desat: one('desat'), tint: one('tint'), vig: one('vig'),
    grain: one('grain'), lbt: one('lbt'), lbb: one('lbb'), kicker: one('kicker'), t1: one('t1'), t2: one('t2'), rule: one('rule'), cap: one('cap'),
    raw: one('raw'), veil: one('veil'), div: one('div'), lraw: one('lraw'), lai: one('lai'), exp: one('exp'), expt: one('expt'), expb: one('expb'),
    status: one('status'), sdot: one('sdot'), tc: one('tc'), stage: one('stage')
  };
  A.grain.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;
  A.grain.style.backgroundSize = '160px';

  // Under 520px the media strip, FX and A2 tracks are hidden (simplified mobile timeline).
  const full = Array.from(root.querySelectorAll<El>('[data-full]'));
  let compact: boolean | undefined;
  const ro = new ResizeObserver(([e]) => {
    const c = e.contentRect.width < 520; if (c === compact) return; compact = c;
    requestAnimationFrame(() => full.forEach(el => { el.style.display = c ? 'none' : ''; }));
  });
  ro.observe(root);

  let gf = 0;
  const txt = (el: El, v: string) => { if (el.textContent !== v) el.textContent = v; };

  function tick(t: number) {
    const sg = (a: number, b: number, e?: (x: number) => number) => { const x = clamp((t - a) / (b - a)); return e ? e(x) : x; };
    const ES = 3.6, EE = 7.8, at = (pos: number) => ES + pos / 100 * 4.2, p = sg(ES, EE);
    const outro = sg(13.0, 13.4, E.o3);
    // timeline
    A.clip.forEach((el, i) => {
      const en = sg(1.4 + i * 0.18, 2.0 + i * 0.18, E.o3), out = sg(13.0 + i * 0.03, 13.4 + i * 0.03, E.o3), o = en * (1 - out);
      el.style.opacity = String(o);
      el.style.transform = `translateX(${((1 - en) * 28).toFixed(1)}px) scale(${(0.9 + 0.1 * en).toFixed(3)})`;
      const b = (1 - en) * 6 + out * 4; el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
      const [l, w] = CL[i], act = t >= ES && t < EE && p * 100 >= l && p * 100 < l + w;
      el.style.outline = act ? '2px solid #fff' : 'none';
    });
    A.cbar.forEach((el, i) => { el.style.transform = `scaleX(${sg(1.7 + i * 0.18, 2.7 + i * 0.18).toFixed(3)})`; el.style.opacity = String(1 - sg(3.4, 3.7)); });
    const sc = sg(2.8, 3.6);
    A.scan.style.opacity = String(sc > 0 && sc < 1 ? Math.sin(sc * Math.PI) : 0);
    A.scan.style.transform = `translateX(${-100 + sc * 655}%)`;
    [16, 36, 50, 68, 80].forEach((b, k) => { const a = sg(at(b), at(b) + 0.25, E.o3) * (1 - outro); A.cut[k].style.opacity = String(a); A.cut[k].style.transform = `scaleY(${a.toFixed(3)})`; });
    [4, 40].forEach((pos, j) => { const a = sg(at(pos), at(pos) + 0.45, E.expo) * (1 - outro); A.tb[j].style.transform = `scaleX(${a.toFixed(3)})`; });
    [34, 50, 65, 81].forEach((pos, j) => { const a = sg(at(pos), at(pos) + 0.3, E.o3) * (1 - outro); A.fx[j].style.opacity = String(a); A.fx[j].style.transform = `scale(${(0.8 + 0.2 * a).toFixed(3)})`; });
    const rv = t < ES ? 0 : t < EE ? p : 1;
    A.wave.style.clipPath = `inset(0 ${((1 - rv) * 100).toFixed(2)}% 0 0)`; A.wave.style.opacity = String(1 - outro);
    A.music.style.transform = `scaleX(${(sg(7.1, 7.7, E.expo) * (1 - outro)).toFixed(3)})`;
    A.bin.forEach((el, i) => { el.style.opacity = String(1 - 0.65 * sg(1.4 + i * 0.18, 1.7 + i * 0.18) * (1 - outro)); });
    A.ph.style.opacity = String(sg(3.3, 3.6) * (1 - sg(12.9, 13.2)));
    A.ph.style.transform = `translateX(${(t < ES ? 0 : t < EE ? p * 100 : 100).toFixed(2)}%)`;
    // preview
    A.shot.forEach((el, i) => {
      const [l, w] = CL[i], ts = at(l), te = at(l + w), fi = l === 36 ? 0.25 : 0.06;
      let o = 0, s = 1.06, tx = 0, ty = 0;
      if (t >= ts - fi && t < te + 0.06) {
        const fin = i === 0 ? 1 : sg(ts - fi, ts + fi), fout = sg(te - 0.06, te + 0.06), u = sg(ts, te);
        o = fin * (1 - fout); s = 1.04 + 0.06 * u; tx = (i % 2 ? -1 : 1) * 1.5 * u;
        if (i === 3) s = 1.04 + 0.16 * E.o3(sg(ts, ts + 0.3)) + 0.03 * u;
        if (i === 5) s = 1.02 + 0.14 * E.expo(u);
      }
      if (i === 1 && t >= EE - 0.12) {
        const h = sg(EE, 9.8, E.expo); o = Math.max(o, sg(EE - 0.12, EE + 0.08));
        s = 1.3 - 0.22 * h - 0.03 * sg(9.8, 13.6); ty = (1 - h) * -2.5; tx = 0.6 * Math.sin(t * 0.7);
      }
      el.style.opacity = String(o);
      if (o > 0) el.style.transform = `translate(${tx.toFixed(3)}%,${ty.toFixed(3)}%) scale(${s.toFixed(4)})`;
    });
    const grade = sg(6.4, 7.0, E.io);
    A.desat.style.opacity = String(t < ES ? 0 : 0.75 * (1 - grade));
    A.tint.style.opacity = String(grade * (1 - sg(13.0, 13.5)));
    A.vig.style.opacity = String(grade * (1 - sg(13.0, 13.5)));
    const go = 0.14 * sg(EE, EE + 0.3) * (1 - outro); A.grain.style.opacity = String(go);
    if (go > 0 && ++gf % 2 === 0) A.grain.style.transform = `translate(${(Math.random() * 8 - 4).toFixed(1)}%,${(Math.random() * 8 - 4).toFixed(1)}%)`;
    const lb = sg(EE, EE + 0.6, E.io) * (1 - sg(13.0, 13.45, E.io)); A.lbt.style.transform = A.lbb.style.transform = `scaleY(${lb.toFixed(3)})`;
    const f = 1 - sg(12.95, 13.25);
    const k = sg(8.2, 8.7, E.o3); A.kicker.style.opacity = String(k * f); A.kicker.style.transform = `translateY(${((1 - k) * 6).toFixed(2)}px)`;
    A.t1.style.transform = `translateY(${((1 - sg(8.3, 9.0, E.expo)) * 110).toFixed(2)}%)`; A.t1.style.opacity = String(f);
    A.t2.style.transform = `translateY(${((1 - sg(8.45, 9.15, E.expo)) * 110).toFixed(2)}%)`; A.t2.style.opacity = String(f);
    A.rule.style.transform = `scaleX(${(sg(8.35, 9.3, E.expo) * f).toFixed(3)})`;
    A.cap.style.opacity = String(sg(5.2, 5.3) * (1 - sg(7.6, 7.8)));
    A.word.forEach((el, j) => {
      const wt = 5.3 + j * 0.28, a = sg(wt, wt + 0.2, E.o3), last = j === A.word.length - 1;
      el.style.opacity = String(a); el.style.transform = `translateY(${((1 - a) * 6).toFixed(2)}px)`;
      el.style.color = t >= wt && t < wt + (last ? 2 : 0.28) ? '#FFD35C' : '#fff';
    });
    const split = t >= 9.8 && t < 11.95;
    const x = !split ? 0 : t < 10.6 ? 88 * E.io(sg(9.8, 10.6)) : t < 11.3 ? 88 - 42 * E.io(sg(10.6, 11.3)) : t < 11.5 ? 46 : 46 * (1 - E.io(sg(11.5, 11.95)));
    A.raw.style.opacity = String(t < ES + 0.15 ? 1 - sg(ES, ES + 0.15) : split ? 1 : t >= 13.0 ? sg(13.0, 13.55, E.io) : 0);
    A.raw.style.clipPath = split ? `inset(0 ${(100 - x).toFixed(2)}% 0 0)` : 'none';
    A.veil.style.opacity = String(0.35 * (1 - sg(1.4, 2.8)) + 0.35 * sg(13.1, 13.6));
    const bx = sg(2.8, 3.05, E.o3) * (1 - sg(3.45, 3.7));
    A.box.forEach(el => { el.style.opacity = String(bx); el.style.transform = `scale(${(1.08 - 0.08 * bx).toFixed(3)})`; });
    const dvo = split ? sg(9.8, 9.9) * (1 - sg(11.85, 11.95)) : 0;
    A.div.style.opacity = String(dvo); A.div.style.transform = `translateX(${x.toFixed(2)}%)`;
    A.lraw.style.opacity = String(clamp((x - 14) / 10) * dvo); A.lai.style.opacity = String(clamp((96 - x) / 10) * dvo);
    const eb = sg(12.0, 12.75, E.io); A.exp.style.opacity = String(sg(11.95, 12.15) * (1 - sg(13.2, 13.5)));
    A.expb.style.transform = `scaleX(${eb.toFixed(3)})`;
    txt(A.expt, eb < 1 ? 'EXPORTING ' + Math.round(eb * 100) + '%' : 'EDIT COMPLETE ✓');
    // status
    const st = t < 1.4 ? 'READY' : t < 2.8 ? 'IMPORTING ASSETS' : t < ES ? 'ANALYZING FOOTAGE' : t < EE ? 'AI EDITING · ' + SUB[Math.min(5, Math.floor((t - ES) / 0.7))]
      : t < 9.8 ? 'AI EDIT' : t < 11.95 ? 'BEFORE / AFTER' : t < 12.75 ? 'EXPORTING' : t < 13.35 ? 'EDIT COMPLETE' : 'READY';
    txt(A.status, st);
    const done = st === 'EDIT COMPLETE', busy = t >= 1.4 && t < 12.75;
    A.sdot.style.background = done ? '#5ee0a0' : '#a06bff';
    A.sdot.style.opacity = busy ? (0.55 + 0.45 * Math.sin(t * 7)).toFixed(3) : '1';
    const secs = Math.round(t < ES ? 0 : t < EE ? p * 552 : 552);
    txt(A.tc, '00:' + String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0'));
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    tick(12.95);
    return () => ro.disconnect();
  }

  tick(0);
  const hv = { x: 0, y: 0, tx: 0, ty: 0, on: false };
  const onPM = (e: PointerEvent) => { const r = root.getBoundingClientRect(); hv.tx = ((e.clientX - r.left) / r.width) * 2 - 1; hv.ty = ((e.clientY - r.top) / r.height) * 2 - 1; };
  const onPL = () => { hv.tx = 0; hv.ty = 0; };
  root.addEventListener('pointermove', onPM);
  root.addEventListener('pointerleave', onPL);

  const hover = () => {
    hv.x += (hv.tx - hv.x) * 0.07; hv.y += (hv.ty - hv.y) * 0.07;
    if (Math.abs(hv.x) < 0.001 && Math.abs(hv.y) < 0.001 && !hv.tx && !hv.ty) {
      if (hv.on) { root.style.transform = ''; A.stage.style.transform = 'scale(1.03)'; hv.on = false; }
      return;
    }
    hv.on = true;
    root.style.transform = `perspective(1600px) rotateX(${(-hv.y * 2.2).toFixed(3)}deg) rotateY(${(hv.x * 3).toFixed(3)}deg)`;
    A.stage.style.transform = `translate(${(-hv.x * 6).toFixed(2)}px,${(-hv.y * 4).toFixed(2)}px) scale(1.03)`;
    A.phh.style.transform = `scale(${(1 + Math.hypot(hv.x, hv.y) * 0.25).toFixed(3)})`;
  };

  let el = 0, last = 0, raf = 0;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    el = (el + dt) % LOOP; tick(el); hover();
    raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
    else { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: 0.2 });
  io.observe(root);

  return () => {
    cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
    root.removeEventListener('pointermove', onPM); root.removeEventListener('pointerleave', onPL);
  };
}

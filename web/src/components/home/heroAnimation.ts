// Hero editing demo: floating rush cards fly into a mini timeline, the AI playhead edits,
// then a raw → edited sweep and "EDIT COMPLETE". 12.8 s loop, driven by one rAF clock.
// Everything is transform/opacity/clip-path writes on elements tagged with data-h="…".

import { HERO_CL, HERO_SLOT } from './demoClips';

const LOOP = 12.8;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const E = {
  o3: (x: number) => 1 - Math.pow(1 - x, 3),
  io: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  expo: (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x))
};
type Ease = (x: number) => number;

interface Frame {
  t: number;
  clock: number;
  sg: (a: number, b: number, e?: Ease) => number;
  ES: number;
  EE: number;
  at: (pos: number) => number;
  p: number;
}

type El = HTMLElement;

export interface HeroDemoOptions {
  /** Playback speed multiplier (the prototype's "heroSpeed" tweak). */
  speed?: number;
}

export function startHeroDemo(root: HTMLElement, { speed = 1 }: HeroDemoOptions = {}): () => void {
  const all = (k: string) => Array.from(root.querySelectorAll<El>(`[data-h="${k}"]`));
  const one = (k: string) => root.querySelector<El>(`[data-h="${k}"]`)!;
  const H = {
    card: all('card'), cin: all('cin'), cscan: all('cscan'), cbadge: all('cbadge'), shot: all('shot'), clip: all('clip'),
    cut: all('cut'), cb: all('cb'), fx: all('fx'), w: all('w'),
    st: one('st'), ok: one('ok'), pct: one('pct'), prog: one('prog'), tint: one('tint'), vig: one('vig'), lbt: one('lbt'), lbb: one('lbb'),
    lt1: one('lt1'), lt2: one('lt2'), ltr: one('ltr'), cap: one('cap'), raw: one('raw'), veil: one('veil'), box: one('box'), dv: one('dv'),
    lraw: one('lraw'), wave: one('wave'), ph: one('ph'), panel: one('panel'), fxl: one('fxl'), fxt: one('fxt')
  };
  const hp = { x: 0, y: 0, tx: 0, ty: 0 };
  const hCur = H.card.map(() => ({ x: 0, y: 0 }));
  const hD: { dx: number; dy: number }[] = [];
  let compact: boolean | undefined;
  const actState = new WeakMap<El, boolean>();

  // Offsets from each card to its timeline slot, measured without the current animation offset.
  const measure = () => {
    H.card.forEach((el, i) => {
      const j = HERO_SLOT[i]; if (j < 0) return;
      const r = el.getBoundingClientRect(), c = H.clip[j].getBoundingClientRect(), cur = hCur[i];
      hD[i] = { dx: (c.left + c.width / 2) - (r.left + r.width / 2 - cur.x), dy: (c.top + c.height / 2) - (r.top + r.height / 2 - cur.y) };
    });
  };

  const ro = new ResizeObserver(() => {
    const c = root.clientWidth < 460;
    requestAnimationFrame(() => {
      if (c !== compact) {
        compact = c;
        H.card.forEach(el => { if (el.dataset.m === '0') el.style.display = c ? 'none' : ''; });
        H.fxl.style.display = H.fxt.style.display = c ? 'none' : '';
        H.card.forEach((el, i) => { if (i === 1 || i === 3) el.style.zIndex = c ? '1' : '3'; });
      }
      measure();
    });
  });
  ro.observe(root);

  function cards({ t, clock, sg }: Frame) {
    const TAU = Math.PI * 2, depth = [0.3, 1, 0.4, 0.9, 0.35];
    H.card.forEach((el, i) => {
      const j = HERO_SLOT[i], ph = i * 1.7, r = sg(11.9 + i * 0.08, 12.5 + i * 0.08, E.o3);
      const fy = 8 * Math.sin(clock * TAU / 6.5 + ph), fx = 4 * Math.sin(clock * TAU / 7.3 + ph * 1.3), fr = Math.sin(clock * TAU / 8 + ph);
      let f = 0, o = 1, s = 1;
      if (j >= 0) {
        const st = 3.6 + j * 0.25;
        if (t < 11.8) { f = sg(st, st + 0.7, E.io); o = 1 - sg(st + 0.5, st + 0.72); s = 1 - 0.55 * f; }
        else { o = r; s = 0.92 + 0.08 * r; }
      } else o = t < 11.8 ? 1 - 0.55 * sg(3.2, 3.6) : 0.45 + 0.55 * r;
      const d = hD[i] || { dx: 0, dy: 0 };
      const x = fx - hp.x * (2 + 8 * depth[i]) + d.dx * f, y = fy - hp.y * (2 + 6 * depth[i]) + d.dy * f;
      hCur[i] = { x, y };
      el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${(fr + hp.x * depth[i]).toFixed(3)}deg) scale(${s.toFixed(3)})`;
      el.style.opacity = o.toFixed(3);
      const a = sg(1.6 + i * 0.2, 2.2 + i * 0.2);
      H.cscan[i].style.opacity = a > 0 && a < 1 ? Math.sin(a * Math.PI).toFixed(3) : '0';
      H.cscan[i].style.transform = `translateX(${(-100 + a * 433).toFixed(1)}%)`;
      H.cbadge[i].style.opacity = (sg(1.9 + i * 0.2, 2.1 + i * 0.2) * (1 - sg(11.8, 12.0))).toFixed(3);
      H.cin[i].style.borderColor = j >= 0 && t >= 3.0 + j * 0.15 && t < 11.8 ? '#ff9ec8' : 'rgba(255,255,255,.4)';
    });
    H.panel.style.transform = `translate(${(-hp.x * 3).toFixed(2)}px,${(-hp.y * 2).toFixed(2)}px)`;
  }

  function timeline({ t, clock, sg, ES, EE, at, p }: Frame) {
    const out = 1 - sg(11.8, 12.2);
    HERO_CL.forEach(([l, w], j) => {
      const el = H.clip[j], st = 3.6 + j * 0.25, a = sg(st + 0.55, st + 0.8, E.o3) * out;
      el.style.opacity = a.toFixed(3);
      el.style.transform = `translateY(${((1 - a) * -10).toFixed(2)}px) scale(${(0.9 + 0.1 * a).toFixed(3)})`;
      const act = t >= ES && t < EE && p * 100 >= l && p * 100 < l + w;
      if (actState.get(el) !== act) { actState.set(el, act); el.style.outline = act ? '1.5px solid #fff' : 'none'; el.style.filter = act ? 'brightness(1.2)' : ''; }
    });
    [24, 42, 64].forEach((b, i) => { H.cut[i].style.transform = `scaleY(${(sg(at(b), at(b) + 0.2, E.o3) * out).toFixed(3)})`; });
    [6, 36, 60].forEach((b, i) => { H.cb[i].style.transform = `scaleX(${(sg(at(b), at(b) + 0.35, E.expo) * out).toFixed(3)})`; });
    [at(23), at(43), 8.67].forEach((tt, i) => {
      const a = sg(tt, tt + 0.3, E.o3) * out;
      H.fx[i].style.opacity = a.toFixed(3); H.fx[i].style.transform = `scale(${(0.8 + 0.2 * a).toFixed(3)})`;
    });
    const rv = t < ES ? 0 : t < EE ? p : 1;
    H.wave.style.clipPath = `inset(0 ${((1 - rv) * 100).toFixed(2)}% 0 0)`;
    H.wave.style.opacity = out.toFixed(3);
    H.wave.style.transform = t >= EE && t < 11.8 ? `scaleY(${(1 + 0.12 * Math.sin(clock * 9)).toFixed(3)})` : 'none';
    H.ph.style.opacity = (sg(4.8, 5.0) * (1 - sg(11.6, 11.9))).toFixed(3);
    H.ph.style.transform = `translateX(${(rv * 100).toFixed(2)}%)`;
  }

  function preview({ t, sg, ES, EE, at }: Frame) {
    HERO_CL.forEach(([l, w], j) => {
      const el = H.shot[j], ts = at(l), te = at(l + w), fi = l === 24 ? 0.22 : 0.05;
      let o = 0, s = 1.05, tx = 0, ty = 0;
      if (t >= ts - fi && t < te + 0.05) {
        const fin = j === 0 ? sg(ES - 0.12, ES + 0.05) : sg(ts - fi, ts + fi), u = sg(ts, te);
        o = fin * (1 - sg(te - 0.05, te + 0.05)); s = 1.04 + 0.05 * u; tx = (j % 2 ? -1 : 1) * 1.2 * u;
        if (j === 2) s = 1.04 + 0.14 * E.o3(sg(ts, ts + 0.3)) + 0.03 * u;
      }
      if (j === 0 && t >= EE - 0.05) { const h = sg(EE, 10.0, E.expo); o = 1; s = 1.22 - 0.16 * h - 0.02 * sg(10, 12.8); tx = 0.5 * Math.sin(t * 0.7); ty = (1 - h) * -2; }
      el.style.opacity = String(o);
      if (o > 0) el.style.transform = `translate(${tx.toFixed(3)}%,${ty.toFixed(3)}%) scale(${s.toFixed(4)})`;
    });
    const sweep = t >= EE && t < 9.45, x = t < 8.15 ? 0 : 100 * E.io(sg(8.15, 9.3));
    H.raw.style.opacity = String(t < EE ? 1 - sg(ES - 0.12, ES + 0.05) : sweep ? 1 : t >= 12.2 ? sg(12.2, 12.8, E.io) : 0);
    H.raw.style.clipPath = sweep ? `inset(0 0 0 ${x.toFixed(2)}%)` : 'none';
    const dvo = sweep ? sg(8.05, 8.15) * (1 - sg(9.3, 9.45)) : 0;
    H.dv.style.opacity = String(dvo); H.dv.style.transform = `translateX(${x.toFixed(2)}%)`;
    H.lraw.style.opacity = (clamp((86 - x) / 10) * dvo).toFixed(3);
    const g = (t >= EE ? 1 : 0) * (1 - sg(11.9, 12.3));
    H.tint.style.opacity = String(g); H.vig.style.opacity = String(g);
    H.lbt.style.transform = H.lbb.style.transform = `scaleY(${(sg(8.6, 9.2, E.io) * (1 - sg(11.9, 12.3, E.io))).toFixed(3)})`;
    const f = 1 - sg(11.8, 12.1);
    H.lt1.style.transform = `translateY(${((1 - sg(8.7, 9.3, E.expo)) * 110).toFixed(2)}%)`; H.lt1.style.opacity = String(f);
    H.lt2.style.transform = `translateY(${((1 - sg(8.82, 9.42, E.expo)) * 110).toFixed(2)}%)`; H.lt2.style.opacity = String(f);
    H.ltr.style.transform = `scaleX(${(sg(8.75, 9.6, E.expo) * f).toFixed(3)})`;
    H.cap.style.opacity = (sg(6.1, 6.2) * f).toFixed(3);
    H.w.forEach((el, j) => {
      const wt = 6.2 + j * 0.25, a = sg(wt, wt + 0.18, E.o3);
      el.style.opacity = a.toFixed(3); el.style.transform = `translateY(${((1 - a) * 5).toFixed(2)}px)`;
      el.style.color = t >= wt && t < wt + 0.25 && t < EE ? '#FFD35C' : '#fff';
    });
    H.veil.style.opacity = (0.25 * (1 - sg(1.5, 2.5)) + 0.25 * sg(12.3, 12.8)).toFixed(3);
    const bx = sg(1.9, 2.1, E.o3) * (1 - sg(2.8, 3.0));
    H.box.style.opacity = String(bx); H.box.style.transform = `scale(${(1.08 - 0.08 * bx).toFixed(3)})`;
  }

  function status({ t, sg }: Frame) {
    const st = t < 1.5 ? 'DROP YOUR RUSHES' : t < 3 ? 'AI ANALYZING' : t < 5 ? 'SELECTING BEST SHOTS' : t < 8 ? 'AI EDITING'
      : t < 8.67 ? 'ADDING MOTION' : t < 9.33 ? 'COLOR GRADING' : t < 10 ? 'SOUND DESIGN' : t < 11.8 ? 'EDIT COMPLETE' : 'READY';
    if (H.st.textContent !== st) H.st.textContent = st;
    const pr = sg(1.5, 10.0), pct = t < 1.5 || t >= 12.3 ? '—' : Math.round(pr * 100) + '%';
    if (H.pct.textContent !== pct) H.pct.textContent = pct;
    H.prog.style.transform = `scaleX(${(pr * (1 - sg(11.8, 12.3))).toFixed(3)})`;
    const a = sg(10, 10.3, E.o3) * (1 - sg(11.8, 12.1));
    H.ok.style.opacity = String(a); H.ok.style.transform = `scale(${(0.6 + 0.4 * a).toFixed(3)})`;
  }

  function frame(t: number, clock: number) {
    const sg = (a: number, b: number, e?: Ease) => { const x = clamp((t - a) / (b - a)); return e ? e(x) : x; };
    const ES = 5.0, EE = 8.0;
    const k: Frame = { t, clock, sg, ES, EE, at: pos => ES + pos / 100 * 3.0, p: sg(ES, EE) };
    cards(k); timeline(k); preview(k); status(k);
  }

  // Reduced motion: show the finished edit, no loop.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    frame(10.6, 0);
    return () => ro.disconnect();
  }

  let hT = 0, hClock = 0, last = 0, raf = 0;
  frame(0, 0);
  const onPM = (e: PointerEvent) => {
    if (compact || e.pointerType === 'touch') return;
    hp.tx = e.clientX / innerWidth * 2 - 1; hp.ty = e.clientY / innerHeight * 2 - 1;
  };
  window.addEventListener('pointermove', onPM);
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - (last || now)) / 1000) * speed; last = now;
    hT = (hT + dt) % LOOP; hClock += dt;
    hp.x += (hp.tx - hp.x) * 0.05; hp.y += (hp.ty - hp.y) * 0.05;
    frame(hT, hClock);
    raf = requestAnimationFrame(loop);
  };
  // Only animate while visible.
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
    else { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: 0.15 });
  io.observe(root);

  return () => {
    cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
    window.removeEventListener('pointermove', onPM);
  };
}

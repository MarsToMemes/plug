import { useEffect, useRef } from 'react';
import { photo, type PhotoKey } from '../../media/catalog';

const STACK: PhotoKey[] = ['concert', 'cinema', 'studio'];
const EASE = 'cubic-bezier(.22,1,.36,1)';

/**
 * Thumbnail stack of the "Packs Motion & Style" card: cards fly in when scrolled into view,
 * the "40+" counter counts up with a shine, and the stack fans out on hover.
 */
export default function PacksStack() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[], n = cards.length;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    cards.forEach((c, i) => {
      c.style.zIndex = String(i + 1);
      c.style.transition = `transform .6s cubic-bezier(.34,1.56,.64,1), box-shadow .5s ${EASE}`;
    });
    const num = el.querySelector<HTMLElement>('[data-count]'), shine = el.querySelector<HTMLElement>('[data-shine]');
    const anims: Animation[] = [];
    let rafId = 0;
    const play = () => {
      if (reduce) return;
      cards.forEach((c, i) => anims.push(c.animate([
        { opacity: 0, transform: 'translateX(90px) translateY(18px) rotate(10deg) scale(.82)', filter: 'blur(10px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0)' }
      ], { duration: 1100, delay: i * 120, easing: EASE, fill: 'backwards' })));
      cards.forEach((c, i) => anims.push(c.animate([{ translate: '0 0' }, { translate: '0 -7px' }, { translate: '0 0' }],
        { duration: 3600, delay: 1400 + i * 280, iterations: Infinity, easing: 'ease-in-out' })));
      if (num) {
        const t0 = performance.now() + 450, dur = 1500;
        const tick = (t: number) => {
          const p = Math.min(1, Math.max(0, (t - t0) / dur)), v = Math.round(40 * (1 - Math.pow(1 - p, 4)));
          num.textContent = v + (p >= 1 ? '+' : '');
          if (p < 1) rafId = requestAnimationFrame(tick);
        };
        num.textContent = '0'; rafId = requestAnimationFrame(tick);
        anims.push(num.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 500, delay: 1950, easing: EASE }));
      }
      if (shine) anims.push(shine.animate([{ transform: 'translateX(-160%)' }, { transform: 'translateX(260%)' }, { transform: 'translateX(260%)' }],
        { duration: 4200, delay: 2000, iterations: Infinity, easing: EASE }));
    };
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);

    const mid = (n - 1) / 2;
    const fan = (on: boolean, hot = -1) => cards.forEach((c, i) => {
      if (!on) { c.style.transform = ''; c.style.boxShadow = ''; return; }
      const k = Math.min(1, el.clientWidth / 420), tx = -(n - 1 - i) * 30 * k, rot = (i - mid) * 5, ty = Math.abs(i - mid) * 5 - (i === hot ? 14 : 0), s = i === hot ? 1.08 : 1;
      c.style.transform = `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg) scale(${s})`;
      c.style.boxShadow = i === hot ? '0 26px 44px -16px rgba(40,10,70,.85)' : '';
    });
    const leave = () => fan(false), enter = () => fan(true);
    const enters = cards.map((c, i) => { const f = () => fan(true, i); c.addEventListener('mouseenter', f); return f; });
    el.addEventListener('mouseleave', leave);
    el.addEventListener('mouseenter', enter);
    return () => {
      io.disconnect(); cancelAnimationFrame(rafId); anims.forEach(a => a.cancel());
      el.removeEventListener('mouseleave', leave); el.removeEventListener('mouseenter', enter);
      cards.forEach((c, i) => c.removeEventListener('mouseenter', enters[i]));
    };
  }, []);

  return (
    <div ref={ref} className="stack" aria-hidden="true">
      {STACK.map(k => <img key={k} className="stack__card" src={photo(k, 360)} alt="" />)}
      <div className="stack__card stack__count">
        <span data-count="40">40+</span>
        <div data-shine="1" className="stack__shine" />
      </div>
    </div>
  );
}

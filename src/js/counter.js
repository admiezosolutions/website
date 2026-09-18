/* Counter — Animated number counters on scroll */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initCounters() {
  document.querySelectorAll('.stat__number[data-target]').forEach((el) => {
    const target = Number.parseFloat(el.dataset.target);
    if (!Number.isFinite(target)) return;

    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const decimals = el.dataset.decimals ? Number.parseInt(el.dataset.decimals, 10) : 0;
    const precision = Number.isFinite(decimals) ? decimals : 0;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => {
            const value = Number(obj.val);
            el.textContent = prefix + value.toFixed(precision).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
          },
        });
      },
    });
  });
}

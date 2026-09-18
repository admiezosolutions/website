/* Lenis Smooth Scroll — Momentum scrolling with GSAP sync */
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initLenis() {
  const lenis = new Lenis({
    lerp: 0.16,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    syncTouch: true,
    syncTouchLerp: 0.08,
    touchMultiplier: 1.25,
    wheelMultiplier: 1,
    stopInertiaOnNavigate: true,
    respectReducedMotion: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  // Sync with GSAP ticker
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const getHeaderOffset = () => {
    const header = document.querySelector('.header');
    return header ? -header.offsetHeight - 16 : -80;
  };

  const getAnchorTarget = (href) => {
    if (!href || href === '#') return null;

    try {
      return document.querySelector(href);
    } catch {
      return document.getElementById(decodeURIComponent(href.slice(1)));
    }
  };

  // Scroll-to for in-page anchor links. Placeholder links stay inert.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const target = getAnchorTarget(href);
      if (href === '#') {
        e.preventDefault();
        return;
      }

      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, {
          offset: getHeaderOffset(),
          duration: 0.55,
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
      }
    });
  });

  return lenis;
}

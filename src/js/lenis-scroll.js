/* Lenis Smooth Scroll - independent from optional GSAP enhancements. */
import Lenis from 'lenis';

export function initLenis({ profile, onScroll } = {}) {
  const balanced = profile?.is('balanced');
  const lenis = new Lenis({
    lerp: balanced ? 0.22 : 0.16,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    syncTouch: !balanced,
    syncTouchLerp: balanced ? 0.12 : 0.08,
    touchMultiplier: balanced ? 1 : 1.25,
    wheelMultiplier: 1,
    stopInertiaOnNavigate: true,
    respectReducedMotion: true,
  });

  const removeScrollListener = onScroll ? lenis.on('scroll', onScroll) : null;
  let animationFrame = null;
  const onFrame = (time) => {
    lenis.raf(time);
    animationFrame = requestAnimationFrame(onFrame);
  };
  animationFrame = requestAnimationFrame(onFrame);

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

  // Delegation keeps anchors working after the router replaces page content.
  const onAnchorClick = (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    const target = getAnchorTarget(href);
    if (href === '#') {
      event.preventDefault();
      return;
    }

    if (target) {
      event.preventDefault();
      lenis.scrollTo(target, {
        offset: getHeaderOffset(),
        duration: 0.55,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
    }
  };

  document.addEventListener('click', onAnchorClick);

  return {
    lenis,
    destroy() {
      document.removeEventListener('click', onAnchorClick);
      removeScrollListener?.();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      lenis.destroy();
    },
  };
}

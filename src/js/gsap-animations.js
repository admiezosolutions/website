/* GSAP Animations — ScrollTrigger, 3D tilt, zoom, parallax, reveals */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let animationsContext = null;
let cleanupHeroTilt = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export function cleanupGSAPAnimations() {
  cleanupHeroTilt?.();
  cleanupHeroTilt = null;
  animationsContext?.revert();
  animationsContext = null;
}

function showAnimatedElementsImmediately() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const staggerItems = document.querySelectorAll('.stagger-grid > *');
  const scrollAnimatedElements = document.querySelectorAll('.zoom-section, .tilt-card');

  if (revealElements.length) gsap.set(revealElements, {
    clearProps: 'transform',
    opacity: 1,
  });

  if (staggerItems.length) gsap.set(staggerItems, {
    clearProps: 'transform',
    opacity: 1,
  });

  if (scrollAnimatedElements.length) gsap.set(scrollAnimatedElements, {
    clearProps: 'transform',
    opacity: 1,
  });
}

export function initGSAPAnimations({ instant = false } = {}) {
  cleanupGSAPAnimations();

  if (instant || reducedMotion.matches) {
    showAnimatedElementsImmediately();
  }

  if (reducedMotion.matches) {
    return;
  }

  animationsContext = gsap.context(() => {
  if (!instant) {
  // ---- Reveal animations ----
  gsap.utils.toArray('.reveal').forEach((el, i) => {
    gsap.fromTo(el,
      { y: 28 },
      {
        y: 0,
        duration: 0.65,
        delay: i * 0.04,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  gsap.utils.toArray('.reveal-left').forEach((el) => {
    gsap.fromTo(el,
      { x: -36 },
      {
        x: 0,
        duration: 0.65,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
        },
      }
    );
  });

  gsap.utils.toArray('.reveal-right').forEach((el) => {
    gsap.fromTo(el,
      { x: 36 },
      {
        x: 0,
        duration: 0.65,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
        },
      }
    );
  });

  gsap.utils.toArray('.reveal-scale').forEach((el) => {
    gsap.fromTo(el,
      { scale: 0.96 },
      {
        scale: 1,
        duration: 0.65,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
        },
      }
    );
  });

  // ---- Staggered card reveals ----
  gsap.utils.toArray('.stagger-grid').forEach((grid) => {
    const cards = grid.children;
    gsap.fromTo(cards, 
      { y: 36, scale: 0.97 },
      {
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
        },
      }
    );
  });
  }

  // ---- 3D Tilt on Hero Visual ----
  const heroCard = document.querySelector('.hero__visual-card');
  if (heroCard && window.matchMedia('(pointer: fine)').matches) {
    const setRotateX = gsap.quickSetter(heroCard, 'rotateX', 'deg');
    const setRotateY = gsap.quickSetter(heroCard, 'rotateY', 'deg');
    const baseRotateX = 3;
    const baseRotateY = -8;
    let currentX = baseRotateX;
    let currentY = baseRotateY;
    let targetX = baseRotateX;
    let targetY = baseRotateY;
    let bounds = null;
    let tiltFrame = null;

    gsap.set(heroCard, { transformPerspective: 1000 });

    const renderTilt = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      setRotateX(currentX);
      setRotateY(currentY);

      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        tiltFrame = requestAnimationFrame(renderTilt);
      } else {
        currentX = targetX;
        currentY = targetY;
        setRotateX(currentX);
        setRotateY(currentY);
        tiltFrame = null;
      }
    };

    const requestTiltFrame = () => {
      if (!tiltFrame) tiltFrame = requestAnimationFrame(renderTilt);
    };

    const onPointerEnter = () => {
      bounds = heroCard.getBoundingClientRect();
    };

    const onPointerMove = (e) => {
      bounds ||= heroCard.getBoundingClientRect();
      const x = (e.clientX - bounds.left) / bounds.width - 0.5;
      const y = (e.clientY - bounds.top) / bounds.height - 0.5;
      targetX = baseRotateX - y * 8;
      targetY = baseRotateY + x * 12;
      requestTiltFrame();
    };

    const onPointerLeave = () => {
      bounds = null;
      targetX = baseRotateX;
      targetY = baseRotateY;
      requestTiltFrame();
    };

    heroCard.addEventListener('pointerenter', onPointerEnter, { passive: true });
    heroCard.addEventListener('pointermove', onPointerMove, { passive: true });
    heroCard.addEventListener('pointerleave', onPointerLeave, { passive: true });
    cleanupHeroTilt = () => {
      heroCard.removeEventListener('pointerenter', onPointerEnter);
      heroCard.removeEventListener('pointermove', onPointerMove);
      heroCard.removeEventListener('pointerleave', onPointerLeave);
      if (tiltFrame) {
        cancelAnimationFrame(tiltFrame);
        tiltFrame = null;
      }
    };
  }

  if (!instant) {
  // ---- Section zoom on scroll ----
  gsap.utils.toArray('.zoom-section').forEach((section) => {
    gsap.fromTo(section, 
      { scale: 0.92, opacity: 0.7 },
      {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 90%',
          end: 'top 40%',
          scrub: 0.35,
        },
      }
    );
  });

  // ---- Parallax gradient blobs ----
  gsap.utils.toArray('.gradient-blob').forEach((blob) => {
    const speed = blob.dataset.speed || 0.3;
    gsap.to(blob, {
      y: () => -200 * parseFloat(speed),
      ease: 'none',
      scrollTrigger: {
        trigger: blob.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.35,
      },
    });
  });

  // ---- 3D card tilt on scroll ----
  gsap.utils.toArray('.tilt-card').forEach((card) => {
    gsap.fromTo(card,
      { rotateX: 8, rotateY: -4, transformPerspective: 800 },
      {
        rotateX: 0,
        rotateY: 0,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          end: 'top 40%',
          scrub: 0.35,
        },
      }
    );
  });
  }

  // ---- Floating animation for decorative elements ----
  gsap.utils.toArray('.float-anim').forEach((el, i) => {
    gsap.to(el, {
      y: -15,
      duration: 2 + i * 0.3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  });
  }, document.querySelector('.page-wrapper') || document.body);
}

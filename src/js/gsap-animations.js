/* GSAP Animations — ScrollTrigger, 3D tilt, zoom, parallax, reveals */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let animationsContext = null;
let cleanupHeroTilt = null;

export function cleanupGSAPAnimations() {
  cleanupHeroTilt?.();
  cleanupHeroTilt = null;
  animationsContext?.revert();
  animationsContext = null;
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
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

  if (instant) {
    showAnimatedElementsImmediately();
    ScrollTrigger.refresh();
    return;
  }

  animationsContext = gsap.context(() => {
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

  // ---- 3D Tilt on Hero Visual ----
  const heroCard = document.querySelector('.hero__visual-card');
  if (heroCard && window.matchMedia('(pointer: fine)').matches) {
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let tiltFrame = null;

    const updateTilt = () => {
      const rect = heroCard.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateX = ((pointerY - centerY) / window.innerHeight) * -8;
      const rotateY = ((pointerX - centerX) / window.innerWidth) * 12;

      gsap.to(heroCard, {
        rotateX: 3 + rotateX,
        rotateY: -8 + rotateY,
        duration: 0.8,
        ease: 'power2.out',
        transformPerspective: 1000,
      });
      tiltFrame = null;
    };

    const onPointerMove = (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!tiltFrame) {
        tiltFrame = requestAnimationFrame(updateTilt);
      }
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    cleanupHeroTilt = () => {
      document.removeEventListener('pointermove', onPointerMove);
      if (tiltFrame) {
        cancelAnimationFrame(tiltFrame);
        tiltFrame = null;
      }
    };
  }

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

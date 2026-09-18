/* GSAP Animations — ScrollTrigger, 3D tilt, zoom, parallax, reveals */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initGSAPAnimations() {
  // ---- Reveal animations ----
  gsap.utils.toArray('.reveal').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: i * 0.05,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });

  gsap.utils.toArray('.reveal-left').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
      },
    });
  });

  gsap.utils.toArray('.reveal-right').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
      },
    });
  });

  gsap.utils.toArray('.reveal-scale').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
      },
    });
  });

  // ---- Staggered card reveals ----
  gsap.utils.toArray('.stagger-grid').forEach((grid) => {
    const cards = grid.children;
    gsap.fromTo(cards, 
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
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
  if (heroCard) {
    document.addEventListener('mousemove', (e) => {
      const rect = heroCard.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateX = ((e.clientY - centerY) / window.innerHeight) * -8;
      const rotateY = ((e.clientX - centerX) / window.innerWidth) * 12;

      gsap.to(heroCard, {
        rotateX: 3 + rotateX,
        rotateY: -8 + rotateY,
        duration: 0.8,
        ease: 'power2.out',
        transformPerspective: 1000,
      });
    });
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
          scrub: 1,
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
        scrub: 1,
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
          scrub: 1,
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
}

/* Navigation - persistent shell listeners and per-page state. */

let shellInitialized = false;
let shellHeader = null;
let darkHero = false;

function setHeaderState(scrollY = window.scrollY || document.documentElement.scrollTop) {
  if (!shellHeader) return;

  const isScrolled = scrollY > 50;
  shellHeader.classList.toggle('scrolled', isScrolled);
  shellHeader.classList.toggle('header--contrast-light', darkHero && !isScrolled);
}

export function initNavShell({ lenis } = {}) {
  if (shellInitialized) return;

  const header = document.querySelector('.header');
  const toggle = document.querySelector('.header__toggle');
  const nav = document.querySelector('.header__nav');

  if (!header) return;

  shellInitialized = true;
  shellHeader = header;
  setHeaderState();

  if (typeof lenis?.on === 'function') {
    lenis.on('scroll', ({ scroll }) => setHeaderState(scroll));
  } else {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setHeaderState();
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu toggle
  if (toggle && nav) {
    const setMenuOpen = (isOpen) => {
      toggle.classList.toggle('active', isOpen);
      nav.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('nav-open', isOpen);

      if (isOpen) {
        lenis?.stop();
      } else {
        lenis?.start();
      }
    };

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', nav.id || 'main-nav');

    const onToggleClick = () => {
      setMenuOpen(!nav.classList.contains('open'));
    };

    toggle.addEventListener('click', onToggleClick);

    // Close mobile menu on link click
    nav.querySelectorAll('.header__link').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    const onResize = () => {
      if (window.innerWidth > 1024 && nav.classList.contains('open')) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', onResize, { passive: true });
  }
}

export function updateNavForPage() {
  const header = shellHeader || document.querySelector('.header');
  if (!header) return;

  const pageWrapper = document.querySelector('.page-wrapper');
  const firstSection = pageWrapper?.firstElementChild;
  darkHero = firstSection?.classList.contains('page-hero') ||
    firstSection?.classList.contains('section--dark') ||
    firstSection?.dataset.headerTheme === 'dark';

  header.classList.toggle('header--on-dark', Boolean(darkHero));
  setHeaderState();

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header__link').forEach((link) => {
    const linkPage = new URL(link.href, window.location.href).pathname.split('/').pop() || 'index.html';
    link.classList.toggle('active', linkPage === currentPage);
  });
}

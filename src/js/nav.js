/* Navigation — Sticky header, mobile menu, active page */

let cleanupNav = () => {};

export function initNav({ lenis } = {}) {
  cleanupNav();

  const header = document.querySelector('.header');
  const toggle = document.querySelector('.header__toggle');
  const nav = document.querySelector('.header__nav');

  if (!header) return;

  const cleanupFns = [];
  const pageWrapper = document.querySelector('.page-wrapper');
  const firstSection = pageWrapper
    ? [...pageWrapper.children].find((el) => !el.classList.contains('header'))
    : null;
  const darkHero = firstSection?.classList.contains('page-hero') ||
    firstSection?.classList.contains('section--dark') ||
    firstSection?.dataset.headerTheme === 'dark';

  header.classList.toggle('header--on-dark', Boolean(darkHero));

  const setHeaderState = (scrollY = window.scrollY || document.documentElement.scrollTop) => {
    const isScrolled = scrollY > 50;
    header.classList.toggle('scrolled', isScrolled);
    header.classList.toggle('header--contrast-light', Boolean(darkHero) && !isScrolled);
  };

  setHeaderState();

  if (lenis) {
    const unlisten = lenis.on('scroll', ({ scroll }) => setHeaderState(scroll));
    cleanupFns.push(unlisten);
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
    cleanupFns.push(() => window.removeEventListener('scroll', onScroll));
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
    cleanupFns.push(() => toggle.removeEventListener('click', onToggleClick));

    // Close mobile menu on link click
    nav.querySelectorAll('.header__link').forEach((link) => {
      const onLinkClick = () => {
        setMenuOpen(false);
      };

      link.addEventListener('click', onLinkClick);
      cleanupFns.push(() => link.removeEventListener('click', onLinkClick));
    });

    const onResize = () => {
      if (window.innerWidth > 1024 && nav.classList.contains('open')) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', onResize, { passive: true });
    cleanupFns.push(() => window.removeEventListener('resize', onResize));

    cleanupFns.push(() => setMenuOpen(false));
  }

  // Active page highlight
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header__link').forEach((link) => {
    const href = link.getAttribute('href');
    if (
      href === currentPage ||
      (currentPage === '' && href === 'index.html') ||
      (currentPage === 'index.html' && href === 'index.html') ||
      (currentPage === '/' && href === 'index.html')
    ) {
      link.classList.add('active');
    }
  });

  cleanupNav = () => {
    cleanupFns.forEach((cleanup) => cleanup());
    cleanupFns.length = 0;
  };
}

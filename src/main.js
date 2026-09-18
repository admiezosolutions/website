/* Main Entry Point — Initialize all modules */
import { initLenis } from './js/lenis-scroll.js';
import { cleanupGSAPAnimations, initGSAPAnimations } from './js/gsap-animations.js';
import { SporeCanvas } from './js/spore-canvas.js';
import { cleanupNav, initNav } from './js/nav.js';
import { initAccordion } from './js/accordion.js';
import { initTabs } from './js/tabs.js';
import { initForm } from './js/form.js';
import { initFooter } from './js/footer.js';
import { initPageRouter } from './js/page-router.js';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  // Core
  const scroll = initLenis();
  const { lenis } = scroll;
  const canvas = new SporeCanvas('spore-canvas');

  const initPage = ({ instant = false } = {}) => {
    initFooter();
    initNav({ lenis });

    // Animations
    initGSAPAnimations({ instant });

    // Interactive components
    initAccordion();
    initTabs();
    initForm();
  };

  const destroyPage = () => {
    cleanupGSAPAnimations();
    cleanupNav();
  };

  const destroyRouter = initPageRouter({ destroyPage, initPage, lenis });
  initPage();

  window.addEventListener('pagehide', () => {
    destroyRouter?.();
    destroyPage();
    canvas.destroy();
    scroll.destroy();
  }, { once: true });
});

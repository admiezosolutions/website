/* Main Entry Point — Initialize all modules */
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';

import { initLenis } from './js/lenis-scroll.js';
import { initGSAPAnimations } from './js/gsap-animations.js';
import { SporeCanvas } from './js/spore-canvas.js';
import { initNav } from './js/nav.js';
import { initCounters } from './js/counter.js';
import { initAccordion } from './js/accordion.js';
import { initTabs } from './js/tabs.js';
import { initForm } from './js/form.js';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  // Core
  initLenis();
  initNav();
  new SporeCanvas('spore-canvas');

  // Animations
  initGSAPAnimations();
  initCounters();

  // Interactive components
  initAccordion();
  initTabs();
  initForm();
});

/* Main Entry Point — Initialize core UI first, then adaptive enhancements. */
import { SporeCanvas } from './js/spore-canvas.js';
import { cleanupNav, initNav } from './js/nav.js';
import { initAccordion } from './js/accordion.js';
import { initTabs } from './js/tabs.js';
import { initForm } from './js/form.js';
import { initFooter } from './js/footer.js';
import { initPageRouter } from './js/page-router.js';
import { performanceProfile, TIER_EVENT } from './js/performance-profile.js';

document.addEventListener('DOMContentLoaded', async () => {
  let scroll = null;
  let scrollTier = null;
  let animations = null;
  let scrollModulePromise = null;
  let animationModulePromise = null;
  let enhancementVersion = 0;

  const scrollFacade = {
    scrollTo(target, options) {
      if (scroll?.lenis) scroll.lenis.scrollTo(target, options);
      else if (target === 0) window.scrollTo(0, 0);
    },
    start() { scroll?.lenis?.start(); },
    stop() { scroll?.lenis?.stop(); },
    resize() { scroll?.lenis?.resize(); },
  };

  const loadScrollModule = () => {
    scrollModulePromise ||= import('./js/lenis-scroll.js');
    return scrollModulePromise;
  };

  const loadAnimationModule = () => {
    animationModulePromise ||= import('./js/gsap-animations.js');
    return animationModulePromise;
  };

  const applyEnhancementTier = async ({ instant = false } = {}) => {
    const version = ++enhancementVersion;
    const useAnimations = performanceProfile.is('high');
    const useLenis = !performanceProfile.is('low') &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const [scrollModule, animationModule] = await Promise.all([
      useLenis ? loadScrollModule() : Promise.resolve(null),
      useAnimations ? loadAnimationModule() : Promise.resolve(null),
    ]);

    if (version !== enhancementVersion) return;

    if (!useAnimations) {
      animations?.cleanupGSAPAnimations();
      animations = null;
    } else {
      animations = animationModule;
    }

    if (!useLenis) {
      scroll?.destroy();
      scroll = null;
      scrollTier = null;
    } else if (scrollTier !== performanceProfile.tier) {
      scroll?.destroy();
      scroll = scrollModule.initLenis({
        profile: performanceProfile,
        onScroll: animations?.updateScrollTriggers,
      });
      scrollTier = performanceProfile.tier;
    }

    initNav({ lenis: scroll?.lenis });
    animations?.initGSAPAnimations({ instant, profile: performanceProfile });
  };

  const canvas = new SporeCanvas('spore-canvas', performanceProfile);

  const initPage = ({ instant = false } = {}) => {
    initFooter();
    initNav({ lenis: scroll?.lenis });
    if (animations) animations.initGSAPAnimations({ instant, profile: performanceProfile });

    // Interactive components
    initAccordion();
    initTabs();
    initForm();
  };

  const destroyPage = () => {
    animations?.cleanupGSAPAnimations();
    cleanupNav();
  };

  const destroyRouter = initPageRouter({
    destroyPage,
    initPage,
    lenis: scrollFacade,
    profile: performanceProfile,
    onNavigationStart: () => canvas.suspend(),
    onNavigationEnd: () => canvas.resume(),
  });
  initPage();
  applyEnhancementTier().catch(() => {
    // Core navigation and native scrolling remain fully functional.
  });

  const onTierChange = () => {
    applyEnhancementTier({ instant: true }).catch(() => {});
  };
  window.addEventListener(TIER_EVENT, onTierChange);

  window.addEventListener('pagehide', () => {
    window.removeEventListener(TIER_EVENT, onTierChange);
    destroyRouter?.();
    destroyPage();
    canvas.destroy();
    scroll?.destroy();
    performanceProfile.destroy();
  }, { once: true });
});

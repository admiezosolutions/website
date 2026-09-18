/* Page Router — instant same-origin navigation with prefetch */
import { cleanupGSAPAnimations } from './gsap-animations.js';

const parser = new DOMParser();
const pageCache = new Map();
let isNavigating = false;

const idle = (callback) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 1500 });
  } else {
    window.setTimeout(callback, 250);
  }
};

function isPageUrl(url) {
  const path = url.pathname;
  return path === '/' || path.endsWith('/') || path.endsWith('.html');
}

function normalizePathname(pathname) {
  return pathname === '/' ? '/index.html' : pathname;
}

function getEligibleUrl(link) {
  if (!link || link.hasAttribute('download')) return null;
  if (link.target && link.target !== '_self') return null;

  const href = link.getAttribute('href');
  if (!href || href === '#' || href.startsWith('#')) return null;

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin || !isPageUrl(url)) return null;

  return url;
}

async function loadPage(url) {
  const cacheKey = url.href;
  if (pageCache.has(cacheKey)) {
    return pageCache.get(cacheKey).cloneNode(true);
  }

  const response = await fetch(cacheKey, {
    headers: { Accept: 'text/html' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${cacheKey}`);
  }

  const text = await response.text();
  const doc = parser.parseFromString(text, 'text/html');

  if (!doc.querySelector('.page-wrapper')) {
    throw new Error(`Missing page wrapper in ${cacheKey}`);
  }

  pageCache.set(cacheKey, doc);
  return doc.cloneNode(true);
}

function prefetch(url) {
  if (pageCache.has(url.href)) return;
  loadPage(url).catch(() => {
    pageCache.delete(url.href);
  });
}

function prefetchLikelyPages({ eager = false } = {}) {
  const run = () => {
    document.querySelectorAll('a[href]').forEach((link) => {
      const url = getEligibleUrl(link);
      if (url && normalizePathname(url.pathname) !== normalizePathname(window.location.pathname)) {
        prefetch(url);
      }
    });
  };

  if (eager) {
    run();
  } else {
    idle(run);
  }
}

function updateHead(nextDoc) {
  document.title = nextDoc.title;

  const currentDescription = document.querySelector('meta[name="description"]');
  const nextDescription = nextDoc.querySelector('meta[name="description"]');

  if (currentDescription && nextDescription) {
    currentDescription.setAttribute('content', nextDescription.getAttribute('content') || '');
  }
}

function scrollToTop(lenis) {
  lenis?.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}

export function initPageRouter({ initPage, lenis } = {}) {
  if (!initPage) return;

  const swapPage = async (url, { push = true } = {}) => {
    if (isNavigating) return;
    isNavigating = true;
    document.documentElement.classList.add('is-navigating');

    try {
      const nextDoc = await loadPage(url);
      const nextWrapper = nextDoc.querySelector('.page-wrapper');
      const currentWrapper = document.querySelector('.page-wrapper');

      if (!nextWrapper || !currentWrapper) {
        window.location.assign(url.href);
        return;
      }

      const update = () => {
        cleanupGSAPAnimations();
        document.body.classList.remove('nav-open');
        lenis?.start();
        currentWrapper.replaceWith(nextWrapper);
        updateHead(nextDoc);

        if (push) {
          window.history.pushState({}, '', url.href);
        }

        scrollToTop(lenis);
        lenis?.resize();
        initPage({ instant: true });
        prefetchLikelyPages();
      };

      update();
    } catch {
      window.location.assign(url.href);
    } finally {
      isNavigating = false;
      document.documentElement.classList.remove('is-navigating');
    }
  };

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('a[href]');
    const url = getEligibleUrl(link);
    if (!url) return;

    if (
      normalizePathname(url.pathname) === normalizePathname(window.location.pathname) &&
      url.search === window.location.search
    ) {
      event.preventDefault();
      if (!url.hash) {
        scrollToTop(lenis);
      }
      return;
    }

    event.preventDefault();
    swapPage(url);
  });

  document.addEventListener('pointerover', (event) => {
    const url = getEligibleUrl(event.target.closest('a[href]'));
    if (url) prefetch(url);
  }, { passive: true });

  document.addEventListener('focusin', (event) => {
    const url = getEligibleUrl(event.target.closest('a[href]'));
    if (url) prefetch(url);
  });

  window.addEventListener('popstate', () => {
    swapPage(new URL(window.location.href), { push: false });
  });

  prefetchLikelyPages({ eager: true });
}

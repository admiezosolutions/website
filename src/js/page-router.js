/* Page Router - instant same-origin navigation with deduplicated prefetch */

const parser = new DOMParser();
const pageCache = new Map();
const pendingPages = new Map();

function canonicalUrl(url) {
  const canonical = new URL(url, window.location.href);
  canonical.hash = '';
  return canonical.href;
}

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
  const cacheKey = canonicalUrl(url);

  if (pageCache.has(cacheKey)) {
    return pageCache.get(cacheKey).cloneNode(true);
  }

  if (!pendingPages.has(cacheKey)) {
    const request = fetch(cacheKey, {
      headers: { Accept: 'text/html' },
      credentials: 'same-origin',
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${cacheKey}`);
        return response.text();
      })
      .then((text) => {
        const doc = parser.parseFromString(text, 'text/html');
        if (!doc.querySelector('.page-wrapper')) {
          throw new Error(`Missing page wrapper in ${cacheKey}`);
        }
        pageCache.set(cacheKey, doc);
        return doc;
      })
      .finally(() => pendingPages.delete(cacheKey));

    pendingPages.set(cacheKey, request);
  }

  const doc = await pendingPages.get(cacheKey);
  return doc.cloneNode(true);
}

function prefetch(url) {
  const cacheKey = canonicalUrl(url);
  if (pageCache.has(cacheKey) || pendingPages.has(cacheKey)) return;
  loadPage(url).catch(() => {
    pageCache.delete(cacheKey);
  });
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

export function initPageRouter({ destroyPage, initPage, lenis } = {}) {
  if (!initPage) return undefined;

  let navigationId = 0;
  let idleHandle = null;
  let idleHandleType = null;

  pageCache.set(canonicalUrl(window.location.href), document.cloneNode(true));

  const schedulePrefetch = () => {
    if (navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType || '')) {
      return;
    }

    const run = () => {
      idleHandle = null;
      idleHandleType = null;
      const seen = new Set();

      document.querySelectorAll('a[href]').forEach((link) => {
        const url = getEligibleUrl(link);
        if (!url) return;

        const key = canonicalUrl(url);
        if (
          key !== canonicalUrl(window.location.href) &&
          !seen.has(key)
        ) {
          seen.add(key);
          prefetch(url);
        }
      });
    };

    if ('requestIdleCallback' in window) {
      idleHandleType = 'idle';
      idleHandle = window.requestIdleCallback(run, { timeout: 1200 });
    } else {
      idleHandleType = 'timeout';
      idleHandle = window.setTimeout(run, 200);
    }
  };

  const swapPage = async (url, { push = true, sourceLink = null } = {}) => {
    const currentNavigation = ++navigationId;
    document.documentElement.classList.add('is-navigating');
    sourceLink?.classList.add('is-pending');

    try {
      const nextDoc = await loadPage(url);
      if (currentNavigation !== navigationId) return;

      const nextWrapper = nextDoc.querySelector('.page-wrapper');
      const currentWrapper = document.querySelector('.page-wrapper');

      if (!nextWrapper || !currentWrapper) {
        window.location.assign(url.href);
        return;
      }

      destroyPage?.();
      document.body.classList.remove('nav-open');
      lenis?.start();
      currentWrapper.replaceWith(nextWrapper);
      updateHead(nextDoc);

      if (push) window.history.pushState({}, '', url.href);

      scrollToTop(lenis);
      lenis?.resize();
      initPage({ instant: true });
      schedulePrefetch();
    } catch {
      if (currentNavigation === navigationId) window.location.assign(url.href);
    } finally {
      sourceLink?.classList.remove('is-pending');
      if (currentNavigation === navigationId) {
        document.documentElement.classList.remove('is-navigating');
      }
    }
  };

  const onClick = (event) => {
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
      if (!url.hash) scrollToTop(lenis);
      return;
    }

    event.preventDefault();
    swapPage(url, { sourceLink: link });
  };

  const onPointerOver = (event) => {
    const url = getEligibleUrl(event.target.closest('a[href]'));
    if (url) prefetch(url);
  };

  const onFocusIn = (event) => {
    const url = getEligibleUrl(event.target.closest('a[href]'));
    if (url) prefetch(url);
  };

  const onPopState = () => {
    swapPage(new URL(window.location.href), { push: false });
  };

  document.addEventListener('click', onClick);
  document.addEventListener('pointerover', onPointerOver, { passive: true });
  document.addEventListener('focusin', onFocusIn);
  window.addEventListener('popstate', onPopState);
  schedulePrefetch();

  return () => {
    navigationId += 1;
    document.removeEventListener('click', onClick);
    document.removeEventListener('pointerover', onPointerOver);
    document.removeEventListener('focusin', onFocusIn);
    window.removeEventListener('popstate', onPopState);

    if (idleHandle !== null) {
      if (idleHandleType === 'idle') window.cancelIdleCallback(idleHandle);
      else window.clearTimeout(idleHandle);
    }
  };
}

/* Page Router - interaction-first navigation with bounded adaptive caching. */

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

function extractPage(doc) {
  const wrapper = doc.querySelector('.page-wrapper');
  if (!wrapper) return null;

  return {
    wrapper: wrapper.cloneNode(true),
    title: doc.title,
    description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
  };
}

function clonePage(page) {
  return { ...page, wrapper: page.wrapper.cloneNode(true) };
}

function cachePage(key, page, limit) {
  pageCache.delete(key);
  pageCache.set(key, page);
  while (pageCache.size > limit) pageCache.delete(pageCache.keys().next().value);
}

async function loadPage(url, { kind = 'navigation', cacheLimit = 3 } = {}) {
  const cacheKey = canonicalUrl(url);
  if (pageCache.has(cacheKey)) {
    const page = pageCache.get(cacheKey);
    pageCache.delete(cacheKey);
    pageCache.set(cacheKey, page);
    return clonePage(page);
  }

  if (!pendingPages.has(cacheKey)) {
    const controller = new AbortController();
    const entry = { controller, kind, promise: null };
    entry.promise = fetch(cacheKey, {
      headers: { Accept: 'text/html' },
      credentials: 'same-origin',
      signal: controller.signal,
      priority: kind === 'navigation' ? 'high' : 'low',
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${cacheKey}`);
        return response.text();
      })
      .then((text) => {
        const doc = parser.parseFromString(text, 'text/html');
        const page = extractPage(doc);
        if (!page) throw new Error(`Missing page wrapper in ${cacheKey}`);
        cachePage(cacheKey, page, cacheLimit);
        return page;
      })
      .finally(() => pendingPages.delete(cacheKey));

    pendingPages.set(cacheKey, entry);
  } else if (kind === 'navigation') {
    pendingPages.get(cacheKey).kind = 'navigation';
  }

  return clonePage(await pendingPages.get(cacheKey).promise);
}

function cancelPendingRequests(exceptKey, { prefetchOnly = true } = {}) {
  pendingPages.forEach((entry, key) => {
    if ((!prefetchOnly || entry.kind === 'prefetch') && key !== exceptKey) {
      entry.controller.abort();
      pendingPages.delete(key);
    }
  });
}

function updateHead(page) {
  document.title = page.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', page.description);
}

function scrollToTop(lenis) {
  lenis?.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}

export function initPageRouter({
  destroyPage,
  initPage,
  lenis,
  profile,
  onNavigationStart,
  onNavigationEnd,
} = {}) {
  if (!initPage) return undefined;

  let navigationId = 0;
  let isNavigating = false;
  let idleHandle = null;
  let idleHandleType = null;
  let enhancementFrame = null;
  let enhancementTimer = null;
  let pressedElement = null;
  let pressTimer = null;
  let recentInteractionUntil = 0;

  const cacheLimit = () => profile?.is('low') ? 1 : profile?.is('balanced') ? 2 : 3;
  const initialPage = extractPage(document);
  if (initialPage) cachePage(canonicalUrl(window.location.href), initialPage, cacheLimit());

  const cancelIdlePrefetch = () => {
    if (idleHandle === null) return;
    if (idleHandleType === 'idle') window.cancelIdleCallback(idleHandle);
    else window.clearTimeout(idleHandle);
    idleHandle = null;
    idleHandleType = null;
  };

  const prefetch = (url) => {
    if (isNavigating || profile?.is('low') || performance.now() < recentInteractionUntil) return;
    const key = canonicalUrl(url);
    if (pageCache.has(key) || pendingPages.has(key)) return;
    loadPage(url, { kind: 'prefetch', cacheLimit: cacheLimit() }).catch((error) => {
      if (error.name !== 'AbortError') pageCache.delete(key);
    });
  };

  const schedulePrefetch = (preferredUrl) => {
    cancelIdlePrefetch();
    if (
      isNavigating ||
      profile?.is('low') ||
      navigator.connection?.saveData ||
      /(^|-)2g$/.test(navigator.connection?.effectiveType || '')
    ) return;

    const run = () => {
      idleHandle = null;
      idleHandleType = null;
      if (isNavigating || performance.now() < recentInteractionUntil) return;

      if (preferredUrl) {
        prefetch(preferredUrl);
        return;
      }

      const currentKey = canonicalUrl(window.location.href);
      const limit = profile?.is('high') ? 2 : 1;
      const seen = new Set();
      for (const link of document.querySelectorAll('.header__link[href], .header__cta a[href]')) {
        const url = getEligibleUrl(link);
        if (!url) continue;
        const key = canonicalUrl(url);
        if (key !== currentKey && !seen.has(key)) {
          seen.add(key);
          prefetch(url);
          if (seen.size >= limit) break;
        }
      }
    };

    if ('requestIdleCallback' in window) {
      idleHandleType = 'idle';
      idleHandle = window.requestIdleCallback(run, { timeout: 1500 });
    } else {
      idleHandleType = 'timeout';
      idleHandle = window.setTimeout(run, 350);
    }
  };

  const clearPressedState = () => {
    window.clearTimeout(pressTimer);
    if (pressedElement?.isConnected) pressedElement.classList.remove('is-pressed');
    pressedElement = null;
  };

  const finishNavigation = (currentNavigation, sourceLink) => {
    if (currentNavigation !== navigationId) return;
    isNavigating = false;
    sourceLink?.classList.remove('is-pending');
    document.documentElement.classList.remove('is-navigating');
    onNavigationEnd?.();
  };

  const deferPageEnhancements = (currentNavigation, sourceLink) => {
    enhancementFrame = requestAnimationFrame(() => {
      enhancementFrame = null;
      enhancementTimer = window.setTimeout(() => {
        enhancementTimer = null;
        if (currentNavigation !== navigationId) return;
        destroyPage?.();
        lenis?.resize();
        initPage({ instant: true });
        finishNavigation(currentNavigation, sourceLink);
        schedulePrefetch();
      }, 0);
    });
  };

  const swapPage = async (url, { push = true, sourceLink = null } = {}) => {
    const currentNavigation = ++navigationId;
    const targetKey = canonicalUrl(url);
    isNavigating = true;
    cancelIdlePrefetch();
    cancelPendingRequests(targetKey, { prefetchOnly: false });
    if (enhancementFrame) cancelAnimationFrame(enhancementFrame);
    if (enhancementTimer) window.clearTimeout(enhancementTimer);
    enhancementFrame = null;
    enhancementTimer = null;
    document.documentElement.classList.add('is-navigating');
    sourceLink?.classList.add('is-pending');
    onNavigationStart?.();

    try {
      const page = await loadPage(url, { kind: 'navigation', cacheLimit: cacheLimit() });
      if (currentNavigation !== navigationId) return;

      const currentWrapper = document.querySelector('.page-wrapper');
      if (!currentWrapper) {
        window.location.assign(url.href);
        return;
      }

      currentWrapper.replaceWith(page.wrapper);
      updateHead(page);
      if (push) window.history.pushState({}, '', url.href);
      document.body.classList.remove('nav-open');
      scrollToTop(lenis);
      clearPressedState();
      deferPageEnhancements(currentNavigation, sourceLink);
    } catch (error) {
      if (currentNavigation !== navigationId) return;
      finishNavigation(currentNavigation, sourceLink);
      if (error.name !== 'AbortError') window.location.assign(url.href);
    }
  };

  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const target = event.target.closest('a[href], button');
    if (!target) return;

    clearPressedState();
    pressedElement = target;
    pressedElement.classList.add('is-pressed');
    recentInteractionUntil = performance.now() + 800;
    cancelIdlePrefetch();
    const url = getEligibleUrl(target.closest('a[href]'));
    cancelPendingRequests(url ? canonicalUrl(url) : null, { prefetchOnly: !url });
  };

  const onPointerEnd = () => {
    window.clearTimeout(pressTimer);
    pressTimer = window.setTimeout(clearPressedState, 90);
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
    if (event.pointerType === 'touch' || profile?.is('low')) return;
    const url = getEligibleUrl(event.target.closest('a[href]'));
    if (url) schedulePrefetch(url);
  };

  const onFocusIn = (event) => {
    if (profile?.is('low')) return;
    const url = getEligibleUrl(event.target.closest('a[href]'));
    if (url) schedulePrefetch(url);
  };

  const onPopState = () => {
    swapPage(new URL(window.location.href), { push: false });
  };

  const pointerStartEvent = 'PointerEvent' in window ? 'pointerdown' : 'touchstart';
  const pointerEndEvent = 'PointerEvent' in window ? 'pointerup' : 'touchend';
  document.addEventListener(pointerStartEvent, onPointerDown, { passive: true });
  document.addEventListener(pointerEndEvent, onPointerEnd, { passive: true });
  document.addEventListener('pointercancel', onPointerEnd, { passive: true });
  document.addEventListener('click', onClick);
  document.addEventListener('pointerover', onPointerOver, { passive: true });
  document.addEventListener('focusin', onFocusIn);
  window.addEventListener('popstate', onPopState);
  schedulePrefetch();

  return () => {
    navigationId += 1;
    cancelIdlePrefetch();
    cancelPendingRequests(null, { prefetchOnly: false });
    clearPressedState();
    if (enhancementFrame) cancelAnimationFrame(enhancementFrame);
    if (enhancementTimer) window.clearTimeout(enhancementTimer);
    document.removeEventListener(pointerStartEvent, onPointerDown);
    document.removeEventListener(pointerEndEvent, onPointerEnd);
    document.removeEventListener('pointercancel', onPointerEnd);
    document.removeEventListener('click', onClick);
    document.removeEventListener('pointerover', onPointerOver);
    document.removeEventListener('focusin', onFocusIn);
    window.removeEventListener('popstate', onPopState);
  };
}

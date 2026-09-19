/* Shared capability and runtime performance profile. */

const TIERS = ['low', 'balanced', 'high'];
const TIER_EVENT = 'admiezo:performance-tier';

function connectionIsSlow(connection) {
  return connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '');
}

function detectInitialTier() {
  const connection = navigator.connection;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const touchFirst = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const compact = window.matchMedia('(max-width: 640px)').matches;

  if (reducedMotion || connectionIsSlow(connection) || (memory && memory <= 2) || (cores && cores <= 2)) {
    return 'low';
  }

  let score = 0;
  if (memory >= 8) score += 2;
  else if (memory >= 4) score += 1;
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;
  if (!touchFirst) score += 1;
  if (touchFirst) score -= 1;
  if (compact) score -= 1;

  return score >= 4 ? 'high' : 'balanced';
}

class PerformanceProfile {
  constructor() {
    this.tier = detectInitialTier();
    this.destroyed = false;
    this.probeFrame = null;
    this.probeTimer = null;
    this.badWindows = 0;
    this.goodWindows = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.hardLow = this.reducedMotion.matches || connectionIsSlow(navigator.connection) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

    this.applyTier();
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onMotionPreferenceChange = this.onMotionPreferenceChange.bind(this);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.reducedMotion.addEventListener('change', this.onMotionPreferenceChange);
    this.scheduleProbe(2500);
  }

  is(tier) {
    return this.tier === tier;
  }

  atLeast(tier) {
    return TIERS.indexOf(this.tier) >= TIERS.indexOf(tier);
  }

  applyTier() {
    document.documentElement.dataset.performanceTier = this.tier;
  }

  setTier(nextTier, reason = 'runtime') {
    if (!TIERS.includes(nextTier) || nextTier === this.tier) return;
    const previousTier = this.tier;
    this.tier = nextTier;
    this.applyTier();
    window.dispatchEvent(new CustomEvent(TIER_EVENT, {
      detail: { tier: nextTier, previousTier, reason },
    }));
  }

  scheduleProbe(delay = 20000) {
    if (this.destroyed || document.hidden) return;
    window.clearTimeout(this.probeTimer);
    this.probeTimer = window.setTimeout(() => this.runProbe(), delay);
  }

  runProbe() {
    if (this.destroyed || document.hidden || this.probeFrame) return;

    let frames = 0;
    let startedAt = 0;
    const sample = (timestamp) => {
      if (!startedAt) startedAt = timestamp;
      frames += 1;
      const elapsed = timestamp - startedAt;

      if (elapsed < 4000) {
        this.probeFrame = requestAnimationFrame(sample);
        return;
      }

      this.probeFrame = null;
      const fps = frames / (elapsed / 1000);
      this.evaluateFps(fps);
      this.scheduleProbe(this.badWindows ? 3000 : 20000);
    };

    this.probeFrame = requestAnimationFrame(sample);
  }

  evaluateFps(fps) {
    if (fps < 42) {
      this.badWindows += 1;
      this.goodWindows = 0;
    } else if (fps > 56) {
      this.goodWindows += 1;
      this.badWindows = 0;
    } else {
      this.badWindows = 0;
      this.goodWindows = 0;
    }

    if (this.badWindows >= 2) {
      const index = Math.max(0, TIERS.indexOf(this.tier) - 1);
      this.badWindows = 0;
      this.setTier(TIERS[index], 'sustained-frame-drops');
    } else if (this.tier === 'low' && !this.hardLow && this.goodWindows >= 3) {
      this.goodWindows = 0;
      this.setTier('balanced', 'sustained-stable-frames');
    }
  }

  onVisibilityChange() {
    if (document.hidden) {
      window.clearTimeout(this.probeTimer);
      if (this.probeFrame) cancelAnimationFrame(this.probeFrame);
      this.probeFrame = null;
    } else {
      this.scheduleProbe(3000);
    }
  }

  onMotionPreferenceChange(event) {
    if (event.matches) {
      this.hardLow = true;
      this.setTier('low', 'reduced-motion');
      return;
    }

    this.hardLow = connectionIsSlow(navigator.connection) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    if (!this.hardLow && this.tier === 'low') this.setTier('balanced', 'reduced-motion-disabled');
  }

  destroy() {
    this.destroyed = true;
    window.clearTimeout(this.probeTimer);
    if (this.probeFrame) cancelAnimationFrame(this.probeFrame);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.reducedMotion.removeEventListener('change', this.onMotionPreferenceChange);
  }
}

export const performanceProfile = new PerformanceProfile();
export { TIER_EVENT };

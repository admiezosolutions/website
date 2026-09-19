/* Spore Canvas - adaptive floating background particles */

const TAU = Math.PI * 2;
const INTERACTION_RADIUS = 120;
const INTERACTION_RADIUS_SQUARED = INTERACTION_RADIUS * INTERACTION_RADIUS;

export class SporeCanvas {
  constructor(canvasId = 'spore-canvas', profile) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.profile = profile;
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    this.particles = [];
    this.pointer = { x: -1000, y: -1000 };
    this.width = 0;
    this.height = 0;
    this.animationId = null;
    this.resizeFrame = null;
    this.lastFrameTime = 0;
    this.isVisible = true;
    this.isDestroyed = false;
    this.isSuspended = false;
    this.pointerBound = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    this.animate = this.animate.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onMotionPreferenceChange = this.onMotionPreferenceChange.bind(this);
    this.onTierChange = this.onTierChange.bind(this);

    this.configureQuality();
    this.resize();
    this.initParticles();
    this.bindEvents();

    if (this.reducedMotion.matches || this.staticMode) {
      this.drawFrame(false);
    } else {
      this.start();
    }
  }

  getParticleCount() {
    const areaScale = Math.min((this.width * this.height) / (1440 * 900), 1);
    return Math.max(this.minimumParticles, Math.round(this.maximumParticles * Math.max(areaScale, 0.55)));
  }

  configureQuality() {
    const tier = this.profile?.tier || 'balanced';
    this.staticMode = tier === 'low';
    this.targetFps = tier === 'high' ? 60 : tier === 'balanced' ? 30 : 1;
    this.frameInterval = 1000 / this.targetFps;
    this.dprCap = tier === 'high' ? 1.5 : 1;
    this.maximumParticles = tier === 'high' ? 60 : tier === 'balanced' ? 30 : 10;
    this.minimumParticles = tier === 'high' ? 22 : tier === 'balanced' ? 14 : 8;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width === this.width && height === this.height && dpr === this.dpr) return;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  initParticles() {
    const particleCount = this.getParticleCount();
    this.particles.length = particleCount;
    for (let index = 0; index < particleCount; index += 1) {
      this.particles[index] = this.resetParticle(this.particles[index] || {});
    }
  }

  resetParticle(particle, fromBottom = false) {
    const hue = Math.random() > 0.5 ? 155 : 35;
    const opacity = Math.random() * 0.3 + 0.05;

    particle.x = Math.random() * this.width;
    particle.y = fromBottom ? this.height + 20 : Math.random() * this.height;
    particle.size = Math.random() * 3 + 1;
    particle.speedY = -(Math.random() * 0.5 + 0.15);
    particle.speedX = (Math.random() - 0.5) * 0.3;
    particle.fill = `hsla(${hue}, 50%, 45%, ${opacity})`;
    particle.glow = `hsla(${hue}, 50%, 45%, ${opacity * 0.15})`;
    particle.wobble = Math.random() * TAU;
    particle.wobbleSpeed = Math.random() * 0.02 + 0.005;
    return particle;
  }

  bindEvents() {
    window.addEventListener('resize', this.onResize, { passive: true });
    this.updatePointerEvents();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('admiezo:performance-tier', this.onTierChange);
    this.reducedMotion.addEventListener('change', this.onMotionPreferenceChange);

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(([entry]) => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible) this.start();
        else this.stop();
      });
      this.observer.observe(this.canvas);
    }
  }

  updatePointerEvents() {
    const shouldBind = this.profile?.is('high') && window.matchMedia('(pointer: fine)').matches;
    if (shouldBind && !this.pointerBound) {
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
      this.pointerBound = true;
    } else if (!shouldBind && this.pointerBound) {
      window.removeEventListener('pointermove', this.onPointerMove);
      document.documentElement.removeEventListener('pointerleave', this.onPointerLeave);
      this.pointerBound = false;
      this.onPointerLeave();
    }
  }

  onTierChange() {
    this.stop();
    this.configureQuality();
    this.updatePointerEvents();
    this.resize();
    this.initParticles();
    this.drawFrame(false);
    if (!this.staticMode) this.start();
  }

  onResize() {
    if (this.resizeFrame) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.resize();
      this.initParticles();
      if (this.reducedMotion.matches || this.staticMode) this.drawFrame(false);
    });
  }

  onPointerMove(event) {
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
  }

  onPointerLeave() {
    this.pointer.x = -1000;
    this.pointer.y = -1000;
  }

  onVisibilityChange() {
    if (document.hidden) this.stop();
    else this.start();
  }

  onMotionPreferenceChange() {
    if (this.reducedMotion.matches) {
      this.stop();
      this.drawFrame(false);
    } else {
      this.start();
    }
  }

  start() {
    if (
      this.isDestroyed ||
      this.isSuspended ||
      this.animationId ||
      document.hidden ||
      !this.isVisible ||
      this.reducedMotion.matches ||
      this.staticMode
    ) return;

    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(this.animate);
  }

  suspend() {
    this.isSuspended = true;
    this.stop();
  }

  resume() {
    this.isSuspended = false;
    this.start();
  }

  stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = null;
  }

  drawParticle(particle) {
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, TAU);
    this.ctx.fillStyle = particle.fill;
    this.ctx.fill();

    if (!this.staticMode) {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * 3, 0, TAU);
      this.ctx.fillStyle = particle.glow;
      this.ctx.fill();
    }
  }

  drawFrame(updateParticles = true) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let index = 0; index < this.particles.length; index += 1) {
      let particle = this.particles[index];

      if (updateParticles) {
        particle.wobble += particle.wobbleSpeed;
        particle.x += particle.speedX + Math.sin(particle.wobble) * 0.3;
        particle.y += particle.speedY;

        const dx = particle.x - this.pointer.x;
        const dy = particle.y - this.pointer.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < INTERACTION_RADIUS_SQUARED) {
          const distance = Math.max(Math.sqrt(distanceSquared), 1);
          const force = (INTERACTION_RADIUS - distance) / INTERACTION_RADIUS;
          particle.x += (dx / distance) * force * 1.5;
          particle.y += (dy / distance) * force * 1.5;
        }

        if (particle.y < -20) {
          this.resetParticle(particle, true);
        }
      }

      this.drawParticle(particle);
    }
  }

  animate(timestamp) {
    this.animationId = requestAnimationFrame(this.animate);
    if (timestamp - this.lastFrameTime < this.frameInterval) return;

    this.lastFrameTime = timestamp;
    this.drawFrame();
  }

  destroy() {
    if (!this.canvas || this.isDestroyed) return;
    this.isDestroyed = true;
    this.stop();
    if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
    window.removeEventListener('resize', this.onResize);
    if (this.pointerBound) {
      window.removeEventListener('pointermove', this.onPointerMove);
      document.documentElement.removeEventListener('pointerleave', this.onPointerLeave);
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('admiezo:performance-tier', this.onTierChange);
    this.reducedMotion.removeEventListener('change', this.onMotionPreferenceChange);
    this.observer?.disconnect();
  }
}

/* Spore Canvas - adaptive floating background particles */

const TAU = Math.PI * 2;
const INTERACTION_RADIUS = 120;
const INTERACTION_RADIUS_SQUARED = INTERACTION_RADIUS * INTERACTION_RADIUS;

export class SporeCanvas {
  constructor(canvasId = 'spore-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

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
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const lowPowerDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const compactViewport = window.matchMedia('(max-width: 768px)').matches;
    this.targetFps = lowPowerDevice ? 30 : compactViewport ? 45 : 60;
    this.frameInterval = 1000 / this.targetFps;

    this.animate = this.animate.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onMotionPreferenceChange = this.onMotionPreferenceChange.bind(this);

    this.resize();
    this.initParticles();
    this.bindEvents();

    if (this.reducedMotion.matches) {
      this.drawFrame(false);
    } else {
      this.start();
    }
  }

  getParticleCount() {
    const areaScale = Math.min((this.width * this.height) / (1440 * 900), 1);
    const lowPowerDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const maximum = lowPowerDevice ? 30 : this.width <= 768 ? 36 : 60;
    return Math.max(22, Math.round(maximum * Math.max(areaScale, 0.65)));
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  initParticles() {
    const particleCount = this.getParticleCount();
    this.particles = Array.from({ length: particleCount }, () => this.createParticle());
  }

  createParticle(fromBottom = false) {
    const hue = Math.random() > 0.5 ? 155 : 35;
    const opacity = Math.random() * 0.3 + 0.05;

    return {
      x: Math.random() * this.width,
      y: fromBottom ? this.height + 20 : Math.random() * this.height,
      size: Math.random() * 3 + 1,
      speedY: -(Math.random() * 0.5 + 0.15),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity,
      fill: `hsla(${hue}, 50%, 45%, ${opacity})`,
      glow: `hsla(${hue}, 50%, 45%, ${opacity * 0.15})`,
      wobble: Math.random() * TAU,
      wobbleSpeed: Math.random() * 0.02 + 0.005,
    };
  }

  bindEvents() {
    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.reducedMotion.addEventListener('change', this.onMotionPreferenceChange);

    this.observer = new IntersectionObserver(([entry]) => {
      this.isVisible = entry.isIntersecting;
      if (this.isVisible) this.start();
      else this.stop();
    });
    this.observer.observe(this.canvas);
  }

  onResize() {
    if (this.resizeFrame) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      this.resize();
      this.initParticles();
      if (this.reducedMotion.matches) this.drawFrame(false);
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
      this.animationId ||
      document.hidden ||
      !this.isVisible ||
      this.reducedMotion.matches
    ) return;

    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(this.animate);
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

    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size * 3, 0, TAU);
    this.ctx.fillStyle = particle.glow;
    this.ctx.fill();
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
          particle = this.createParticle(true);
          this.particles[index] = particle;
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
    window.removeEventListener('pointermove', this.onPointerMove);
    document.documentElement.removeEventListener('pointerleave', this.onPointerLeave);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.reducedMotion.removeEventListener('change', this.onMotionPreferenceChange);
    this.observer?.disconnect();
  }
}

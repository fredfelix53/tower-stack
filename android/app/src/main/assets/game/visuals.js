/* ===== Tower Stack — Visuals ===== */
(function() {
  'use strict';

  class Particle {
    constructor(x, y, color, type = 'sparkle') {
      this.x = x; this.y = y; this.color = color; this.type = type;
      this.life = 1.0; this.decay = 0.02 + Math.random() * 0.03;
      this.size = type === 'star' ? 4 + Math.random() * 4 : 2 + Math.random() * 3;
      this.vx = (Math.random() - 0.5) * 6; this.vy = (Math.random() - 0.5) * 6 - 3;
      this.gravity = 0.06; this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.2;
    }
    update() { this.x += this.vx; this.y += this.vy; this.vy += this.gravity; this.life -= this.decay; this.rotation += this.rotSpeed; return this.life > 0; }
    draw(ctx) {
      ctx.save(); ctx.globalAlpha = Math.max(0, this.life);
      ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
      ctx.fillStyle = this.color; ctx.shadowColor = this.color; ctx.shadowBlur = 8;
      if (this.type === 'star') {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) { const a = (i * 4 * Math.PI / 5) - Math.PI / 2; ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * this.size, Math.sin(a) * this.size); }
        ctx.closePath(); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  class ParticleSystem {
    constructor() { this.particles = []; }
    emit(x, y, color, count = 15, type = 'sparkle') { for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color, type)); }
    emitPerfect(x, y) {
      const colors = ['#ffd700', '#ffe66d', '#ff9ff3', '#00ff88'];
      for (let i = 0; i < 25; i++) {
        const p = new Particle(x, y, colors[Math.floor(Math.random() * colors.length)], 'star');
        p.vy = -3 - Math.random() * 4; p.vx = (Math.random() - 0.5) * 8;
        this.particles.push(p);
      }
    }
    emitDrop(x, y, color) {
      for (let i = 0; i < 10; i++) { this.particles.push(new Particle(x, y, color, 'sparkle')); }
    }
    emitGameOver(x, y) {
      for (let i = 0; i < 40; i++) {
        const p = new Particle(x, y, '#ff4444', 'sparkle');
        p.vy = -2 - Math.random() * 5; p.vx = (Math.random() - 0.5) * 10;
        p.decay = 0.04;
        this.particles.push(p);
      }
    }
    update() { this.particles = this.particles.filter(p => p.update()); }
    draw(ctx) { for (const p of this.particles) p.draw(ctx); }
  }

  class FloatingText {
    constructor(x, y, text, color = '#fff', size = 20) {
      this.x = x; this.y = y; this.text = text; this.color = color; this.size = size;
      this.life = 1.0; this.vy = -1.5;
    }
    update() { this.y += this.vy; this.vy *= 0.97; this.life -= 0.02; return this.life > 0; }
    draw(ctx) {
      ctx.save(); ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color; ctx.font = `bold ${this.size}px sans-serif`;
      ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
      ctx.fillText(this.text, this.x, this.y); ctx.restore();
    }
  }

  function drawBlock(ctx, x, y, w, h, color, alpha = 1, rounded = true) {
    ctx.save();
    ctx.globalAlpha = alpha;
    // Shadow
    ctx.shadowColor = color; ctx.shadowBlur = 6;

    // Gradient
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, color || '#4facfe');
    grad.addColorStop(0.5, (color || '#4facfe') + 'cc');
    grad.addColorStop(1, (color || '#4facfe') + '88');
    ctx.fillStyle = grad;

    if (rounded) {
      const r = Math.min(4, w / 4);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }

    // Highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    if (rounded) {
      const r = Math.min(4, w / 4);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h * 0.3, r);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h * 0.3);
    }
    ctx.restore();
  }

  window.TowerVisuals = {
    ParticleSystem, Particle, FloatingText,
    drawBlock,
  };
})();

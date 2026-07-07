/**
 * Particles - 粒子特效系统
 * 死亡时的爆炸粒子效果
 */
class Particles {
  constructor() {
    this.particles = [];
    this.active = false;
  }

  /** 在指定位置生成爆炸粒子 */
  explode(x, y) {
    this.active = true;
    this.particles = [];
    const colors = ['#FF6D00', '#FFD54F', '#FF8F00', '#FFFFFF', '#FFAB00'];

    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.025,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  update() {
    let allDead = true;
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // 重力
      p.life -= p.decay;
      if (p.life > 0) allDead = false;
    }
    if (allDead) {
      this.active = false;
    }
  }

  render(ctx) {
    if (!this.active) return;
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  reset() {
    this.particles = [];
    this.active = false;
  }
}
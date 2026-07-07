/**
 * Background - 背景绘制
 * 天空渐变、云朵、远山、滚动地面
 */
class Background {
  constructor() {
    this.groundOffset = 0;
    this.groundSpeed = PIPE_SPEED_INITIAL;
    this.clouds = this._generateClouds();
    this.mountains = this._generateMountains();
  }

  _generateClouds() {
    const clouds = [];
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: Math.random() * GAME_WIDTH,
        y: 30 + Math.random() * 100,
        w: 60 + Math.random() * 60,
        h: 25 + Math.random() * 15,
        speed: 0.15 + Math.random() * 0.3,
      });
    }
    return clouds;
  }

  _generateMountains() {
    const peaks = [];
    // 生成远山轮廓
    const segs = 10;
    for (let i = 0; i <= segs; i++) {
      peaks.push({
        x: (GAME_WIDTH / segs) * i,
        y: 320 + Math.sin(i * 0.8) * 40 + Math.cos(i * 1.3) * 25 + Math.sin(i * 2.1) * 15,
      });
    }
    return peaks;
  }

  update(speed) {
    this.groundSpeed = speed;
    this.groundOffset = (this.groundOffset + speed) % 24;

    // 云朵移动
    this.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -c.w) {
        c.x = GAME_WIDTH + c.w;
        c.y = 30 + Math.random() * 100;
      }
    });
  }

  render(ctx) {
    this._drawSky(ctx);
    this._drawMountains(ctx);
    this._drawClouds(ctx);
    this._drawGround(ctx);
  }

  _drawSky(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT - GROUND_HEIGHT);
    gradient.addColorStop(0, '#4EC0CA');
    gradient.addColorStop(0.5, '#7DD8E0');
    gradient.addColorStop(1, '#B8E8ED');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  _drawMountains(ctx) {
    ctx.fillStyle = '#8BC34A';
    ctx.globalAlpha = 0.3;

    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT);

    for (let i = 0; i < this.mountains.length; i++) {
      const p = this.mountains[i];
      ctx.lineTo(p.x, p.y);
    }

    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // 第二层更近的山
    ctx.fillStyle = '#7CB342';
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT);
    for (let i = 0; i <= 12; i++) {
      const x = (GAME_WIDTH / 12) * i;
      const y = 340 + Math.sin(i * 0.9) * 30 + Math.cos(i * 1.5) * 20;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  _drawClouds(ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.7;

    this.clouds.forEach(c => {
      ctx.beginPath();
      // 椭圆组合成云朵
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      ctx.ellipse(cx - c.w * 0.2, cy, c.w * 0.3, c.h * 0.5, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + c.w * 0.15, cy - c.h * 0.15, c.w * 0.25, c.h * 0.45, 0, 0, Math.PI * 2);
      ctx.ellipse(cx, cy - c.h * 0.2, c.w * 0.35, c.h * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }

  _drawGround(ctx) {
    const groundY = GAME_HEIGHT - GROUND_HEIGHT;

    // 地面主体
    ctx.fillStyle = '#DED895';
    ctx.fillRect(0, groundY, GAME_WIDTH, GROUND_HEIGHT);

    // 地面纹理条纹
    ctx.fillStyle = '#C9BF77';
    const stripeW = 24;
    const start = -(this.groundOffset % stripeW);
    for (let x = start; x < GAME_WIDTH; x += stripeW * 2) {
      ctx.fillRect(x, groundY, stripeW, 4);
      ctx.fillRect(x - stripeW * 0.5, groundY + 8, stripeW, 3);
    }

    // 草地边缘
    ctx.fillStyle = '#8BC34A';
    ctx.fillRect(0, groundY, GAME_WIDTH, 6);

    // 草皮高光
    ctx.fillStyle = '#9CCC65';
    ctx.fillRect(0, groundY, GAME_WIDTH, 3);
  }
}
/**
 * Bird - 小鸟类
 * 处理小鸟的物理、动画和渲染
 */
class Bird {
  constructor() {
    this.x = 80;
    this.y = 0;
    this.width = 34;
    this.height = 26;
    this.velocity = 0;
    this.gravity = 0.18;
    this.jumpForce = -5.5;
    this.maxFallSpeed = 4.5;
    this.rotation = 0;
    this.dead = false;

    // 翅膀扇动动画
    this.wingAngle = 0;
    this.wingSpeed = 0.3;
    this.wingPhase = 0;

    this.reset();
  }

  reset() {
    this.x = 80;
    this.y = GAME_HEIGHT / 2 - this.height / 2;
    this.velocity = 0;
    this.rotation = 0;
    this.wingPhase = 0;
    this.dead = false;
  }

  jump() {
    this.velocity = this.jumpForce;
    this.wingPhase = 0;
  }

  /** 标记死亡，停在当前位置 */
  kill() {
    this.dead = true;
    this.velocity = 0;
    this.rotation = 70;
    this.wingAngle = -30;
  }

  update() {
    if (this.dead) return;

    this.velocity += this.gravity;
    if (this.velocity > this.maxFallSpeed) this.velocity = this.maxFallSpeed;
    this.y += this.velocity;

    // 旋转角度跟随速度
    const targetRotation = Math.max(-25, Math.min(70, this.velocity * 4));
    this.rotation += (targetRotation - this.rotation) * 0.15;

    // 翅膀扇动
    this.wingPhase += this.wingSpeed;
    this.wingAngle = Math.sin(this.wingPhase) * 20;
  }

  /** 检查是否飞出边界 */
  isOutOfBounds() {
    return this.y < -this.height || this.y > GAME_HEIGHT - GROUND_HEIGHT - this.height;
  }

  /** 碰撞检测用 bounding box（更宽容） */
  getBounds() {
    const margin = 6;
    return {
      x: this.x + margin,
      y: this.y + margin,
      w: this.width - margin * 2,
      h: this.height - margin * 2,
    };
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);

    // 身体 - 黄色圆形
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 身体暗面（下部阴影）
    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.ellipse(0, 3, this.width / 2 - 2, this.height / 2 - 2, 0, 0, Math.PI);
    ctx.fill();

    // 白色眼眶
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(8, -4, 9, 0, Math.PI * 2);
    ctx.fill();

    if (this.dead) {
      // 死亡状态：眼睛变叉号
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      // 第一条斜线
      ctx.beginPath();
      ctx.moveTo(4, -8);
      ctx.lineTo(12, 0);
      ctx.stroke();

      // 第二条斜线
      ctx.beginPath();
      ctx.moveTo(12, -8);
      ctx.lineTo(4, 0);
      ctx.stroke();
    } else {
      // 黑色瞳孔
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.arc(11, -3, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 高光点
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(12.5, -5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 嘴巴 - 橙色三角形（死时变伤心的倒三角）
    ctx.fillStyle = '#FF6D00';
    ctx.beginPath();
    if (this.dead) {
      // 死时嘴变小
      ctx.moveTo(15, -1);
      ctx.lineTo(20, -1);
      ctx.lineTo(17, 2);
    } else {
      ctx.moveTo(16, -2);
      ctx.lineTo(24, 0);
      ctx.lineTo(16, 4);
    }
    ctx.closePath();
    ctx.fill();

    // 翅膀
    ctx.fillStyle = '#FFE082';
    ctx.save();
    ctx.translate(-4, 2);
    ctx.rotate((this.wingAngle * Math.PI) / 180);
    ctx.beginPath();
    ctx.ellipse(0, -4, 12, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 翅膀暗色条纹
    ctx.fillStyle = '#FFCA28';
    ctx.beginPath();
    ctx.ellipse(0, -4, 9, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}
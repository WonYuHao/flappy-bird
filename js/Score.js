/**
 * ScoreRenderer - 游戏内实时分数显示
 * Canvas 内绘制，带得分弹跳动画
 */
class ScoreRenderer {
  constructor() {
    this.score = 0;
    this.displayScore = 0; // 动画过渡值
    this.scale = 1;
    this.scaleTimer = 0;
  }

  setScore(val) {
    this.score = val;
    // 得分时弹跳动画
    this.scale = 1.3;
    this.scaleTimer = 15;
  }

  update() {
    if (this.scaleTimer > 0) {
      this.scaleTimer--;
      // 弹跳回弹
      if (this.scaleTimer > 8) {
        this.scale -= 0.03;
      } else {
        this.scale += (1 - this.scale) * 0.2;
      }
    } else {
      this.scale = 1;
    }
    // 平滑过渡
    this.displayScore += (this.score - this.displayScore) * 0.3;
  }

  render(ctx) {
    if (this.score <= 0) return;

    const roundedScore = Math.round(this.displayScore);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x = GAME_WIDTH / 2;
    const y = 60;

    ctx.translate(x, y);
    ctx.scale(this.scale, this.scale);

    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.font = 'bold 48px "Arial", sans-serif';
    ctx.fillText(String(roundedScore), 3, 3);

    // 主体白色
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(String(roundedScore), 0, 0);

    // 顶部高光描边
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeText(String(roundedScore), 0, 1);

    ctx.restore();
  }

  reset() {
    this.score = 0;
    this.displayScore = 0;
    this.scale = 1;
    this.scaleTimer = 0;
  }
}
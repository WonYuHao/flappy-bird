/**
 * Pipe - 管道类
 * 处理管道的生成、移动、碰撞回收和渲染
 */

const PIPE_WIDTH = 52;
const PIPE_GAP_INITIAL = 200;
const PIPE_MIN_GAP = 155;
const PIPE_SPEED_INITIAL = 1.6;
const PIPE_SPEED_MAX = 4.0;
const PIPE_HEAD_HEIGHT = 24;
const PIPE_SPAWN_INTERVAL = 130; // 帧

class Pipe {
  constructor(x) {
    this.x = x;
    this.topHeight = 0;
    this.bottomY = 0;
    this.width = PIPE_WIDTH;
    this.gap = PIPE_GAP_INITIAL;
    this.passed = false;
    this.active = false;
    // 不在这里调 reset，由外部显式调用
  }

  reset(x, prevTopHeight) {
    this.x = x !== undefined ? x : GAME_WIDTH;
    this.passed = false;
    this.active = true;

    // 上管道高度随机范围（更宽）
    const minTop = 40;
    const maxTop = GAME_HEIGHT - GROUND_HEIGHT - this.gap - 40;

    let rangeMin = minTop;
    let rangeMax = maxTop;

    // 相邻管道高度差限制：基于前一个管道的高度，上下浮动不超过 90px
    if (prevTopHeight !== undefined) {
      rangeMin = Math.max(minTop, prevTopHeight - 90);
      rangeMax = Math.min(maxTop, prevTopHeight + 90);
    }

    this.topHeight = rangeMin + Math.random() * (rangeMax - rangeMin);
    this.bottomY = this.topHeight + this.gap;
  }

  /** 根据难度参数更新 gap 和 speed（由 Game 管理） */
  static updateDifficulty(score) {
    // 随分数减小间隙、加快速度（更平缓的曲线）
    const gap = Math.max(PIPE_MIN_GAP, PIPE_GAP_INITIAL - score * 0.5);
    const speed = Math.min(PIPE_SPEED_MAX, PIPE_SPEED_INITIAL + score * 0.02);
    return { gap, speed };
  }

  update(speed) {
    this.x -= speed;
    if (this.x < -this.width) {
      this.active = false;
    }
  }

  /** 获取上管道碰撞矩形 */
  getTopBounds() {
    return {
      x: this.x + 2,
      y: 0,
      w: this.width - 4,
      h: this.topHeight,
    };
  }

  /** 获取下管道碰撞矩形 */
  getBottomBounds() {
    return {
      x: this.x + 2,
      y: this.bottomY,
      w: this.width - 4,
      h: GAME_HEIGHT - this.bottomY,
    };
  }

  render(ctx) {
    // 上管道
    this._drawPipe(ctx, this.x, this.topHeight, true);
    // 下管道
    this._drawPipe(ctx, this.x, this.bottomY, false);
  }

  _drawPipe(ctx, x, y, isTop) {
    const { width } = this;

    ctx.save();

    if (isTop) {
      // 上管道：管道主体从 y - bodyHeight 画到 y
      const bodyHeight = GAME_HEIGHT;
      ctx.fillStyle = '#558B2F';
      ctx.fillRect(x, -bodyHeight, width, this.topHeight + bodyHeight);

      // 管道主体亮面
      ctx.fillStyle = '#73BF2E';
      ctx.fillRect(x + 4, -bodyHeight, width - 8, this.topHeight + bodyHeight);

      // 管道口（底部装饰）
      ctx.fillStyle = '#7CB342';
      ctx.fillRect(x - 4, this.topHeight - PIPE_HEAD_HEIGHT, width + 8, PIPE_HEAD_HEIGHT);

      // 管道口高光
      ctx.fillStyle = '#8BC34A';
      ctx.fillRect(x - 2, this.topHeight - PIPE_HEAD_HEIGHT + 4, width + 4, 6);

      // 管口暗边
      ctx.fillStyle = '#33691E';
      ctx.fillRect(x - 2, this.topHeight - 4, width + 4, 4);
    } else {
      // 下管道：从 y 开始向下
      const bottomEdge = GAME_HEIGHT + 100;
      ctx.fillStyle = '#73BF2E';
      ctx.fillRect(x, y, width, bottomEdge - y);

      // 暗面
      ctx.fillStyle = '#558B2F';
      ctx.fillRect(x + width - 8, y, 8, bottomEdge - y);

      // 管道口（顶部装饰）
      ctx.fillStyle = '#7CB342';
      ctx.fillRect(x - 4, y, width + 8, PIPE_HEAD_HEIGHT);

      // 管口高光
      ctx.fillStyle = '#8BC34A';
      ctx.fillRect(x - 2, y + 2, width + 4, 4);

      // 管口暗边
      ctx.fillStyle = '#33691E';
      ctx.fillRect(x - 2, y, width + 4, 4);
    }

    ctx.restore();
  }
}
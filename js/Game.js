/**
 * Game - 游戏主控制器
 * 管理游戏状态机、主循环、所有子系统
 */

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'IDLE'; // IDLE | PLAYING | DEAD | FALLEN

    // 子系统
    this.bird = new Bird();
    this.background = new Background();
    this.pipes = [];
    this.scoreRenderer = new ScoreRenderer();
    this.particles = new Particles();
    this.audio = new AudioManager();
    this.input = new Input();

    // 管道生成
    this.pipeSpawnCounter = 0;
    this.pipeSpawnInterval = PIPE_SPAWN_INTERVAL;
    this.currentSpeed = PIPE_SPEED_INITIAL;
    this.currentGap = PIPE_GAP_INITIAL;

    // 分数
    this.score = 0;

    // 动画帧
    this.animFrameId = null;
    this.lastTime = 0;

    // 绑定
    this.loop = this.loop.bind(this);
    this.handleAction = this.handleAction.bind(this);

    this.playerX = 80;
  }

  /** 初始化并启动 */
  start() {
    this.background = new Background();
    this._resize();
    window.addEventListener('resize', () => this._resize());
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this._resize());
    }
    this.input.onAction(this.handleAction);
    this.input.bind();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  _resize() {
    // 逻辑尺寸保持不变
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;

    // 计算缩放比例，让 canvas 适配屏幕
    const padding = 20; // 四周留白
    const maxW = window.innerWidth - padding * 2;
    const maxH = (window.visualViewport ? window.visualViewport.height : window.innerHeight) - padding * 2;
    const ratio = Math.min(maxW / GAME_WIDTH, maxH / GAME_HEIGHT, 1.2);

    const displayW = Math.floor(GAME_WIDTH * ratio);
    const displayH = Math.floor(GAME_HEIGHT * ratio);

    // 设置 canvas 显示尺寸
    this.canvas.style.width = displayW + 'px';
    this.canvas.style.height = displayH + 'px';

    // 设置容器尺寸（canvas + 排行榜按钮空间）
    const container = document.getElementById('game-container');
    container.style.width = displayW + 'px';
    container.style.height = displayH + 'px';

    // 同步更新 UI 浮层尺寸
    const overlays = container.querySelectorAll('.overlay, .modal-overlay');
    overlays.forEach(el => {
      el.style.width = displayW + 'px';
      el.style.height = displayH + 'px';
    });
  }

  handleAction() {
    this.audio.init();

    switch (this.state) {
      case 'IDLE':
        this.startGame();
        break;
      case 'PLAYING':
        this.flap();
        break;
      // DEAD 状态下不响应键盘/点击，必须通过按钮操作
    }
  }

  /** IDLE → PLAYING */
  startGame() {
    this.state = 'PLAYING';
    this.score = 0;
    this.currentSpeed = PIPE_SPEED_INITIAL;
    this.currentGap = PIPE_GAP_INITIAL;
    this.bird.reset();
    this.bird.jump();
    this.pipes = [];
    this.scoreRenderer.reset();
    this.particles.reset();
    this.pipeSpawnCounter = 0;

    this.audio.flap();
    ui.hideAll();
  }

  /** 小鸟跳跃 */
  flap() {
    this.bird.jump();
    this.audio.flap();
  }

  /** 碰撞后进入 DEAD 状态 */
  die() {
    this.state = 'DEAD';
    this.deathTimer = 0;
    this.audio.die();
    this.bird.kill(); // 停在碰撞位置，眼睛变叉号
    this.particles.explode(
      this.bird.x + this.bird.width / 2,
      this.bird.y + this.bird.height / 2
    );
  }

  /** DEAD → IDLE (显示结算界面) */
  showGameOver() {
    // 立即保存最高分，确保无论何种操作都不会丢失
    this._saveBestScore();
    ui.showGameOver(this.score, this._getBestScore());
  }

  /** 重新开始 */
  restartGame() {
    this.startGame();
  }

  /** 回到开始界面 */
  gotoIdle() {
    this.state = 'IDLE';
    this.bird.reset();
    this.pipes = [];
    this.scoreRenderer.reset();
    this.particles.reset();
    this.score = 0;
    this.currentSpeed = PIPE_SPEED_INITIAL;
    this.currentGap = PIPE_GAP_INITIAL;
    ui.showStart();
  }

  /** 主循环 */
  loop(timestamp) {
    this.animFrameId = requestAnimationFrame(this.loop);

    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // 帧跳过保护（标签页切回时避免大跳跃）
    if (dt > 200) return;

    this.update();
    this.render();
  }

  /** 游戏逻辑更新 */
  update() {
    if (this.state === 'PLAYING') {
      this.bird.update();
      this.background.update(this.currentSpeed);
      this.scoreRenderer.update();
      this._updatePipes();
      this._spawnPipes();
      this._checkCollisions();
      this._checkScore();
      this._updateDifficulty();
    } else if (this.state === 'DEAD') {
      this.deathTimer++;
      this.particles.update();
      // 小鸟停在碰撞位置，不再下落
      if (this.deathTimer === 40) {
        this.showGameOver();
      }
    } else if (this.state === 'IDLE') {
      // 空闲时小鸟做轻微浮动
      this.background.update(PIPE_SPEED_INITIAL);
      this.bird.y = GAME_HEIGHT / 2 - this.bird.height / 2 + Math.sin(Date.now() / 400) * 12;
      this.bird.wingPhase += 0.1;
      this.bird.wingAngle = Math.sin(this.bird.wingPhase) * 15;
    }
  }

  _updatePipes() {
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      this.pipes[i].update(this.currentSpeed);
      if (!this.pipes[i].active) {
        this.pipes.splice(i, 1);
      }
    }
  }

  _spawnPipes() {
    this.pipeSpawnCounter++;
    if (this.pipeSpawnCounter >= this.pipeSpawnInterval) {
      this.pipeSpawnCounter = 0;

      // 获取前一个管道的高度，用于约束相邻管道高度差
      const prevPipe = this.pipes.length > 0 ? this.pipes[this.pipes.length - 1] : null;
      const prevTop = prevPipe ? prevPipe.topHeight : undefined;

      const pipe = new Pipe(GAME_WIDTH);
      pipe.gap = this.currentGap;
      pipe.reset(GAME_WIDTH, prevTop);
      this.pipes.push(pipe);

      // 随难度提高生成间隔缩短（更平缓）
      this.pipeSpawnInterval = Math.max(95, PIPE_SPAWN_INTERVAL - this.score * 0.3);
    }
  }

  _checkCollisions() {
    const birdBounds = this.bird.getBounds();

    // 边界检查
    if (this.bird.isOutOfBounds()) {
      this.die();
      return;
    }

    // 管道碰撞
    for (const pipe of this.pipes) {
      if (!pipe.active) continue;

      const top = pipe.getTopBounds();
      const bottom = pipe.getBottomBounds();

      if (this._aabbCollision(birdBounds, top) || this._aabbCollision(birdBounds, bottom)) {
        this.die();
        return;
      }
    }
  }

  _aabbCollision(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  _checkScore() {
    for (const pipe of this.pipes) {
      if (pipe.passed || !pipe.active) continue;
      if (pipe.x + pipe.width < this.bird.x) {
        pipe.passed = true;
        this.score++;
        this.scoreRenderer.setScore(this.score);
        this.audio.score();
      }
    }
  }

  _updateDifficulty() {
    const diff = Pipe.updateDifficulty(this.score);
    this.currentGap = diff.gap;
    this.currentSpeed = diff.speed;
  }

  /** 渲染所有内容到 Canvas */
  render() {
    const { ctx } = this;

    // 清屏
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 背景
    this.background.render(ctx);

    // 管道
    for (const pipe of this.pipes) {
      if (pipe.active) pipe.render(ctx);
    }

    // 小鸟
    this.bird.render(ctx);

    // 分数
    this.scoreRenderer.render(ctx);

    // 粒子
    this.particles.render(ctx);
  }

  _getBestScore() {
    try {
      return parseInt(localStorage.getItem('flappyBestScore'), 10) || 0;
    } catch {
      return 0;
    }
  }

  _saveBestScore() {
    const best = this._getBestScore();
    if (this.score > best) {
      try {
        localStorage.setItem('flappyBestScore', String(this.score));
      } catch {
        // localStorage 不可用则忽略
      }
    }
  }
}

/** 常量 */
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const GROUND_HEIGHT = 80;
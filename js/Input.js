/**
 * Input - 统一输入处理
 * 支持触摸、鼠标点击、键盘空格/上键
 */
class Input {
  constructor() {
    this._onAction = null;

    // 绑定 this
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onClick = this._onClick.bind(this);
  }

  /** 注册动作回调 */
  onAction(fn) {
    this._onAction = fn;
  }

  /** 绑定所有事件监听 */
  bind() {
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('touchstart', this._onTouchStart, { passive: false });
    document.addEventListener('click', this._onClick);

    // 防止移动端双击缩放
    document.addEventListener('touchstart', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  /** 解绑 */
  unbind() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('touchstart', this._onTouchStart);
    document.removeEventListener('click', this._onClick);
  }

  _trigger() {
    if (this._onAction) this._onAction();
  }

  _onKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      this._trigger();
    }
  }

  _onTouchStart(e) {
    if (this._shouldIgnore(e.target)) return;
    e.preventDefault();
    this._trigger();
  }

  _onClick(e) {
    if (this._shouldIgnore(e.target)) return;
    this._trigger();
  }

  /** UI 浮层或 modals 区域不应触发游戏动作 */
  _shouldIgnore(target) {
    // 具体的交互元素
    if (target.closest('button, input, textarea, select')) return true;
    // 排行榜 modal 内的所有点击
    if (target.closest('#leaderboard-modal')) return true;
    // Game Over 卡片内的点击（除按钮外也应阻止）
    if (target.closest('.game-over-card')) return true;
    return false;
  }
}
/**
 * Audio - Web Audio API 编程生成音效
 * 无需加载外部音频文件
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  /** 在首次用户交互时初始化 AudioContext（绕过浏览器自动播放限制） */
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API 不可用');
    }
  }

  /** 播放短促音调 */
  _playTone(freq, duration, type = 'square', volume = 0.15) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  /** 跳跃音效 - 上升音调 */
  flap() {
    this._playTone(400, 0.08, 'square', 0.1);
    setTimeout(() => this._playTone(600, 0.06, 'square', 0.08), 30);
  }

  /** 得分音效 - 清脆叮咚 */
  score() {
    this._playTone(880, 0.1, 'sine', 0.12);
    setTimeout(() => this._playTone(1100, 0.15, 'sine', 0.1), 80);
  }

  /** 死亡音效 - 低沉撞击 */
  die() {
    this._playTone(200, 0.15, 'sawtooth', 0.12);
    setTimeout(() => this._playTone(150, 0.2, 'sawtooth', 0.1), 100);
    setTimeout(() => this._playTone(100, 0.4, 'triangle', 0.08), 200);
  }

  /** UI 按钮点击 */
  click() {
    this._playTone(660, 0.05, 'sine', 0.06);
  }
}
/**
 * main.js - 游戏入口
 * 初始化游戏并挂载 UI 事件
 */

let game;
let ui;

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  game = new Game(canvas);
  ui = new UI();

  // 绑定 UI 按钮事件
  _bindUIEvents();

  // 启动游戏循环（会初始化屏幕适配）
  game.start();

  // 显示开始界面（必须在 game.start() 之后，容器尺寸才正确）
  ui.showStart();
});

function _bindUIEvents() {
  const audio = new AudioManager();

  // 排行榜按钮（开始界面右上角）
  ui.elements.leaderboardBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    audio.init();
    audio.click();
    await ui.showLeaderboard();
  });

  // 关闭排行榜
  ui.elements.closeLeaderboard.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.click();
    ui.hideLeaderboard();
  });

  // 暂停 / 继续
  ui.elements.pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.init();
    audio.click();
    game.togglePause();
  });

  ui.elements.resumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.init();
    audio.click();
    game.resumeGame();
  });

  ui.elements.pauseLeaderboardBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    audio.init();
    audio.click();
    await ui.showLeaderboard();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP' && (game.state === 'PLAYING' || game.state === 'PAUSED')) {
      e.preventDefault();
      game.togglePause();
    }
  });

  // 排行榜遮罩层点击关闭
  ui.elements.leaderboardModal.addEventListener('click', (e) => {
    if (e.target === ui.elements.leaderboardModal) {
      ui.hideLeaderboard();
    }
  });

  // 提交分数按钮
  ui.elements.submitBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    audio.init();
    audio.click();
    const ok = await ui.submitScore();
    if (ok) {
      const btn = ui.elements.submitBtn;
      btn.textContent = '✓ 已提交';
      btn.classList.add('submitted');
      btn.disabled = false;
      await ui.showLeaderboard();
    }
  });

  // 结算界面 "查看完整排行" 按钮
  ui.elements.viewLeaderboardBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    audio.init();
    audio.click();
    await ui.showLeaderboard();
  });

  // 匿名确认对话框
  ui.elements.confirmAnonymousBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.click();
    // submitScore 内部处理
  });

  ui.elements.cancelAnonymousBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.click();
    // submitScore 内部处理
  });

  // 阻止匿名对话框上的点击冒泡
  ui.elements.anonymousDialog.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  ui.elements.anonymousDialog.addEventListener('touchstart', (e) => {
    e.stopPropagation();
  });

  // 再来一局（Game Over 界面）
  ui.elements.playAgainBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.init();
    audio.click();
    game.restartGame();
    // 重置提交按钮
    ui.elements.submitBtn.textContent = '提交分数';
    ui.elements.submitBtn.classList.remove('submitted');
    ui.elements.nicknameInput.value = '';
  });

  // 回到首页（Game Over 界面）
  ui.elements.backHomeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.init();
    audio.click();
    game.gotoIdle();
    ui.elements.submitBtn.textContent = '提交分数';
    ui.elements.submitBtn.classList.remove('submitted');
    ui.elements.nicknameInput.value = '';
  });

  // 禁止昵称输入框回车触发提交（避免输入法冲突）
  ui.elements.nicknameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
    e.stopPropagation();
  });

  // 阻止 UI 浮层上的点击冒泡到 Canvas 触发游戏（开始界面除外，它需要触发游戏开始）
  ['game-over-screen', 'leaderboard-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      el.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      });
    }
  });
}

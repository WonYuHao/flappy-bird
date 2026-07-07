/**
 * UI - DOM 界面管理
 * 控制开始界面、Game Over 结算、排行榜弹窗
 */
class UI {
  constructor() {
    this.elements = {};
    this.leaderboard = new Leaderboard();
    this._cacheDOM();
  }

  _cacheDOM() {
    this.elements = {
      startScreen: document.getElementById('start-screen'),
      gameOverScreen: document.getElementById('game-over-screen'),
      leaderboardModal: document.getElementById('leaderboard-modal'),
      finalScore: document.getElementById('final-score'),
      bestScore: document.getElementById('best-score'),
      newBest: document.getElementById('new-best'),
      nicknameInput: document.getElementById('nickname-input'),
      submitBtn: document.getElementById('submit-btn'),
      playAgainBtn: document.getElementById('play-again-btn'),
      backHomeBtn: document.getElementById('back-home-btn'),
      leaderboardBtn: document.getElementById('leaderboard-btn'),
      leaderboardList: document.getElementById('leaderboard-list'),
      leaderboardTotal: document.getElementById('leaderboard-total'),
      closeLeaderboard: document.getElementById('close-leaderboard'),
      startHint: document.getElementById('start-hint'),
      titleBird: document.getElementById('title-bird'),
    };
  }

  /** 显示开始界面 */
  showStart() {
    this.hideAll();
    this.elements.startScreen.classList.remove('hidden');
  }

  /** Game Over 结算界面 */
  showGameOver(score, bestScore) {
    this.hideAll();
    this.elements.gameOverScreen.classList.remove('hidden');
    this.elements.finalScore.textContent = score;
    this.elements.bestScore.textContent = Math.max(score, bestScore);

    if (score > bestScore && score > 0) {
      this.elements.newBest.classList.remove('hidden');
    } else {
      this.elements.newBest.classList.add('hidden');
    }

    this._lastScore = score;
  }

  /** 隐藏所有界面 */
  hideAll() {
    this.elements.startScreen.classList.add('hidden');
    this.elements.gameOverScreen.classList.add('hidden');
    this.elements.leaderboardModal.classList.add('hidden');
  }

  /** 提交分数（异步） */
  async submitScore() {
    const nickname = this.elements.nicknameInput.value.trim();
    if (!nickname) {
      this.elements.nicknameInput.classList.add('shake');
      setTimeout(() => this.elements.nicknameInput.classList.remove('shake'), 500);
      return null;
    }

    this.elements.submitBtn.textContent = '提交中...';
    this.elements.submitBtn.disabled = true;

    const result = await this.leaderboard.submitScore(nickname, this._lastScore);
    return result;
  }

  /** 显示排行榜弹窗（异步） */
  async showLeaderboard() {
    this.elements.leaderboardModal.classList.remove('hidden');
    this.elements.leaderboardList.innerHTML = '<div class="empty-rank">加载中...</div>';

    const data = await this.leaderboard.getRankings();
    this.elements.leaderboardTotal.textContent = data.total;

    let html = '';
    if (data.rankings.length === 0) {
      html += '<div class="empty-rank">还没有人上榜，快来第一个！</div>';
    } else {
      data.rankings.forEach(entry => {
        const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : '';
        const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';
        const dateStr = entry.created_at ? entry.created_at.slice(0, 10) : '';
        html += `
          <div class="rank-item ${rankClass}">
            <span class="rank-num">${medal || entry.rank}</span>
            <span class="rank-name">${this._escape(entry.nickname)}</span>
            <span class="rank-score">${entry.score}</span>
            <span class="rank-date">${dateStr}</span>
          </div>
        `;
      });
    }
    this.elements.leaderboardList.innerHTML = html;
  }

  /** 关闭排行榜 */
  hideLeaderboard() {
    this.elements.leaderboardModal.classList.add('hidden');
  }

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
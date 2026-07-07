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
      pauseScreen: document.getElementById('pause-screen'),
      gameOverScreen: document.getElementById('game-over-screen'),
      leaderboardModal: document.getElementById('leaderboard-modal'),
      finalScore: document.getElementById('final-score'),
      bestScore: document.getElementById('best-score'),
      bestScoreLine: document.getElementById('best-score-line'),
      newBest: document.getElementById('new-best'),
      currentRank: document.getElementById('current-rank'),
      viewLeaderboardBtn: document.getElementById('view-leaderboard-btn'),
      nicknameInput: document.getElementById('nickname-input'),
      submitBtn: document.getElementById('submit-btn'),
      playAgainBtn: document.getElementById('play-again-btn'),
      backHomeBtn: document.getElementById('back-home-btn'),
      leaderboardBtn: document.getElementById('leaderboard-btn'),
      pauseBtn: document.getElementById('pause-btn'),
      resumeBtn: document.getElementById('resume-btn'),
      pauseLeaderboardBtn: document.getElementById('pause-leaderboard-btn'),
      leaderboardList: document.getElementById('leaderboard-list'),
      leaderboardTotal: document.getElementById('leaderboard-total'),
      closeLeaderboard: document.getElementById('close-leaderboard'),
      anonymousDialog: document.getElementById('anonymous-confirm-dialog'),
      confirmAnonymousBtn: document.getElementById('confirm-anonymous-btn'),
      cancelAnonymousBtn: document.getElementById('cancel-anonymous-btn'),
    };
  }

  /** 显示开始界面 */
  showStart() {
    this.hideAll();
    this.elements.leaderboardBtn.classList.remove('hidden');
    this.elements.pauseBtn.classList.add('hidden');
    this.elements.startScreen.classList.remove('hidden');
  }

  showPause() {
    this.elements.leaderboardBtn.classList.add('hidden');
    this.elements.pauseBtn.textContent = '▶';
    this.elements.pauseScreen.classList.remove('hidden');
  }

  hidePause() {
    this.elements.leaderboardBtn.classList.add('hidden');
    this.elements.pauseBtn.textContent = 'Ⅱ';
    this.elements.pauseScreen.classList.add('hidden');
  }

  /** Game Over 结算界面 */
  async showGameOver(score, bestScore) {
    this.hideAll();
    // 结算界面隐藏右上角排行榜按钮
    this.elements.leaderboardBtn.classList.add('hidden');
    this.elements.pauseBtn.classList.add('hidden');
    this.elements.gameOverScreen.classList.remove('hidden');
    this.elements.finalScore.textContent = score;
    this.elements.bestScore.textContent = Math.max(score, bestScore);
    this.elements.bestScoreLine.textContent = '最高记录：' + Math.max(score, bestScore);

    if (score > bestScore && score > 0) {
      this.elements.newBest.classList.remove('hidden');
    } else {
      this.elements.newBest.classList.add('hidden');
    }

    this._lastScore = score;

    // 查询当前分数在排行榜上的排名
    this.elements.currentRank.textContent = '当前排名 查询中...';
    try {
      const rank = await this.leaderboard.getRank(score);
      this.elements.currentRank.textContent = rank ? `当前排名 ${rank}` : '暂未上榜';
    } catch {
      this.elements.currentRank.textContent = '暂未上榜';
    }
  }

  /** 隐藏所有界面 */
  hideAll() {
    this.elements.startScreen.classList.add('hidden');
    this.elements.pauseScreen.classList.add('hidden');
    this.elements.gameOverScreen.classList.add('hidden');
    this.elements.leaderboardModal.classList.add('hidden');
    this.elements.anonymousDialog.classList.add('hidden');
  }

  /** 提交分数（异步）。空昵称弹出确认窗 */
  async submitScore() {
    const nickname = this.elements.nicknameInput.value.trim();

    if (nickname) {
      return this._doSubmit(nickname);
    }

    // 空输入：弹出匿名确认窗
    return new Promise((resolve) => {
      this.elements.anonymousDialog.classList.remove('hidden');

      const cleanup = () => {
        this.elements.anonymousDialog.classList.add('hidden');
        this.elements.confirmAnonymousBtn.removeEventListener('click', onConfirm);
        this.elements.cancelAnonymousBtn.removeEventListener('click', onCancel);
      };

      const onConfirm = async () => {
        cleanup();
        const result = await this._doSubmit('匿名');
        resolve(result);
      };

      const onCancel = () => {
        cleanup();
        resolve(null);
      };

      this.elements.confirmAnonymousBtn.addEventListener('click', onConfirm);
      this.elements.cancelAnonymousBtn.addEventListener('click', onCancel);
    });
  }

  async _doSubmit(nickname) {
    this.elements.submitBtn.textContent = '提交中...';
    this.elements.submitBtn.disabled = true;

    const ok = await this.leaderboard.submitScore(nickname, this._lastScore);
    return ok;
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

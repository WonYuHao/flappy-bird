/**
 * Leaderboard - 排行榜数据管理（localStorage 版本）
 * 支持本地排行榜和后续升级到远程 API
 */
class Leaderboard {
  constructor() {
    this.storageKey = 'flappyLeaderboard';
    this.maxEntries = 20;
  }

  /** 获取排行榜数据 */
  getRankings() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** 提交分数 */
  submitScore(nickname, score) {
    const entries = this.getRankings();
    const entry = {
      nickname: String(nickname).trim().slice(0, 12),
      score: score,
      date: new Date().toISOString().slice(0, 10),
    };

    entries.push(entry);
    entries.sort((a, b) => b.score - a.score);

    // 只保留 top N
    const trimmed = entries.slice(0, this.maxEntries);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
    } catch {
      // 存储满了则清理后重试
      console.warn('localStorage 存储已满');
    }

    // 计算排名（返回条目在完整列表中的位置）
    const rank = trimmed.findIndex(e => e === entry) + 1;

    return {
      rank,
      total: trimmed.length,
      rankings: trimmed.map((e, i) => ({ ...e, rank: i + 1 })),
    };
  }

  /** 获取完整排行（带 rank） */
  getFormattedRankings() {
    const entries = this.getRankings();
    return {
      rankings: entries.map((e, i) => ({ ...e, rank: i + 1 })),
      total: entries.length,
    };
  }
}